import enum
from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Boolean, DateTime, Date, 
    ForeignKey, Enum, Index, func
)
from sqlalchemy.orm import relationship
from app.core.database import Base

# --- ENUMS ---
class UserRoleEnum(str, enum.Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    FINANCE = "Finance"
    SALES = "Sales"
    RSO_MANAGER = "RSO Manager"
    STAFF = "Staff"
    VIEWER = "Viewer"

class StockMovementType(str, enum.Enum):
    PURCHASE = "Purchase"
    SALE = "Sale"
    RETURN_IN = "Return In"
    RETURN_OUT = "Return Out"
    ADJUSTMENT = "Adjustment"
    TRANSFER = "Transfer"
    RSO_ISSUE = "RSO Issue"
    RETAILER_ISSUE = "Retailer Issue"
    DAMAGE = "Damage"
    LOSS = "Loss"
    CORRECTION = "Correction"

class PaymentMethodEnum(str, enum.Enum):
    CASH = "Cash"
    BANK_TRANSFER = "Bank Transfer"
    CHEQUE = "Cheque"
    COMPANY_CREDIT = "Company Credit"
    RETAILER_BALANCE = "Retailer Balance"
    ONLINE = "Online"

class CompanyCreditTxType(str, enum.Enum):
    STOCK_ON_CREDIT = "Stock Received on Credit"
    PAYMENT_TO_COMPANY = "Payment to Company"
    CREDIT_ADJUSTMENT = "Credit Adjustment"
    RETURN_TO_COMPANY = "Return to Company"
    CREDIT_SETTLEMENT = "Credit Settlement"

class ReturnTypeEnum(str, enum.Enum):
    CUSTOMER_RETURN = "Customer Return"
    RETAILER_RETURN = "Retailer Return"
    RSO_RETURN = "RSO Return"
    SUPPLIER_RETURN = "Supplier Return"
    COMPANY_RETURN = "Company Return"

class CommissionTypeEnum(str, enum.Enum):
    PURCHASE_COMMISSION = "Purchase Commission"
    SALES_COMMISSION = "Sales Commission"
    COMPANY_INCENTIVE = "Company Incentive"
    RSO_COMMISSION = "RSO Commission"
    RETAILER_COMMISSION = "Retailer Commission"
    OTHER_INCOME = "Other Income"

class LedgerAccountType(str, enum.Enum):
    ASSET = "Asset"
    LIABILITY = "Liability"
    EQUITY = "Equity"
    REVENUE = "Revenue"
    EXPENSE = "Expense"

class EntryTypeEnum(str, enum.Enum):
    DEBIT = "Debit"
    CREDIT = "Credit"

# --- AUTH & USER ---
class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="role")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="users")

# --- CATEGORY & PRODUCT ---
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    sku = Column(String(60), unique=True, index=True, nullable=False)
    barcode = Column(String(100), unique=True, index=True, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    brand = Column(String(100), default="Ufone")
    unit = Column(String(30), default="Piece")
    purchase_price = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    selling_price = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    retailer_price = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    rso_price = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    company_price = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    alert_quantity = Column(Numeric(12, 2), default=Decimal("10.00"), nullable=False)
    current_stock = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    avg_cost = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    commission = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    discount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    tax_percent = Column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    status = Column(String(30), default="Active")
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="products")
    stock_movements = relationship("StockMovement", back_populates="product")

# --- STOCK MOVEMENTS ---
class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    movement_type = Column(String(50), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)  # positive for in, negative for out
    unit_cost = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    unit_price = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    balance_after = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    reference = Column(String(100), nullable=True)
    source = Column(String(100), nullable=True)
    destination = Column(String(100), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="stock_movements")
    user = relationship("User")

# --- COMPANY & CREDIT ---
class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    credit_accounts = relationship("CompanyCreditAccount", back_populates="company")

