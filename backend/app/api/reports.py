import io
import csv
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.accounting_engine import calculate_profit_and_loss
from app.models.models import (
    Sale, Purchase, Expense, Salary, Return, RetailerCollection,
    CompanyCreditTransaction, Investment, Commission, Product, RSO, Retailer, Staff
)
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

router = APIRouter(prefix="/reports", tags=["Report Center"])

def get_date_bounds(period: str, custom_start: Optional[date] = None, custom_end: Optional[date] = None):
    today = date.today()
    if period == "today":
        return today, today
    elif period == "yesterday":
        yest = today - timedelta(days=1)
        return yest, yest
    elif period == "this_week":
        start = today - timedelta(days=today.weekday())
        return start, today
    elif period == "last_week":
        start = today - timedelta(days=today.weekday() + 7)
        end = start + timedelta(days=6)
        return start, end
    elif period == "this_month":
        start = today.replace(day=1)
        return start, today
    elif period == "last_month":
        first_this = today.replace(day=1)
        last_prev = first_this - timedelta(days=1)
        first_prev = last_prev.replace(day=1)
        return first_prev, last_prev
    elif period == "this_year":
        start = today.replace(month=1, day=1)
        return start, today
    elif period == "custom" and custom_start and custom_end:
        return custom_start, custom_end
    return today.replace(day=1), today

