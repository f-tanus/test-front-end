from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class MaterialBase(BaseModel):
    name: str
    unit: str
    cost_per_unit: float = 0
    supplier: Optional[str] = None
    notes: Optional[str] = None


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    cost_per_unit: Optional[float] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None


class MaterialResponse(MaterialBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)