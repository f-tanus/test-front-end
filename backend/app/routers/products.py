from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.product import Product, ProductMaterial
from app.models.material import Material
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListItem, ProductMaterialResponse
from app.auth import require_auth

router = APIRouter(prefix="/api/products", tags=["Products"], dependencies=[Depends(require_auth)])


def calculate_product_costs(product: Product, db: Session) -> tuple:
    """Calculate materials cost and profit margin for a product."""
    materials_cost = 0
    for pm in product.product_materials:
        material = db.query(Material).filter(Material.id == pm.material_id).first()
        if material:
            materials_cost += float(pm.quantity) * float(material.cost_per_unit)

    total_cost = materials_cost + float(product.labor_cost or 0)
    sale_price = float(product.sale_price)

    if total_cost > 0 and sale_price > 0:
        profit_margin = ((sale_price - total_cost) / sale_price) * 100
    else:
        profit_margin = 0

    return round(materials_cost, 2), round(profit_margin, 2)


@router.get("/", response_model=List[ProductListItem])
def list_products(
    search: str = Query("", max_length=100),
    category: str = Query("", max_length=100),
    db: Session = Depends(get_db),
):
    query = db.query(Product).options(joinedload(Product.product_materials).joinedload(ProductMaterial.material))
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    if category:
        query = query.filter(Product.category == category)
    products = query.order_by(Product.name).all()

    result = []
    for p in products:
        materials_cost, profit_margin = calculate_product_costs(p, db)
        result.append(ProductListItem(
            id=p.id,
            name=p.name,
            category=p.category,
            sale_price=float(p.sale_price),
            materials_cost=materials_cost,
            profit_margin=profit_margin,
            is_active=p.is_active,
        ))
    return result


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(Product.category).distinct().filter(Product.category.isnot(None)).all()
    return [c[0] for c in categories]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).options(
        joinedload(Product.product_materials).joinedload(ProductMaterial.material)
    ).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    materials_cost, profit_margin = calculate_product_costs(product, db)

    # Build material responses
    materials = []
    for pm in product.product_materials:
        material = pm.material
        material_cost_total = float(pm.quantity) * float(material.cost_per_unit) if material else 0
        materials.append(ProductMaterialResponse(
            id=pm.id,
            product_id=pm.product_id,
            material_id=pm.material_id,
            quantity=float(pm.quantity),
            material_name=material.name if material else None,
            material_unit=material.unit if material else None,
            material_cost=float(material.cost_per_unit) if material else None,
            material_cost_total=round(material_cost_total, 2),
        ))

    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        category=product.category,
        sale_price=float(product.sale_price),
        labor_cost=float(product.labor_cost or 0),
        markup_percentage=float(product.markup_percentage or 30),
        profit_margin=profit_margin,
        materials_cost=materials_cost,
        notes=product.notes,
        is_active=product.is_active,
        created_at=product.created_at,
        updated_at=product.updated_at,
        materials=materials,
    )


@router.post("/", response_model=ProductResponse, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    product = Product(
        name=data.name,
        description=data.description,
        category=data.category,
        sale_price=data.sale_price,
        labor_cost=data.labor_cost or 0,
        markup_percentage=data.markup_percentage or 30,
        notes=data.notes,
    )
    db.add(product)
    db.flush()

    for mat in data.materials:
        pm = ProductMaterial(product_id=product.id, material_id=mat.material_id, quantity=mat.quantity)
        db.add(pm)

    db.commit()
    db.refresh(product)
    return get_product(product.id, db)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True, exclude={"materials"})
    for key, value in update_data.items():
        setattr(product, key, value)

    # Update materials if provided
    if data.materials is not None:
        db.query(ProductMaterial).filter(ProductMaterial.product_id == product_id).delete()
        for mat in data.materials:
            pm = ProductMaterial(product_id=product_id, material_id=mat.material_id, quantity=mat.quantity)
            db.add(pm)

    db.commit()
    db.refresh(product)
    return get_product(product.id, db)


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}