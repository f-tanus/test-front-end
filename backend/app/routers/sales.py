from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import date
from app.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.customer import Customer
from app.models.product import Product
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleUpdate, SaleResponse, SaleListItem, SaleItemResponse
from app.auth import require_auth
from app.security import sanitize_string

router = APIRouter(prefix="/api/sales", tags=["Sales"], dependencies=[Depends(require_auth)])


@router.get("/", response_model=List[SaleListItem])
def list_sales(
    search: str = Query("", max_length=100),
    status: str = Query("", max_length=30),
    start_date: date = Query(None),
    end_date: date = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Sale).options(joinedload(Sale.customer))

    if search:
        query = query.join(Sale.customer).filter(Customer.name.ilike(f"%{search}%"))
    if status:
        query = query.filter(Sale.payment_status == status)
    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    sales = query.order_by(Sale.sale_date.desc()).all()

    result = []
    for s in sales:
        result.append(SaleListItem(
            id=s.id,
            customer_name=s.customer.name if s.customer else "Walk-in Customer",
            sale_date=s.sale_date,
            total_amount=float(s.total_amount),
            payment_status=s.payment_status,
            payment_method=s.payment_method,
        ))
    return result


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).options(
        joinedload(Sale.customer),
        joinedload(Sale.items).joinedload(SaleItem.product),
    ).filter(Sale.id == sale_id).first()

    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    items = []
    for item in sale.items:
        items.append(SaleItemResponse(
            id=item.id,
            sale_id=item.sale_id,
            product_id=item.product_id,
            quantity=float(item.quantity),
            unit_price=float(item.unit_price),
            subtotal=float(item.subtotal),
            product_name=item.product.name if item.product else "Deleted Product",
        ))

    return SaleResponse(
        id=sale.id,
        customer_id=sale.customer_id,
        customer_name=sale.customer.name if sale.customer else "Walk-in Customer",
        sale_date=sale.sale_date,
        total_amount=float(sale.total_amount),
        payment_status=sale.payment_status,
        payment_method=sale.payment_method,
        notes=sale.notes,
        created_at=sale.created_at,
        updated_at=sale.updated_at,
        items=items,
    )


@router.post("/", response_model=SaleResponse, status_code=201)
def create_sale(data: SaleCreate, db: Session = Depends(get_db)):
    # Verify customer exists if provided
    if data.customer_id:
        customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    sale = Sale(
        customer_id=data.customer_id,
        sale_date=data.sale_date,
        payment_status=data.payment_status,
        payment_method=data.payment_method,
        notes=data.notes,
    )
    db.add(sale)
    db.flush()

    total = 0
    for item_data in data.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data.product_id} not found")

        unit_price = item_data.unit_price if item_data.unit_price > 0 else float(product.sale_price)
        subtotal = round(float(item_data.quantity) * unit_price, 2)
        total += subtotal

        item = SaleItem(
            sale_id=sale.id,
            product_id=item_data.product_id,
            quantity=item_data.quantity,
            unit_price=unit_price,
            subtotal=subtotal,
        )
        db.add(item)

    sale.total_amount = round(total, 2)
    db.commit()
    db.refresh(sale)
    return get_sale(sale.id, db)


@router.put("/{sale_id}", response_model=SaleResponse)
def update_sale(sale_id: int, data: SaleUpdate, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(sale, key, value)

    db.commit()
    db.refresh(sale)
    return get_sale(sale.id, db)


@router.delete("/{sale_id}")
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    db.delete(sale)
    db.commit()
    return {"message": "Sale deleted successfully"}