from sqlalchemy import Column, Integer, String, DateTime, Numeric, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    sale_date = Column(Date, nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)
    payment_status = Column(String(30), default="pending")  # pending, paid, partially_paid, cancelled
    payment_method = Column(String(50), default="cash")  # cash, credit_card, debit_card, pix, transfer, other
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))

    customer = relationship("Customer", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Numeric(10, 2), nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False, default=0)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")