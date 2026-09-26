from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import (
    Product, StockMovement, StockMovementType, Purchase, PurchaseItem,
    Sale, SaleItem, Return, ReturnItem, Expense, Salary, CompanyCreditAccount,
    CompanyCreditTransaction, LedgerAccount, LedgerTransaction, LedgerEntry,
    EntryTypeEnum, AuditLog
)

SYSTEM_ACCOUNTS = [
    {"code": "1010", "name": "Cash on Hand", "type": "Asset"},
    {"code": "1020", "name": "Bank Account", "type": "Asset"},
    {"code": "1030", "name": "Accounts Receivable - Retailers", "type": "Asset"},
    {"code": "1040", "name": "Accounts Receivable - RSO", "type": "Asset"},
    {"code": "1050", "name": "Merchandise Inventory", "type": "Asset"},
    {"code": "2010", "name": "Company Payables / Credit", "type": "Liability"},
    {"code": "2020", "name": "Accrued Salaries", "type": "Liability"},
    {"code": "3010", "name": "Owner / Investor Capital", "type": "Equity"},
    {"code": "4010", "name": "Sales Revenue", "type": "Revenue"},
    {"code": "4020", "name": "Commission Income", "type": "Revenue"},
    {"code": "5010", "name": "Cost of Goods Sold (COGS)", "type": "Expense"},
    {"code": "5020", "name": "Operating Expenses", "type": "Expense"},
    {"code": "5030", "name": "Salary Expense", "type": "Expense"},
]

def ensure_system_accounts(db: Session):
    """Ensures standard chart of accounts exists."""
    for acct_data in SYSTEM_ACCOUNTS:
        existing = db.query(LedgerAccount).filter(LedgerAccount.code == acct_data["code"]).first()
        if not existing:
            account = LedgerAccount(
                code=acct_data["code"],
                name=acct_data["name"],
                account_type=acct_data["type"],
                balance=Decimal("0.00"),
                is_system=True
            )
            db.add(account)
    db.commit()

def get_account_by_code(db: Session, code: str) -> LedgerAccount:
    acct = db.query(LedgerAccount).filter(LedgerAccount.code == code).first()
    if not acct:
        ensure_system_accounts(db)
        acct = db.query(LedgerAccount).filter(LedgerAccount.code == code).first()
    return acct

def post_ledger_transaction(
    db: Session,
    tx_code: str,
    description: str,
    reference_type: str,
    reference_id: str,
    entries: List[Dict[str, Any]],
    user_id: Optional[int] = None
) -> LedgerTransaction:
    """
    Creates a double-entry ledger transaction.
    Each entry is: {"account_code": str, "entry_type": "Debit"|"Credit", "amount": Decimal, "memo": str}
    Verifies Debit total == Credit total.
    """
    total_debit = Decimal("0.00")
    total_credit = Decimal("0.00")
    
    for e in entries:
        amt = Decimal(str(e["amount"]))
        if e["entry_type"] == EntryTypeEnum.DEBIT.value:
            total_debit += amt
        else:
            total_credit += amt

    # Tolerance of 0.01 for minor rounding
    if abs(total_debit - total_credit) > Decimal("0.05"):
        raise ValueError(f"Ledger transaction out of balance! Debit: {total_debit}, Credit: {total_credit}")

    tx = LedgerTransaction(
        tx_code=tx_code,
        date=datetime.utcnow(),
        description=description,
        reference_type=reference_type,
        reference_id=str(reference_id),
        created_by_user_id=user_id
    )
    db.add(tx)
    db.flush()

    for e in entries:
        amt = Decimal(str(e["amount"]))
        acct = get_account_by_code(db, e["account_code"])
        entry = LedgerEntry(
            transaction_id=tx.id,
            account_id=acct.id,
            entry_type=e["entry_type"],
            amount=amt,
            memo=e.get("memo", description)
        )
        db.add(entry)

        # Update account balance based on normal balance rules
        # Assets & Expenses increase with Debit, decrease with Credit
        # Liabilities, Equity, Revenue increase with Credit, decrease with Debit
        if acct.account_type in ["Asset", "Expense"]:
            if e["entry_type"] == EntryTypeEnum.DEBIT.value:
                acct.balance += amt
            else:
                acct.balance -= amt
        else:
            if e["entry_type"] == EntryTypeEnum.CREDIT.value:
                acct.balance += amt
            else:
                acct.balance -= amt

    return tx

