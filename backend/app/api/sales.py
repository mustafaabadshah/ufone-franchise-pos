from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.accounting_engine import process_sale_accounting
from app.models.models import (
    Sale, SaleItem, Product, Retailer, RSO, Staff, AuditLog
)
from app.schemas.schemas import SaleCreate, SaleOut

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.get("", response_model=List[SaleOut])
def list_sales(
    search: Optional[str] = None,
    staff_id: Optional[int] = None,
    retailer_id: Optional[int] = None,
    rso_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Sale)
    if search:
        s = f"%{search}%"
        q = q.filter((Sale.invoice_number.ilike(s)) | (Sale.customer_name.ilike(s)) | (Sale.title.ilike(s)))
    if staff_id:
        q = q.filter(Sale.staff_id == staff_id)
    if retailer_id:
        q = q.filter(Sale.retailer_id == retailer_id)
    if rso_id:
        q = q.filter(Sale.rso_id == rso_id)
    if date_from:
        q = q.filter(Sale.sale_date >= date_from)
    if date_to:
        q = q.filter(Sale.sale_date <= date_to)

    sales = q.order_by(Sale.sale_date.desc(), Sale.id.desc()).all()
    # Enrich names
    res = []
    for s in sales:
        s_dict = {c.name: getattr(s, c.name) for c in s.__table__.columns}
        s_dict["staff_name"] = s.staff.name if s.staff else None
        s_dict["retailer_name"] = s.retailer.name if s.retailer else None
        s_dict["rso_name"] = s.rso.name if s.rso else None
        s_dict["items"] = s.items
        res.append(SaleOut(**s_dict))
    return res

@router.get("/summary")
def get_sales_summary(
    staff_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Sale)
    if staff_id:
        q = q.filter(Sale.staff_id == staff_id)
    if date_from:
        q = q.filter(Sale.sale_date >= date_from)
    if date_to:
        q = q.filter(Sale.sale_date <= date_to)

    sales = q.all()
    total_qty = sum((sum(i.quantity for i in s.items) for s in sales), Decimal("0.00"))
    total_amount = sum((s.total_amount for s in sales), Decimal("0.00"))
    paid_amount = sum((s.paid_amount for s in sales), Decimal("0.00"))
    remaining_amount = sum((s.remaining_amount for s in sales), Decimal("0.00"))

    return {
        "total_quantity": float(total_qty),
        "total_amount": float(total_amount),
        "paid_amount": float(paid_amount),
        "total_remaining": float(remaining_amount),
        "count": len(sales)
    }

@router.post("", response_model=SaleOut)
def create_sale(data: SaleCreate, db: Session = Depends(get_db)):
    # Validate stock before processing sale
    for item in data.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        if prod.current_stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {prod.name}. Available: {prod.current_stock}, Requested: {item.quantity}"
            )

    inv_num = data.invoice_number or f"SAL-{int(datetime.utcnow().timestamp())}"
    
    subtotal = sum((item.quantity * item.unit_price - (item.discount or Decimal("0.00")) for item in data.items), Decimal("0.00"))
    total_amt = subtotal - data.discount + data.tax
    paid_amt = min(data.paid_amount, total_amt)
    remaining_amt = max(Decimal("0.00"), total_amt - paid_amt)

    status = "Paid"
    if remaining_amt > Decimal("0.00") and paid_amt == Decimal("0.00"):
        status = "Due"
    elif remaining_amt > Decimal("0.00"):
        status = "Partial"

    sale = Sale(
        invoice_number=inv_num,
        title=data.title or "Direct Sale",
        sale_date=data.sale_date,
        sale_type=data.sale_type,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        staff_id=data.staff_id,
        retailer_id=data.retailer_id,
        rso_id=data.rso_id,
        subtotal=subtotal,
        discount=data.discount,
        tax=data.tax,
        commission=data.commission,
        total_amount=total_amt,
        paid_amount=paid_amt,
        remaining_amount=remaining_amt,
        payment_method=data.payment_method,
        payment_status=status,
        remarks=data.remarks
    )
    db.add(sale)
    db.flush()

    for item in data.items:
        s_item = SaleItem(
            sale_id=sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            discount=item.discount or Decimal("0.00"),
            commission=item.commission or Decimal("0.00"),
            total_amount=(item.quantity * item.unit_price) - (item.discount or Decimal("0.00"))
        )
        db.add(s_item)

    db.flush()

    # Update retailer/RSO balance if on credit
    if remaining_amt > Decimal("0.00"):
        if data.retailer_id:
            ret = db.query(Retailer).filter(Retailer.id == data.retailer_id).first()
            if ret:
                ret.balance += remaining_amt
        elif data.rso_id:
            rso = db.query(RSO).filter(RSO.id == data.rso_id).first()
            if rso:
                rso.current_balance += remaining_amt

    # Run centralized accounting engine (stocks, COGS, ledger)
    process_sale_accounting(db, sale)

    log = AuditLog(
        action="Create",
        entity="Sale",
        entity_id=str(sale.id),
        new_value=f"Created sale {sale.invoice_number} of PKR {sale.total_amount}"
    )
    db.add(log)
    db.commit()
    db.refresh(sale)

    s_dict = {c.name: getattr(sale, c.name) for c in sale.__table__.columns}
    s_dict["staff_name"] = sale.staff.name if sale.staff else None
    s_dict["retailer_name"] = sale.retailer.name if sale.retailer else None
    s_dict["rso_name"] = sale.rso.name if sale.rso else None
    s_dict["items"] = sale.items
    return SaleOut(**s_dict)

@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    s_dict = {c.name: getattr(sale, c.name) for c in sale.__table__.columns}
    s_dict["staff_name"] = sale.staff.name if sale.staff else None
    s_dict["retailer_name"] = sale.retailer.name if sale.retailer else None
    s_dict["rso_name"] = sale.rso.name if sale.rso else None
    s_dict["items"] = sale.items
    return SaleOut(**s_dict)
