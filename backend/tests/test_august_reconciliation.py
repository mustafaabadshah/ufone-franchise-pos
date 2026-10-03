import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.models import Investment, Retailer, Expense, Salary, RSOSalary, Commission, Sale, Loan
from app.core.accounting_engine import calculate_profit_and_loss

client = TestClient(app)

def test_august_investments_and_capital_reconciliation():
    """Validates Rows 15-21 of August.xlsx: Total Injected Funds = Rs. 6,649,340.00"""
    db = SessionLocal()
    investments = db.query(Investment).all()
    loans = db.query(Loan).all()
    owner_equity = sum((inv.amount_given for inv in investments), Decimal("0.00"))
    working_loans = sum((ln.amount for ln in loans), Decimal("0.00"))
    total_injected = owner_equity + working_loans
    assert total_injected == Decimal("6649340.00"), f"Expected 6,649,340, got {total_injected}"

    # Verify Owner Equity vs Working Loans
    assert owner_equity == Decimal("5220410.00"), f"Islam Badshah equity mismatch: {owner_equity}"
    assert working_loans == Decimal("1428930.00"), f"Third party loans mismatch: {working_loans}"
    db.close()

def test_august_market_credit_reconciliation():
    """Validates Rows 24-34 of August.xlsx: Total Market Debtors = Rs. 719,385.00"""
    db = SessionLocal()
    retailers = db.query(Retailer).filter(Retailer.balance > 0).all()
    total_credit = sum((r.balance for r in retailers), Decimal("0.00"))
    assert total_credit == Decimal("719385.00"), f"Expected 719,385, got {total_credit}"
    db.close()

def test_august_expenditures_reconciliation():
    """Validates Rows 41-59 of August.xlsx: Total Monthly Outflows = Rs. 1,653,620.00 across 17 records"""
    db = SessionLocal()
    expenses = db.query(Expense).all()
    total_outflows = sum((e.amount for e in expenses), Decimal("0.00"))
    assert len(expenses) == 17, f"Expected 17 expense records, got {len(expenses)}"
    assert total_outflows == Decimal("1653620.00"), f"Expected 1,653,620, got {total_outflows}"
    db.close()

def test_august_salaries_reconciliation():
    """Validates Rows 41, 66-71, 76-82 of August.xlsx: Office: 144.3k + RSO: 108.024k = 252,324.00"""
    db = SessionLocal()
    rso_salaries = db.query(RSOSalary).all()
    rso_total = sum((rs.gross_total for rs in rso_salaries), Decimal("0.00"))
    assert rso_total == Decimal("108024.00"), f"Expected 108,024 RSO total, got {rso_total}"

    all_salaries = db.query(Salary).all()
    total_salaries = sum((s.salary_given for s in all_salaries), Decimal("0.00"))
    assert total_salaries == Decimal("252324.00"), f"Expected 252,324 total salaries, got {total_salaries}"
    db.close()

def test_august_commissions_reconciliation():
    """Validates Rows 15-16, 160-170 of August.xlsx: Total Inflows from Ufone HQ = Rs. 849,297.00"""
    db = SessionLocal()
    commissions = db.query(Commission).all()
    total_comm = sum((c.amount for c in commissions), Decimal("0.00"))
    assert total_comm == Decimal("849297.00"), f"Expected 849,297 commission, got {total_comm}"

    topup_comm = sum((c.amount for c in commissions if c.commission_type == "U Top Up Commission"), Decimal("0.00"))
    promo_comm = sum((c.amount for c in commissions if c.commission_type != "U Top Up Commission"), Decimal("0.00"))
    assert topup_comm == Decimal("211074.00"), f"Expected 211,074 top up commission, got {topup_comm}"
    assert promo_comm == Decimal("638223.00"), f"Expected 638,223 promo commissions, got {promo_comm}"
    db.close()

def test_august_evc_sales_volume():
    """Validates Rows 63-71 of August.xlsx: EVC Sales Volume = Rs. 14,660,000.00"""
    db = SessionLocal()
    sales = db.query(Sale).all()
    total_sales = sum((s.total_amount for s in sales), Decimal("0.00"))
    assert total_sales == Decimal("14660000.00"), f"Expected 14,660,000, got {total_sales}"
    db.close()

def test_pnl_dual_models():
    """Validates dual accounting models: Agency 1.4% (+Rs. 20,837) and Commercial (+Rs. 387,337)"""
    db = SessionLocal()
    pnl = calculate_profit_and_loss(db)
    assert pnl["commission_income"] == 849297.0
    assert pnl["total_operating_deductions"] == 828460.0
    assert pnl["agency_net_profit"] == 20837.0
    assert pnl["net_profit"] == 387337.0
    assert pnl["is_loss"] is False
    assert pnl["total_cash_outflows"] == 1653620.0
    db.close()

def test_dashboard_api_solvency():
    """Validates /api/v1/dashboard/metrics reports positive solvency and no false deficit"""
    res = client.get("/api/v1/dashboard/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["total_sales"] == 14660000.0
    assert data["total_expenses"] == 1653620.0
    assert data["total_salaries"] == 252324.0
    assert data["net_profit"] == 387337.0
    eq = data["financial_equation"]
    assert eq["working_capital_loans"] == 1428930.0
    assert eq["owner_equity"] == 5220410.0
    assert eq["working_capital_surplus"] == 948394.0
    assert eq["agency_net_profit"] == 20837.0
    assert eq["state_badge"] == "Healthy & Profitable"
    assert eq["is_loss"] is False

def test_monthly_report_api_audit():
    """Validates /api/v1/reports/monthly matches every section of August.xlsx"""
    res = client.get("/api/v1/reports/monthly?year=2026&month=8")
    assert res.status_code == 200
    data = res.json()
    assert data["total_capital_loans"] == 6649340.0
    assert data["total_market_credit"] == 719385.0
    assert data["total_expenditures_outflow"] == 1653620.0
    assert data["total_rso_payroll"] == 108024.0
    assert data["total_staff_payroll"] == 144300.0
    assert data["combined_payroll"] == 252324.0
    assert data["total_commissions_inflow"] == 849297.0
    assert data["agency_net_profit"] == 20837.0
    assert data["net_profit"] == 387337.0
