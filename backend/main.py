import sys
from pathlib import Path

# Ensure backend directory is in sys.path so 'app' can always be imported
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.core.database import init_databases
from app.core.exams_db import init_exams_db

# Initialize database schemas safely on cold start
try:
    init_databases()
    init_exams_db()
except Exception:
    pass

__all__ = ["app"]
