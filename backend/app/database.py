import psycopg2
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings


def get_engine():
    """Create SQLAlchemy engine from psycopg2 connection URI."""
    uri = settings.DATABASE_URI

    # Support both postgres:// and postgresql:// schemes
    if uri.startswith("postgres://"):
        uri = uri.replace("postgres://", "postgresql://", 1)

    # Ensure sslmode is set if not present
    if "sslmode" not in uri:
        separator = "&" if "?" in uri else "?"
        uri = f"{uri}{separator}sslmode=require"

    return create_engine(uri, pool_pre_ping=True)


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)


def test_connection():
    """Test the database connection using psycopg2 directly."""
    conn = psycopg2.connect(settings.DATABASE_URI)
    cur = conn.cursor()
    cur.execute("SELECT VERSION()")
    version = cur.fetchone()[0]
    cur.close()
    conn.close()
    return version
