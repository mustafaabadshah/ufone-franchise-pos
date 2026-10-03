import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import Loan, LoanReturn, Investment, InvestmentReturn, Expense, LedgerTransaction, LedgerEntry, LedgerAccount
from app.core.accounting_engine import calculate_profit_and_loss

client = TestClient(app)

def test_credit_debit_summary_endpoint():
    """Verify /api/v1/finance/credit-debit-summary returns accurate credit and debit details"""
    res = client.get("/api/v1/finance/credit-debit-summary")
    assert res.status_code == 200
    data = res.json()
    assert "credit" in data
    assert "debit" in data
    
    # Credit verification
    credit = data["credit"]
    assert credit["total_credit_amount"] == 719385.0
    assert credit["total_amount"] == 719385.0
    assert len(credit["items"]) >= 10
    
    # Debit verification (6.64M total debit)
    debit = data["debit"]
    assert debit["total_debit_amount"] == 6649340.0
    assert debit["total_equity_invested"] == 5220410.0
    assert debit["total_loans_taken"] == 1428930.0
    assert len(debit["items"]) >= 6

def test_loans_creation_and_repayment_no_double_entry():
    """Verify loan creation and repayment balances properly without polluting operating expenses"""
    db = SessionLocal()
    initial_expense_count = db.query(Expense).count()
    initial_pnl = calculate_profit_and_loss(db)
    cash_acct = db.query(LedgerAccount).filter(LedgerAccount.code == "1010").first()
    initial_cash_bal = cash_acct.balance if cash_acct else Decimal("0.00")
    db.close()
    
    # 1. Create a new loan of Rs. 100,000
    loan_payload = {
        "lender_name": "Test Working Lender",
        "phone": "03339998888",
        "loan_type": "Working Capital Loan",
        "amount": 100000.0,
        "loan_date": "2026-08-15",
        "due_date": "2026-12-31",
        "payment_method": "Cash",
        "remarks": "Automated zero-double-entry verification loan"
    }
    create_res = client.post("/api/v1/finance/loans", json=loan_payload)
    assert create_res.status_code == 200
    loan_data = create_res.json()
    loan_id = loan_data["id"]

    try:
        assert float(loan_data["amount"]) == 100000.0
        assert float(loan_data["remaining_balance"]) == 100000.0
        assert loan_data["status"] == "Active"

        # 2. Record Return of Loan (Rs. 40,000 partial repayment)
        return_payload = {
            "amount_returned": 40000.0,
            "return_date": "2026-08-20",
            "payment_method": "Cash",
            "reference": "RET-TEST-001",
            "remarks": "Partial loan return test"
        }
        return_res = client.post(f"/api/v1/finance/loans/{loan_id}/returns", json=return_payload)
        assert return_res.status_code == 200
        ret_data = return_res.json()
        assert float(ret_data["amount_returned"]) == 40000.0

        # 3. Check updated loan record
        loans_list_res = client.get("/api/v1/finance/loans")
        assert loans_list_res.status_code == 200
        loans_all = loans_list_res.json()
        matched = [l for l in loans_all if l["id"] == loan_id][0]
        assert float(matched["total_returned"]) == 40000.0
        assert float(matched["remaining_balance"]) == 60000.0
        assert matched["status"] == "Partially Returned"

        # 4. Zero Double Entry Guarantee Check:
        # Operating expenses must NOT increase, operating P&L must NOT change
        db = SessionLocal()
        after_expense_count = db.query(Expense).count()
        after_pnl = calculate_profit_and_loss(db)
        
        assert after_expense_count == initial_expense_count, "Zero double-entry violation: loan transaction created false Expense record!"
        assert after_pnl["operating_expenses"] == initial_pnl["operating_expenses"], "Zero double-entry violation: operating expenses changed!"
        assert after_pnl["net_profit"] == initial_pnl["net_profit"], "Zero double-entry violation: operating net profit changed!"
    finally:
        # Clean up test loan, returns, and associated ledger entries
        db = SessionLocal()
        db.query(LoanReturn).filter(LoanReturn.loan_id == loan_id).delete()
        db.query(Loan).filter(Loan.id == loan_id).delete()
        txs = db.query(LedgerTransaction).filter(
            (LedgerTransaction.reference_type == "Loan") & (LedgerTransaction.reference_id == str(loan_id))
        ).all()
        for t in txs:
            db.query(LedgerEntry).filter(LedgerEntry.transaction_id == t.id).delete()
            db.delete(t)
        cash_acct = db.query(LedgerAccount).filter(LedgerAccount.code == "1010").first()
        if cash_acct:
            cash_acct.balance = initial_cash_bal
        db.commit()
        db.close()

def test_investment_return_no_double_entry():
    """Verify return of investment does NOT insert duplicate operating expenses"""
    db = SessionLocal()
    inv = db.query(Investment).first()
    assert inv is not None
    initial_returns = inv.returns
    initial_expense_count = db.query(Expense).count()
    cash_acct = db.query(LedgerAccount).filter(LedgerAccount.code == "1010").first()
    initial_cash_bal = cash_acct.balance if cash_acct else Decimal("0.00")
    db.close()

    ret_payload = {
        "amount": 25000.0,
        "return_date": "2026-08-25",
        "return_type": "Profit Distribution",
        "payment_method": "Cash",
        "reference": "RET-INV-TEST",
        "remarks": "Test investment return"
    }
    res = client.post(f"/api/v1/finance/investments/{inv.id}/returns", json=ret_payload)
    assert res.status_code == 200
    ret_obj = res.json()

    try:
        assert float(ret_obj["amount"]) == 25000.0

        # Ensure no expense pollution
        db = SessionLocal()
        after_expense_count = db.query(Expense).count()
        assert after_expense_count == initial_expense_count, "Investment return erroneously inserted an operating Expense!"
    finally:
        # Clean up test return and restore ledger
        db = SessionLocal()
        db.query(InvestmentReturn).filter(InvestmentReturn.id == ret_obj["id"]).delete()
        inv_reloaded = db.query(Investment).filter(Investment.id == inv.id).first()
        inv_reloaded.returns = initial_returns
        inv_reloaded.remaining = inv_reloaded.amount_given - initial_returns
        txs = db.query(LedgerTransaction).filter(
            LedgerTransaction.description.like(f"%Return of Investment to {inv.name}%")
        ).all()
        for t in txs:
            db.query(LedgerEntry).filter(LedgerEntry.transaction_id == t.id).delete()
            db.delete(t)
        cash_acct = db.query(LedgerAccount).filter(LedgerAccount.code == "1010").first()
        if cash_acct:
            cash_acct.balance = initial_cash_bal
        db.commit()
        db.close()
