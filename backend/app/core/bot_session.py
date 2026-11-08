import socket
from typing import Optional
from aiogram import Bot
from aiogram.client.session.aiohttp import AiohttpSession

class IPv4AiohttpSession(AiohttpSession):
    """
    Forces IPv4 resolution for Telegram Bot API connections.
    Prevents hangs and connection timeouts on cloud hosts with broken or incomplete IPv6 routes.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._connector_init["family"] = socket.AF_INET

def create_bot(token: str) -> Bot:
    """
    Factory creating an aiogram Bot instance equipped with IPv4AiohttpSession.
    """
    return Bot(token=token, session=IPv4AiohttpSession())
