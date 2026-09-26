import pytest
from datetime import date
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.core.accounting_engine import (
    ensure_system_accounts, calculate_profit_and_loss,
    process_purchase_accounting, process_sale_accounting, process_return_accounting
)
from app.models.models import (
    Product, Category, Purchase, PurchaseItem, Sale, SaleItem,
    Return, ReturnItem, Expense, Salary, Company, CompanyCreditAccount,
    CompanyCreditTransaction, RSO, RSODailyReport, CashDenomination
)

# In-memory SQLite for testing
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    ensure_system_accounts(session)
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_profit_calculation_scenario_44(db_session):
    """
    Instruction 44:
    Purchase: 100 units x Rs. 90 = Rs. 9,000 cost
    Sale: 100 units x Rs. 100 = Rs. 10,000 revenue
    Commission: Rs. 500
    Expense: Rs. 300
    Gross Profit: 10,000 - 9,000 + 500 = 1,500
    Net Profit: 1,500 - 300 = 1,200
    Dashboard must show Rs. 1,200 net profit.
    """
    # 1. Product
    prod = Product(
        name="Test SIM Card",
        sku="SIM-TEST-44",
        purchase_price=Decimal("90.00"),
        selling_price=Decimal("100.00"),
        current_stock=Decimal("0.00"),
        avg_cost=Decimal("0.00")
    )
    db_session.add(prod)
    db_session.flush()

    # 2. Purchase
    pur = Purchase(
        invoice_number="PUR-TEST-44",
        purchase_date=date.today(),
        subtotal=Decimal("9000.00"),
        total_amount=Decimal("9000.00"),
        paid_amount=Decimal("9000.00"),
        due_amount=Decimal("0.00"),
        payment_method="Cash"
    )
    db_session.add(pur)
    db_session.flush()
    p_item = PurchaseItem(
        purchase_id=pur.id,
        product_id=prod.id,
        quantity=Decimal("100.00"),
        purchase_price=Decimal("90.00"),
        total_amount=Decimal("9000.00")
    )
    db_session.add(p_item)
    db_session.flush()
    process_purchase_accounting(db_session, pur)

    assert prod.current_stock == Decimal("100.00")
    assert prod.avg_cost == Decimal("90.00")

    # 3. Sale
    sale = Sale(
        invoice_number="SAL-TEST-44",
        sale_date=date.today(),
        subtotal=Decimal("10000.00"),
        total_amount=Decimal("10000.00"),
        commission=Decimal("500.00"),
        paid_amount=Decimal("10000.00"),
        remaining_amount=Decimal("0.00"),
        payment_method="Cash"
    )
    db_session.add(sale)
    db_session.flush()
    s_item = SaleItem(
        sale_id=sale.id,
        product_id=prod.id,
        quantity=Decimal("100.00"),
        unit_price=Decimal("100.00"),
        commission=Decimal("500.00"),
        total_amount=Decimal("10000.00")
    )
    db_session.add(s_item)
    db_session.flush()
    process_sale_accounting(db_session, sale)

    assert prod.current_stock == Decimal("0.00")
    assert sale.cogs == Decimal("9000.00")
    assert sale.gross_profit == Decimal("1500.00")

    # 4. Expense
    exp = Expense(
        title="Delivery Transport",
        category="Transport",
        amount=Decimal("300.00"),
        paid_date=date.today()
    )
    db_session.add(exp)
    db_session.commit()

    # 5. Calculate P&L
    pnl = calculate_profit_and_loss(db_session)
    assert pnl["gross_profit"] == 1500.0
    assert pnl["expenses"] == 300.0
    assert pnl["net_profit"] == 1200.0
    assert pnl["is_loss"] is False

