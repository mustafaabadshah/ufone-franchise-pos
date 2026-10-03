from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.accounting_engine import calculate_profit_and_loss, post_ledger_transaction
from app.models.models import (
    Company, CompanyCreditAccount, CompanyCreditTransaction, LedgerAccount,
    LedgerTransaction, LedgerEntry, Investment, InvestmentReturn, Loan, LoanReturn,
    Retailer, Commission, EntryTypeEnum, AuditLog
)
from app.schemas.schemas import (
    CompanyCreate, CompanyCreditAccountOut, CompanyCreditPaymentCreate,
    InvestmentCreate, InvestmentOut, InvestmentReturnCreate, InvestmentReturnOut,
    LoanCreate, LoanOut, LoanReturnCreate, LoanReturnOut,
    CommissionCreate, CommissionOut
)

router = APIRouter(prefix="/finance", tags=["Finance & Accounting"])

# --- PROFIT & LOSS ---
@router.get("/profit-and-loss")
def get_pnl_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return calculate_profit_and_loss(db, start_date=date_from, end_date=date_to)

# --- LEDGER ---
@router.get("/ledger/accounts")
def list_ledger_accounts(db: Session = Depends(get_db)):
    accounts = db.query(LedgerAccount).order_by(LedgerAccount.code.asc()).all()
    return [
        {
            "id": a.id,
            "code": a.code,
            "name": a.name,
            "account_type": a.account_type,
            "balance": float(a.balance),
            "is_system": a.is_system
        }
        for a in accounts
    ]

