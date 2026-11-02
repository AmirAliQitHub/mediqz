import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import TELEGRAM_SECRET_TOKEN, TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_USERNAME


class TestBotConnectivity(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.mock_bot = MagicMock()
        self.mock_bot.get_me = AsyncMock(return_value=MagicMock(
            id=8882238851,
            first_name="Mediaz",
            username="MediqzBot"
        ))
        self.mock_bot.get_webhook_info = AsyncMock(return_value=MagicMock(
            url="https://mediqz.vercel.app/api/telegram/webhook",
            has_custom_certificate=False,
            pending_update_count=0,
            last_error_date=None,
            last_error_message=None
        ))
        app.state.bot = self.mock_bot

    def test_environment_and_credentials(self):
        """Verify bot credentials are non-empty and mathematically matched."""
        self.assertTrue(bool(TELEGRAM_BOT_TOKEN), "TELEGRAM_BOT_TOKEN must not be empty")
        self.assertEqual(TELEGRAM_BOT_USERNAME, "MediqzBot")
        self.assertTrue(bool(TELEGRAM_SECRET_TOKEN), "TELEGRAM_SECRET_TOKEN must be provisioned")
        self.assertEqual(len(TELEGRAM_SECRET_TOKEN), 32)

    def test_webhook_hmac_rejection(self):
        """Forged or missing HMAC token must yield HTTP 403 Forbidden."""
        payload = {"update_id": 99999, "message": {"text": "/start"}}
        
        # Missing header
        resp_missing = self.client.post("/api/telegram/webhook", json=payload)
        self.assertEqual(resp_missing.status_code, 403)

        # Forged header
        headers = {"X-Telegram-Bot-Api-Secret-Token": "bad_token_12345"}
        resp_bad = self.client.post("/api/telegram/webhook", json=payload, headers=headers)
        self.assertEqual(resp_bad.status_code, 403)

    def test_webhook_successful_dispatch(self):
        """Valid HMAC token must successfully dispatch update to aiogram dispatcher."""
        payload = {
            "update_id": 123456,
            "message": {
                "message_id": 101,
                "date": 1700000000,
                "chat": {"id": 987654321, "type": "private"},
                "from": {"id": 987654321, "is_bot": False, "first_name": "TestStudent", "username": "student_test"},
                "text": "/start"
            }
        }
        headers = {"X-Telegram-Bot-Api-Secret-Token": TELEGRAM_SECRET_TOKEN}
        with patch("app.bot.dispatcher.dp.feed_webhook_update", new_callable=AsyncMock) as mock_feed:
            mock_feed.return_value = None
            resp = self.client.post("/api/telegram/webhook", json=payload, headers=headers)
            self.assertEqual(resp.status_code, 200)
            self.assertTrue(resp.json().get("ok"))
            mock_feed.assert_called_once()

    def test_telegram_status_endpoint(self):
        """GET /api/telegram/status must return bot identity and active status."""
        resp = self.client.get("/api/telegram/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("active"))
        self.assertEqual(data.get("bot", {}).get("username"), "MediqzBot")
        self.assertEqual(data.get("bot", {}).get("first_name"), "Mediaz")


if __name__ == "__main__":
    unittest.main()
