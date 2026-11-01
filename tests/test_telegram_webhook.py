import unittest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import TELEGRAM_SECRET_TOKEN


class TestTelegramWebhook(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # Mock bot instance on app.state
        self.mock_bot = MagicMock()
        self.mock_bot.get_me = AsyncMock(return_value=MagicMock(id=8882238851, first_name="Mediaz", username="MediqzBot"))
        self.mock_bot.get_webhook_info = AsyncMock(return_value=MagicMock(
            url="https://test.com/api/telegram/webhook",
            has_custom_certificate=False,
            pending_update_count=0,
            last_error_date=None,
            last_error_message=None
        ))
        app.state.bot = self.mock_bot

    def test_webhook_secret_token_validation(self):
        payload = {
            "update_id": 10001,
            "message": {
                "message_id": 1,
                "date": 1441645532,
                "chat": {"id": 111222, "type": "private"},
                "from": {"id": 111222, "is_bot": False, "first_name": "TestUser"},
                "text": "/start"
            }
        }
        # 1. Invalid secret token -> 403 Forbidden
        headers = {"X-Telegram-Bot-Api-Secret-Token": "wrong_secret_token_xyz"}
        resp = self.client.post("/api/telegram/webhook", json=payload, headers=headers)
        self.assertEqual(resp.status_code, 403)
        self.assertIn("Invalid Telegram webhook secret token", resp.json()["detail"])

        # 2. Valid secret token -> 200 OK
        valid_headers = {"X-Telegram-Bot-Api-Secret-Token": TELEGRAM_SECRET_TOKEN}
        with patch("app.bot.dispatcher.dp.feed_webhook_update", new_callable=AsyncMock) as mock_feed:
            mock_feed.return_value = None
            resp = self.client.post("/api/telegram/webhook", json=payload, headers=valid_headers)
            self.assertEqual(resp.status_code, 200)
            self.assertTrue(resp.json()["ok"])
            mock_feed.assert_called_once()

    def test_bot_status_endpoint(self):
        resp = self.client.get("/api/telegram/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["active"])
        self.assertEqual(data["bot"]["username"], "MediqzBot")


if __name__ == "__main__":
    unittest.main()
