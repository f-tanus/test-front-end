"""
Run the RuralSys application.
Usage: python run.py
Make sure PostgreSQL is running and .env has the correct DATABASE_URL.
"""
import sys
import os

# Add backend dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn

if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════╗
    ║     RuralSys - Sistema de Gestão Rural   ║
    ║                                          ║
    ║   Ensure PostgreSQL is running and       ║
    ║   DATABASE_URL is set in backend/.env    ║
    ╚══════════════════════════════════════════╝
    """)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)