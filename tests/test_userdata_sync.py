import os
import sys
import unittest
import threading
from pathlib import Path
from datetime import datetime

# Set up paths
TESTS_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = TESTS_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
BOT_DIR = Path("/Users/amiralirakhshani/Projects/MediqzBot")

sys.path.insert(0, str(BACKEND_DIR))
sys.path.insert(0, str(BOT_DIR))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import get_user_db, init_databases
import database as bot_db


class TestUserDataSync(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_databases()
        cls.client = TestClient(app)
        cls.base_test_tg_id = 991122000

    def setUp(self):
        self._cleanup()

    def tearDown(self):
        self._cleanup()

    def _cleanup(self):
        with get_user_db() as conn:
            conn.execute("DELETE FROM completed_courses WHERE user_id IN (SELECT id FROM users WHERE telegram_user_id >= ?)", (self.base_test_tg_id,))
            conn.execute("DELETE FROM part_reviews WHERE user_id IN (SELECT id FROM users WHERE telegram_user_id >= ?)", (self.base_test_tg_id,))
            conn.execute("DELETE FROM student_exam_analyses WHERE user_id IN (SELECT id FROM users WHERE telegram_user_id >= ?)", (self.base_test_tg_id,))
            conn.execute("DELETE FROM review_logs WHERE telegram_user_id >= ?", (self.base_test_tg_id,))
            conn.execute("DELETE FROM leitner_cards WHERE telegram_user_id >= ?", (self.base_test_tg_id,))
            conn.execute("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE telegram_user_id >= ?)", (self.base_test_tg_id,))
            conn.execute("DELETE FROM users WHERE telegram_user_id >= ?", (self.base_test_tg_id,))
            conn.commit()

    def test_telegram_auth_endpoint_and_token(self):
        """Test Telegram auth endpoint creates user, returns token, and /api/auth/me retains telegram_user_id."""
        tg_id = self.base_test_tg_id + 1
        payload = {
            "id": tg_id,
            "first_name": "سامان",
            "last_name": "راد",
            "username": "saman_rad"
        }
        res = self.client.post("/api/auth/telegram", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("token", data)
        self.assertEqual(data["user"]["telegram_user_id"], tg_id)
        self.assertEqual(data["user"]["display_name"], "سامان راد")
        self.assertFalse(data["user"]["is_superuser"])

        token = data["token"]
        headers = {"Authorization": f"Bearer {token}"}
        me_res = self.client.get("/api/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        me_data = me_res.json()
        self.assertEqual(me_data["telegram_user_id"], tg_id)
        self.assertEqual(me_data["display_name"], "سامان راد")

    def test_username_hijack_prevention(self):
        """Ensure an attacker supplying username='admin' via Telegram cannot hijack the admin account."""
        attacker_tg_id = self.base_test_tg_id + 2
        payload = {
            "id": attacker_tg_id,
            "first_name": "Hacker",
            "username": "admin"
        }
        res = self.client.post("/api/auth/telegram", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        # Must not receive admin username or superuser status
        self.assertNotEqual(data["user"]["username"], "admin")
        self.assertFalse(data["user"]["is_superuser"])
        self.assertEqual(data["user"]["access_level"], "S2")

        # Verify real admin account is intact and has no telegram_user_id hijacked
        with get_user_db() as conn:
            real_admin = conn.execute("SELECT * FROM users WHERE username = 'admin'").fetchone()
            self.assertIsNotNone(real_admin)
            self.assertTrue(bool(real_admin["is_superuser"]))
            self.assertNotEqual(real_admin["telegram_user_id"], attacker_tg_id)

    def test_cross_layer_leitner_sync(self):
        """Test bot Leitner additions and reviews directly mutate and sync with userdata.db."""
        tg_id = self.base_test_tg_id + 3
        # Register user via bot
        bot_db.register_user(tg_id, "سینا", "sina_test")

        # Add flashcard via bot
        added = bot_db.add_to_leitner(tg_id, "استعاره", "یکی از ارکان زیبایی‌شناسی شعر", 11, "فصل اول")
        self.assertTrue(added)

        # Retrieve card from bot
        cards = bot_db.get_all_user_cards(tg_id)
        self.assertEqual(len(cards), 1)
        card_id = cards[0]["id"]
        self.assertEqual(cards[0]["word"], "استعاره")
        self.assertEqual(cards[0]["step"], 1)

        # Record review via bot
        review_res = bot_db.record_leitner_review(card_id, tg_id, is_correct=True)
        self.assertEqual(review_res["new_step"], 2)

        # Directly verify underlying userdata.db
        with get_user_db() as conn:
            user_row = conn.execute("SELECT id FROM users WHERE telegram_user_id = ?", (tg_id,)).fetchone()
            self.assertIsNotNone(user_row)
            internal_uid = user_row["id"]

            card_row = conn.execute("SELECT * FROM leitner_cards WHERE user_id = ?", (internal_uid,)).fetchone()
            self.assertIsNotNone(card_row)
            self.assertEqual(card_row["step"], 2)
            self.assertEqual(card_row["telegram_user_id"], tg_id)

            log_row = conn.execute("SELECT * FROM review_logs WHERE user_id = ?", (internal_uid,)).fetchone()
            self.assertIsNotNone(log_row)
            self.assertEqual(log_row["card_id"], card_id)
            self.assertEqual(log_row["is_correct"], 1)
            self.assertEqual(log_row["step_after"], 2)

    def test_case_insensitive_uniqueness(self):
        """Verify that duplicate cards with differing case or whitespace are deduplicated without crashing."""
        tg_id = self.base_test_tg_id + 4
        bot_db.register_user(tg_id, "مریم", "maryam")

        add1 = bot_db.add_to_leitner(tg_id, "Mitosis", "تقسیم یاخته‌ای رشتمان", 11, "زیست شناسی")
        self.assertTrue(add1)

        # Attempt to add same word with lowercase / extra whitespace
        add2 = bot_db.add_to_leitner(tg_id, "  mitosis  ", "توضیح تکراری", 11, "زیست شناسی")
        # Should be handled gracefully without exception, and count remains 1
        cards = bot_db.get_all_user_cards(tg_id)
        self.assertEqual(len(cards), 1)

    def test_concurrent_multithreaded_writes(self):
        """Verify concurrent multi-threaded writes across bot reviews and web sessions complete without database locks."""
        tg_id = self.base_test_tg_id + 5
        bot_db.register_user(tg_id, "کاربر همزمان", "concurrency_user")
        
        # Add 5 cards
        for i in range(5):
            bot_db.add_to_leitner(tg_id, f"واژه_{i}", f"معنی_{i}", 10, "فصل اول")

        cards = bot_db.get_all_user_cards(tg_id)
        self.assertEqual(len(cards), 5)

        errors = []
        threads = []

        def worker_review(cid):
            try:
                bot_db.record_leitner_review(cid, tg_id, True)
            except Exception as e:
                errors.append(f"Bot review error: {e}")

        def worker_course_complete(idx):
            try:
                # Simulate CourseBox user saving progress
                with get_user_db() as conn:
                    user_row = conn.execute("SELECT id FROM users WHERE telegram_user_id = ?", (tg_id,)).fetchone()
                    conn.execute("""
                        INSERT INTO completed_courses 
                        (user_id, course_id, part_id, title, topic_code, total_slides, correct_count, score_percentage, completed_at)
                        VALUES (?, ?, ?, 'دوره تستی', 'PER', 10, 8, 80.0, ?)
                    """, (user_row["id"], f"course_{idx}", f"part_{idx}", datetime.now().isoformat()))
                    conn.commit()
            except Exception as e:
                errors.append(f"Backend write error: {e}")

        # Spawn 10 concurrent threads (5 bot reviews + 5 web progress writes)
        for i in range(5):
            t1 = threading.Thread(target=worker_review, args=(cards[i]["id"],))
            t2 = threading.Thread(target=worker_course_complete, args=(i,))
            threads.extend([t1, t2])

        for t in threads:
            t.start()
        for t in threads:
            t.join()

        self.assertEqual(len(errors), 0, f"Encountered concurrency lock errors: {errors}")

        # Verify all 5 cards stepped to 2
        updated_cards = bot_db.get_all_user_cards(tg_id)
        for c in updated_cards:
            self.assertEqual(c["step"], 2)

    def test_user_routines_sync_and_cleared_dates(self):
        """Test routine synchronization and zombie elimination via cleared_dates."""
        tg_id = self.base_test_tg_id + 6
        res = self.client.post("/api/auth/telegram", json={
            "id": tg_id,
            "first_name": "امیر",
            "last_name": "راد",
            "username": "amir_rad"
        })
        self.assertEqual(res.status_code, 200)
        token = res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Step 1: Sync 2 items on 1405-08-20
        sync_res = self.client.post("/api/reviews/routines", headers=headers, json={
            "routines": [
                {
                    "shamsi_date": "1405-08-20",
                    "course_id": "c1",
                    "course_title": "درس ۱",
                    "part_id": "p1",
                    "part_title": "پارت ۱",
                    "slide_count": 5,
                    "completed": False,
                    "order_idx": 0
                },
                {
                    "shamsi_date": "1405-08-20",
                    "course_id": "c2",
                    "course_title": "درس ۲",
                    "part_id": "p1",
                    "part_title": "پارت ۱",
                    "slide_count": 4,
                    "completed": False,
                    "order_idx": 1
                }
            ],
            "cleared_dates": []
        })
        self.assertEqual(sync_res.status_code, 200)

        # Verify items exist
        get_res = self.client.get("/api/reviews/routines", headers=headers)
        self.assertEqual(get_res.status_code, 200)
        items = get_res.json()
        self.assertEqual(len(items), 2)

        # Step 2: Remove all items on 1405-08-20 by specifying it in cleared_dates
        clear_res = self.client.post("/api/reviews/routines", headers=headers, json={
            "routines": [],
            "cleared_dates": ["1405-08-20"]
        })
        self.assertEqual(clear_res.status_code, 200)

        # Verify items are completely wiped from DB (no zombie resurrection)
        get_res2 = self.client.get("/api/reviews/routines", headers=headers)
        self.assertEqual(get_res2.status_code, 200)
        items2 = get_res2.json()
        self.assertEqual(len(items2), 0)


if __name__ == "__main__":
    unittest.main()
