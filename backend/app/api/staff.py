from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Staff, AuditLog
from app.schemas.schemas import StaffCreate, StaffUpdate, StaffOut

router = APIRouter(prefix="/staff", tags=["Staff Management"])

@router.get("", response_model=List[StaffOut])
def list_staff(db: Session = Depends(get_db)):
    return db.query(Staff).order_by(Staff.id.asc()).all()

@router.post("", response_model=StaffOut)
def create_staff(data: StaffCreate, db: Session = Depends(get_db)):
    staff = Staff(
        name=data.name,
        email=data.email,
        phone=data.phone,
        role=data.role,
        salary_amount=data.salary_amount,
        joining_date=data.joining_date,
        status=data.status
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff

@router.get("/{staff_id}", response_model=StaffOut)
def get_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff

@router.put("/{staff_id}", response_model=StaffOut)
def update_staff(staff_id: int, data: StaffUpdate, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(staff, field, value)

    db.commit()
    db.refresh(staff)
    return staff

@router.delete("/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    staff.status = "Inactive"
    db.commit()
    return {"message": "Staff member marked as Inactive"}