class CompanyCreditAccount(Base):
    __tablename__ = "company_credit_accounts"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    reference_number = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    total_credit = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    amount_paid = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    outstanding = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    status = Column(String(30), default="Active")  # Active, Settled, Overdue
    due_date = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="credit_accounts")
    transactions = relationship("CompanyCreditTransaction", back_populates="account")

class CompanyCreditTransaction(Base):
    __tablename__ = "company_credit_transactions"
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("company_credit_accounts.id"), nullable=False)
    tx_type = Column(String(50), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    paid_date = Column(Date, default=date.today)
    payment_method = Column(String(50), default="Bank Transfer")
    reference = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    account = relationship("CompanyCreditAccount", back_populates="transactions")
    user = relationship("User")

# --- PURCHASES ---
class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    company_name = Column(String(150), nullable=True)
    purchase_date = Column(Date, default=date.today, nullable=False)
    subtotal = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    discount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    tax = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    total_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    paid_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    due_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    payment_method = Column(String(50), default="Cash")  # Cash, Company Credit, Bank
    payment_status = Column(String(30), default="Paid")  # Paid, Partial, Due, Loan
    is_company_credit = Column(Boolean, default=False)
    company_credit_account_id = Column(Integer, ForeignKey("company_credit_accounts.id"), nullable=True)
    investment_id = Column(Integer, ForeignKey("investments.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")
    user = relationship("User")

class PurchaseItem(Base):
    __tablename__ = "purchase_items"
    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    purchase_price = Column(Numeric(12, 2), nullable=False)
    sale_price = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    discount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)

    purchase = relationship("Purchase", back_populates="items")
    product = relationship("Product")

# --- STAFF & SALARIES ---
class Staff(Base):
    __tablename__ = "staff"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), nullable=True)
    phone = Column(String(50), nullable=True)
    role = Column(String(60), default="Sales Staff")
    salary_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    joining_date = Column(Date, default=date.today)
    status = Column(String(30), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    salaries = relationship("Salary", back_populates="staff_member")

class Salary(Base):
    __tablename__ = "salaries"
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    month = Column(String(30), nullable=False)  # e.g. "September 2026"
    basic_salary = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    allowances = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    deductions = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    bonus = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    commission = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    net_salary = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    salary_given = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    remaining = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    paid_on = Column(Date, default=date.today)
    paid_by = Column(String(100), nullable=True)
    payment_method = Column(String(50), default="Cash")
    status = Column(String(30), default="Paid")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    staff_member = relationship("Staff", back_populates="salaries")

# --- RETAILERS ---
class Retailer(Base):
    __tablename__ = "retailers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    shop_name = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    msisdn = Column(String(50), nullable=True)  # EasyLoad number
    address = Column(Text, nullable=True)
    route = Column(String(100), nullable=True)
    balance = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)  # receivable
    status = Column(String(30), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    collections = relationship("RetailerCollection", back_populates="retailer")

class RetailerCollection(Base):
    __tablename__ = "retailer_collections"
    id = Column(Integer, primary_key=True, index=True)
    retailer_id = Column(Integer, ForeignKey("retailers.id"), nullable=False)
    msisdn = Column(String(50), nullable=True)
    date = Column(Date, default=date.today)
    collection_type = Column(String(50), default="Balance Received")  # "Balance Sent", "Balance Received", "Cash Pending"
    amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50), default="Cash")
    reason = Column(String(255), nullable=True)
    due_date = Column(Date, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    retailer = relationship("Retailer", back_populates="collections")
    user = relationship("User")

# --- RSO MANAGEMENT ---
class RSO(Base):
    __tablename__ = "rsos"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    mobile = Column(String(50), nullable=False)
    route = Column(String(120), nullable=False)
    address = Column(Text, nullable=True)
    joining_date = Column(Date, default=date.today)
    status = Column(String(30), default="Active")
    opening_balance = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    current_balance = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)  # pending cash / receivable
    easyload_balance = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    sim_balance = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    card_balance = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    daily_reports = relationship("RSODailyReport", back_populates="rso")

