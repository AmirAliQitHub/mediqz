import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ASSETS_DIR = BASE_DIR / "assets"
COURSES_DIR = ASSETS_DIR / "courses"
DB_USER_PATH = ASSETS_DIR / "userdata.db"

SECRET_KEY = os.getenv("SECRET_KEY", "alqualite_coursebox_secret_jwt_2026")
ACCESS_TOKEN_EXPIRE_DAYS = 30

raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000"
)
ALLOWED_ORIGINS = [orig.strip() for orig in raw_origins.split(",") if orig.strip()]