@router.get("/ledger/transactions")
def list_ledger_transactions(
    account_id: Optional[int] = None,
    reference_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(LedgerTransaction)
    if reference_type and reference_type != "All":
        q = q.filter(LedgerTransaction.reference_type == reference_type)
    if date_from:
        q = q.filter(func.date(LedgerTransaction.date) >= date_from)
    if date_to:
        q = q.filter(func.date(LedgerTransaction.date) <= date_to)

    txs = q.order_by(LedgerTransaction.date.desc(), LedgerTransaction.id.desc()).limit(150).all()
    results = []
    for tx in txs:
        entries = [
            {
                "id": e.id,
                "account_code": e.account.code if e.account else "",
                "account_name": e.account.name if e.account else "",
                "entry_type": e.entry_type,
                "amount": float(e.amount),
                "memo": e.memo
            }
            for e in tx.entries
        ]
        results.append({
            "id": tx.id,
            "tx_code": tx.tx_code,
            "date": tx.date,
            "description": tx.description,
            "reference_type": tx.reference_type,
            "reference_id": tx.reference_id,
            "entries": entries
        })
    return results

# --- COMPANY CREDIT & LOANS ---
@router.get("/company-credit/accounts", response_model=List[CompanyCreditAccountOut])
def list_company_credit_accounts(db: Session = Depends(get_db)):
    accounts = db.query(CompanyCreditAccount).join(Company).all()
    results = []
    for a in accounts:
        a_dict = {c.name: getattr(a, c.name) for c in a.__table__.columns}
        a_dict["company_name"] = a.company.name if a.company else None
        results.append(CompanyCreditAccountOut(**a_dict))
    return results

@router.get("/company-credit/summary")
def get_company_credit_summary(db: Session = Depends(get_db)):
    accounts = db.query(CompanyCreditAccount).all()
    total_credit = sum((a.total_credit for a in accounts), Decimal("0.00"))
    total_paid = sum((a.amount_paid for a in accounts), Decimal("0.00"))
    total_outstanding = sum((a.outstanding for a in accounts), Decimal("0.00"))

    return {
        "total_credit": float(total_credit),
        "total_paid": float(total_paid),
        "total_outstanding": float(total_outstanding),
        "account_count": len(accounts)
    }

@router.post("/company-credit/payments")
def make_company_credit_payment(data: CompanyCreditPaymentCreate, db: Session = Depends(get_db)):
    acc = db.query(CompanyCreditAccount).filter(CompanyCreditAccount.id == data.account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Company credit account not found")

    if data.amount <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")
    if data.amount > acc.outstanding:
        raise HTTPException(status_code=400, detail=f"Payment amount PKR {data.amount} exceeds outstanding PKR {acc.outstanding}")

    acc.amount_paid += data.amount
    acc.outstanding -= data.amount
    if acc.outstanding == Decimal("0.00"):
        acc.status = "Settled"

    # Create transaction record
    tx = CompanyCreditTransaction(
        account_id=acc.id,
        tx_type="Payment to Company",
        amount=data.amount,
        paid_date=data.payment_date,
        payment_method=data.payment_method,
        reference=data.reference or f"SETTLE-{int(datetime.utcnow().timestamp())}",
        remarks=data.remarks
    )
    db.add(tx)
    db.flush()

    # Double-entry ledger:
    # Debit: Company Payable (2010)
    # Credit: Cash (1010) or Bank (1020)
    cash_or_bank = "1020" if data.payment_method == "Bank Transfer" else "1010"
    entries = [
        {
            "account_code": "2010",
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": data.amount,
            "memo": f"Payment to company {acc.company.name if acc.company else ''}"
        },
        {
            "account_code": cash_or_bank,
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": data.amount,
            "memo": f"Settlement payment for {acc.reference_number}"
        }
    ]

    post_ledger_transaction(
        db=db,
        tx_code=f"TX-COMP-PAY-{tx.id}",
        description=f"Company credit settlement for {acc.company.name if acc.company else ''}",
        reference_type="CompanyCredit",
        reference_id=str(acc.id),
        entries=entries
    )

    log = AuditLog(
        action="Settlement",
        entity="CompanyCreditAccount",
        entity_id=str(acc.id),
        new_value=f"Paid PKR {data.amount} to company. Remaining outstanding: PKR {acc.outstanding}"
    )
    db.add(log)
    db.commit()

    return {
        "message": "Payment recorded successfully",
        "paid_amount": float(data.amount),
        "new_outstanding": float(acc.outstanding),
        "status": acc.status
    }

@router.get("/company-credit/{account_id}/statement")
def get_company_statement(account_id: int, db: Session = Depends(get_db)):
    acc = db.query(CompanyCreditAccount).filter(CompanyCreditAccount.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Company credit account not found")

    txs = db.query(CompanyCreditTransaction).filter(CompanyCreditTransaction.account_id == account_id).order_by(CompanyCreditTransaction.paid_date.asc()).all()
    
    return {
        "company_name": acc.company.name if acc.company else "Company",
        "reference_number": acc.reference_number,
        "total_credit": float(acc.total_credit),
        "amount_paid": float(acc.amount_paid),
        "outstanding": float(acc.outstanding),
        "status": acc.status,
        "due_date": str(acc.due_date) if acc.due_date else None,
        "transactions": [
            {
                "id": t.id,
                "tx_type": t.tx_type,
                "amount": float(t.amount),
                "date": str(t.paid_date),
                "payment_method": t.payment_method,
                "reference": t.reference,
                "remarks": t.remarks
            }
            for t in txs
        ]
    }

# --- CASH MANAGEMENT & DENOMINATIONS ---
@router.post("/cash/verify-denominations")
def verify_cash_denominations(payload: Dict[str, Any], db: Session = Depends(get_db)):
    """
    Accepts: { denominations: { 5000: 2, 1000: 5, 500: 10, ... }, expected_cash: 20000 }
    Returns physical total, expected cash, difference, and excess/shortage classification.
    """
    denoms = payload.get("denominations", {})
    expected = Decimal(str(payload.get("expected_cash", 0)))
    
    physical_total = Decimal("0.00")
    denom_breakdown = []
    for d_val, qty in denoms.items():
        v = int(d_val)
        q = int(qty or 0)
        line_tot = Decimal(str(v * q))
        physical_total += line_tot
        denom_breakdown.append({
            "denomination": v,
            "quantity": q,
            "total": float(line_tot)
        })

    diff = physical_total - expected
    status = "Matched"
    if diff > Decimal("0.00"):
        status = "Cash Excess"
    elif diff < Decimal("0.00"):
        status = "Cash Shortage"

    return {
        "breakdown": denom_breakdown,
        "physical_cash_total": float(physical_total),
        "expected_cash": float(expected),
        "difference": float(diff),
        "status": status
    }

# --- INVESTMENTS ---
@router.get("/investments", response_model=List[InvestmentOut])
def list_investments(db: Session = Depends(get_db)):
    return db.query(Investment).order_by(Investment.investment_date.desc(), Investment.id.desc()).all()

@router.post("/investments", response_model=InvestmentOut)
def create_investment(data: InvestmentCreate, db: Session = Depends(get_db)):
    inv = Investment(
        name=data.name,
        phone=data.phone,
        amount_given=data.amount_given,
        purchased_amount=Decimal("0.00"),
        returns=Decimal("0.00"),
        remaining=data.amount_given,
        investment_date=data.investment_date,
        payment_method=data.payment_method,
        remarks=data.remarks
    )
    db.add(inv)
    db.flush()

    # Double entry: Debit Cash/Bank (1010/1020), Credit Owner / Investor Capital (3010)
    cash_or_bank = "1020" if data.payment_method == "Bank Transfer" else "1010"
    entries = [
        {
            "account_code": cash_or_bank,
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": data.amount_given,
            "memo": f"Investment from {data.name}"
        },
        {
            "account_code": "3010",
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": data.amount_given,
            "memo": f"Capital from {data.name}"
        }
    ]
    post_ledger_transaction(
        db=db,
        tx_code=f"TX-INV-{inv.id}",
        description=f"Investment from {data.name}",
        reference_type="Investment",
        reference_id=str(inv.id),
        entries=entries
    )

    db.commit()
    db.refresh(inv)
    return inv

# --- RETURN OF INVESTMENT ---
@router.post("/investments/{investment_id}/returns", response_model=InvestmentReturnOut)
def record_investment_return(
    investment_id: int,
    data: InvestmentReturnCreate,
    db: Session = Depends(get_db)
):
    inv = db.query(Investment).filter(Investment.id == investment_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investment portfolio not found")

    if data.amount <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Return amount must be greater than zero")

    inv_ret = InvestmentReturn(
        investment_id=inv.id,
        amount=data.amount,
        return_date=data.return_date,
        return_type=data.return_type,
        payment_method=data.payment_method,
        reference=data.reference or f"RET-INV-{int(datetime.utcnow().timestamp())}",
        remarks=data.remarks
    )
    db.add(inv_ret)
    inv.returns = (inv.returns or Decimal("0.00")) + data.amount
    inv.remaining = max(Decimal("0.00"), inv.amount_given - inv.returns)
    if inv.remaining == Decimal("0.00"):
        inv.status = "Settled"

    # Single-source-of-truth Double entry (NO duplicate expense):
    # Debit Owner Capital / Dividends (3010), Credit Cash/Bank (1010/1020)
    cash_or_bank = "1020" if data.payment_method == "Bank Transfer" else "1010"
    entries = [
        {
            "account_code": "3010",
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": data.amount,
            "memo": f"Return of Investment to {inv.name}"
        },
        {
            "account_code": cash_or_bank,
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": data.amount,
            "memo": f"Disbursement for return to {inv.name}"
        }
    ]
    post_ledger_transaction(
        db=db,
        tx_code=f"TX-INVRET-{int(datetime.utcnow().timestamp())}",
        description=f"Return of Investment to {inv.name}",
        reference_type="InvestmentReturn",
        reference_id=str(inv.id),
        entries=entries
    )
    db.commit()
    db.refresh(inv_ret)
    return inv_ret

@router.get("/investments/returns", response_model=List[InvestmentReturnOut])
def list_investment_returns(db: Session = Depends(get_db)):
    return db.query(InvestmentReturn).order_by(InvestmentReturn.return_date.desc(), InvestmentReturn.id.desc()).all()

# --- LOANS & RETURN OF LOAN ---
@router.get("/loans", response_model=List[LoanOut])
def list_loans(db: Session = Depends(get_db)):
    return db.query(Loan).order_by(Loan.loan_date.desc(), Loan.id.desc()).all()

@router.post("/loans", response_model=LoanOut)
def create_loan(data: LoanCreate, db: Session = Depends(get_db)):
    if data.amount <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Loan amount must be greater than zero")

    loan = Loan(
        lender_name=data.lender_name,
        phone=data.phone,
        loan_type=data.loan_type,
        amount=data.amount,
        total_returned=Decimal("0.00"),
        remaining_balance=data.amount,
        loan_date=data.loan_date,
        due_date=data.due_date,
        payment_method=data.payment_method,
        status="Active",
        remarks=data.remarks
    )
    db.add(loan)
    db.flush()

    # Double entry: Debit Cash/Bank (1010/1020), Credit Loans Payable (2030)
    cash_or_bank = "1020" if data.payment_method == "Bank Transfer" else "1010"
    entries = [
        {
            "account_code": cash_or_bank,
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": data.amount,
            "memo": f"Loan received from {data.lender_name}"
        },
        {
            "account_code": "2030",
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": data.amount,
            "memo": f"Liability: Borrowings from {data.lender_name}"
        }
    ]
    post_ledger_transaction(
        db=db,
        tx_code=f"TX-LOAN-{loan.id}-{int(datetime.utcnow().timestamp())}",
        description=f"Loan received from {data.lender_name}",
        reference_type="Loan",
        reference_id=str(loan.id),
        entries=entries
    )
    db.commit()
    db.refresh(loan)
    return loan

@router.post("/loans/{loan_id}/returns", response_model=LoanReturnOut)
def record_loan_return(loan_id: int, data: LoanReturnCreate, db: Session = Depends(get_db)):
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan record not found")

    if data.amount_returned <= Decimal("0.00"):
        raise HTTPException(status_code=400, detail="Repayment amount must be greater than zero")
    if data.amount_returned > loan.remaining_balance:
        raise HTTPException(status_code=400, detail=f"Repayment amount PKR {data.amount_returned} exceeds remaining balance PKR {loan.remaining_balance}")

    loan_ret = LoanReturn(
        loan_id=loan.id,
        amount_returned=data.amount_returned,
        return_date=data.return_date,
        payment_method=data.payment_method,
        reference=data.reference or f"RET-LOAN-{int(datetime.utcnow().timestamp())}",
        remarks=data.remarks
    )
    db.add(loan_ret)
    loan.total_returned += data.amount_returned
    loan.remaining_balance -= data.amount_returned
    if loan.remaining_balance == Decimal("0.00"):
        loan.status = "Settled"
    else:
        loan.status = "Partially Returned"

    # Single-source-of-truth Double entry (NO duplicate expense):
    # Debit Loans Payable (2030), Credit Cash/Bank (1010/1020)
    cash_or_bank = "1020" if data.payment_method == "Bank Transfer" else "1010"
    entries = [
        {
            "account_code": "2030",
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": data.amount_returned,
            "memo": f"Loan repayment to {loan.lender_name}"
        },
        {
            "account_code": cash_or_bank,
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": data.amount_returned,
            "memo": f"Disbursement for loan settlement to {loan.lender_name}"
        }
    ]
    post_ledger_transaction(
        db=db,
        tx_code=f"TX-LOANRET-{int(datetime.utcnow().timestamp())}",
        description=f"Return of loan to {loan.lender_name}",
        reference_type="LoanReturn",
        reference_id=str(loan.id),
        entries=entries
    )
    db.commit()
    db.refresh(loan_ret)
    return loan_ret

@router.get("/loans/returns", response_model=List[LoanReturnOut])
def list_loan_returns(db: Session = Depends(get_db)):
    return db.query(LoanReturn).order_by(LoanReturn.return_date.desc(), LoanReturn.id.desc()).all()

# --- DASHBOARD CREDIT & DEBIT DETAILED SUMMARY ---
@router.get("/credit-debit-summary")
def get_credit_debit_summary(db: Session = Depends(get_db)):
    # Credit: Market Receivables / Debtors (Retailer dues)
    debtors = db.query(Retailer).filter(Retailer.balance > 0).order_by(Retailer.balance.desc()).all()
    total_market_credit = sum((d.balance for d in debtors), Decimal("0.00"))
    
    debtor_items = [
        {
            "id": d.id,
            "name": d.name,
            "shop_name": d.shop_name,
            "phone": d.phone or "N/A",
            "balance": float(d.balance),
            "route": d.route or "General Route",
            "type": "Market Credit / Retailer Due",
            "status": "Due"
        }
        for d in debtors
    ]

    # External loans & wholesale credit liabilities
    loans = db.query(Loan).all()
    total_loans_taken = sum((l.amount for l in loans), Decimal("0.00"))
    total_loans_returned = sum((l.total_returned for l in loans), Decimal("0.00"))
    total_loans_remaining = sum((l.remaining_balance for l in loans), Decimal("0.00"))

    company_credit = db.query(CompanyCreditAccount).all()
    company_credit_outstanding = sum((c.outstanding for c in company_credit), Decimal("0.00"))

    # Debit: Capital Injections & Loans Inward
    investments = db.query(Investment).all()
    total_equity_invested = sum((i.amount_given for i in investments), Decimal("0.00"))
    total_equity_returned = sum((i.returns for i in investments), Decimal("0.00"))
    total_equity_remaining = sum((i.remaining for i in investments), Decimal("0.00"))

    total_debit_amount = total_equity_invested + total_loans_taken

    debit_items = []
    for inv in investments:
        debit_items.append({
            "id": f"inv-{inv.id}",
            "name": inv.name,
            "investor_or_lender": inv.name,
            "type": "Equity Capital Investment",
            "amount": float(inv.amount_given),
            "returned": float(inv.returns),
            "remaining": float(inv.remaining),
            "status": inv.status or "Active",
            "date": str(inv.investment_date)
        })

    for l in loans:
        debit_items.append({
            "id": f"loan-{l.id}",
            "name": f"{l.lender_name} ({l.loan_type})",
            "investor_or_lender": l.lender_name,
            "type": f"Loan ({l.loan_type})",
            "amount": float(l.amount),
            "returned": float(l.total_returned),
            "remaining": float(l.remaining_balance),
            "status": l.status or "Active",
            "date": str(l.loan_date)
        })

    return {
        "credit": {
            "total_credit_amount": float(total_market_credit),
            "total_credit_given": float(total_market_credit),
            "total_payables_owed": float(total_loans_remaining + company_credit_outstanding),
            "total_amount": float(total_market_credit),
            "debtor_count": len(debtor_items),
            "items": debtor_items,
            "wholesale_credit": float(company_credit_outstanding),
            "loans_payable": float(total_loans_remaining)
        },
        "debit": {
            "total_debit_amount": float(total_debit_amount),
            "total_equity_invested": float(total_equity_invested),
            "total_equity_returned": float(total_equity_returned),
            "total_equity_remaining": float(total_equity_remaining),
            "total_loans_taken": float(total_loans_taken),
            "total_loans_returned": float(total_loans_returned),
            "total_loans_remaining": float(total_loans_remaining),
            "item_count": len(debit_items),
            "items": debit_items
        }
    }

# --- COMMISSIONS ---
@router.get("/commissions", response_model=List[CommissionOut])
def list_commissions(
    commission_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Commission)
    if commission_type and commission_type != "All":
        q = q.filter(Commission.commission_type == commission_type)
    commissions = q.order_by(Commission.date.desc(), Commission.id.desc()).all()
    results = []
    for c in commissions:
        c_dict = {col.name: getattr(c, col.name) for col in c.__table__.columns}
        c_dict["product_name"] = c.product.name if c.product else None
        results.append(CommissionOut(**c_dict))
    return results

@router.post("/commissions", response_model=CommissionOut)
def create_commission(data: CommissionCreate, db: Session = Depends(get_db)):
    comm = Commission(
        commission_type=data.commission_type,
        amount=data.amount,
        fixed_or_percentage=data.fixed_or_percentage,
        percentage_value=data.percentage_value,
        product_id=data.product_id,
        party_name=data.party_name,
        date=data.date,
        reference=data.reference or f"COM-{int(datetime.utcnow().timestamp())}",
        remarks=data.remarks
    )
    db.add(comm)
    db.flush()

    # Double entry for extra commission/other income:
    # Debit: Cash (1010) or Receivable
    # Credit: Commission Income (4020)
    entries = [
        {
            "account_code": "1010",
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": data.amount,
            "memo": f"Commission received: {data.commission_type}"
        },
        {
            "account_code": "4020",
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": data.amount,
            "memo": f"Commission income ({data.commission_type})"
        }
    ]
    post_ledger_transaction(
        db=db,
        tx_code=f"TX-COM-{comm.id}",
        description=f"Commission: {data.commission_type}",
        reference_type="Commission",
        reference_id=str(comm.id),
        entries=entries
    )

    db.commit()
    db.refresh(comm)
    c_dict = {col.name: getattr(comm, col.name) for col in comm.__table__.columns}
    c_dict["product_name"] = comm.product.name if comm.product else None
    return CommissionOut(**c_dict)
