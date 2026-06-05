"""
Security module for injection prevention:
- HTML escaping to prevent XSS
- SQL injection prevention (already handled by SQLAlchemy ORM)
- Input sanitization helpers
"""
import html
import re
from typing import Any, Optional


def escape_html(value: Any) -> str:
    """Escape HTML characters to prevent XSS attacks."""
    if value is None:
        return ""
    return html.escape(str(value), quote=True)


def sanitize_string(value: Optional[str]) -> Optional[str]:
    """Sanitize a string input, stripping dangerous characters."""
    if value is None:
        return None
    # Strip leading/trailing whitespace
    value = value.strip()
    # Remove null bytes
    value = value.replace("\x00", "")
    # Escape HTML
    value = html.escape(value, quote=True)
    return value


def sanitize_search_term(value: str) -> str:
    """Sanitize search terms, allowing only safe characters."""
    # Remove any SQL-like injection patterns
    value = re.sub(r"[;'\"]", "", value)
    # Limit length
    value = value[:100]
    return value.strip()


def format_currency(value: Any) -> str:
    """Format a numeric value as Brazilian currency string."""
    if value is None:
        return "R$ 0,00"
    try:
        v = float(value)
        return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except (ValueError, TypeError):
        return "R$ 0,00"


def format_date(value: Any) -> str:
    """Format a date value safely."""
    if value is None:
        return "-"
    return str(value)


def validate_integer(value: Any, min_val: int = 0, max_val: int = 10**9) -> Optional[int]:
    """Validate and return an integer within range."""
    try:
        v = int(value)
        if min_val <= v <= max_val:
            return v
        return None
    except (ValueError, TypeError):
        return None


def validate_numeric(value: Any, min_val: float = 0, max_val: float = 10**9) -> Optional[float]:
    """Validate and return a float within range."""
    try:
        v = float(value)
        if min_val <= v <= max_val:
            return round(v, 4)
        return None
    except (ValueError, TypeError):
        return None