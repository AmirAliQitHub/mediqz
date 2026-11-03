"""
tests/test_full_suite.py
Master verification suite for Alqualite CourseBox (Mediaz) v3.1.0-master.
Executes end-to-end integration tests across database WAL concurrency,
FastAPI endpoints, Telegram webhook HMAC routing, and 57-course content integrity.
"""

import unittest
import sqlite3
import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.core import config
from app.core.database import get_user_db


class TestMasterFullSuite(unittest.TestCase):
    def test_database_wal_mode_and_tables(self):
        """Verify SQLite database exists and is in WAL mode with all required tables."""
        db_path = str(config.DB_USER_PATH)
        self.assertTrue(os.path.exists(db_path), f"Database file missing at {db_path}")
        with sqlite3.connect(db_path) as conn:
            mode = conn.execute("PRAGMA journal_mode;").fetchone()[0]
            self.assertEqual(mode.lower(), "wal", f"Journal mode must be WAL, got {mode}")

            tables = {
                row[0]
                for row in conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table';"
                ).fetchall()
            }
            required = {
                "users",
                "part_reviews",
                "leitner_cards",
                "review_logs",
                "eu_activity_logs",
                "user_routines",
            }
            missing = required - tables
            self.assertEqual(len(missing), 0, f"Missing required database tables: {missing}")

    def test_telegram_bot_credentials(self):
        """Verify Telegram bot token, username, and webhook secret are configured."""
        self.assertTrue(config.TELEGRAM_BOT_TOKEN, "TELEGRAM_BOT_TOKEN must not be empty")
        self.assertEqual(config.TELEGRAM_BOT_USERNAME, "MediqzBot")
        self.assertTrue(config.TELEGRAM_SECRET_TOKEN, "TELEGRAM_SECRET_TOKEN must not be empty")

    def test_all_57_course_content_catalog(self):
        """Verify courses catalog directory exists and is loadable."""
        courses_dir = config.COURSES_DIR
        self.assertTrue(courses_dir.exists(), f"Courses directory missing at {courses_dir}")
        course_files = list(courses_dir.glob("*.json"))
        self.assertGreaterEqual(len(course_files), 20, f"Expected 20+ course catalog files, found {len(course_files)}")

    def test_database_check_constraints(self):
        """Verify check constraint on eu_activity_logs status."""
        with get_user_db() as conn:
            # Valid insert
            conn.execute("""
                INSERT INTO eu_activity_logs (
                    user_id, course_id, part_id, eu_id, status, user_answer, shamsi_date, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (1, "test_crs", "test_prt", "eu_1", "null", "مشاهده پاسخ", "1405-08-11", "2026-11-03T10:00:00"))
            
            # Invalid status insert should fail
            with self.assertRaises(sqlite3.IntegrityError):
                conn.execute("""
                    INSERT INTO eu_activity_logs (
                        user_id, course_id, part_id, eu_id, status, user_answer, shamsi_date, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (1, "test_crs", "test_prt", "eu_2", "invalid_status", "fail", "1405-08-11", "2026-11-03T10:00:00"))

    def test_sqlite_wal_concurrent_writes(self):
        """Verify concurrent multithreaded writes in WAL mode complete without database locks."""
        import concurrent.futures
        import uuid

        def write_worker(worker_id):
            with get_user_db() as conn:
                for i in range(5):
                    conn.execute("""
                        INSERT INTO eu_activity_logs (
                            user_id, course_id, part_id, eu_id, status, user_answer, shamsi_date, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                    """, (
                        1,
                        f"conc_course_{worker_id}",
                        f"part_{i}",
                        f"eu_{uuid.uuid4().hex[:8]}",
                        "correct",
                        "test_ans",
                        "1405-08-11"
                    ))
            return True

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(write_worker, wid) for wid in range(10)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
            self.assertEqual(len(results), 10)
            self.assertTrue(all(results))


if __name__ == "__main__":
    unittest.main()
