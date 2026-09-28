export interface User {
  id: int;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

export type int = number;

export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  category_id?: number;
  category_name?: string;
  brand: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  retailer_price: number;
  rso_price: number;
  company_price: number;
  alert_quantity: number;
  current_stock: number;
  avg_cost: number;
  commission: number;
  discount: number;
  tax_percent: number;
  status: string;
  description?: string;
  created_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  movement_type: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  balance_after: number;
  reference?: string;
  source?: string;
  destination?: string;
  remarks?: string;
  date: string;
}

export interface PurchaseItem {
  id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  discount?: number;
  total_amount?: number;
}

export interface Purchase {
  id: number;
  invoice_number: string;
  company_id?: number;
  company_name?: string;
  purchase_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_method: string;
  payment_status: string;
  is_company_credit: boolean;
  due_date?: string;
  remarks?: string;
  created_at: string;
  items: PurchaseItem[];
}

export interface SaleItem {
  id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_cost?: number;
  unit_price: number;
  discount?: number;
  commission?: number;
  total_amount: number;
  cogs?: number;
  gross_profit?: number;
}

export interface Sale {
  id: number;
  invoice_number: string;
  title: string;
  sale_date: string;
  sale_type: string;
  customer_name?: string;
  customer_phone?: string;
  staff_id?: number;
  staff_name?: string;
  retailer_id?: number;
  retailer_name?: string;
  rso_id?: number;
  rso_name?: string;
  subtotal: number;
  discount: number;
  tax: number;
  commission: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  cogs: number;
  gross_profit: number;
  payment_method: string;
  payment_status: string;
  remarks?: string;
  created_at: string;
  items: SaleItem[];
}

export interface Staff {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  salary_amount: number;
  joining_date: string;
  status: string;
  created_at: string;
}

export interface Salary {
  id: number;
  staff_id: number;
  staff_name?: string;
  month: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  bonus: number;
  commission: number;
  net_salary: number;
  salary_given: number;
  remaining: number;
  paid_on: string;
  paid_by?: string;
  payment_method: string;
  status: string;
  remarks?: string;
  created_at: string;
}

export interface Retailer {
  id: number;
  name: string;
  shop_name?: string;
  phone?: string;
  msisdn?: string;
  address?: string;
  route?: string;
  balance: number;
  status: string;
  created_at: string;
}

export interface RetailerCollection {
  id: number;
  retailer_id: number;
  retailer_name?: string;
  msisdn?: string;
  date: string;
  collection_type: string;
  amount: number;
  payment_method: string;
  reason?: string;
  due_date?: string;
  remarks?: string;
  created_at: string;
}

export interface RSO {
  id: number;
  name: string;
  code: string;
  mobile: string;
  route: string;
  address?: string;
  joining_date: string;
  status: string;
  opening_balance: number;
  current_balance: number;
  easyload_balance: number;
  sim_balance: number;
  card_balance: number;
  remarks?: string;
  created_at: string;
}

export interface RSOItem {
  id?: number;
  product_id?: number;
  item_name: string;
  opening_balance: number;
  new_issue: number;
  sale: number;
  closing_in_hand: number;
  rate: number;
  total_amount: number;
  remarks?: string;
}

export interface CashDenomination {
  id?: number;
  denomination: number;
  quantity: number;
  total: number;
}

export interface RSODailyReport {
  id: number;
  report_code: string;
  rso_id: number;
  rso_name?: string;
  rso_code?: string;
  date: string;
  route: string;
  total_sale_amount: number;
  expected_cash: number;
  cash_received: number;
  cash_pending: number;
  cash_difference: number;
  status: string;
  easyload_opening: number;
  easyload_issuance: number;
  easyload_retailer_transfer: number;
  easyload_closing: number;
  finance_remarks?: string;
  rso_signature?: string;
  sd_signature?: string;
  finance_signature?: string;
  created_at: string;
  items: RSOItem[];
  denominations: CashDenomination[];
}

export interface RSOSalary {
  id: number;
  rso_id?: number;
  rso_name: string;
  month: string;
  basic_salary: number;
  fuel_amount: number;
  kpi_comm: number;
  evc_comm: number;
  bcards_comm: number;
  fca_comm: number;
  bonus: number;
  gross_total: number;
  created_at: string;
}

export interface EasyLoadTransaction {
  id: number;
  date: string;
  msisdn: string;
  retailer_id?: number;
  retailer_name?: string;
  rso_id?: number;
  rso_name?: string;
  tx_type: string;
  amount: number;
  discount: number;
  commission: number;
  reference?: string;
  remarks?: string;
  created_at: string;
}

export interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  paid_date: string;
  payment_method: string;
  paid_by_staff_id?: number;
  paid_by_name?: string;
  reference?: string;
  remarks?: string;
  created_at: string;
}

export interface Investment {
  id: number;
  name: string;
  phone?: string;
  amount_given: number;
  purchased_amount: number;
  returns: number;
  remaining: number;
  investment_date: string;
  payment_method: string;
  status: string;
  remarks?: string;
  created_at: string;
}

export interface Commission {
  id: number;
  commission_type: string;
  amount: number;
  fixed_or_percentage: string;
  percentage_value: number;
  product_id?: number;
  product_name?: string;
  party_name?: string;
  date: string;
  reference?: string;
  remarks?: string;
  created_at: string;
}

export interface CompanyCreditAccount {
  id: number;
  company_id: number;
  company_name?: string;
  reference_number: string;
  description?: string;
  total_credit: number;
  amount_paid: number;
  outstanding: number;
  status: string;
  due_date?: string;
  remarks?: string;
  created_at: string;
}

export interface ReturnRecord {
  id: number;
  return_number: string;
  return_type: string;
  return_date: string;
  original_reference?: string;
  total_amount: number;
  refunded_amount: number;
  cogs_reversed: number;
  reason?: string;
  remarks?: string;
  created_at: string;
}

export interface DashboardMetrics {
  today_sales: number;
  total_sales: number;
  today_purchases: number;
  total_purchases: number;
  today_expenses: number;
  total_expenses: number;
  today_profit: number;
  today_loss: number;
  gross_profit: number;
  net_profit: number;
  is_net_loss: boolean;
  net_balance: number;
  purchase_due: number;
  company_credit_outstanding: number;
  retailer_receivable: number;
  rso_receivable: number;
  staff_count: number;
  product_count: number;
  pending_purchases: number;
  low_stock_items: number;
  cash_in_hand: number;
  investment: number;
  returns: number;
  commission_income: number;
}
