from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from typing import List
from datetime import date, datetime
from app.database import get_db
from app.models.sale import Sale, SaleItem
from app.models.customer import Customer
from app.models.product import Product
from app.models.user import User
from app.schemas.finance import (
    FinanceSummary, RevenueByPeriod, PaymentMethodSummary,
    CustomerReport, ProductPerformance,
)
from app.auth import require_auth

router = APIRouter(prefix="/api/finance", tags=["Finance"], dependencies=[Depends(require_auth)])


@router.get("/summary", response_model=FinanceSummary)
def get_finance_summary(
    start_date: date = Query(None),
    end_date: date = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Sale)
    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    sales = query.all()

    total_revenue = sum(float(s.total_amount) for s in sales if s.payment_status != "cancelled")
    total_paid = sum(float(s.total_amount) for s in sales if s.payment_status == "paid")
    total_pending = sum(float(s.total_amount) for s in sales if s.payment_status == "pending")
    total_cancelled = sum(float(s.total_amount) for s in sales if s.payment_status == "cancelled")
    total_sales = len(sales)

    total_customers = db.query(Customer).count()
    total_products = db.query(Product).count()
    avg_ticket = round(total_revenue / total_sales, 2) if total_sales > 0 else 0

    return FinanceSummary(
        total_revenue=round(total_revenue, 2),
        total_paid=round(total_paid, 2),
        total_pending=round(total_pending, 2),
        total_cancelled=round(total_cancelled, 2),
        total_customers=total_customers,
        total_products=total_products,
        total_sales=total_sales,
        average_ticket=avg_ticket,
    )


@router.get("/revenue-by-period", response_model=List[RevenueByPeriod])
def revenue_by_period(
    period: str = Query("month", regex="^(day|week|month|year)$"),
    start_date: date = Query(None),
    end_date: date = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(
        func.date_trunc(period, Sale.sale_date).label("period"),
        func.sum(Sale.total_amount).label("total"),
        func.count(Sale.id).label("count"),
    ).filter(Sale.payment_status != "cancelled")

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    results = query.group_by("period").order_by("period").all()

    return [
        RevenueByPeriod(
            period=str(r.period),
            total=round(float(r.total), 2),
            count=r.count,
        )
        for r in results
    ]


@router.get("/payment-methods", response_model=List[PaymentMethodSummary])
def payment_methods_summary(
    start_date: date = Query(None),
    end_date: date = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(
        Sale.payment_method,
        func.sum(Sale.total_amount).label("total"),
        func.count(Sale.id).label("count"),
    ).filter(Sale.payment_status != "cancelled")

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    results = query.group_by(Sale.payment_method).all()

    return [
        PaymentMethodSummary(
            payment_method=r.payment_method,
            total=round(float(r.total), 2),
            count=r.count,
        )
        for r in results
    ]


@router.get("/customer-report", response_model=List[CustomerReport])
def customer_report(
    min_purchases: int = Query(0),
    db: Session = Depends(get_db),
):
    subquery = db.query(
        Sale.customer_id,
        func.count(Sale.id).label("total_sales"),
        func.sum(Sale.total_amount).label("total_spent"),
        func.max(Sale.sale_date).label("last_purchase"),
    ).filter(Sale.customer_id.isnot(None)).group_by(Sale.customer_id).subquery()

    results = db.query(
        Customer.id,
        Customer.name,
        subquery.c.total_sales,
        subquery.c.total_spent,
        subquery.c.last_purchase,
    ).join(subquery, Customer.id == subquery.c.customer_id).filter(
        subquery.c.total_sales >= min_purchases
    ).order_by(subquery.c.total_spent.desc()).all()

    return [
        CustomerReport(
            customer_id=r.id,
            customer_name=r.name,
            total_sales=r.total_sales,
            total_spent=round(float(r.total_spent), 2),
            last_purchase=r.last_purchase,
        )
        for r in results
    ]


@router.get("/product-performance", response_model=List[ProductPerformance])
def product_performance(
    start_date: date = Query(None),
    end_date: date = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(
        Product.id,
        Product.name,
        func.sum(SaleItem.quantity).label("total_sold"),
        func.sum(SaleItem.subtotal).label("total_revenue"),
    ).join(SaleItem, Product.id == SaleItem.product_id
    ).join(Sale, SaleItem.sale_id == Sale.id
    ).filter(Sale.payment_status != "cancelled")

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    results = query.group_by(Product.id, Product.name).order_by(
        func.sum(SaleItem.subtotal).desc()
    ).all()

    items = []
    for r in results:
        product = db.query(Product).filter(Product.id == r.id).first()
        items.append(ProductPerformance(
            product_id=r.id,
            product_name=r.name,
            total_sold=round(float(r.total_sold), 2),
            total_revenue=round(float(r.total_revenue), 2),
            profit_margin=float(product.profit_margin) if product and product.profit_margin else None,
        ))
    return items