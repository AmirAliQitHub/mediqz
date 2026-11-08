import hmac
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Header, HTTPException, Request
from aiogram import Bot
from aiogram.types import Update

from app.core.config import TELEGRAM_SECRET_TOKEN, WEB_APP_URL, TELEGRAM_BOT_TOKEN
from app.core.bot_session import create_bot
from app.bot.dispatcher import dp

logger = logging.getLogger("TelegramWebhookAPI")
router = APIRouter(prefix="/telegram", tags=["telegram_webhook"])


def get_or_create_bot(request: Request) -> Optional[Bot]:
    """
    Retrieves the Bot instance from application state or lazily initializes it.
    Ensures cold-start serverless requests never fail with 503 uninitialized.
    """
    bot: Optional[Bot] = getattr(request.app.state, "bot", None)
    if not bot and TELEGRAM_BOT_TOKEN:
        try:
            bot = create_bot(token=TELEGRAM_BOT_TOKEN)
            request.app.state.bot = bot
            logger.info("Lazy-initialized Telegram Bot instance on serverless request.")
        except Exception as e:
            logger.error(f"Failed to lazy-initialize Telegram Bot: {e}")
    return bot


@router.post("/webhook")
async def telegram_webhook_handler(
    request: Request,
    payload: Dict[str, Any],
    x_telegram_bot_api_secret_token: Optional[str] = Header(None)
):
    """
    Receives and processes incoming updates pushed directly from Telegram's cloud servers.
    Eliminates the need for long-polling daemons or background worker threads.
    """
    if TELEGRAM_SECRET_TOKEN:
        if not x_telegram_bot_api_secret_token or not hmac.compare_digest(
            x_telegram_bot_api_secret_token, TELEGRAM_SECRET_TOKEN
        ):
            logger.warning("Rejected webhook update: missing or invalid secret token.")
            raise HTTPException(status_code=403, detail="Invalid Telegram webhook secret token")

    bot: Optional[Bot] = get_or_create_bot(request)
    if not bot:
        logger.error("Bot instance not available in application state.")
        raise HTTPException(status_code=503, detail="Telegram bot service not initialized")

    try:
        update = Update.model_validate(payload, context={"bot": bot})
        # Feed update directly to the consolidated dispatcher
        await dp.feed_webhook_update(bot=bot, update=update, web_app_url=WEB_APP_URL)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Error handling Telegram webhook update: {e}", exc_info=True)
        # Always return 200 with ok:True to Telegram so it doesn't repeatedly retry un-deliverable updates
        return {"ok": True, "warning": str(e)}


@router.get("/status")
async def telegram_bot_status(request: Request):
    """
    Diagnostics endpoint for checking Telegram bot connectivity and webhook status.
    """
    bot: Optional[Bot] = get_or_create_bot(request)
    if not bot:
        return {"active": False, "reason": "Bot instance not initialized (TELEGRAM_BOT_TOKEN missing)"}

    try:
        me = await bot.get_me()
        webhook_info = await bot.get_webhook_info()
        return {
            "active": True,
            "bot": {
                "id": me.id,
                "first_name": me.first_name,
                "username": me.username,
            },
            "webhook": {
                "url": webhook_info.url,
                "has_custom_certificate": webhook_info.has_custom_certificate,
                "pending_update_count": webhook_info.pending_update_count,
                "last_error_date": webhook_info.last_error_date,
                "last_error_message": webhook_info.last_error_message,
            },
            "web_app_url": WEB_APP_URL,
        }
    except Exception as e:
        return {"active": False, "error": str(e)}