def test_loss_scenario_45(db_session):
    """
    Instruction 45:
    Purchase: Rs. 10,000
    Sale: Rs. 8,000
    Commission: Rs. 200
    Expenses: Rs. 500
    Gross result: 8,000 - 10,000 + 200 = -1,800
    Net: -1,800 - 500 = -2,300
    Dashboard must display: Net Loss: Rs. 2,300
    """
    prod = Product(
        name="Discounted Device",
        sku="DEV-LOSS-45",
        purchase_price=Decimal("10000.00"),
        selling_price=Decimal("8000.00"),
        current_stock=Decimal("0.00")
    )
    db_session.add(prod)
    db_session.flush()

    # Purchase 1 item for 10000
    pur = Purchase(
        invoice_number="PUR-TEST-45",
        purchase_date=date.today(),
        subtotal=Decimal("10000.00"),
        total_amount=Decimal("10000.00"),
        paid_amount=Decimal("10000.00"),
        due_amount=Decimal("0.00")
    )
    p_item = PurchaseItem(product_id=prod.id, quantity=Decimal("1.00"), purchase_price=Decimal("10000.00"), total_amount=Decimal("10000.00"))
    pur.items.append(p_item)
    db_session.add(pur)
    db_session.flush()
    process_purchase_accounting(db_session, pur)

    # Sale 1 item for 8000 with 200 commission
    sale = Sale(
        invoice_number="SAL-TEST-45",
        sale_date=date.today(),
        subtotal=Decimal("8000.00"),
        total_amount=Decimal("8000.00"),
        commission=Decimal("200.00"),
        paid_amount=Decimal("8000.00"),
        remaining_amount=Decimal("0.00")
    )
    s_item = SaleItem(product_id=prod.id, quantity=Decimal("1.00"), unit_price=Decimal("8000.00"), commission=Decimal("200.00"), total_amount=Decimal("8000.00"))
    sale.items.append(s_item)
    db_session.add(sale)
    db_session.flush()
    process_sale_accounting(db_session, sale)

    # Expense: 500
    exp = Expense(title="Office Maintenance", category="Maintenance", amount=Decimal("500.00"), paid_date=date.today())
    db_session.add(exp)
    db_session.commit()

    pnl = calculate_profit_and_loss(db_session)
    assert pnl["gross_profit"] == -1800.0
    assert pnl["net_profit"] == -2300.0
    assert pnl["is_loss"] is True
    assert pnl["loss_amount"] == 2300.0

def test_company_credit_no_false_cash_reduction(db_session):
    """
    Instruction 9:
    Credit purchase from company -> stock increases, company payable increases,
    NO false cash reduction!
    """
    comp = Company(name="PTCL / Ufone Wholesale", code="UF-HQ-TEST")
    db_session.add(comp)
    db_session.flush()

    acc = CompanyCreditAccount(
        company_id=comp.id,
        reference_number="CR-LINE-1",
        total_credit=Decimal("100000.00"),
        amount_paid=Decimal("0.00"),
        outstanding=Decimal("100000.00")
    )
    db_session.add(acc)
    db_session.commit()

    prod = Product(name="Bolt Wingle", sku="WGL-01", purchase_price=Decimal("2000.00"), selling_price=Decimal("2500.00"), current_stock=Decimal("0.00"))
    db_session.add(prod)
    db_session.flush()

    # Credit purchase: 50 units @ 2000 = 100,000 entirely on credit (paid = 0, due = 100,000)
    pur = Purchase(
        invoice_number="PUR-CRED-01",
        company_id=comp.id,
        company_name=comp.name,
        purchase_date=date.today(),
        subtotal=Decimal("100000.00"),
        total_amount=Decimal("100000.00"),
        paid_amount=Decimal("0.00"),
        due_amount=Decimal("100000.00"),
        payment_method="Company Credit",
        is_company_credit=True
    )
    p_item = PurchaseItem(product_id=prod.id, quantity=Decimal("50.00"), purchase_price=Decimal("2000.00"), total_amount=Decimal("100000.00"))
    pur.items.append(p_item)
    db_session.add(pur)
    db_session.flush()
    process_purchase_accounting(db_session, pur)

    assert prod.current_stock == Decimal("50.00")
    # Verify cash ledger account 1010 has balance 0 (no false cash deduction)
    from app.models.models import LedgerAccount
    cash_acct = db_session.query(LedgerAccount).filter(LedgerAccount.code == "1010").first()
    payable_acct = db_session.query(LedgerAccount).filter(LedgerAccount.code == "2010").first()
    assert cash_acct.balance == Decimal("0.00")
    assert payable_acct.balance == Decimal("100000.00")
