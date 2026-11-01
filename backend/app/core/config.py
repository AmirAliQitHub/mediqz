import os
import hashlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Auto-load .env if present without hardcoding secrets in public code
env_file = BASE_DIR / ".env"
if env_file.exists():
    try:
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    except Exception:
        pass

ASSETS_DIR = BASE_DIR / "assets"
COURSES_DIR = ASSETS_DIR / "courses"

DATA_DIR = Path(os.getenv("DATA_DIR", str(ASSETS_DIR)))
DB_USER_PATH = DATA_DIR / "userdata.db"
DB_EXAMS_PATH = DATA_DIR / "exams.db"

SECRET_KEY = os.getenv("SECRET_KEY", "alqualite_coursebox_secret_jwt_2026")
ACCESS_TOKEN_EXPIRE_DAYS = 30

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_BOT_USERNAME = os.getenv("TELEGRAM_BOT_USERNAME", "MediqzBot")
TELEGRAM_BOT_NAME = os.getenv("TELEGRAM_BOT_NAME", "Mediaz")
WEB_APP_URL = (os.getenv("WEB_APP_URL") or os.getenv("RENDER_EXTERNAL_URL") or "").strip().rstrip("/")
TELEGRAM_SECRET_TOKEN = os.getenv("TELEGRAM_SECRET_TOKEN", hashlib.sha256(TELEGRAM_BOT_TOKEN.encode()).hexdigest()[:32])

raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000"
)
ALLOWED_ORIGINS = [orig.strip() for orig in raw_origins.split(",") if orig.strip()]
