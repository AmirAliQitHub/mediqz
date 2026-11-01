import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from aiogram import Bot
from aiogram.types import MenuButtonWebApp, WebAppInfo

from app.core.config import ALLOWED_ORIGINS, TELEGRAM_BOT_TOKEN, WEB_APP_URL, TELEGRAM_SECRET_TOKEN
from app.core.database import init_databases
from app.core.exams_db import init_exams_db
from app.api.auth import router as auth_router
from app.api.courses import router as courses_router
from app.api.reviews import router as reviews_router
from app.api.admin import router as admin_router
from app.api.exams import router as exams_router
from app.api.telegram_webhook import router as telegram_router

logger = logging.getLogger("MediazApp")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_databases()
    init_exams_db()

    # Initialize Telegram Bot instance
    bot = None
    if TELEGRAM_BOT_TOKEN:
        try:
            bot = Bot(token=TELEGRAM_BOT_TOKEN)
            app.state.bot = bot
            logger.info("Telegram Bot client initialized.")

            # Automatic Webhook and Menu Button Configuration
            if WEB_APP_URL:
                webhook_url = f"{WEB_APP_URL}/api/telegram/webhook"
                logger.info(f"Configuring Telegram webhook -> {webhook_url}")
                await bot.set_webhook(
                    url=webhook_url,
                    secret_token=TELEGRAM_SECRET_TOKEN if TELEGRAM_SECRET_TOKEN else None,
                    drop_pending_updates=True
                )
                logger.info(f"Configuring Telegram Menu Button -> {WEB_APP_URL}")
                await bot.set_chat_menu_button(
                    menu_button=MenuButtonWebApp(
                        text="ورود به مدیاز 🚀",
                        web_app=WebAppInfo(url=WEB_APP_URL)
                    )
                )
            else:
                logger.info("WEB_APP_URL not set; running in local API mode without active webhook.")
        except Exception as e:
            logger.error(f"Error initializing Telegram bot webhook lifecycle: {e}", exc_info=True)

    yield

    if bot and bot.session:
        try:
            await bot.session.close()
        except Exception:
            pass

app = FastAPI(
    title="Alqualite CourseBox API",
    description="Interactive Learning & Cognitive Mastery Engine (آلکالیت اینتراکتیو)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(courses_router, prefix="/api")
app.include_router(reviews_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(exams_router, prefix="/api")
app.include_router(telegram_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": "Alqualite CourseBox",
        "persian_name": "آلکالیت اینتراکتیو",
        "mode": "interactive_courses"
    }

# Static files and Single Page Application (SPA) serving for unified cloud deployment
BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST", str(BASE_DIR / "frontend" / "dist")))

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend_assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes to 404 with JSON rather than serving index.html
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")

        try:
            resolved_path = (FRONTEND_DIST / full_path).resolve()
            if resolved_path.is_relative_to(FRONTEND_DIST.resolve()) and resolved_path.is_file():
                return FileResponse(resolved_path)
        except (ValueError, RuntimeError):
            pass

        index_file = FRONTEND_DIST / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)

        raise HTTPException(status_code=404, detail="Frontend index.html not found")
else:
    @app.get("/")
    def root():
        return {
            "status": "ok",
            "message": "Alqualite CourseBox backend is running. Build frontend ('npm run build') to serve UI."
        }

