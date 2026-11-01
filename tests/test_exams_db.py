import unittest
import sqlite3
import sys
from pathlib import Path

# Add backend to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.core.exams_db import get_exams_db, init_exams_db

class TestExamsDatabase(unittest.TestCase):
    def setUp(self):
        init_exams_db()

    def test_database_tables_exist(self):
        with get_exams_db() as conn:
            c = conn.cursor()
            tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
            self.assertIn("exams", tables)
            self.assertIn("exam_questions", tables)

    def test_seeded_m10t_exam_exists(self):
        with get_exams_db() as conn:
            c = conn.cursor()
            exam_row = c.execute("SELECT * FROM exams WHERE id = 'M10T-405Mehr17'").fetchone()
            self.assertIsNotNone(exam_row, "Seeded M10T-405Mehr17 exam must exist in exams table")
            self.assertEqual(exam_row["total_questions"], 90)
            self.assertEqual(exam_row["grade"], "10")
            self.assertEqual(exam_row["major"], "تجربی")

    def test_all_90_questions_populated_correctly(self):
        with get_exams_db() as conn:
            c = conn.cursor()
            questions = c.execute(
                "SELECT * FROM exam_questions WHERE exam_id = 'M10T-405Mehr17' ORDER BY q_num ASC"
            ).fetchall()
            self.assertEqual(len(questions), 90, "Exactly 90 questions must be populated")

            subjects_count = {}
            for q in questions:
                q_num = q["q_num"]
                subj = q["subject"]
                subjects_count[subj] = subjects_count.get(subj, 0) + 1

                if 1 <= q_num <= 30:
                    self.assertEqual(subj, "زیست‌شناسی")
                    self.assertTrue(q["utid"].startswith("M10T-405Mehr17-B"))
                elif 31 <= q_num <= 50:
                    self.assertEqual(subj, "ریاضی")
                    self.assertTrue(q["utid"].startswith("M10T-405Mehr17-M"))
                elif 51 <= q_num <= 70:
                    self.assertEqual(subj, "فیزیک")
                    self.assertTrue(q["utid"].startswith("M10T-405Mehr17-P"))
                elif 71 <= q_num <= 90:
                    self.assertEqual(subj, "شیمی")
                    self.assertTrue(q["utid"].startswith("M10T-405Mehr17-C"))

                # Answer key check
                self.assertIn(q["correct_opt"], [1, 2, 3, 4], f"Question {q_num} must have valid option 1..4")
                # Difficulty check
                self.assertIn(q["difficulty"], ["آسان", "متوسط", "دشوار"], f"Question {q_num} invalid difficulty")
                # TopicID check
                self.assertTrue(bool(q["topic_id"]), f"Question {q_num} must have a non-empty topic_id")
                # Time profile check
                self.assertIn(q["time_taking_profile"], ["Fast", "Standard", "Long af"])
                # Question type check
                self.assertIn(q["question_type"], ["Mafhoomi", "Mohasebati", "Tarkibi", "Nokat Shekl", "Hefzi", "Nemoodari"])

            self.assertEqual(subjects_count.get("زیست‌شناسی"), 30)
            self.assertEqual(subjects_count.get("ریاضی"), 20)
            self.assertEqual(subjects_count.get("فیزیک"), 20)
            self.assertEqual(subjects_count.get("شیمی"), 20)

if __name__ == "__main__":
    unittest.main()