# --- DAILY REPORT ---
@router.get("/daily")
def get_daily_report(
    target_date: Optional[date] = None,
    rso_id: Optional[int] = None,
    retailer_id: Optional[int] = None,
    staff_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    d = target_date or date.today()
    
    # Sales
    sales_q = db.query(Sale).filter(Sale.sale_date == d)
    if rso_id:
        sales_q = sales_q.filter(Sale.rso_id == rso_id)
    if retailer_id:
        sales_q = sales_q.filter(Sale.retailer_id == retailer_id)
    if staff_id:
        sales_q = sales_q.filter(Sale.staff_id == staff_id)
    sales = sales_q.all()

    total_sales = sum((s.total_amount for s in sales), Decimal("0.00"))
    cash_sales = sum((s.paid_amount for s in sales if s.payment_method == "Cash"), Decimal("0.00"))
    cogs = sum((s.cogs for s in sales), Decimal("0.00"))
    sales_commission = sum((s.commission for s in sales), Decimal("0.00"))

    # Purchases
    purchases = db.query(Purchase).filter(Purchase.purchase_date == d).all()
    total_purchases = sum((p.total_amount for p in purchases), Decimal("0.00"))
    cash_purchases = sum((p.paid_amount for p in purchases if p.payment_method == "Cash"), Decimal("0.00"))

    # Expenses
    expenses = db.query(Expense).filter(Expense.paid_date == d).all()
    total_expenses = sum((e.amount for e in expenses), Decimal("0.00"))

    # Salaries
    salaries = db.query(Salary).filter(Salary.paid_on == d).all()
    total_salaries = sum((s.salary_given for s in salaries), Decimal("0.00"))

    # Commissions
    extra_commissions = db.query(Commission).filter(Commission.date == d).all()
    total_commission_income = sales_commission + sum((c.amount for c in extra_commissions), Decimal("0.00"))

    # Returns
    returns = db.query(Return).filter(Return.return_date == d).all()
    total_returns = sum((r.total_amount for r in returns), Decimal("0.00"))

    # Collections
    collections = db.query(RetailerCollection).filter(RetailerCollection.date == d).all()
    total_collections = sum((c.amount for c in collections if c.collection_type == "Balance Received"), Decimal("0.00"))

    # Company Payments
    comp_payments = db.query(CompanyCreditTransaction).filter(CompanyCreditTransaction.paid_date == d, CompanyCreditTransaction.tx_type == "Payment to Company").all()
    total_comp_payments = sum((cp.amount for cp in comp_payments), Decimal("0.00"))

    # Investments
    investments = db.query(Investment).filter(Investment.investment_date == d).all()
    total_investments = sum((i.amount_given for i in investments), Decimal("0.00"))

    # Opening Cash (estimated from prior cash flows)
    opening_cash = Decimal("25000.00")
    closing_cash = opening_cash + cash_sales + total_collections + total_investments - cash_purchases - total_expenses - total_salaries - total_comp_payments

    gross_profit = total_sales - cogs + total_commission_income
    net_profit = gross_profit - total_expenses - total_salaries

    return {
        "date": str(d),
        "opening_cash": float(opening_cash),
        "total_sales": float(total_sales),
        "cash_sales": float(cash_sales),
        "total_purchases": float(total_purchases),
        "cash_purchases": float(cash_purchases),
        "expenses": float(total_expenses),
        "salaries": float(total_salaries),
        "commissions": float(total_commission_income),
        "returns": float(total_returns),
        "collections": float(total_collections),
        "company_payments": float(total_comp_payments),
        "investments": float(total_investments),
        "closing_cash": float(closing_cash),
        "gross_profit": float(gross_profit),
        "net_profit": float(net_profit),
        "is_loss": net_profit < Decimal("0.00"),
        "sales_count": len(sales),
        "purchases_count": len(purchases),
        "expenses_count": len(expenses)
    }

# --- WEEKLY REPORT ---
@router.get("/weekly")
def get_weekly_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    today = date.today()
    start = date_from or (today - timedelta(days=6))
    end = date_to or today

    day_by_day = []
    curr = start
    week_sales = Decimal("0.00")
    week_purchases = Decimal("0.00")
    week_expenses = Decimal("0.00")
    week_salaries = Decimal("0.00")
    week_commissions = Decimal("0.00")
    week_collections = Decimal("0.00")
    week_cogs = Decimal("0.00")

    while curr <= end:
        sales = db.query(Sale).filter(Sale.sale_date == curr).all()
        purchases = db.query(Purchase).filter(Purchase.purchase_date == curr).all()
        expenses = db.query(Expense).filter(Expense.paid_date == curr).all()
        salaries = db.query(Salary).filter(Salary.paid_on == curr).all()
        cols = db.query(RetailerCollection).filter(RetailerCollection.date == curr, RetailerCollection.collection_type == "Balance Received").all()

        s_amt = sum((s.total_amount for s in sales), Decimal("0.00"))
        s_cogs = sum((s.cogs for s in sales), Decimal("0.00"))
        s_com = sum((s.commission for s in sales), Decimal("0.00"))
        p_amt = sum((p.total_amount for p in purchases), Decimal("0.00"))
        e_amt = sum((e.amount for e in expenses), Decimal("0.00"))
        sal_amt = sum((s.salary_given for s in salaries), Decimal("0.00"))
        col_amt = sum((c.amount for c in cols), Decimal("0.00"))

        d_gross = s_amt - s_cogs + s_com
        d_net = d_gross - e_amt - sal_amt

        day_by_day.append({
            "date": str(curr),
            "day": curr.strftime("%A"),
            "sales": float(s_amt),
            "purchases": float(p_amt),
            "expenses": float(e_amt),
            "salaries": float(sal_amt),
            "collections": float(col_amt),
            "gross_profit": float(d_gross),
            "net_profit": float(d_net)
        })

        week_sales += s_amt
        week_cogs += s_cogs
        week_commissions += s_com
        week_purchases += p_amt
        week_expenses += e_amt
        week_salaries += sal_amt
        week_collections += col_amt

        curr += timedelta(days=1)

    week_gross = week_sales - week_cogs + week_commissions
    week_net = week_gross - week_expenses - week_salaries

    return {
        "period": f"{start} to {end}",
        "total_sales": float(week_sales),
        "total_purchases": float(week_purchases),
        "total_expenses": float(week_expenses),
        "total_salaries": float(week_salaries),
        "total_collections": float(week_collections),
        "gross_profit": float(week_gross),
        "net_profit": float(week_net),
        "is_loss": week_net < Decimal("0.00"),
        "daily_breakdown": day_by_day
    }

# --- MONTHLY REPORT ---
@router.get("/monthly")
def get_monthly_report(
    year: int = Query(2026),
    month: int = Query(9),
    db: Session = Depends(get_db)
):
    first_day = date(year, month, 1)
    next_month = first_day.replace(day=28) + timedelta(days=4)
    last_day = next_month - timedelta(days=next_month.day)

    pnl = calculate_profit_and_loss(db, start_date=first_day, end_date=last_day)

    # Payables & Receivables
    from app.models.models import CompanyCreditAccount
    company_payables = db.query(func.coalesce(func.sum(CompanyCreditAccount.outstanding), 0)).scalar()
    retailer_receivables = db.query(func.coalesce(func.sum(Retailer.balance), 0)).scalar()
    rso_receivables = db.query(func.coalesce(func.sum(RSO.current_balance), 0)).scalar()

    # Daily trend graph for the month
    daily_graph = []
    curr = first_day
    while curr <= min(last_day, date.today()):
        d_pnl = calculate_profit_and_loss(db, start_date=curr, end_date=curr)
        daily_graph.append({
            "day": curr.strftime("%d"),
            "revenue": d_pnl["net_revenue"],
            "expenses": d_pnl["expenses"] + d_pnl["salaries"],
            "net_profit": d_pnl["net_profit"]
        })
        curr += timedelta(days=1)

    return {
        "year": year,
        "month": month,
        "month_name": first_day.strftime("%B %Y"),
        "revenue": pnl["net_revenue"],
        "cogs": pnl["cogs"],
        "gross_profit": pnl["gross_profit"],
        "expenses": pnl["expenses"],
        "salaries": pnl["salaries"],
        "commission": pnl["commission_income"],
        "returns": pnl["sales_returns"],
        "net_profit": pnl["net_profit"],
        "is_loss": pnl["is_loss"],
        "company_payables": float(company_payables),
        "retailer_receivables": float(retailer_receivables),
        "rso_receivables": float(rso_receivables),
        "daily_graph": daily_graph
    }

# --- YEARLY REPORT ---
@router.get("/yearly")
def get_yearly_report(year: int = Query(2026), db: Session = Depends(get_db)):
    months_data = []
    tot_sales = 0.0
    tot_cogs = 0.0
    tot_gross = 0.0
    tot_exp = 0.0
    tot_sal = 0.0
    tot_comm = 0.0
    tot_net = 0.0

    for m in range(1, 13):
        f_day = date(year, m, 1)
        next_m = f_day.replace(day=28) + timedelta(days=4)
        l_day = next_m - timedelta(days=next_m.day)
        pnl = calculate_profit_and_loss(db, start_date=f_day, end_date=l_day)

        months_data.append({
            "month": f_day.strftime("%B"),
            "sales": pnl["net_revenue"],
            "cogs": pnl["cogs"],
            "gross_profit": pnl["gross_profit"],
            "expenses": pnl["expenses"],
            "salaries": pnl["salaries"],
            "commission": pnl["commission_income"],
            "net_profit": pnl["net_profit"]
        })

        tot_sales += pnl["net_revenue"]
        tot_cogs += pnl["cogs"]
        tot_gross += pnl["gross_profit"]
        tot_exp += pnl["expenses"]
        tot_sal += pnl["salaries"]
        tot_comm += pnl["commission_income"]
        tot_net += pnl["net_profit"]

    return {
        "year": year,
        "monthly_breakdown": months_data,
        "annual_totals": {
            "sales": tot_sales,
            "cogs": tot_cogs,
            "gross_profit": tot_gross,
            "expenses": tot_exp,
            "salaries": tot_sal,
            "commission": tot_comm,
            "net_profit": tot_net
        }
    }

# --- EXCEL EXPORT ---
@router.get("/export/excel")
def export_report_excel(
    report_type: str = Query("sales", description="sales, purchases, stock, pnl, expenses, rso"),
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"{report_type.upper()} Report"

    # Styling
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1E1B4B", end_color="1E1B4B", fill_type="solid")
    title_font = Font(name="Calibri", size=14, bold=True)

    # Title header
    ws.append(["Ufone 4G Authorized Franchise - Peshawar Branch"])
    ws.append([f"Report: {report_type.upper()} | Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"])
    ws.append([])
    ws["A1"].font = title_font

    if report_type == "sales":
        ws.append(["Invoice #", "Date", "Customer / Retailer / RSO", "Type", "Total (PKR)", "Paid (PKR)", "Due (PKR)", "Gross Profit (PKR)"])
        sales = db.query(Sale).order_by(Sale.sale_date.desc()).all()
        for s in sales:
            party = s.retailer.name if s.retailer else (s.rso.name if s.rso else (s.customer_name or "Direct"))
            ws.append([s.invoice_number, str(s.sale_date), party, s.sale_type, float(s.total_amount), float(s.paid_amount), float(s.remaining_amount), float(s.gross_profit)])

    elif report_type == "purchases":
        ws.append(["Invoice #", "Date", "Company / Supplier", "Method", "Total (PKR)", "Paid (PKR)", "Due (PKR)", "Status"])
        purchases = db.query(Purchase).order_by(Purchase.purchase_date.desc()).all()
        for p in purchases:
            ws.append([p.invoice_number, str(p.purchase_date), p.company_name or "Company", p.payment_method, float(p.total_amount), float(p.paid_amount), float(p.due_amount), p.payment_status])

    elif report_type == "stock":
        ws.append(["SKU", "Product Name", "Category", "Current Stock", "Alert Qty", "Avg Cost (PKR)", "Sale Price (PKR)", "Valuation (PKR)", "Status"])
        prods = db.query(Product).order_by(Product.name.asc()).all()
        for p in prods:
            stat = "Out of stock" if p.current_stock <= 0 else ("Low stock" if p.current_stock <= p.alert_quantity else "In stock")
            ws.append([p.sku, p.name, p.category.name if p.category else "General", float(p.current_stock), float(p.alert_quantity), float(p.avg_cost), float(p.selling_price), float(p.current_stock * p.avg_cost), stat])

    elif report_type == "expenses":
        ws.append(["Title", "Category", "Date", "Amount (PKR)", "Paid By", "Method", "Remarks"])
        exps = db.query(Expense).order_by(Expense.paid_date.desc()).all()
        for e in exps:
            ws.append([e.title, e.category, str(e.paid_date), float(e.amount), e.paid_by_name or "", e.payment_method, e.remarks or ""])

    else:
        ws.append(["Metric", "Amount (PKR)"])
        pnl = calculate_profit_and_loss(db)
        for k, v in pnl.items():
            ws.append([k.replace("_", " ").title(), v])

    # Format header row (row 4)
    for col in ws.iter_cols(min_row=4, max_row=4):
        for cell in col:
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center")

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)

    filename = f"ufone_pos_{report_type}_{date.today().strftime('%Y%m%d')}.xlsx"
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# --- CSV EXPORT ---
@router.get("/export/csv")
def export_report_csv(
    report_type: str = Query("sales"),
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "sales":
        writer.writerow(["Invoice", "Date", "Customer", "Total Amount", "Paid Amount", "Remaining", "Gross Profit"])
        for s in db.query(Sale).all():
            writer.writerow([s.invoice_number, str(s.sale_date), s.customer_name or "Direct", float(s.total_amount), float(s.paid_amount), float(s.remaining_amount), float(s.gross_profit)])
    elif report_type == "stock":
        writer.writerow(["SKU", "Product", "Current Stock", "Alert Qty", "Cost", "Price", "Valuation"])
        for p in db.query(Product).all():
            writer.writerow([p.sku, p.name, float(p.current_stock), float(p.alert_quantity), float(p.avg_cost), float(p.selling_price), float(p.current_stock * p.avg_cost)])
    else:
        writer.writerow(["Title", "Category", "Amount", "Date"])
        for e in db.query(Expense).all():
            writer.writerow([e.title, e.category, float(e.amount), str(e.paid_date)])

    output.seek(0)
    filename = f"ufone_pos_{report_type}_{date.today().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
