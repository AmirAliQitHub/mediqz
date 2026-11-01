import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import init_databases, get_user_db


class TestMobileAuthAndCourseFiltering(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_databases()
        cls.client = TestClient(app)

    def test_telegram_auth_and_onboarding(self):
        import time, random
        unique_tg_id = int(time.time() * 1000) % 100000000 + random.randint(1, 9999)
        # 1. Telegram login for a brand new student
        res = self.client.post("/api/auth/telegram", json={
            "id": unique_tg_id,
            "first_name": "سارا",
            "username": f"sara_{unique_tg_id}"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("token", data)
        self.assertTrue(data.get("needs_onboarding"))
        token = data["token"]

        # 2. Complete onboarding
        headers = {"Authorization": f"Bearer {token}"}
        onboard_res = self.client.post("/api/auth/onboarding", json={
            "display_name": "سارا محمدی",
            "grade": "11"
        }, headers=headers)
        self.assertEqual(onboard_res.status_code, 200)
        ob_data = onboard_res.json()
        self.assertTrue(ob_data["user"]["is_onboarded"])
        self.assertEqual(ob_data["user"]["grade"], "11")
        self.assertFalse(ob_data["user"]["is_superuser"])

        # 3. Test me endpoint
        me_res = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["grade"], "11")

    def test_superuser_promotion_amirtaii8123(self):
        # Register or onboard with amirtaii8123
        res = self.client.post("/api/auth/telegram", json={
            "id": 81238123,
            "first_name": "amirtaii8123",
            "username": "amirtaii8123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.json()
        token = data["token"]
        self.assertTrue(data["user"]["is_superuser"])
        self.assertEqual(data["user"]["access_level"], "SUPERUSER")

        headers = {"Authorization": f"Bearer {token}"}
        # Admin endpoint access should succeed
        admin_res = self.client.get("/api/admin/users", headers=headers)
        self.assertEqual(admin_res.status_code, 200)
        users = admin_res.json()
        self.assertTrue(len(users) >= 1)

    def test_course_filtering_normal_vs_superuser(self):
        # 1. Normal user should see exactly 12 stable courses
        res = self.client.get("/api/courses")
        self.assertEqual(res.status_code, 200)
        courses = res.json()
        self.assertEqual(len(courses), 12)
        topic_codes = {c["topic_code"] for c in courses}
        expected_codes = {
            "FA10", "FA11", "FA12",
            "fa10_emla", "fa11_emla", "fa12_emla",
            "FA10E", "FA11E", "FA12E",
            "AR10", "AR11", "AR12"
        }
        self.assertEqual(topic_codes, expected_codes)

        # 2. Superuser or include_dev=True should see all courses
        res_dev = self.client.get("/api/courses?include_dev=true")
        self.assertEqual(res_dev.status_code, 200)
        all_courses = res_dev.json()
        self.assertGreater(len(all_courses), 12)


if __name__ == "__main__":
    unittest.main()
