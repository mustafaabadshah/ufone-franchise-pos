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
    "Rent", "Electricity", "Internet", "Transport", "Fuel",
    "Maintenance", "Salary-related", "Office", "Tea & Refreshment", "Other"
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
    total_amount = sum((e.amount for e in expenses), Decimal("0.00"))
    categories_used = len(set(e.category for e in expenses))

    return {
        "total_amount": float(total_amount),
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

    # Double entry ledger:
    # Debit: Operating Expenses (5020)
    # Credit: Cash (1010) or Bank (1020)
    cash_or_bank = "1020" if data.payment_method == "Bank Transfer" else "1010"
    entries = [
        {
            "account_code": "5020",
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": data.amount,
            "memo": f"Expense: {data.title} ({data.category})"
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
