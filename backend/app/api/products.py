from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import Product, Category, StockMovement, PurchaseItem, SaleItem, ReturnItem, AuditLog
from app.schemas.schemas import (
    ProductCreate, ProductUpdate, ProductOut, CategoryCreate, CategoryOut,
    StockMovementOut
)

router = APIRouter(prefix="/products", tags=["Products"])

# --- CATEGORIES ---
@router.get("/categories", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

@router.post("/categories", response_model=CategoryOut)
def create_category(cat: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(Category).filter(Category.name == cat.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category name already exists")
    db_cat = Category(name=cat.name, description=cat.description)
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

# --- PRODUCTS ---
@router.get("", response_model=List[ProductOut])
def list_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    low_stock: Optional[bool] = False,
    db: Session = Depends(get_db)
):
    q = db.query(Product)
    if search:
        s = f"%{search}%"
        q = q.filter((Product.name.ilike(s)) | (Product.sku.ilike(s)) | (Product.barcode.ilike(s)))
    if category_id:
        q = q.filter(Product.category_id == category_id)
    if status_filter and status_filter != "All":
        q = q.filter(Product.status == status_filter)
    if low_stock:
        q = q.filter(Product.current_stock <= Product.alert_quantity)
    
    products = q.order_by(Product.id.asc()).all()
    # Populate category_name
    res = []
    for p in products:
        p_dict = {c.name: getattr(p, c.name) for c in p.__table__.columns}
        p_dict["category_name"] = p.category.name if p.category else None
        res.append(ProductOut(**p_dict))
    return res

@router.post("", response_model=ProductOut)
def create_product(prod: ProductCreate, db: Session = Depends(get_db)):
    existing_sku = db.query(Product).filter(Product.sku == prod.sku).first()
    if existing_sku:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{prod.sku}' already exists")
    
    db_prod = Product(
        name=prod.name,
        sku=prod.sku,
        barcode=prod.barcode,
        category_id=prod.category_id,
        brand=prod.brand,
        unit=prod.unit,
        purchase_price=prod.purchase_price,
        selling_price=prod.selling_price,
        retailer_price=prod.retailer_price,
        rso_price=prod.rso_price,
        company_price=prod.company_price,
        alert_quantity=prod.alert_quantity,
        current_stock=prod.current_stock,
        avg_cost=prod.purchase_price,
        commission=prod.commission,
        discount=prod.discount,
        tax_percent=prod.tax_percent,
        status=prod.status,
        description=prod.description
    )
    db.add(db_prod)
    db.flush()

    # If opening stock > 0, record movement
    if prod.current_stock > 0:
        mov = StockMovement(
            product_id=db_prod.id,
            movement_type="Adjustment",
            quantity=prod.current_stock,
            unit_cost=prod.purchase_price,
            unit_price=prod.selling_price,
            balance_after=prod.current_stock,
            reference="Initial Stock",
            source="Manual Entry",
            destination="Franchise Inventory",
            remarks="Initial Opening Stock"
        )
        db.add(mov)

    # Log audit
    log = AuditLog(
        action="Create",
        entity="Product",
        entity_id=str(db_prod.id),
        new_value=f"Created product {db_prod.name} (SKU: {db_prod.sku})"
    )
    db.add(log)

    db.commit()
    db.refresh(db_prod)
    p_dict = {c.name: getattr(db_prod, c.name) for c in db_prod.__table__.columns}
    p_dict["category_name"] = db_prod.category.name if db_prod.category else None
    return ProductOut(**p_dict)

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    p_dict = {c.name: getattr(prod, c.name) for c in prod.__table__.columns}
    p_dict["category_name"] = prod.category.name if prod.category else None
    return ProductOut(**p_dict)

@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, prod_in: ProductUpdate, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    old_data = f"Name: {prod.name}, Price: {prod.selling_price}, Status: {prod.status}"
    
    update_data = prod_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(prod, field, value)

    log = AuditLog(
        action="Update",
        entity="Product",
        entity_id=str(prod.id),
        old_value=old_data,
        new_value=f"Updated product {prod.name}"
    )
    db.add(log)
    db.commit()
    db.refresh(prod)
    p_dict = {c.name: getattr(prod, c.name) for c in prod.__table__.columns}
    p_dict["category_name"] = prod.category.name if prod.category else None
    return ProductOut(**p_dict)

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if used in transactions
    has_sales = db.query(SaleItem).filter(SaleItem.product_id == product_id).first()
    has_purchases = db.query(PurchaseItem).filter(PurchaseItem.product_id == product_id).first()
    if has_sales or has_purchases:
        prod.status = "Inactive"
        db.commit()
        return {"message": "Product has transaction history; marked as Inactive instead of deleting."}
    
    db.delete(prod)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.get("/{product_id}/analysis")
def get_product_detail_analysis(product_id: int, db: Session = Depends(get_db)):
    """
    Returns complete breakdown:
    Current stock, Total purchased, Total sold, Total returned,
    Total revenue, Total cost, Total profit, Total commission, Total discount.
    """
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    # Purchase stats
    purchases = db.query(PurchaseItem).filter(PurchaseItem.product_id == product_id).all()
    total_purchased_qty = sum((p.quantity for p in purchases), Decimal("0.00"))
    total_purchased_cost = sum((p.total_amount for p in purchases), Decimal("0.00"))

    # Sales stats
    sales = db.query(SaleItem).filter(SaleItem.product_id == product_id).all()
    total_sold_qty = sum((s.quantity for s in sales), Decimal("0.00"))
    total_revenue = sum((s.total_amount for s in sales), Decimal("0.00"))
    total_cogs = sum((s.cogs for s in sales), Decimal("0.00"))
    total_discount = sum((s.discount for s in sales), Decimal("0.00"))
    total_commission = sum((s.commission for s in sales), Decimal("0.00"))

    # Return stats
    returns = db.query(ReturnItem).filter(ReturnItem.product_id == product_id).all()
    total_returned_qty = sum((r.quantity for r in returns), Decimal("0.00"))

    total_profit = total_revenue - total_cogs + total_commission

    return {
        "product_id": prod.id,
        "name": prod.name,
        "sku": prod.sku,
        "category": prod.category.name if prod.category else "Uncategorized",
        "current_stock": float(prod.current_stock),
        "avg_cost": float(prod.avg_cost),
        "selling_price": float(prod.selling_price),
        "total_purchased_qty": float(total_purchased_qty),
        "total_purchased_cost": float(total_purchased_cost),
        "total_sold_qty": float(total_sold_qty),
        "total_returned_qty": float(total_returned_qty),
        "total_revenue": float(total_revenue),
        "total_cost": float(total_cogs),
        "total_profit": float(total_profit),
        "total_commission": float(total_commission),
        "total_discount": float(total_discount)
    }

@router.get("/{product_id}/stock-history")
def get_product_stock_history(product_id: int, db: Session = Depends(get_db)):
    movements = (
        db.query(StockMovement)
        .filter(StockMovement.product_id == product_id)
        .order_by(StockMovement.date.desc())
        .limit(100)
        .all()
    )
    return [
        {
            "id": m.id,
            "date": m.date,
            "movement_type": m.movement_type,
            "quantity": float(m.quantity),
            "unit_cost": float(m.unit_cost),
            "unit_price": float(m.unit_price),
            "balance_after": float(m.balance_after),
            "reference": m.reference,
            "source": m.source,
            "destination": m.destination,
            "remarks": m.remarks
        }
        for m in movements
    ]