class RSODailyReport(Base):
    __tablename__ = "rso_reports"
    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(100), unique=True, index=True, nullable=False)
    rso_id = Column(Integer, ForeignKey("rsos.id"), nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    route = Column(String(120), nullable=False)
    
    # Financial Summary
    total_sale_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    expected_cash = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    cash_received = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    cash_pending = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    cash_difference = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)  # physical cash - expected
    status = Column(String(30), default="Submitted")  # Draft, Submitted, Approved, Settled
    
    # Easyload in Report
    easyload_opening = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    easyload_issuance = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    easyload_retailer_transfer = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    easyload_closing = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    
    # Notes / Signatures
    finance_remarks = Column(Text, nullable=True)
    rso_signature = Column(String(100), nullable=True)
    sd_signature = Column(String(100), nullable=True)
    finance_signature = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    rso = relationship("RSO", back_populates="daily_reports")
    items = relationship("RSOItem", back_populates="report", cascade="all, delete-orphan")
    denominations = relationship("CashDenomination", back_populates="report", cascade="all, delete-orphan")

class RSOItem(Base):
    __tablename__ = "rso_items"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("rso_reports.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    item_name = Column(String(120), nullable=False)  # Pre Paid, SC 100, EC 350, Rep SIM, Eload SIM, EC 600, Wingle, MIFI, Hand Set
    opening_balance = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    new_issue = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    sale = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    closing_in_hand = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    rate = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    total_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    remarks = Column(String(255), nullable=True)

    report = relationship("RSODailyReport", back_populates="items")
    product = relationship("Product")

class CashDenomination(Base):
    __tablename__ = "cash_denominations"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("rso_reports.id", ondelete="CASCADE"), nullable=True)
    date = Column(Date, default=date.today)
    denomination = Column(Integer, nullable=False)  # 5000, 1000, 500, 100, 50, 20, 10
    quantity = Column(Integer, default=0, nullable=False)
    total = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)

    report = relationship("RSODailyReport", back_populates="denominations")

class RSOSalary(Base):
    __tablename__ = "rso_salaries"
    id = Column(Integer, primary_key=True, index=True)
    rso_id = Column(Integer, ForeignKey("rsos.id"), nullable=True)
    rso_name = Column(String(120), nullable=False)
    month = Column(String(50), default="August 2026", nullable=False)
    basic_salary = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    fuel_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    kpi_comm = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    evc_comm = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    bcards_comm = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    fca_comm = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    bonus = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    gross_total = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    rso = relationship("RSO")

class EasyLoadTransaction(Base):
    __tablename__ = "easyload_transactions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, default=date.today)
    msisdn = Column(String(50), nullable=False)
    retailer_id = Column(Integer, ForeignKey("retailers.id"), nullable=True)
    rso_id = Column(Integer, ForeignKey("rsos.id"), nullable=True)
    tx_type = Column(String(50), default="Transfer")  # Transfer, Issuance, Sale, Commission
    amount = Column(Numeric(12, 2), nullable=False)
    discount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    commission = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    reference = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    retailer = relationship("Retailer")
    rso = relationship("RSO")

