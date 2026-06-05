from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List


class FinanceSummary(BaseModel):
    total_revenue: float = 0
    total_paid: float = 0
    total_pending: float = 0
    total_cancelled: float = 0
    total_customers: int = 0
    total_products: int = 0
    total_sales: int = 0
    average_ticket: float = 0


class RevenueByPeriod(BaseModel):
    period: str
    total: float
    count: int


class PaymentMethodSummary(BaseModel):
    payment_method: str
    total: float
    count: int


class CustomerReport(BaseModel):
    customer_id: int
    customer_name: str
    total_sales: int
    total_spent: float
    last_purchase: Optional[date] = None


class ProductPerformance(BaseModel):
    product_id: int
    product_name: str
    total_sold: float
    total_revenue: float
    profit_margin: Optional[float] = None


class DateRangeFilter(BaseModel):
    start_date: date
    end_date: date