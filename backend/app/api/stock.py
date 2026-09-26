from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.models import Product, StockMovement, AuditLog
from app.schemas.schemas import StockMovementOut, StockAdjustmentCreate

router = APIRouter(prefix="/stock", tags=["Stock Management"])

@router.get("/summary")
def get_stock_summary(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    total_products = len(products)
    total_units = sum((p.current_stock for p in products), Decimal("0.00"))
    low_stock = sum(1 for p in products if 0 < p.current_stock <= p.alert_quantity)
    out_of_stock = sum(1 for p in products if p.current_stock <= Decimal("0.00"))
    stock_valuation = sum((p.current_stock * (p.avg_cost or p.purchase_price) for p in products), Decimal("0.00"))

    return {
        "products": total_products,
        "total_units": float(total_units),
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "stock_valuation": float(stock_valuation)
    }

@router.get("/items")
def get_stock_items(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,  # All, In stock, Low stock, Out of stock
    db: Session = Depends(get_db)
):
    q = db.query(Product)
    if search:
        s = f"%{search}%"
        q = q.filter((Product.name.ilike(s)) | (Product.sku.ilike(s)))
    
    products = q.order_by(Product.name.asc()).all()
    results = []
    for p in products:
        if p.current_stock <= 0:
            stat = "Out of stock"
        elif p.current_stock <= p.alert_quantity:
            stat = "Low stock"
        else:
            stat = "In stock"

        if status_filter and status_filter != "All" and stat != status_filter:
            continue

        results.append({
            "id": p.id,
            "product_name": p.name,
            "sku": p.sku,
            "category": p.category.name if p.category else "Uncategorized",
            "stock": float(p.current_stock),
            "alert_at": float(p.alert_quantity),
            "avg_cost": float(p.avg_cost),
            "valuation": float(p.current_stock * (p.avg_cost or p.purchase_price)),
            "status": stat
        })
    return results

@router.get("/movements")
def get_stock_movements(
    product_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db)
):
    q = db.query(StockMovement).join(Product)
    if product_id:
        q = q.filter(StockMovement.product_id == product_id)
    if movement_type and movement_type != "All":
        q = q.filter(StockMovement.movement_type == movement_type)
    if date_from:
        q = q.filter(func.date(StockMovement.date) >= date_from)
    if date_to:
        q = q.filter(func.date(StockMovement.date) <= date_to)

    movements = q.order_by(StockMovement.date.desc()).limit(200).all()
    return [
        {
            "id": m.id,
            "date": m.date,
            "product_name": m.product.name if m.product else "N/A",
            "sku": m.product.sku if m.product else "",
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

@router.post("/adjustments")
def create_stock_adjustment(adj: StockAdjustmentCreate, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == adj.product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    new_stock = prod.current_stock + adj.quantity
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Stock adjustment would result in negative stock balance")

    prod.current_stock = new_stock

    mov = StockMovement(
        product_id=prod.id,
        movement_type=adj.adjustment_type,
        quantity=adj.quantity,
        unit_cost=prod.avg_cost or prod.purchase_price,
        unit_price=prod.selling_price,
        balance_after=new_stock,
        reference=f"ADJ-{datetime.utcnow().strftime('%Y%m%d%H%M')}",
        source="Franchise Inventory",
        destination=adj.adjustment_type,
        remarks=adj.remarks
    )
    db.add(mov)

    log = AuditLog(
        action="Adjustment",
        entity="Stock",
        entity_id=str(prod.id),
        old_value=f"Stock was {prod.current_stock - adj.quantity}",
        new_value=f"Adjusted by {adj.quantity} to {new_stock} ({adj.remarks})"
    )
    db.add(log)
    db.commit()

    return {"message": "Stock adjusted successfully", "new_stock": float(new_stock)}
