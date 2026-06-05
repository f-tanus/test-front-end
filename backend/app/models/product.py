from sqlalchemy import Column, Integer, String, DateTime, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    sale_price = Column(Numeric(10, 2), nullable=False, default=0)
    labor_cost = Column(Numeric(10, 2), default=0)
    markup_percentage = Column(Numeric(5, 2), default=30.00)  # default 30% markup
    profit_margin = Column(Numeric(10, 2), default=0)
    is_active = Column(Integer, default=1)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    product_materials = relationship("ProductMaterial", back_populates="product", cascade="all, delete-orphan")
    sale_items = relationship("SaleItem", back_populates="product")


class ProductMaterial(Base):
    __tablename__ = "product_materials"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Numeric(10, 4), nullable=False, default=1)

    product = relationship("Product", back_populates="product_materials")
    material = relationship("Material", back_populates="product_materials")