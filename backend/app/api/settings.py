from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Setting, AuditLog
from app.schemas.schemas import SettingUpdate, SettingOut

router = APIRouter(prefix="/settings", tags=["Settings"])

DEFAULT_SETTINGS = [
    {"key": "company_name", "value": "Ufone Franchise - Dargai Office", "category": "general", "description": "Parent telecom entity"},
    {"key": "franchise_name", "value": "Ufone Franchise - Dargai Office", "category": "general", "description": "Shop / Franchise commercial name"},
    {"key": "branch", "value": "Dargai Office", "category": "general", "description": "Franchise branch or location"},
    {"key": "address", "value": "Main Bazar, Dargai, Malakand, KP", "category": "general", "description": "Physical shop address"},
    {"key": "phone", "value": "+92 333 9123456", "category": "general", "description": "Contact number"},
    {"key": "currency", "value": "PKR", "category": "general", "description": "Operational currency symbol"},
    {"key": "invoice_prefix", "value": "UF-DARG-", "category": "sales", "description": "Sales invoice prefix"},
    {"key": "date_format", "value": "YYYY-MM-DD", "category": "general", "description": "Display date format"},
    {"key": "low_stock_threshold", "value": "10", "category": "stock", "description": "Global default low stock alert threshold"},
    {"key": "default_tax", "value": "0.0", "category": "finance", "description": "Default tax percentage"},
    {"key": "default_discount", "value": "0.0", "category": "sales", "description": "Default discount value"},
    {"key": "payment_methods", "value": "Cash,Bank Transfer,Company Credit,Cheque,Online", "category": "finance", "description": "Allowed payment methods"},
    {"key": "print_header", "value": "UFONE 4G FRANCHISE - DARGAI OFFICE", "category": "print", "description": "Printed document header text"},
    {"key": "print_footer", "value": "Thank you for using Ufone 4G Network! (Dargai Office)", "category": "print", "description": "Printed document footer note"}
]

def init_default_settings(db: Session):
    for s in DEFAULT_SETTINGS:
        existing = db.query(Setting).filter(Setting.key == s["key"]).first()
        if not existing:
            st = Setting(key=s["key"], value=s["value"], category=s["category"], description=s["description"])
            db.add(st)
    db.commit()

@router.get("", response_model=List[SettingOut])
def get_all_settings(db: Session = Depends(get_db)):
    settings_list = db.query(Setting).all()
    if not settings_list:
        init_default_settings(db)
        settings_list = db.query(Setting).all()
    return settings_list

@router.put("/{key}")
def update_setting(key: str, data: SettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        setting = Setting(key=key, value=data.value)
        db.add(setting)
    else:
        setting.value = data.value
    
    log = AuditLog(
        action="Update",
        entity="Setting",
        entity_id=key,
        new_value=f"Updated setting {key} to {data.value}"
    )
    db.add(log)
    db.commit()
    return {"message": "Setting updated successfully", "key": key, "value": data.value}
