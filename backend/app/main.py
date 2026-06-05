from fastapi import FastAPI, Request, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os

from app.database import init_db, get_db, SessionLocal
from app.routers import materials, customers, products, sales, finance, auth_router
from app.auth import require_auth, get_user_from_token, hash_password
from app.models.user import User

app = FastAPI(title="Sistema Rural - Gestão de Produtos Rurais", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files and templates
templates_dir = os.path.join(os.path.dirname(__file__), "..", "templates")
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")

app.mount("/static", StaticFiles(directory=static_dir), name="static")
templates = Jinja2Templates(directory=templates_dir)

# Include auth router (no auth guard needed for login/logout)
app.include_router(auth_router.router)

# API routers (auth guard applied via router-level dependencies)
app.include_router(materials.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(sales.router)
app.include_router(finance.router)


def require_page_auth(request: Request, db: Session = Depends(get_db)):
    """Check auth for page routes. Redirects to /login if not authenticated."""
    user = get_user_from_token(request, db)
    if user is None:
        return None  # Signal redirect
    return user


# Auth-guarded page routes
@app.get("/", response_class=HTMLResponse)
async def home(request: Request, db: Session = Depends(get_db)):
    user = get_user_from_token(request, db)
    if user is None:
        return RedirectResponse(url="/login", status_code=303)
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/inventory", response_class=HTMLResponse)
async def inventory_page(request: Request, db: Session = Depends(get_db)):
    user = get_user_from_token(request, db)
    if user is None:
        return RedirectResponse(url="/login", status_code=303)
    return templates.TemplateResponse("inventory.html", {"request": request})


@app.get("/materials", response_class=HTMLResponse)
async def materials_page(request: Request, db: Session = Depends(get_db)):
    user = get_user_from_token(request, db)
    if user is None:
        return RedirectResponse(url="/login", status_code=303)
    return templates.TemplateResponse("materials.html", {"request": request})


@app.get("/sales", response_class=HTMLResponse)
async def sales_page(request: Request, db: Session = Depends(get_db)):
    user = get_user_from_token(request, db)
    if user is None:
        return RedirectResponse(url="/login", status_code=303)
    return templates.TemplateResponse("sales.html", {"request": request})


@app.get("/customers", response_class=HTMLResponse)
async def customers_page(request: Request, db: Session = Depends(get_db)):
    user = get_user_from_token(request, db)
    if user is None:
        return RedirectResponse(url="/login", status_code=303)
    return templates.TemplateResponse("customers.html", {"request": request})


@app.get("/finance", response_class=HTMLResponse)
async def finance_page(request: Request, db: Session = Depends(get_db)):
    user = get_user_from_token(request, db)
    if user is None:
        return RedirectResponse(url="/login", status_code=303)
    return templates.TemplateResponse("finance.html", {"request": request})


def seed_default_user():
    """Create default admin user if it doesn't exist."""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "Michele").first()
        if not existing:
            user = User(
                username="Michele",
                hashed_password=hash_password("080870"),
                is_active=True,
            )
            db.add(user)
            db.commit()
            print("Default user 'Michele' created successfully")
    except Exception as e:
        print(f"Error creating default user: {e}")
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    init_db()
    seed_default_user()