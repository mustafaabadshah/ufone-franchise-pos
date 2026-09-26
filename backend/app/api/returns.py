from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.accounting_engine import process_return_accounting
from app.models.models import Return, ReturnItem, Product, Investment, AuditLog
from app.schemas.schemas import ReturnCreate, ReturnOut

router = APIRouter(prefix="/returns", tags=["Returns"])

@router.get("", response_model=List[ReturnOut])
def list_returns(db: Session = Depends(get_db)):
    returns = db.query(Return).order_by(Return.return_date.desc(), Return.id.desc()).all()
    return returns

@router.post("", response_model=ReturnOut)
def create_return(data: ReturnCreate, db: Session = Depends(get_db)):
    ret_num = f"RET-{int(datetime.utcnow().timestamp())}"
    total_val = sum((item.quantity * item.unit_price for item in data.items), Decimal("0.00"))
    refund_val = data.refunded_amount if data.refunded_amount > Decimal("0.00") else total_val

    # If linked to an investor return (like the reference panel allows returns against investors)
    if data.investment_id:
        inv = db.query(Investment).filter(Investment.id == data.investment_id).first()
        if inv:
            inv.returns += total_val
            inv.remaining = inv.amount_given - inv.purchased_amount + inv.returns

    ret = Return(
        return_number=ret_num,
        return_type=data.return_type,
        return_date=data.return_date,
        original_reference=data.original_reference,
        sale_id=data.sale_id,
        purchase_id=data.purchase_id,
        retailer_id=data.retailer_id,
        rso_id=data.rso_id,
        company_id=data.company_id,
        investment_id=data.investment_id,
        total_amount=total_val,
        refunded_amount=refund_val,
        reason=data.reason,
        remarks=data.remarks
    )
    db.add(ret)
    db.flush()

    for item in data.items:
        r_item = ReturnItem(
            return_id=ret.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            total_amount=item.quantity * item.unit_price
        )
        db.add(r_item)

    db.flush()

    # Process inventory and financial reversals in centralized accounting engine
    process_return_accounting(db, ret)

    log = AuditLog(
        action="Return",
        entity="Return",
        entity_id=str(ret.id),
        new_value=f"Processed return {ret.return_number} of PKR {ret.total_amount} ({ret.return_type})"
    )
    db.add(log)
    db.commit()
    db.refresh(ret)
    return ret
