from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import AuditLog, User, Role, Permission
from app.schemas.schemas import AuditLogOut, UserOut, UserCreate

router = APIRouter(prefix="/admin", tags=["Administration & Audit"])

@router.get("/audit-logs", response_model=List[AuditLogOut])
def list_audit_logs(
    entity: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(AuditLog)
    if entity and entity != "All":
        q = q.filter(AuditLog.entity == entity)
    if action and action != "All":
        q = q.filter(AuditLog.action == action)
    return q.order_by(AuditLog.timestamp.desc()).limit(200).all()

@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    results = []
    for u in users:
        u_dict = {c.name: getattr(u, c.name) for c in u.__table__.columns}
        u_dict["role_name"] = u.role.name if u.role else "Staff"
        results.append(UserOut(**u_dict))
    return results

@router.get("/roles")
def list_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description,
            "permissions": [rp.permission.code for rp in r.permissions if rp.permission]
        }
        for r in roles
    ]