def process_purchase_accounting(db: Session, purchase: Purchase, user_id: Optional[int] = None):
    """
    Executes inventory updates, weighted average cost re-calculation,
    stock movement generation, and double-entry ledger posting for a purchase.
    """
    inventory_val_added = Decimal("0.00")

    for item in purchase.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if prod:
            old_stock = prod.current_stock
            old_cost = prod.avg_cost
            qty = item.quantity
            cost = item.purchase_price
            
            # Weighted Average Cost Calculation
            new_stock = old_stock + qty
            if new_stock > 0:
                new_avg_cost = ((old_stock * old_cost) + (qty * cost)) / new_stock
            else:
                new_avg_cost = cost

            prod.current_stock = new_stock
            prod.avg_cost = new_avg_cost
            prod.purchase_price = cost
            if item.sale_price > Decimal("0.00"):
                prod.selling_price = item.sale_price

            inventory_val_added += (qty * cost)

            # Record stock movement
            mov = StockMovement(
                product_id=prod.id,
                movement_type=StockMovementType.PURCHASE.value,
                quantity=qty,
                unit_cost=cost,
                unit_price=item.sale_price or prod.selling_price,
                balance_after=new_stock,
                reference=purchase.invoice_number,
                source=purchase.company_name or "Supplier",
                destination="Franchise Inventory",
                user_id=user_id,
                remarks=f"Purchase invoice {purchase.invoice_number}"
            )
            db.add(mov)

    # Double entry:
    # Debit: Merchandise Inventory (1050)
    # Credit: Cash (1010) for paid amount, and Company Payable (2010) for due amount
    entries = [
        {
            "account_code": "1050",
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": purchase.total_amount,
            "memo": f"Inventory received on purchase {purchase.invoice_number}"
        }
    ]

    if purchase.paid_amount > Decimal("0.00"):
        cash_or_bank = "1020" if purchase.payment_method == "Bank Transfer" else "1010"
        entries.append({
            "account_code": cash_or_bank,
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": purchase.paid_amount,
            "memo": f"Payment for purchase {purchase.invoice_number}"
        })

    if purchase.due_amount > Decimal("0.00"):
        entries.append({
            "account_code": "2010",
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": purchase.due_amount,
            "memo": f"Company credit / payable for purchase {purchase.invoice_number}"
        })

    post_ledger_transaction(
        db=db,
        tx_code=f"TX-PUR-{purchase.invoice_number}",
        description=f"Purchase {purchase.invoice_number} from {purchase.company_name or 'Company'}",
        reference_type="Purchase",
        reference_id=str(purchase.id),
        entries=entries,
        user_id=user_id
    )

def process_sale_accounting(db: Session, sale: Sale, user_id: Optional[int] = None):
    """
    Executes stock decrease, COGS calculation via Weighted Average Cost,
    stock movement generation, and double-entry ledger posting for a sale.
    """
    total_cogs = Decimal("0.00")
    total_revenue = sale.total_amount

    for item in sale.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            continue
        
        # Use product's current weighted average cost
        item_cost = prod.avg_cost if prod.avg_cost > Decimal("0.00") else prod.purchase_price
        item.unit_cost = item_cost
        item_cogs = item.quantity * item_cost
        item.cogs = item_cogs
        item.gross_profit = item.total_amount - item_cogs + item.commission
        total_cogs += item_cogs

        # Reduce stock
        prod.current_stock -= item.quantity
        mov = StockMovement(
            product_id=prod.id,
            movement_type=StockMovementType.SALE.value,
            quantity=-item.quantity,
            unit_cost=item_cost,
            unit_price=item.unit_price,
            balance_after=prod.current_stock,
            reference=sale.invoice_number,
            source="Franchise Inventory",
            destination=sale.customer_name or sale.title or "Customer",
            user_id=user_id,
            remarks=f"Sale invoice {sale.invoice_number}"
        )
        db.add(mov)

    sale.cogs = total_cogs
    sale.gross_profit = total_revenue - total_cogs + sale.commission

    # Double entry:
    # 1. Recognize Revenue & Cash / Receivable
    # Debit: Cash (1010) or Receivable (1030 for retailer, 1040 for RSO)
    # Credit: Sales Revenue (4010)
    # 2. Recognize COGS & Inventory reduction
    # Debit: COGS (5010)
    # Credit: Merchandise Inventory (1050)
    entries = []

    if sale.paid_amount > Decimal("0.00"):
        cash_or_bank = "1020" if sale.payment_method == "Bank Transfer" else "1010"
        entries.append({
            "account_code": cash_or_bank,
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": sale.paid_amount,
            "memo": f"Cash received for sale {sale.invoice_number}"
        })

    if sale.remaining_amount > Decimal("0.00"):
        rec_code = "1040" if sale.rso_id else "1030"
        entries.append({
            "account_code": rec_code,
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": sale.remaining_amount,
            "memo": f"Receivable balance for sale {sale.invoice_number}"
        })

    entries.append({
        "account_code": "4010",
        "entry_type": EntryTypeEnum.CREDIT.value,
        "amount": sale.total_amount,
        "memo": f"Revenue from sale {sale.invoice_number}"
    })

    if total_cogs > Decimal("0.00"):
        entries.append({
            "account_code": "5010",
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": total_cogs,
            "memo": f"COGS for sale {sale.invoice_number}"
        })
        entries.append({
            "account_code": "1050",
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": total_cogs,
            "memo": f"Inventory relief for sale {sale.invoice_number}"
        })

    post_ledger_transaction(
        db=db,
        tx_code=f"TX-SALE-{sale.invoice_number}",
        description=f"Sale {sale.invoice_number} - {sale.title}",
        reference_type="Sale",
        reference_id=str(sale.id),
        entries=entries,
        user_id=user_id
    )

