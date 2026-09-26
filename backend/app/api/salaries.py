from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.accounting_engine import post_ledger_transaction
from app.models.models import Staff, Salary, EntryTypeEnum, AuditLog
from app.schemas.schemas import SalaryCreate, SalaryOut

router = APIRouter(prefix="/salaries", tags=["Salaries & Payroll"])

@router.get("", response_model=List[SalaryOut])
def list_salaries(
    search: Optional[str] = None,
    month: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Salary).join(Staff)
    if search:
        s = f"%{search}%"
        q = q.filter((Staff.name.ilike(s)) | (Salary.month.ilike(s)))
    if month:
        q = q.filter(Salary.month == month)
    if date_from:
        q = q.filter(Salary.paid_on >= date_from)
    if date_to:
        q = q.filter(Salary.paid_on <= date_to)

    salaries = q.order_by(Salary.paid_on.desc(), Salary.id.desc()).all()
    results = []
    for sal in salaries:
        s_dict = {c.name: getattr(sal, c.name) for c in sal.__table__.columns}
        s_dict["staff_name"] = sal.staff_member.name if sal.staff_member else None
        results.append(SalaryOut(**s_dict))
    return results

@router.get("/summary")
def get_salaries_summary(
    month: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Salary)
    if month:
        q = q.filter(Salary.month == month)
    if date_from:
        q = q.filter(Salary.paid_on >= date_from)
    if date_to:
        q = q.filter(Salary.paid_on <= date_to)

    salaries = q.all()
    total_salary = sum((s.net_salary for s in salaries), Decimal("0.00"))
    salary_given = sum((s.salary_given for s in salaries), Decimal("0.00"))
    total_remaining = sum((s.remaining for s in salaries), Decimal("0.00"))

    return {
        "total_salary": float(total_salary),
        "salary_given": float(salary_given),
        "total_remaining": float(total_remaining),
        "total_records": len(salaries)
    }

@router.post("", response_model=SalaryOut)
def record_salary_disbursement(data: SalaryCreate, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.id == data.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    net_salary = data.basic_salary + data.allowances - data.deductions + data.bonus + data.commission
    given = min(data.salary_given, net_salary)
    remaining = max(Decimal("0.00"), net_salary - given)

    status = "Paid" if remaining == Decimal("0.00") else ("Partial" if given > Decimal("0.00") else "Unpaid")

    sal = Salary(
        staff_id=data.staff_id,
        month=data.month,
        basic_salary=data.basic_salary,
        allowances=data.allowances,
        deductions=data.deductions,
        bonus=data.bonus,
        commission=data.commission,
        net_salary=net_salary,
        salary_given=given,
        remaining=remaining,
        paid_on=data.paid_on,
        paid_by=data.paid_by,
        payment_method=data.payment_method,
        status=status,
        remarks=data.remarks
    )
    db.add(sal)
    db.flush()

    # Double entry ledger for salary:
    # Debit: Salary Expense (5030) for net salary
    # Credit: Cash (1010) or Bank (1020) for paid amount, Accrued Salaries (2020) for remaining
    entries = [
        {
            "account_code": "5030",
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": net_salary,
            "memo": f"Salary for {staff.name} ({sal.month})"
        }
    ]
    if given > Decimal("0.00"):
        cash_or_bank = "1020" if data.payment_method == "Bank Transfer" else "1010"
        entries.append({
            "account_code": cash_or_bank,
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": given,
            "memo": f"Disbursed salary to {staff.name}"
        })
    if remaining > Decimal("0.00"):
        entries.append({
            "account_code": "2020",
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": remaining,
            "memo": f"Accrued salary payable to {staff.name}"
        })

    post_ledger_transaction(
        db=db,
        tx_code=f"TX-SAL-{sal.id}",
        description=f"Salary disbursement for {staff.name} ({sal.month})",
        reference_type="Salary",
        reference_id=str(sal.id),
        entries=entries
    )

    log = AuditLog(
        action="Salary",
        entity="Salary",
        entity_id=str(sal.id),
        new_value=f"Disbursed salary of PKR {given} to {staff.name} for month {sal.month}"
    )
    db.add(log)
    db.commit()
    db.refresh(sal)

    s_dict = {c.name: getattr(sal, c.name) for c in sal.__table__.columns}
    s_dict["staff_name"] = staff.name
    return SalaryOut(**s_dict)
