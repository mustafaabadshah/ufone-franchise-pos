from datetime import date as dt_date, datetime as dt_datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- AUTH & USER ---
class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role_id: int
    phone: Optional[str] = None
    is_active: bool = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role_id: Optional[int] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role_id: int
    role_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: dt_datetime
    class Config:
        from_attributes = True

# --- CATEGORY ---
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: dt_datetime
    class Config:
        from_attributes = True

# --- PRODUCT ---
class ProductCreate(BaseModel):
    name: str
    sku: str
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    brand: str = "Ufone"
    unit: str = "Piece"
    purchase_price: Decimal = Decimal("0.00")
    selling_price: Decimal = Decimal("0.00")
    retailer_price: Decimal = Decimal("0.00")
    rso_price: Decimal = Decimal("0.00")
    company_price: Decimal = Decimal("0.00")
    alert_quantity: Decimal = Decimal("10.00")
    current_stock: Decimal = Decimal("0.00")
    commission: Decimal = Decimal("0.00")
    discount: Decimal = Decimal("0.00")
    tax_percent: Decimal = Decimal("0.00")
    status: str = "Active"
    description: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    purchase_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    retailer_price: Optional[Decimal] = None
    rso_price: Optional[Decimal] = None
    company_price: Optional[Decimal] = None
    alert_quantity: Optional[Decimal] = None
    commission: Optional[Decimal] = None
    discount: Optional[Decimal] = None
    tax_percent: Optional[Decimal] = None
    status: Optional[str] = None
    description: Optional[str] = None

class ProductOut(BaseModel):
    id: int
    name: str
    sku: str
    barcode: Optional[str] = None
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    brand: str
    unit: str
    purchase_price: Decimal
    selling_price: Decimal
    retailer_price: Decimal
    rso_price: Decimal
    company_price: Decimal
    alert_quantity: Decimal
    current_stock: Decimal
    avg_cost: Decimal
    commission: Decimal
    discount: Decimal
    tax_percent: Decimal
    status: str
    description: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

# --- STOCK MOVEMENTS ---
class StockMovementOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    movement_type: str
    quantity: Decimal
    unit_cost: Decimal
    unit_price: Decimal
    balance_after: Decimal
    reference: Optional[str] = None
    source: Optional[str] = None
    destination: Optional[str] = None
    remarks: Optional[str] = None
    date: dt_datetime
    class Config:
        from_attributes = True

class StockAdjustmentCreate(BaseModel):
    product_id: int
    adjustment_type: str  # Adjustment, Damage, Loss, Correction
    quantity: Decimal  # can be positive or negative
    remarks: str

# --- PURCHASES ---
class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: Decimal
    purchase_price: Decimal
    sale_price: Optional[Decimal] = Decimal("0.00")
    discount: Optional[Decimal] = Decimal("0.00")

class PurchaseCreate(BaseModel):
    invoice_number: Optional[str] = None
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    purchase_date: dt_date = Field(default_factory=dt_date.today)
    items: List[PurchaseItemCreate]
    discount: Decimal = Decimal("0.00")
    tax: Decimal = Decimal("0.00")
    paid_amount: Decimal = Decimal("0.00")
    payment_method: str = "Cash"  # Cash, Bank Transfer, Company Credit
    investment_id: Optional[int] = None
    due_date: Optional[dt_date] = None
    remarks: Optional[str] = None

class PurchaseItemOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: Decimal
    purchase_price: Decimal
    sale_price: Decimal
    discount: Decimal
    total_amount: Decimal
    class Config:
        from_attributes = True

class PurchaseOut(BaseModel):
    id: int
    invoice_number: str
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    purchase_date: dt_date
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    due_amount: Decimal
    payment_method: str
    payment_status: str
    is_company_credit: bool
    due_date: Optional[dt_date] = None
    remarks: Optional[str] = None
    created_at: dt_datetime
    items: List[PurchaseItemOut] = []
    class Config:
        from_attributes = True

