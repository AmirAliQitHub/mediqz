import unittest
from fastapi.testclient import TestClient
from app.main import app

class TestStaticServing(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check_still_intact(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "healthy")

    def test_root_serves_spa_index(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response.headers.get("content-type", ""))
        self.assertIn("<div id=\"root\">", response.text)

    def test_spa_catch_all_route(self):
        # Navigation routes like /courses or /account should return index.html for SPA routing
        response = self.client.get("/courses")
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/html", response.headers.get("content-type", ""))
        self.assertIn("<div id=\"root\">", response.text)

    def test_api_route_404_not_html(self):
        # A nonexistent /api endpoint should return 404 JSON, NOT fallback to index.html
        response = self.client.get("/api/nonexistent_test_route")
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn("detail", data)

    def test_static_asset_favicon(self):
        response = self.client.get("/favicon.svg")
        self.assertEqual(response.status_code, 200)

if __name__ == "__main__":
    unittest.main()