# --- SALES ---
class Sale(Base):
    __tablename__ = "sales"
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(150), default="Direct Sale")
    sale_date = Column(Date, default=date.today, nullable=False)
    sale_type = Column(String(50), default="Customer")  # Customer, Retailer, RSO, Direct Customer
    customer_name = Column(String(120), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    retailer_id = Column(Integer, ForeignKey("retailers.id"), nullable=True)
    rso_id = Column(Integer, ForeignKey("rsos.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    subtotal = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    discount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    tax = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    commission = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    total_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    paid_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    remaining_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    
    # Financial engine metrics
    cogs = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    gross_profit = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    
    payment_method = Column(String(50), default="Cash")
    payment_status = Column(String(30), default="Paid")  # Paid, Partial, Due
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    staff = relationship("Staff")
    retailer = relationship("Retailer")
    rso = relationship("RSO")
    user = relationship("User")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    unit_cost = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)  # Weighted average cost at sale time
    unit_price = Column(Numeric(12, 2), nullable=False)
    discount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    commission = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    cogs = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    gross_profit = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")

# --- RETURNS ---
class Return(Base):
    __tablename__ = "returns"
    id = Column(Integer, primary_key=True, index=True)
    return_number = Column(String(100), unique=True, index=True, nullable=False)
    return_type = Column(String(50), default="Customer Return")  # Customer, Retailer, RSO, Supplier, Company
    return_date = Column(Date, default=date.today)
    original_reference = Column(String(100), nullable=True)  # invoice or purchase number
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    retailer_id = Column(Integer, ForeignKey("retailers.id"), nullable=True)
    rso_id = Column(Integer, ForeignKey("rsos.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    investment_id = Column(Integer, ForeignKey("investments.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    total_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    refunded_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    cogs_reversed = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    reason = Column(String(255), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("ReturnItem", back_populates="return_record", cascade="all, delete-orphan")
    user = relationship("User")

class ReturnItem(Base):
    __tablename__ = "return_items"
    id = Column(Integer, primary_key=True, index=True)
    return_id = Column(Integer, ForeignKey("returns.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False)
    unit_cost = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    unit_price = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    total_amount = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    cogs_reversed = Column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)

    return_record = relationship("Return", back_populates="items")
    product = relationship("Product")

# --- EXPENSES ---
class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    category = Column(String(80), nullable=False)  # Rent, Electricity, Internet, Transport, Fuel, Maintenance, Office, Salary-related, Other
    amount = Column(Numeric(14, 2), nullable=False)
    paid_date = Column(Date, default=date.today)
    payment_method = Column(String(50), default="Cash")
    paid_by_staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    paid_by_name = Column(String(100), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reference = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    staff = relationship("Staff")
    user = relationship("User")

# --- INVESTMENTS & RETURN OF INVESTMENT ---
class Investment(Base):
    __tablename__ = "investments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)  # Investor name
    phone = Column(String(50), nullable=True)
    amount_given = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    purchased_amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    returns = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    remaining = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    investment_date = Column(Date, default=date.today)
    payment_method = Column(String(50), default="Cash")
    status = Column(String(30), default="Active")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    return_records = relationship("InvestmentReturn", back_populates="investment", cascade="all, delete-orphan")

class InvestmentReturn(Base):
    __tablename__ = "investment_returns"
    id = Column(Integer, primary_key=True, index=True)
    investment_id = Column(Integer, ForeignKey("investments.id"), nullable=False, index=True)
    amount = Column(Numeric(14, 2), nullable=False)
    return_date = Column(Date, default=date.today)
    return_type = Column(String(50), default="Capital Return")  # Capital Return, Profit Share, Dividend
    payment_method = Column(String(50), default="Bank Transfer")
    reference = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    investment = relationship("Investment", back_populates="return_records")

# --- LOANS & RETURN OF LOAN ---
class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    lender_name = Column(String(120), nullable=False, index=True)  # Haris Badshah, Israr Kiran, etc.
    phone = Column(String(50), nullable=True)
    loan_type = Column(String(50), default="Working Capital")  # Working Capital, Short-term, Inventory Financing
    amount = Column(Numeric(14, 2), nullable=False)
    total_returned = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    remaining_balance = Column(Numeric(14, 2), nullable=False)
    loan_date = Column(Date, default=date.today)
    due_date = Column(Date, nullable=True)
    payment_method = Column(String(50), default="Bank Transfer")
    status = Column(String(30), default="Active")  # Active, Partially Returned, Settled
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    returns = relationship("LoanReturn", back_populates="loan", cascade="all, delete-orphan")

class LoanReturn(Base):
    __tablename__ = "loan_returns"
    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=False, index=True)
    amount_returned = Column(Numeric(14, 2), nullable=False)
    return_date = Column(Date, default=date.today)
    payment_method = Column(String(50), default="Bank Transfer")
    reference = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    loan = relationship("Loan", back_populates="returns")

# --- COMMISSIONS ---
class Commission(Base):
    __tablename__ = "commissions"
    id = Column(Integer, primary_key=True, index=True)
    commission_type = Column(String(50), nullable=False)  # Purchase, Sales, Company Incentive, RSO, Retailer, Other Income
    amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    fixed_or_percentage = Column(String(20), default="Fixed")
    percentage_value = Column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    party_name = Column(String(120), nullable=True)
    date = Column(Date, default=date.today)
    reference = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product")

# --- CENTRALIZED DOUBLE-ENTRY LEDGER ---
class LedgerAccount(Base):
    __tablename__ = "ledger_accounts"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    account_type = Column(String(30), nullable=False)  # Asset, Liability, Equity, Revenue, Expense
    balance = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    is_system = Column(Boolean, default=True)

class LedgerTransaction(Base):
    __tablename__ = "ledger_transactions"
    id = Column(Integer, primary_key=True, index=True)
    tx_code = Column(String(100), unique=True, index=True, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    description = Column(String(255), nullable=False)
    reference_type = Column(String(50), nullable=True)  # Purchase, Sale, Return, Expense, Salary, CompanyCredit, Investment
    reference_id = Column(String(100), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    entries = relationship("LedgerEntry", back_populates="transaction", cascade="all, delete-orphan")

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("ledger_transactions.id", ondelete="CASCADE"), nullable=False)
    account_id = Column(Integer, ForeignKey("ledger_accounts.id"), nullable=False)
    entry_type = Column(String(20), nullable=False)  # Debit or Credit
    amount = Column(Numeric(14, 2), default=Decimal("0.00"), nullable=False)
    memo = Column(String(255), nullable=True)

    transaction = relationship("LedgerTransaction", back_populates="entries")
    account = relationship("LedgerAccount")

# --- SETTINGS & AUDIT LOG ---
class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False)
    value = Column(Text, nullable=False)
    category = Column(String(50), default="general")
    description = Column(String(255), nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), nullable=True)
    action = Column(String(50), nullable=False)  # Create, Update, Delete, Payment, Return, Settlement, Stock Adjustment
    entity = Column(String(80), nullable=False)
    entity_id = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

# --- FCA & BVS MONTHLY PERFORMANCE TRACKING ---
class FCAgent(Base):
    __tablename__ = "fca_agents"
    id = Column(Integer, primary_key=True, index=True)
    bvs_id = Column(String(60), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=True)
    market = Column(String(150), nullable=True)
    category = Column(String(100), nullable=True, index=True)
    channel = Column(String(100), default="Market FCA")
    status = Column(String(50), default="Active")
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    monthly_records = relationship("FCAMonthlyRecord", back_populates="agent", cascade="all, delete-orphan", order_by="FCAMonthlyRecord.month_key.asc()")


class FCAMonthlyRecord(Base):
    __tablename__ = "fca_monthly_records"
    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("fca_agents.id", ondelete="CASCADE"), nullable=False, index=True)
    month_key = Column(String(20), nullable=False, index=True)  # e.g. "2026-01", "2026-08", "2026-09"
    month_label = Column(String(50), nullable=False)  # e.g. "Jan 2026", "Aug 2026", "Sep 2026"
    sims_sold = Column(Integer, default=0, nullable=False)
    source = Column(String(100), default="Manual Entry")
    notes = Column(String(255), nullable=True)
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agent = relationship("FCAgent", back_populates="monthly_records")
    updater = relationship("User")

    __table_args__ = (
        Index("idx_agent_month", "agent_id", "month_key", unique=True),
    )

