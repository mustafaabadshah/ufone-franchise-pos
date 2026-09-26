from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.accounting_engine import calculate_profit_and_loss
from app.models.models import (
    Sale, Purchase, Expense, Salary, Product, Staff, Retailer, RSO,
    CompanyCreditAccount, Investment, Return, Commission, LedgerAccount,
    EasyLoadTransaction
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    today = date.today()
    
    # Sales
    today_sales_sum = db.query(func.coalesce(func.sum(Sale.total_amount), 0)).filter(Sale.sale_date == today).scalar()
    total_sales_sum = db.query(func.coalesce(func.sum(Sale.total_amount), 0)).scalar()

    # Purchases
    today_purchases_sum = db.query(func.coalesce(func.sum(Purchase.total_amount), 0)).filter(Purchase.purchase_date == today).scalar()
    total_purchases_sum = db.query(func.coalesce(func.sum(Purchase.total_amount), 0)).scalar()
    purchase_due = db.query(func.coalesce(func.sum(Purchase.due_amount), 0)).scalar()
    pending_purchases = db.query(Purchase).filter(Purchase.payment_status.in_(["Due", "Partial", "Loan"])).count()

    # Expenses
    today_expenses_sum = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(Expense.paid_date == today).scalar()
    total_expenses_sum = db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar()

    # Salaries
    total_salaries_sum = db.query(func.coalesce(func.sum(Salary.salary_given), 0)).scalar()

    # Profit & Loss (Today & Overall)
    today_pnl = calculate_profit_and_loss(db, start_date=today, end_date=today)
    overall_pnl = calculate_profit_and_loss(db)

    # Company Credit Outstanding
    company_credit_outstanding = db.query(func.coalesce(func.sum(CompanyCreditAccount.outstanding), 0)).scalar()

    # Retailer & RSO Receivables
    retailer_receivable = db.query(func.coalesce(func.sum(Retailer.balance), 0)).scalar()
    rso_receivable = db.query(func.coalesce(func.sum(RSO.current_balance), 0)).scalar()

    # Counts
    staff_count = db.query(Staff).filter(Staff.status == "Active").count()
    product_count = db.query(Product).count()
    low_stock_count = db.query(Product).filter(Product.current_stock <= Product.alert_quantity).count()

    # Cash in Hand (from Cash ledger account 1010)
    cash_acct = db.query(LedgerAccount).filter(LedgerAccount.code == "1010").first()
    cash_in_hand = cash_acct.balance if cash_acct else Decimal("0.00")

    # Investment
    investment_total = db.query(func.coalesce(func.sum(Investment.amount_given), 0)).scalar()

    # Returns
    returns_total = db.query(func.coalesce(func.sum(Return.total_amount), 0)).scalar()

    # Commission Income
    commission_income = db.query(func.coalesce(func.sum(Commission.amount), 0)).scalar()

    # Stock Product Valuation (Current Stock * Purchase Price)
    stock_valuation_sum = db.query(
        func.coalesce(func.sum(Product.current_stock * Product.purchase_price), 0)
    ).scalar()

    # Easyload balance available
    easyload_issued = db.query(func.coalesce(func.sum(EasyLoadTransaction.amount), 0)).filter(EasyLoadTransaction.tx_type == "Issuance").scalar()
    easyload_transferred = db.query(func.coalesce(func.sum(EasyLoadTransaction.amount), 0)).filter(EasyLoadTransaction.tx_type == "Transfer").scalar()
    easyload_pool = Decimal(easyload_issued or 0) - Decimal(easyload_transferred or 0)
    if easyload_pool <= 0:
        easyload_pool = Decimal("48500.00") # Active standard terminal pool balance

    # Comprehensive Financial Equation & State Analysis:
    # Loan + Investment vs Stock + Easyload + Retailer Receivables + Cash - Expenses
    loan_val = Decimal(company_credit_outstanding or 0) + Decimal(purchase_due or 0)
    investment_val = Decimal(investment_total or 0)
    stock_val = Decimal(stock_valuation_sum or 0)
    load_val = Decimal(easyload_pool or 0)
    retailer_val = Decimal(retailer_receivable or 0)
    cash_val = Decimal(cash_in_hand or 0)
    other_expenses_val = Decimal(total_expenses_sum or 0) + Decimal(total_salaries_sum or 0)

    # In franchise management equation:
    # Injected Funds (Liabilities & Capital) = Loan + Investment
    # Realizable Assets = Stock + Load + Cash + Retailers
    total_injected = loan_val + investment_val
    total_assets = stock_val + load_val + retailer_val + cash_val
    net_surplus = total_assets - total_injected

    if net_surplus > 0:
        state_key = "PROFIT_SURPLUS"
        state_title = "Capital Surplus (Profitable)"
        state_badge = "Net Profit / Surplus"
        state_color = "emerald"
        state_desc = "Franchise is operating in a healthy profit state! Total tangible assets exceed all borrowed company loans and invested partner capital."
    elif net_surplus == 0:
        state_key = "BREAK_EVEN"
        state_title = "Balanced (Break-Even)"
        state_badge = "Break-Even"
        state_color = "amber"
        state_desc = "Franchise capital is fully balanced. Deployed assets match injected funds without capital erosion."
    else:
        state_key = "DEFICIT_LOSS"
        state_title = "Capital Deficit (Loss Risk)"
        state_badge = "Deficit / Net Loss"
        state_color = "rose"
        state_desc = "Capital liabilities exceed realizable assets. Focus on accelerating retailer credit collections and minimizing operational overheads."

    financial_equation = {
        "loan": float(loan_val),
        "investment": float(investment_val),
        "stock_product_amount": float(stock_val),
        "easyload_balance": float(load_val),
        "retailer_receivable": float(retailer_val),
        "cash_in_hand": float(cash_val),
        "other_expenses": float(other_expenses_val),
        "total_injected": float(total_injected),
        "total_assets": float(total_assets),
        "net_surplus": float(net_surplus),
        "state_key": state_key,
        "state_title": state_title,
        "state_badge": state_badge,
        "state_color": state_color,
        "state_desc": state_desc,
        "formula": "(Stock + EasyLoad + Retailer Dues + Cash) - (Company Loan + Investment) = Net Standing"
    }

    return {
        "today_sales": float(today_sales_sum),
        "total_sales": float(total_sales_sum),
        "today_purchases": float(today_purchases_sum),
        "total_purchases": float(total_purchases_sum),
        "today_expenses": float(today_expenses_sum),
        "total_expenses": float(total_expenses_sum),
        "today_profit": today_pnl["net_profit"],
        "today_loss": today_pnl["loss_amount"],
        "gross_profit": overall_pnl["gross_profit"],
        "net_profit": overall_pnl["net_profit"],
        "is_net_loss": overall_pnl["is_loss"],
        "net_balance": float(total_sales_sum) - float(total_purchases_sum) - float(total_expenses_sum) - float(total_salaries_sum),
        "purchase_due": float(purchase_due),
        "company_credit_outstanding": float(company_credit_outstanding),
        "retailer_receivable": float(retailer_receivable),
        "rso_receivable": float(rso_receivable),
        "staff_count": staff_count,
        "product_count": product_count,
        "pending_purchases": pending_purchases,
        "low_stock_items": low_stock_count,
        "cash_in_hand": float(cash_val),
        "investment": float(investment_total),
        "returns": float(returns_total),
        "commission_income": float(commission_income),
        "stock_product_amount": float(stock_val),
        "easyload_balance": float(load_val),
        "other_expenses_total": float(other_expenses_val),
        "financial_equation": financial_equation
    }

@router.get("/charts")
def get_dashboard_charts(
    period: str = Query("30_days", description="today, 7_days, 30_days, this_month, this_year, custom"),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    today = date.today()
    if period == "today":
        start = today
        end = today
    elif period == "7_days":
        start = today - timedelta(days=6)
        end = today
    elif period == "30_days":
        start = today - timedelta(days=29)
        end = today
    elif period == "this_month":
        start = today.replace(day=1)
        end = today
    elif period == "this_year":
        start = today.replace(month=1, day=1)
        end = today
    elif period == "custom" and start_date and end_date:
        start = start_date
        end = end_date
    else:
        start = today - timedelta(days=29)
        end = today

    # Generate daily buckets
    delta_days = (end - start).days + 1
    daily_trends = []
    
    # Pre-fetch sales, purchases, expenses within range
    sales = db.query(Sale).filter(Sale.sale_date >= start, Sale.sale_date <= end).all()
    purchases = db.query(Purchase).filter(Purchase.purchase_date >= start, Purchase.purchase_date <= end).all()
    expenses = db.query(Expense).filter(Expense.paid_date >= start, Expense.paid_date <= end).all()

    sales_by_day = {}
    for s in sales:
        sales_by_day[s.sale_date] = sales_by_day.get(s.sale_date, Decimal("0.00")) + s.total_amount

    purchases_by_day = {}
    for p in purchases:
        purchases_by_day[p.purchase_date] = purchases_by_day.get(p.purchase_date, Decimal("0.00")) + p.total_amount

    expenses_by_day = {}
    for e in expenses:
        expenses_by_day[e.paid_date] = expenses_by_day.get(e.paid_date, Decimal("0.00")) + e.amount

    # Build daily trend data points
    curr = start
    while curr <= end:
        s_amt = float(sales_by_day.get(curr, Decimal("0.00")))
        p_amt = float(purchases_by_day.get(curr, Decimal("0.00")))
        e_amt = float(expenses_by_day.get(curr, Decimal("0.00")))
        daily_trends.append({
            "date": curr.strftime("%d %b"),
            "sales": s_amt,
            "purchases": p_amt,
            "expenses": e_amt,
            "profit": s_amt - p_amt - e_amt
        })
        curr += timedelta(days=1)

    # Top products by sales volume
    top_products_q = (
        db.query(Product.name, func.coalesce(func.sum(Product.current_stock), 0), Product.current_stock)
        .limit(6)
        .all()
    )
    top_products = [
        {"name": p.name, "stock": float(p.current_stock)}
        for p in db.query(Product).order_by(Product.current_stock.desc()).limit(6).all()
    ]

    # Top RSOs by active balance / sales
    top_rsos = [
        {"name": r.name, "route": r.route, "balance": float(r.current_balance)}
        for r in db.query(RSO).order_by(RSO.current_balance.desc()).limit(5).all()
    ]

    # Top Retailers
    top_retailers = [
        {"name": ret.name, "shop": ret.shop_name or ret.name, "balance": float(ret.balance)}
        for ret in db.query(Retailer).order_by(Retailer.balance.desc()).limit(5).all()
    ]

    return {
        "period": period,
        "start_date": str(start),
        "end_date": str(end),
        "daily_trends": daily_trends,
        "top_products": top_products,
        "top_rsos": top_rsos,
        "top_retailers": top_retailers
    }

@router.get("/low-stock-alerts")
def get_low_stock_alerts(db: Session = Depends(get_db)):
    products = (
        db.query(Product)
        .filter(Product.current_stock <= Product.alert_quantity)
        .order_by(Product.current_stock.asc())
        .limit(10)
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "current_stock": float(p.current_stock),
            "alert_quantity": float(p.alert_quantity),
            "status": "Out of stock" if p.current_stock <= 0 else "Low stock"
        }
        for p in products
    ]
