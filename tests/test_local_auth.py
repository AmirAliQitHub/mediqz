import unittest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.main import app
from app.core.database import init_databases, get_user_db

class TestLocalAuth(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_databases()
        cls.client = TestClient(app)

    def test_admin_login_success(self):
        res = self.client.post("/api/auth/login", json={"username": "admin", "password": "password"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue("token" in data)
        self.assertTrue(data["user"]["is_superuser"])
        self.assertEqual(data["user"]["access_level"], "SUPERUSER")
        self.assertEqual(data["user"]["username"], "admin")

    def test_demo_login_success(self):
        res = self.client.post("/api/auth/login", json={"username": "demo", "password": "demo123"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue("token" in data)
        self.assertFalse(data["user"]["is_superuser"])
        self.assertEqual(data["user"]["username"], "demo")

    def test_invalid_login_rejected(self):
        res = self.client.post("/api/auth/login", json={"username": "admin", "password": "wrong_password"})
        self.assertEqual(res.status_code, 401)

if __name__ == "__main__":
    unittest.main()
