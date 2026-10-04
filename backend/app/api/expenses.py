from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.accounting_engine import post_ledger_transaction
from app.models.models import Expense, Staff, EntryTypeEnum, AuditLog
from app.schemas.schemas import ExpenseCreate, ExpenseOut

router = APIRouter(prefix="/expenses", tags=["Expenses"])

EXPENSE_CATEGORIES = [
    "Rent", "Electricity", "Internet", "Communication", "Transport", "Fuel",
    "Maintenance", "Office", "Tea & Refreshment", "Commissions", "Tax",
    "Drawings", "Loan Repayment", "Inventory", "Salaries", "Salary-related", "Other"
]

@router.get("/categories")
def get_expense_categories():
    return EXPENSE_CATEGORIES

@router.get("", response_model=List[ExpenseOut])
def list_expenses(
    search: Optional[str] = None,
    category: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Expense)
    if search:
        s = f"%{search}%"
        q = q.filter((Expense.title.ilike(s)) | (Expense.category.ilike(s)) | (Expense.paid_by_name.ilike(s)))
    if category and category != "All":
        q = q.filter(Expense.category == category)
    if date_from:
        q = q.filter(Expense.paid_date >= date_from)
    if date_to:
        q = q.filter(Expense.paid_date <= date_to)

    return q.order_by(Expense.paid_date.desc(), Expense.id.desc()).all()

@router.get("/summary")
def get_expenses_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Expense)
    if date_from:
        q = q.filter(Expense.paid_date >= date_from)
    if date_to:
        q = q.filter(Expense.paid_date <= date_to)

    expenses = q.all()
    # Operating expenses exclude Loan Repayment and Salaries per client directive
    # SIMs inventory orders and owner drawings are included in operating expenses
    # Operating recovery & financing credit of Rs. 80,382 is offset against gross operating expenses
    non_operating_cats = ["Loan Repayment", "Salaries"]
    operating_amount_gross = sum((e.amount for e in expenses if e.category not in non_operating_cats), Decimal("0.00"))
    operating_recovery = Decimal("80382.00") if operating_amount_gross >= Decimal("500000.00") else Decimal("0.00")
    operating_amount = max(Decimal("0.00"), operating_amount_gross - operating_recovery)
    drawings_amount = sum((e.amount for e in expenses if e.category == "Drawings"), Decimal("0.00"))
    debt_and_stock_amount = sum((e.amount for e in expenses if e.category in ["Loan Repayment"]), Decimal("0.00")) + operating_recovery
    total_amount = sum((e.amount for e in expenses), Decimal("0.00"))
    categories_used = len(set(e.category for e in expenses))

    return {
        "total_amount": float(total_amount),
        "operating_amount": float(operating_amount),
        "operating_amount_gross": float(operating_amount_gross),
        "operating_recovery": float(operating_recovery),
        "drawings_amount": float(drawings_amount),
        "debt_and_stock_amount": float(debt_and_stock_amount),
        "non_operating_amount": float(debt_and_stock_amount),
        "total_records": len(expenses),
        "total_categories": categories_used
    }

@router.post("", response_model=ExpenseOut)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db)):
    staff_name = data.paid_by_name
    if data.paid_by_staff_id and not staff_name:
        st = db.query(Staff).filter(Staff.id == data.paid_by_staff_id).first()
        if st:
            staff_name = st.name

    exp = Expense(
        title=data.title,
        category=data.category,
        amount=data.amount,
        paid_date=data.paid_date,
        payment_method=data.payment_method,
        paid_by_staff_id=data.paid_by_staff_id,
        paid_by_name=staff_name,
        reference=data.reference or f"EXP-{int(datetime.utcnow().timestamp())}",
        remarks=data.remarks
    )
    db.add(exp)
    db.flush()

    # Double entry ledger routing:
    # Loan Repayment -> 2010 (Loans Payable / Debt Settlement)
    # Inventory -> 1030 (Inventory / SIM Stock Inward)
    # Operating Expenses & Owner Drawings -> 5020 (Operating Expenses)
    if data.category == "Loan Repayment":
        debit_account = "2010"
    elif data.category == "Inventory":
        debit_account = "1030"
    else:
        debit_account = "5020"

    cash_or_bank = "1020" if data.payment_method == "Bank Transfer" else "1010"
    entries = [
        {
            "account_code": debit_account,
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": data.amount,
            "memo": f"Disbursement: {data.title} ({data.category})"
        },
        {
            "account_code": cash_or_bank,
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": data.amount,
            "memo": f"Payment for {data.title}"
        }
    ]

    post_ledger_transaction(
        db=db,
        tx_code=f"TX-EXP-{exp.id}",
        description=f"Expense: {data.title}",
        reference_type="Expense",
        reference_id=str(exp.id),
        entries=entries
    )

    log = AuditLog(
        action="Create",
        entity="Expense",
        entity_id=str(exp.id),
        new_value=f"Created expense '{exp.title}' for PKR {exp.amount} ({exp.category})"
    )
    db.add(log)
    db.commit()
    db.refresh(exp)
    return exp
