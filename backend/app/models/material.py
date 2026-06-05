from sqlalchemy import Column, Integer, String, DateTime, Numeric, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    unit = Column(String(50), nullable=False)  # kg, liters, units, meters, etc.
    cost_per_unit = Column(Numeric(10, 2), nullable=False, default=0)
    supplier = Column(String(200))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    product_materials = relationship("ProductMaterial", back_populates="material")