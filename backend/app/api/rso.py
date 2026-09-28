from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import (
    RSO, RSODailyReport, RSOItem, CashDenomination, Product, StockMovement,
    StockMovementType, AuditLog, RSOSalary
)
from app.schemas.schemas import (
    RSOCreate, RSOUpdate, RSOOut, RSODailyReportCreate, RSODailyReportOut,
    RSOSalaryCreate, RSOSalaryOut
)

router = APIRouter(prefix="/rso", tags=["RSO Management"])

STANDARD_RSO_ITEMS = [
    {"name": "Pre Paid SIM", "rate": 100.0},
    {"name": "SC 100 (Scratch Card)", "rate": 100.0},
    {"name": "EC 350 (Super Card)", "rate": 350.0},
    {"name": "Rep SIM (Replacement SIM)", "rate": 50.0},
    {"name": "Eload SIM", "rate": 100.0},
    {"name": "EC 600 (Super Card Max)", "rate": 600.0},
    {"name": "Wingle (4G USB)", "rate": 2500.0},
    {"name": "MIFI (4G Cloud Device)", "rate": 4500.0},
    {"name": "Hand Set (Feature Phone)", "rate": 3200.0},
]

@router.get("/standard-items")
def get_standard_rso_items():
    return STANDARD_RSO_ITEMS

@router.get("", response_model=List[RSOOut])
def list_rsos(db: Session = Depends(get_db)):
    return db.query(RSO).order_by(RSO.name.asc()).all()

@router.post("", response_model=RSOOut)
def create_rso(data: RSOCreate, db: Session = Depends(get_db)):
    existing = db.query(RSO).filter(RSO.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"RSO code '{data.code}' already exists")

    rso = RSO(
        name=data.name,
        code=data.code,
        mobile=data.mobile,
        route=data.route,
        address=data.address,
        joining_date=data.joining_date,
        opening_balance=data.opening_balance,
        current_balance=data.opening_balance,
        remarks=data.remarks
    )
    db.add(rso)
    db.commit()
    db.refresh(rso)
    return rso

@router.get("/{rso_id}", response_model=RSOOut)
def get_rso(rso_id: int, db: Session = Depends(get_db)):
    rso = db.query(RSO).filter(RSO.id == rso_id).first()
    if not rso:
        raise HTTPException(status_code=404, detail="RSO not found")
    return rso

