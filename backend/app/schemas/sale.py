from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional, List


class SaleItemBase(BaseModel):
    product_id: int
    quantity: float = 1
    unit_price: float = 0


class SaleItemCreate(SaleItemBase):
    pass


class SaleItemResponse(SaleItemBase):
    id: int
    sale_id: int
    subtotal: float
    product_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SaleBase(BaseModel):
    customer_id: Optional[int] = None
    sale_date: date
    payment_status: str = "pending"
    payment_method: str = "cash"
    notes: Optional[str] = None


class SaleCreate(SaleBase):
    items: List[SaleItemCreate] = []


class SaleUpdate(BaseModel):
    customer_id: Optional[int] = None
    sale_date: Optional[date] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class SaleResponse(SaleBase):
    id: int
    total_amount: float
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None
    items: List[SaleItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class SaleListItem(BaseModel):
    id: int
    customer_name: Optional[str] = None
    sale_date: date
    total_amount: float
    payment_status: str
    payment_method: str

    model_config = ConfigDict(from_attributes=True)