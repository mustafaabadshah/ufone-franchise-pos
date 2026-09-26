from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.accounting_engine import process_purchase_accounting
from app.models.models import (
    Purchase, PurchaseItem, Product, Company, CompanyCreditAccount,
    CompanyCreditTransaction, Investment, AuditLog
)
from app.schemas.schemas import PurchaseCreate, PurchaseOut

router = APIRouter(prefix="/purchases", tags=["Purchases"])

@router.get("", response_model=List[PurchaseOut])
def list_purchases(
    search: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Purchase)
    if search:
        s = f"%{search}%"
        q = q.filter((Purchase.invoice_number.ilike(s)) | (Purchase.company_name.ilike(s)))
    if date_from:
        q = q.filter(Purchase.purchase_date >= date_from)
    if date_to:
        q = q.filter(Purchase.purchase_date <= date_to)
    if payment_status and payment_status != "All":
        q = q.filter(Purchase.payment_status == payment_status)

    purchases = q.order_by(Purchase.purchase_date.desc(), Purchase.id.desc()).all()
    return purchases

@router.get("/summary")
def get_purchases_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Purchase)
    if date_from:
        q = q.filter(Purchase.purchase_date >= date_from)
    if date_to:
        q = q.filter(Purchase.purchase_date <= date_to)

    purchases = q.all()
    total_qty = sum((sum(i.quantity for i in p.items) for p in purchases), Decimal("0.00"))
    total_amount = sum((p.total_amount for p in purchases), Decimal("0.00"))
    total_paid = sum((p.paid_amount for p in purchases), Decimal("0.00"))
    total_due = sum((p.due_amount for p in purchases), Decimal("0.00"))

    return {
        "total_quantity": float(total_qty),
        "total_amount": float(total_amount),
        "total_paid": float(total_paid),
        "total_due": float(total_due),
        "count": len(purchases)
    }

@router.post("", response_model=PurchaseOut)
def create_purchase(data: PurchaseCreate, db: Session = Depends(get_db)):
    # Auto invoice number if not provided
    inv_num = data.invoice_number or f"PUR-{int(datetime.utcnow().timestamp())}"
    
    # Calculate totals
    subtotal = sum((item.quantity * item.purchase_price - (item.discount or Decimal("0.00")) for item in data.items), Decimal("0.00"))
    total_amt = subtotal - data.discount + data.tax
    paid_amt = min(data.paid_amount, total_amt)
    due_amt = max(Decimal("0.00"), total_amt - paid_amt)

    is_company_credit = (data.payment_method == "Company Credit") or (due_amt > Decimal("0.00"))

    status = "Paid"
    if due_amt > Decimal("0.00") and paid_amt == Decimal("0.00"):
        status = "Due"
    elif due_amt > Decimal("0.00"):
        status = "Partial"

    # Get or create company if company_name provided
    company_obj = None
    if data.company_id:
        company_obj = db.query(Company).filter(Company.id == data.company_id).first()
    elif data.company_name:
        company_obj = db.query(Company).filter(Company.name == data.company_name).first()
        if not company_obj:
            company_obj = Company(name=data.company_name, code=f"COMP-{int(datetime.utcnow().timestamp())}")
            db.add(company_obj)
            db.flush()

    # If company credit, find or create credit account
    credit_account_id = None
    if is_company_credit and company_obj:
        acc = db.query(CompanyCreditAccount).filter(CompanyCreditAccount.company_id == company_obj.id).first()
        if not acc:
            acc = CompanyCreditAccount(
                company_id=company_obj.id,
                reference_number=f"CR-{company_obj.code}",
                description=f"Credit line for {company_obj.name}",
                total_credit=due_amt,
                amount_paid=Decimal("0.00"),
                outstanding=due_amt,
                status="Active",
                due_date=data.due_date
            )
            db.add(acc)
            db.flush()
        else:
            acc.total_credit += due_amt
            acc.outstanding += due_amt
            if data.due_date:
                acc.due_date = data.due_date

        credit_account_id = acc.id

        # Record credit transaction
        ctx = CompanyCreditTransaction(
            account_id=acc.id,
            tx_type="Stock Received on Credit",
            amount=due_amt,
            paid_date=data.purchase_date,
            reference=inv_num,
            remarks=f"Purchase invoice {inv_num} on credit"
        )
        db.add(ctx)

    # If linked to an investor, update investor purchased amount
    if data.investment_id:
        inv_record = db.query(Investment).filter(Investment.id == data.investment_id).first()
        if inv_record:
            inv_record.purchased_amount += total_amt
            inv_record.remaining = inv_record.amount_given - inv_record.purchased_amount + inv_record.returns

    purchase = Purchase(
        invoice_number=inv_num,
        company_id=company_obj.id if company_obj else None,
        company_name=company_obj.name if company_obj else (data.company_name or "PTCL / Ufone Wholesale"),
        purchase_date=data.purchase_date,
        subtotal=subtotal,
        discount=data.discount,
        tax=data.tax,
        total_amount=total_amt,
        paid_amount=paid_amt,
        due_amount=due_amt,
        payment_method=data.payment_method,
        payment_status=status,
        is_company_credit=is_company_credit,
        company_credit_account_id=credit_account_id,
        investment_id=data.investment_id,
        due_date=data.due_date,
        remarks=data.remarks
    )
    db.add(purchase)
    db.flush()

    # Add items
    for item in data.items:
        p_item = PurchaseItem(
            purchase_id=purchase.id,
            product_id=item.product_id,
            quantity=item.quantity,
            purchase_price=item.purchase_price,
            sale_price=item.sale_price or Decimal("0.00"),
            discount=item.discount or Decimal("0.00"),
            total_amount=(item.quantity * item.purchase_price) - (item.discount or Decimal("0.00"))
        )
        db.add(p_item)
    
    db.flush()

    # Run centralized accounting engine (stocks, WAC, ledger)
    process_purchase_accounting(db, purchase)

    # Log audit
    log = AuditLog(
        action="Create",
        entity="Purchase",
        entity_id=str(purchase.id),
        new_value=f"Created purchase {purchase.invoice_number} of total PKR {purchase.total_amount}"
    )
    db.add(log)
    db.commit()
    db.refresh(purchase)
    return purchase

@router.get("/{purchase_id}", response_model=PurchaseOut)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    p = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return p
