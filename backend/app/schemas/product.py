from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List


class ProductMaterialBase(BaseModel):
    material_id: int
    quantity: float = 1


class ProductMaterialCreate(ProductMaterialBase):
    pass


class ProductMaterialResponse(ProductMaterialBase):
    id: int
    product_id: int
    material_name: Optional[str] = None
    material_unit: Optional[str] = None
    material_cost: Optional[float] = None
    material_cost_total: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    sale_price: float = 0
    labor_cost: Optional[float] = 0
    markup_percentage: Optional[float] = 30.00
    notes: Optional[str] = None


class ProductCreate(ProductBase):
    materials: List[ProductMaterialCreate] = []


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    sale_price: Optional[float] = None
    labor_cost: Optional[float] = None
    markup_percentage: Optional[float] = None
    notes: Optional[str] = None
    is_active: Optional[int] = None
    materials: Optional[List[ProductMaterialCreate]] = None


class ProductResponse(ProductBase):
    id: int
    is_active: int
    profit_margin: Optional[float] = None
    materials_cost: Optional[float] = None
    created_at: datetime
    updated_at: datetime
    materials: List[ProductMaterialResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ProductListItem(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    sale_price: float
    materials_cost: Optional[float] = None
    profit_margin: Optional[float] = None
    is_active: int

    model_config = ConfigDict(from_attributes=True)