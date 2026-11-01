"""
Mediaz Telegram Bot Package
Consolidated aiogram 3.x dispatcher, keyboards, and handlers for Webhook execution.
"""
from app.bot.dispatcher import dp, setup_bot_dispatcher

__all__ = ["dp", "setup_bot_dispatcher"]
