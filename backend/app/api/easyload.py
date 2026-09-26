from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import EasyLoadTransaction, Retailer, RSO, AuditLog
from app.schemas.schemas import EasyLoadCreate, EasyLoadOut

router = APIRouter(prefix="/easyload", tags=["EasyLoad Management"])

@router.get("", response_model=List[EasyLoadOut])
def list_easyload_transactions(
    msisdn: Optional[str] = None,
    retailer_id: Optional[int] = None,
    rso_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(EasyLoadTransaction)
    if msisdn:
        q = q.filter(EasyLoadTransaction.msisdn.ilike(f"%{msisdn}%"))
    if retailer_id:
        q = q.filter(EasyLoadTransaction.retailer_id == retailer_id)
    if rso_id:
        q = q.filter(EasyLoadTransaction.rso_id == rso_id)
    if date_from:
        q = q.filter(EasyLoadTransaction.date >= date_from)
    if date_to:
        q = q.filter(EasyLoadTransaction.date <= date_to)

    txs = q.order_by(EasyLoadTransaction.date.desc(), EasyLoadTransaction.id.desc()).all()
    results = []
    for t in txs:
        t_dict = {c.name: getattr(t, c.name) for c in t.__table__.columns}
        t_dict["retailer_name"] = t.retailer.name if t.retailer else None
        t_dict["rso_name"] = t.rso.name if t.rso else None
        results.append(EasyLoadOut(**t_dict))
    return results

@router.get("/summary")
def get_easyload_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(EasyLoadTransaction)
    if date_from:
        q = q.filter(EasyLoadTransaction.date >= date_from)
    if date_to:
        q = q.filter(EasyLoadTransaction.date <= date_to)

    txs = q.all()
    total_transferred = sum((t.amount for t in txs if t.tx_type == "Transfer"), Decimal("0.00"))
    total_issued = sum((t.amount for t in txs if t.tx_type == "Issuance"), Decimal("0.00"))
    total_commission = sum((t.commission for t in txs), Decimal("0.00"))
    total_discount = sum((t.discount for t in txs), Decimal("0.00"))

    # Active RSO easyload balance pool
    rso_pool = db.query(func.coalesce(func.sum(RSO.easyload_balance), 0)).scalar()

    return {
        "total_transferred": float(total_transferred),
        "total_issued": float(total_issued),
        "total_commission": float(total_commission),
        "total_discount": float(total_discount),
        "active_rso_pool": float(rso_pool),
        "count": len(txs)
    }

@router.post("", response_model=EasyLoadOut)
def create_easyload_transaction(data: EasyLoadCreate, db: Session = Depends(get_db)):
    tx = EasyLoadTransaction(
        date=data.date,
        msisdn=data.msisdn,
        retailer_id=data.retailer_id,
        rso_id=data.rso_id,
        tx_type=data.tx_type,
        amount=data.amount,
        discount=data.discount,
        commission=data.commission,
        reference=data.reference or f"ELD-{int(datetime.utcnow().timestamp())}",
        remarks=data.remarks
    )
    db.add(tx)

    # If transferred to retailer, update retailer balance
    if data.retailer_id and data.tx_type in ["Transfer", "Sale"]:
        ret = db.query(Retailer).filter(Retailer.id == data.retailer_id).first()
        if ret:
            ret.balance += (data.amount - data.discount)

    # If issued from RSO, update RSO easyload pool
    if data.rso_id:
        rso = db.query(RSO).filter(RSO.id == data.rso_id).first()
        if rso:
            if data.tx_type == "Issuance":
                rso.easyload_balance += data.amount
            elif data.tx_type == "Transfer":
                rso.easyload_balance -= data.amount

    log = AuditLog(
        action="Create",
        entity="EasyLoad",
        entity_id=str(tx.id),
        new_value=f"EasyLoad {data.tx_type} PKR {data.amount} to MSISDN {data.msisdn}"
    )
    db.add(log)
    db.commit()
    db.refresh(tx)

    t_dict = {c.name: getattr(tx, c.name) for c in tx.__table__.columns}
    t_dict["retailer_name"] = tx.retailer.name if tx.retailer else None
    t_dict["rso_name"] = tx.rso.name if tx.rso else None
    return EasyLoadOut(**t_dict)
