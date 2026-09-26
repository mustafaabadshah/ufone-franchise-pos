from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import Retailer, RetailerCollection, AuditLog
from app.schemas.schemas import (
    RetailerCreate, RetailerUpdate, RetailerOut, RetailerCollectionCreate, RetailerCollectionOut
)

router = APIRouter(prefix="/retailers", tags=["Retailers & Collections"])

@router.get("", response_model=List[RetailerOut])
def list_retailers(search: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Retailer)
    if search:
        s = f"%{search}%"
        q = q.filter((Retailer.name.ilike(s)) | (Retailer.shop_name.ilike(s)) | (Retailer.phone.ilike(s)))
    return q.order_by(Retailer.name.asc()).all()

@router.post("", response_model=RetailerOut)
def create_retailer(data: RetailerCreate, db: Session = Depends(get_db)):
    retailer = Retailer(
        name=data.name,
        shop_name=data.shop_name or data.name,
        phone=data.phone,
        msisdn=data.msisdn,
        address=data.address,
        route=data.route,
        balance=Decimal("0.00")
    )
    db.add(retailer)
    db.commit()
    db.refresh(retailer)
    return retailer

@router.get("/{retailer_id}", response_model=RetailerOut)
def get_retailer(retailer_id: int, db: Session = Depends(get_db)):
    ret = db.query(Retailer).filter(Retailer.id == retailer_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Retailer not found")
    return ret

@router.put("/{retailer_id}", response_model=RetailerOut)
def update_retailer(retailer_id: int, data: RetailerUpdate, db: Session = Depends(get_db)):
    ret = db.query(Retailer).filter(Retailer.id == retailer_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Retailer not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(ret, field, value)

    db.commit()
    db.refresh(ret)
    return ret

# --- COLLECTIONS ---
@router.get("/collections/all", response_model=List[RetailerCollectionOut])
def list_collections(
    retailer_id: Optional[int] = None,
    collection_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(RetailerCollection)
    if retailer_id:
        q = q.filter(RetailerCollection.retailer_id == retailer_id)
    if collection_type and collection_type != "All":
        q = q.filter(RetailerCollection.collection_type == collection_type)
    if date_from:
        q = q.filter(RetailerCollection.date >= date_from)
    if date_to:
        q = q.filter(RetailerCollection.date <= date_to)

    cols = q.order_by(RetailerCollection.date.desc(), RetailerCollection.id.desc()).all()
    results = []
    for c in cols:
        c_dict = {col.name: getattr(c, col.name) for col in c.__table__.columns}
        c_dict["retailer_name"] = c.retailer.name if c.retailer else None
        results.append(RetailerCollectionOut(**c_dict))
    return results

@router.get("/collections/summary")
def get_collections_summary(db: Session = Depends(get_db)):
    cols = db.query(RetailerCollection).all()
    total_sent = sum((c.amount for c in cols if c.collection_type == "Balance Sent"), Decimal("0.00"))
    total_received = sum((c.amount for c in cols if c.collection_type == "Balance Received"), Decimal("0.00"))
    total_outstanding = db.query(func.coalesce(func.sum(Retailer.balance), 0)).scalar()

    return {
        "total_sent": float(total_sent),
        "total_received": float(total_received),
        "outstanding": float(total_outstanding),
        "count": len(cols)
    }

@router.post("/collections", response_model=RetailerCollectionOut)
def record_retailer_collection(data: RetailerCollectionCreate, db: Session = Depends(get_db)):
    ret = db.query(Retailer).filter(Retailer.id == data.retailer_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Retailer not found")

    col = RetailerCollection(
        retailer_id=data.retailer_id,
        msisdn=data.msisdn or ret.msisdn,
        date=data.date,
        collection_type=data.collection_type,
        amount=data.amount,
        payment_method=data.payment_method,
        reason=data.reason,
        due_date=data.due_date,
        remarks=data.remarks
    )
    db.add(col)

    # Adjust retailer balance
    if data.collection_type == "Balance Sent":
        ret.balance += data.amount
    elif data.collection_type == "Balance Received":
        ret.balance = max(Decimal("0.00"), ret.balance - data.amount)

    log = AuditLog(
        action="Collection",
        entity="RetailerCollection",
        entity_id=str(col.id),
        new_value=f"Recorded {data.collection_type} PKR {data.amount} for retailer {ret.name}"
    )
    db.add(log)
    db.commit()
    db.refresh(col)

    c_dict = {col_name.name: getattr(col, col_name.name) for col_name in col.__table__.columns}
    c_dict["retailer_name"] = ret.name
    return RetailerCollectionOut(**c_dict)