@router.put("/{rso_id}", response_model=RSOOut)
def update_rso(rso_id: int, data: RSOUpdate, db: Session = Depends(get_db)):
    rso = db.query(RSO).filter(RSO.id == rso_id).first()
    if not rso:
        raise HTTPException(status_code=404, detail="RSO not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(rso, field, value)

    db.commit()
    db.refresh(rso)
    return rso

# --- RSO DAILY SALES REPORT ---
@router.get("/reports/daily", response_model=List[RSODailyReportOut])
def list_rso_daily_reports(
    rso_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(RSODailyReport)
    if rso_id:
        q = q.filter(RSODailyReport.rso_id == rso_id)
    if date_from:
        q = q.filter(RSODailyReport.date >= date_from)
    if date_to:
        q = q.filter(RSODailyReport.date <= date_to)

    reports = q.order_by(RSODailyReport.date.desc(), RSODailyReport.id.desc()).all()
    results = []
    for r in reports:
        r_dict = {c.name: getattr(r, c.name) for c in r.__table__.columns}
        r_dict["rso_name"] = r.rso.name if r.rso else None
        r_dict["rso_code"] = r.rso.code if r.rso else None
        r_dict["items"] = [
            {c.name: getattr(i, c.name) for c in i.__table__.columns}
            for i in r.items
        ]
        r_dict["denominations"] = [
            {c.name: getattr(d, c.name) for c in d.__table__.columns}
            for d in r.denominations
        ]
        results.append(RSODailyReportOut(**r_dict))
    return results

@router.post("/reports/daily", response_model=RSODailyReportOut)
def create_rso_daily_report(data: RSODailyReportCreate, db: Session = Depends(get_db)):
    rso = db.query(RSO).filter(RSO.id == data.rso_id).first()
    if not rso:
        raise HTTPException(status_code=404, detail="RSO not found")

    report_code = f"RSO-REP-{rso.code}-{data.date.strftime('%Y%m%d')}-{int(datetime.utcnow().timestamp()) % 10000}"

    # Calculate item totals and validate Closing = Opening + New Issue - Sale
    total_sales_amount = Decimal("0.00")
    for item in data.items:
        expected_closing = item.opening_balance + item.new_issue - item.sale
        # If closing not passed, calculate it
        if item.closing_in_hand == Decimal("0.00") and expected_closing != Decimal("0.00"):
            item.closing_in_hand = expected_closing

        item_total = item.sale * item.rate
        item.total_amount = item_total
        total_sales_amount += item_total

    # Calculate physical cash from denominations
    physical_cash = Decimal("0.00")
    for d in data.denominations:
        line_total = Decimal(str(d.denomination * d.quantity))
        physical_cash += line_total

    cash_received = data.cash_received if data.cash_received > Decimal("0.00") else physical_cash
    expected_cash = data.expected_cash if data.expected_cash > Decimal("0.00") else total_sales_amount
    cash_pending = max(Decimal("0.00"), expected_cash - cash_received)
    cash_diff = physical_cash - expected_cash  # > 0: Excess, < 0: Shortage

    # Easyload Closing Formula
    # Closing = Opening + Issuance - Retailer Transfers
    easyload_closing = data.easyload_closing
    if easyload_closing == Decimal("0.00"):
        easyload_closing = data.easyload_opening + data.easyload_issuance - data.easyload_retailer_transfer

    report = RSODailyReport(
        report_code=report_code,
        rso_id=rso.id,
        date=data.date,
        route=data.route or rso.route,
        total_sale_amount=total_sales_amount,
        expected_cash=expected_cash,
        cash_received=cash_received,
        cash_pending=cash_pending,
        cash_difference=cash_diff,
        status="Submitted",
        easyload_opening=data.easyload_opening,
        easyload_issuance=data.easyload_issuance,
        easyload_retailer_transfer=data.easyload_retailer_transfer,
        easyload_closing=easyload_closing,
        finance_remarks=data.finance_remarks,
        rso_signature=data.rso_signature or rso.name,
        sd_signature=data.sd_signature,
        finance_signature=data.finance_signature
    )
    db.add(report)
    db.flush()

    # Add items
    for item in data.items:
        r_item = RSOItem(
            report_id=report.id,
            product_id=item.product_id,
            item_name=item.item_name,
            opening_balance=item.opening_balance,
            new_issue=item.new_issue,
            sale=item.sale,
            closing_in_hand=item.closing_in_hand,
            rate=item.rate,
            total_amount=item.total_amount,
            remarks=item.remarks
        )
        db.add(r_item)

    # Add cash denominations
    for d in data.denominations:
        c_denom = CashDenomination(
            report_id=report.id,
            date=data.date,
            denomination=d.denomination,
            quantity=d.quantity,
            total=Decimal(str(d.denomination * d.quantity))
        )
        db.add(c_denom)

    # Update RSO balance and easyload balance
    rso.current_balance += cash_pending
    rso.easyload_balance = easyload_closing

    log = AuditLog(
        action="Create",
        entity="RSODailyReport",
        entity_id=str(report.id),
        new_value=f"Created RSO daily report {report.report_code} for {rso.name} (Sales: PKR {report.total_sale_amount}, Cash Diff: {cash_diff})"
    )
    db.add(log)
    db.commit()
    db.refresh(report)

    r_dict = {c.name: getattr(report, c.name) for c in report.__table__.columns}
    r_dict["rso_name"] = rso.name
    r_dict["rso_code"] = rso.code
    r_dict["items"] = [{c.name: getattr(i, c.name) for c in i.__table__.columns} for i in report.items]
    r_dict["denominations"] = [{c.name: getattr(d, c.name) for c in d.__table__.columns} for d in report.denominations]
    return RSODailyReportOut(**r_dict)

@router.get("/reports/daily/{report_id}", response_model=RSODailyReportOut)
def get_rso_daily_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(RSODailyReport).filter(RSODailyReport.id == report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="RSO report not found")
    
    r_dict = {c.name: getattr(r, c.name) for c in r.__table__.columns}
    r_dict["rso_name"] = r.rso.name if r.rso else None
    r_dict["rso_code"] = r.rso.code if r.rso else None
    r_dict["items"] = [{c.name: getattr(i, c.name) for c in i.__table__.columns} for i in r.items]
    r_dict["denominations"] = [{c.name: getattr(d, c.name) for c in d.__table__.columns} for d in r.denominations]
    return RSODailyReportOut(**r_dict)

# --- RSO SALARIES (August 2026 Sheet Structure) ---
@router.get("/salaries/all", response_model=List[RSOSalaryOut])
def list_rso_salaries(month: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(RSOSalary)
    if month:
        q = q.filter(RSOSalary.month.ilike(f"%{month}%"))
    return q.order_by(RSOSalary.id.asc()).all()

@router.post("/salaries", response_model=RSOSalaryOut)
def create_rso_salary(data: RSOSalaryCreate, db: Session = Depends(get_db)):
    sal = RSOSalary(
        rso_id=data.rso_id,
        rso_name=data.rso_name,
        month=data.month,
        basic_salary=data.basic_salary,
        fuel_amount=data.fuel_amount,
        kpi_comm=data.kpi_comm,
        evc_comm=data.evc_comm,
        bcards_comm=data.bcards_comm,
        fca_comm=data.fca_comm,
        bonus=data.bonus,
        gross_total=data.gross_total
    )
    db.add(sal)
    db.commit()
    db.refresh(sal)
    return sal