def process_return_accounting(db: Session, ret: Return, user_id: Optional[int] = None):
    """
    Executes stock re-entry/relief, revenue/COGS reversal, and ledger entries for returns.
    """
    total_cogs_reversed = Decimal("0.00")
    entries = []

    for item in ret.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if prod:
            # Customer / Retailer return: product comes BACK to inventory
            if ret.return_type in ["Customer Return", "Retailer Return", "RSO Return"]:
                prod.current_stock += item.quantity
                item_cost = prod.avg_cost if prod.avg_cost > Decimal("0.00") else prod.purchase_price
                item.unit_cost = item_cost
                cogs_item = item.quantity * item_cost
                item.cogs_reversed = cogs_item
                total_cogs_reversed += cogs_item

                mov = StockMovement(
                    product_id=prod.id,
                    movement_type=StockMovementType.RETURN_IN.value,
                    quantity=item.quantity,
                    unit_cost=item_cost,
                    unit_price=item.unit_price,
                    balance_after=prod.current_stock,
                    reference=ret.return_number,
                    source=ret.return_type,
                    destination="Franchise Inventory",
                    user_id=user_id,
                    remarks=f"Return {ret.return_number} - {ret.reason or ''}"
                )
                db.add(mov)

            # Supplier / Company return: product leaves inventory to company
            else:
                prod.current_stock -= item.quantity
                mov = StockMovement(
                    product_id=prod.id,
                    movement_type=StockMovementType.RETURN_OUT.value,
                    quantity=-item.quantity,
                    unit_cost=item.unit_cost or prod.avg_cost,
                    unit_price=item.unit_price,
                    balance_after=prod.current_stock,
                    reference=ret.return_number,
                    source="Franchise Inventory",
                    destination="Company/Supplier",
                    user_id=user_id,
                    remarks=f"Return to company {ret.return_number}"
                )
                db.add(mov)

    ret.cogs_reversed = total_cogs_reversed

    # Ledger entries for Customer / Retailer returns:
    # Debit: Sales Revenue (4010) (reversal)
    # Credit: Cash (1010) or Receivable (1030/1040)
    # Debit: Inventory (1050)
    # Credit: COGS (5010)
    if ret.return_type in ["Customer Return", "Retailer Return", "RSO Return"]:
        if ret.total_amount > Decimal("0.00"):
            entries.append({
                "account_code": "4010",
                "entry_type": EntryTypeEnum.DEBIT.value,
                "amount": ret.total_amount,
                "memo": f"Revenue reversal on return {ret.return_number}"
            })
            entries.append({
                "account_code": "1010",
                "entry_type": EntryTypeEnum.CREDIT.value,
                "amount": ret.total_amount,
                "memo": f"Refund paid for return {ret.return_number}"
            })
        if total_cogs_reversed > Decimal("0.00"):
            entries.append({
                "account_code": "1050",
                "entry_type": EntryTypeEnum.DEBIT.value,
                "amount": total_cogs_reversed,
                "memo": f"Inventory restored for return {ret.return_number}"
            })
            entries.append({
                "account_code": "5010",
                "entry_type": EntryTypeEnum.CREDIT.value,
                "amount": total_cogs_reversed,
                "memo": f"COGS reversed on return {ret.return_number}"
            })
    else:
        # Return to company reduces company payable
        entries.append({
            "account_code": "2010",
            "entry_type": EntryTypeEnum.DEBIT.value,
            "amount": ret.total_amount,
            "memo": f"Company payable reduced by return {ret.return_number}"
        })
        entries.append({
            "account_code": "1050",
            "entry_type": EntryTypeEnum.CREDIT.value,
            "amount": ret.total_amount,
            "memo": f"Inventory returned to company {ret.return_number}"
        })

    if entries:
        post_ledger_transaction(
            db=db,
            tx_code=f"TX-RET-{ret.return_number}",
            description=f"Return {ret.return_number} ({ret.return_type})",
            reference_type="Return",
            reference_id=str(ret.id),
            entries=entries,
            user_id=user_id
        )