# --- SALES ---
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: Decimal
    unit_price: Decimal
    discount: Optional[Decimal] = Decimal("0.00")
    commission: Optional[Decimal] = Decimal("0.00")

class SaleCreate(BaseModel):
    invoice_number: Optional[str] = None
    title: str = "Direct Sale"
    sale_date: dt_date = Field(default_factory=dt_date.today)
    sale_type: str = "Customer"  # Customer, Retailer, RSO, Direct Customer
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    staff_id: Optional[int] = None
    retailer_id: Optional[int] = None
    rso_id: Optional[int] = None
    items: List[SaleItemCreate]
    discount: Decimal = Decimal("0.00")
    tax: Decimal = Decimal("0.00")
    commission: Decimal = Decimal("0.00")
    paid_amount: Decimal = Decimal("0.00")
    payment_method: str = "Cash"
    remarks: Optional[str] = None

class SaleItemOut(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: Decimal
    unit_cost: Decimal
    unit_price: Decimal
    discount: Decimal
    commission: Decimal
    total_amount: Decimal
    cogs: Decimal
    gross_profit: Decimal
    class Config:
        from_attributes = True

class SaleOut(BaseModel):
    id: int
    invoice_number: str
    title: str
    sale_date: dt_date
    sale_type: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    retailer_id: Optional[int] = None
    retailer_name: Optional[str] = None
    rso_id: Optional[int] = None
    rso_name: Optional[str] = None
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    commission: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    remaining_amount: Decimal
    cogs: Decimal
    gross_profit: Decimal
    payment_method: str
    payment_status: str
    remarks: Optional[str] = None
    created_at: dt_datetime
    items: List[SaleItemOut] = []
    class Config:
        from_attributes = True

# --- RETURNS ---
class ReturnItemCreate(BaseModel):
    product_id: int
    quantity: Decimal
    unit_price: Decimal

class ReturnCreate(BaseModel):
    return_type: str  # Customer Return, Retailer Return, RSO Return, Supplier Return, Company Return
    return_date: dt_date = Field(default_factory=dt_date.today)
    original_reference: Optional[str] = None
    sale_id: Optional[int] = None
    purchase_id: Optional[int] = None
    retailer_id: Optional[int] = None
    rso_id: Optional[int] = None
    company_id: Optional[int] = None
    investment_id: Optional[int] = None
    items: List[ReturnItemCreate]
    refunded_amount: Decimal = Decimal("0.00")
    reason: Optional[str] = None
    remarks: Optional[str] = None

class ReturnOut(BaseModel):
    id: int
    return_number: str
    return_type: str
    return_date: dt_date
    original_reference: Optional[str] = None
    total_amount: Decimal
    refunded_amount: Decimal
    cogs_reversed: Decimal
    reason: Optional[str] = None
    remarks: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

# --- STAFF & SALARIES ---
class StaffCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "Sales Staff"
    salary_amount: Decimal = Decimal("0.00")
    joining_date: dt_date = Field(default_factory=dt_date.today)
    status: str = "Active"

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    salary_amount: Optional[Decimal] = None
    joining_date: Optional[dt_date] = None
    status: Optional[str] = None

class StaffOut(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    salary_amount: Decimal
    joining_date: dt_date
    status: str
    created_at: dt_datetime
    class Config:
        from_attributes = True

class SalaryCreate(BaseModel):
    staff_id: int
    month: str
    basic_salary: Decimal
    allowances: Decimal = Decimal("0.00")
    deductions: Decimal = Decimal("0.00")
    bonus: Decimal = Decimal("0.00")
    commission: Decimal = Decimal("0.00")
    salary_given: Decimal
    paid_on: dt_date = Field(default_factory=dt_date.today)
    paid_by: Optional[str] = None
    payment_method: str = "Cash"
    remarks: Optional[str] = None

class SalaryOut(BaseModel):
    id: int
    staff_id: int
    staff_name: Optional[str] = None
    month: str
    basic_salary: Decimal
    allowances: Decimal
    deductions: Decimal
    bonus: Decimal
    commission: Decimal
    net_salary: Decimal
    salary_given: Decimal
    remaining: Decimal
    paid_on: dt_date
    paid_by: Optional[str] = None
    payment_method: str
    status: str
    remarks: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

# --- RETAILERS ---
class RetailerCreate(BaseModel):
    name: str
    shop_name: Optional[str] = None
    phone: Optional[str] = None
    msisdn: Optional[str] = None
    address: Optional[str] = None
    route: Optional[str] = None

class RetailerUpdate(BaseModel):
    name: Optional[str] = None
    shop_name: Optional[str] = None
    phone: Optional[str] = None
    msisdn: Optional[str] = None
    address: Optional[str] = None
    route: Optional[str] = None
    status: Optional[str] = None

class RetailerOut(BaseModel):
    id: int
    name: str
    shop_name: Optional[str] = None
    phone: Optional[str] = None
    msisdn: Optional[str] = None
    address: Optional[str] = None
    route: Optional[str] = None
    balance: Decimal
    status: str
    created_at: dt_datetime
    class Config:
        from_attributes = True

class RetailerCollectionCreate(BaseModel):
    retailer_id: int
    msisdn: Optional[str] = None
    date: dt_date = Field(default_factory=dt_date.today)
    collection_type: str = "Balance Received"  # Balance Sent, Balance Received, Cash Pending
    amount: Decimal
    payment_method: str = "Cash"
    reason: Optional[str] = None
    due_date: Optional[dt_date] = None
    remarks: Optional[str] = None

class RetailerCollectionOut(BaseModel):
    id: int
    retailer_id: int
    retailer_name: Optional[str] = None
    msisdn: Optional[str] = None
    date: dt_date
    collection_type: str
    amount: Decimal
    payment_method: str
    reason: Optional[str] = None
    due_date: Optional[dt_date] = None
    remarks: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

# --- RSO & RSO DAILY REPORT ---
class RSOCreate(BaseModel):
    name: str
    code: str
    mobile: str
    route: str
    address: Optional[str] = None
    joining_date: dt_date = Field(default_factory=dt_date.today)
    opening_balance: Decimal = Decimal("0.00")
    remarks: Optional[str] = None

class RSOUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    mobile: Optional[str] = None
    route: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None

class RSOOut(BaseModel):
    id: int
    name: str
    code: str
    mobile: str
    route: str
    address: Optional[str] = None
    joining_date: dt_date
    status: str
    opening_balance: Decimal
    current_balance: Decimal
    easyload_balance: Decimal
    sim_balance: Decimal
    card_balance: Decimal
    remarks: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

class RSOItemIn(BaseModel):
    product_id: Optional[int] = None
    item_name: str
    opening_balance: Decimal = Decimal("0.00")
    new_issue: Decimal = Decimal("0.00")
    sale: Decimal = Decimal("0.00")
    closing_in_hand: Decimal = Decimal("0.00")
    rate: Decimal = Decimal("0.00")
    total_amount: Decimal = Decimal("0.00")
    remarks: Optional[str] = None

class CashDenominationIn(BaseModel):
    denomination: int
    quantity: int

class RSODailyReportCreate(BaseModel):
    rso_id: int
    date: dt_date = Field(default_factory=dt_date.today)
    route: str
    items: List[RSOItemIn]
    easyload_opening: Decimal = Decimal("0.00")
    easyload_issuance: Decimal = Decimal("0.00")
    easyload_retailer_transfer: Decimal = Decimal("0.00")
    easyload_closing: Decimal = Decimal("0.00")
    expected_cash: Decimal = Decimal("0.00")
    cash_received: Decimal = Decimal("0.00")
    denominations: List[CashDenominationIn] = []
    finance_remarks: Optional[str] = None
    rso_signature: Optional[str] = None
    sd_signature: Optional[str] = None
    finance_signature: Optional[str] = None

class RSODailyReportOut(BaseModel):
    id: int
    report_code: str
    rso_id: int
    rso_name: Optional[str] = None
    rso_code: Optional[str] = None
    date: dt_date
    route: str
    total_sale_amount: Decimal
    expected_cash: Decimal
    cash_received: Decimal
    cash_pending: Decimal
    cash_difference: Decimal
    status: str
    easyload_opening: Decimal
    easyload_issuance: Decimal
    easyload_retailer_transfer: Decimal
    easyload_closing: Decimal
    finance_remarks: Optional[str] = None
    rso_signature: Optional[str] = None
    sd_signature: Optional[str] = None
    finance_signature: Optional[str] = None
    created_at: dt_datetime
    items: List[Dict[str, Any]] = []
    denominations: List[Dict[str, Any]] = []
    class Config:
        from_attributes = True

# --- RSO SALARIES ---
class RSOSalaryCreate(BaseModel):
    rso_id: Optional[int] = None
    rso_name: str
    month: str = "August 2026"
    basic_salary: Decimal = Decimal("0.00")
    fuel_amount: Decimal = Decimal("0.00")
    kpi_comm: Decimal = Decimal("0.00")
    evc_comm: Decimal = Decimal("0.00")
    bcards_comm: Decimal = Decimal("0.00")
    fca_comm: Decimal = Decimal("0.00")
    bonus: Decimal = Decimal("0.00")
    gross_total: Decimal = Decimal("0.00")

class RSOSalaryOut(BaseModel):
    id: int
    rso_id: Optional[int] = None
    rso_name: str
    month: str
    basic_salary: Decimal
    fuel_amount: Decimal
    kpi_comm: Decimal
    evc_comm: Decimal
    bcards_comm: Decimal
    fca_comm: Decimal
    bonus: Decimal
    gross_total: Decimal
    created_at: dt_datetime
    class Config:
        from_attributes = True

# --- EASYLOAD ---
class EasyLoadCreate(BaseModel):
    date: dt_date = Field(default_factory=dt_date.today)
    msisdn: str
    retailer_id: Optional[int] = None
    rso_id: Optional[int] = None
    tx_type: str = "Transfer"
    amount: Decimal
    discount: Decimal = Decimal("0.00")
    commission: Decimal = Decimal("0.00")
    reference: Optional[str] = None
    remarks: Optional[str] = None

class EasyLoadOut(BaseModel):
    id: int
    date: dt_date
    msisdn: str
    retailer_id: Optional[int] = None
    retailer_name: Optional[str] = None
    rso_id: Optional[int] = None
    rso_name: Optional[str] = None
    tx_type: str
    amount: Decimal
    discount: Decimal
    commission: Decimal
    reference: Optional[str] = None
    remarks: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

# --- EXPENSES ---
class ExpenseCreate(BaseModel):
    title: str
    category: str
    amount: Decimal
    paid_date: dt_date = Field(default_factory=dt_date.today)
    payment_method: str = "Cash"
    paid_by_staff_id: Optional[int] = None
    paid_by_name: Optional[str] = None
    reference: Optional[str] = None
    remarks: Optional[str] = None

class ExpenseOut(BaseModel):
    id: int
    title: str
    category: str
    amount: Decimal
    paid_date: dt_date
    payment_method: str
    paid_by_staff_id: Optional[int] = None
    paid_by_name: Optional[str] = None
    reference: Optional[str] = None
    remarks: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

# --- INVESTMENTS ---
class InvestmentCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    amount_given: Decimal
    investment_date: dt_date = Field(default_factory=dt_date.today)
    payment_method: str = "Cash"
    remarks: Optional[str] = None

class InvestmentReturnCreate(BaseModel):
    amount: Decimal
    return_date: dt_date = Field(default_factory=dt_date.today)
    return_type: str = "Capital Return"  # Capital Return, Profit Share, Dividend
    payment_method: str = "Bank Transfer"
    reference: Optional[str] = None
    remarks: Optional[str] = None

class InvestmentReturnOut(BaseModel):
    id: int
    investment_id: int
    amount: Decimal
    return_date: dt_date
    return_type: str
    payment_method: str
    reference: Optional[str] = None
    remarks: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

class InvestmentOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    amount_given: Decimal
    purchased_amount: Decimal
    returns: Decimal
    remaining: Decimal
    investment_date: dt_date
    payment_method: str
    status: str
    remarks: Optional[str] = None
    created_at: dt_datetime
    return_records: List[InvestmentReturnOut] = []
    class Config:
        from_attributes = True

# --- LOANS & RETURN OF LOAN ---
class LoanCreate(BaseModel):
    lender_name: str
    phone: Optional[str] = None
    loan_type: str = "Working Capital"
    amount: Decimal
    loan_date: dt_date = Field(default_factory=dt_date.today)
    due_date: Optional[dt_date] = None
    payment_method: str = "Bank Transfer"
    remarks: Optional[str] = None

class LoanReturnCreate(BaseModel):
    amount_returned: Decimal
    return_date: dt_date = Field(default_factory=dt_date.today)
    payment_method: str = "Bank Transfer"
    reference: Optional[str] = None
    remarks: Optional[str] = None

class LoanReturnOut(BaseModel):
    id: int
    loan_id: int
    amount_returned: Decimal
    return_date: dt_date
    payment_method: str
    reference: Optional[str] = None
    remarks: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

class LoanOut(BaseModel):
    id: int
    lender_name: str
    phone: Optional[str] = None
    loan_type: str
    amount: Decimal
    total_returned: Decimal
    remaining_balance: Decimal
    loan_date: dt_date
    due_date: Optional[dt_date] = None
    payment_method: str
    status: str
    remarks: Optional[str] = None
    created_at: dt_datetime
    returns: List[LoanReturnOut] = []
    class Config:
        from_attributes = True

# --- COMMISSIONS ---
class CommissionCreate(BaseModel):
    commission_type: str
    amount: Decimal
    fixed_or_percentage: str = "Fixed"
    percentage_value: Decimal = Decimal("0.00")
    product_id: Optional[int] = None
    party_name: Optional[str] = None
    date: dt_date = Field(default_factory=dt_date.today)
    reference: Optional[str] = None
    remarks: Optional[str] = None

class CommissionOut(BaseModel):
    id: int
    commission_type: str
    amount: Decimal
    fixed_or_percentage: str
    percentage_value: Decimal
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    party_name: Optional[str] = None
    date: dt_date
    reference: Optional[str] = None
    remarks: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

# --- COMPANY CREDIT ---
class CompanyCreate(BaseModel):
    name: str
    code: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class CompanyCreditAccountOut(BaseModel):
    id: int
    company_id: int
    company_name: Optional[str] = None
    reference_number: str
    description: Optional[str] = None
    total_credit: Decimal
    amount_paid: Decimal
    outstanding: Decimal
    status: str
    due_date: Optional[dt_date] = None
    remarks: Optional[str] = None
    created_at: dt_datetime
    class Config:
        from_attributes = True

class CompanyCreditPaymentCreate(BaseModel):
    account_id: int
    amount: Decimal
    payment_date: dt_date = Field(default_factory=dt_date.today)
    payment_method: str = "Bank Transfer"
    reference: Optional[str] = None
    remarks: Optional[str] = None

# --- SETTINGS & AUDIT ---
class SettingUpdate(BaseModel):
    key: str
    value: str

class SettingOut(BaseModel):
    id: int
    key: str
    value: str
    category: str
    description: Optional[str] = None
    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    entity: str
    entity_id: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: dt_datetime
    class Config:
        from_attributes = True