def calculate_profit_and_loss(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Computes accurate P&L based on actual transaction accounting.
    Revenue - Sales Returns - Discounts = Net Revenue
    Net Revenue - COGS = Gross Profit
    Gross Profit + Commission Income - Operating Expenses - Salaries = NET PROFIT / LOSS
    If negative, net profit is negative (Net Loss).
    """
    sales_q = db.query(Sale)
    returns_q = db.query(Return).filter(Return.return_type.in_(["Customer Return", "Retailer Return", "RSO Return"]))
    expenses_q = db.query(Expense)
    salaries_q = db.query(Salary)

    if start_date:
        sales_q = sales_q.filter(Sale.sale_date >= start_date)
        returns_q = returns_q.filter(Return.return_date >= start_date)
        expenses_q = expenses_q.filter(Expense.paid_date >= start_date)
        salaries_q = salaries_q.filter(Salary.paid_on >= start_date)

    if end_date:
        sales_q = sales_q.filter(Sale.sale_date <= end_date)
        returns_q = returns_q.filter(Return.return_date <= end_date)
        expenses_q = expenses_q.filter(Expense.paid_date <= end_date)
        salaries_q = salaries_q.filter(Salary.paid_on <= end_date)

    sales = sales_q.all()
    returns = returns_q.all()
    expenses = expenses_q.all()
    salaries = salaries_q.all()

    gross_revenue = sum((s.subtotal for s in sales), Decimal("0.00"))
    sales_discounts = sum((s.discount for s in sales), Decimal("0.00"))
    sales_returns_amount = sum((r.total_amount for r in returns), Decimal("0.00"))
    net_revenue = gross_revenue - sales_discounts - sales_returns_amount

    # COGS = Sale COGS minus COGS reversed by customer returns
    sales_cogs = sum((s.cogs for s in sales), Decimal("0.00"))
    returns_cogs_reversed = sum((r.cogs_reversed for r in returns), Decimal("0.00"))
    net_cogs = max(Decimal("0.00"), sales_cogs - returns_cogs_reversed)

    # Commission income
    sales_commission = sum((s.commission for s in sales), Decimal("0.00"))

    gross_profit = net_revenue - net_cogs + sales_commission

    total_expenses = sum((e.amount for e in expenses), Decimal("0.00"))
    total_salaries = sum((s.salary_given for s in salaries), Decimal("0.00"))

    net_profit = gross_profit - total_expenses - total_salaries
    is_loss = net_profit < Decimal("0.00")

    return {
        "gross_revenue": float(gross_revenue),
        "sales_discounts": float(sales_discounts),
        "sales_returns": float(sales_returns_amount),
        "net_revenue": float(net_revenue),
        "cogs": float(net_cogs),
        "commission_income": float(sales_commission),
        "gross_profit": float(gross_profit),
        "expenses": float(total_expenses),
        "salaries": float(total_salaries),
        "net_profit": float(net_profit),
        "is_loss": is_loss,
        "loss_amount": float(abs(net_profit)) if is_loss else 0.0
    }
