import unittest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Add backend to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.main import app
from app.core.database import init_databases
from app.core.exams_db import init_exams_db

class TestExamsAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_databases()
        init_exams_db()
        cls.client = TestClient(app)

        # Login as demo user
        resp = cls.client.post("/api/auth/login", json={"username": "demo", "password": "demo123"})
        if resp.status_code == 200:
            cls.token = resp.json()["token"]
        else:
            cls.token = ""
        cls.headers = {"Authorization": f"Bearer {cls.token}"} if cls.token else {}

    def test_get_exams_catalog(self):
        resp = self.client.get("/api/exams")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data, list)
        exam_ids = [e["id"] for e in data]
        self.assertIn("M10T-405Mehr17", exam_ids)
        self.assertIn("MD12T-405Aba22", exam_ids)

    def test_get_duel_mediqz_exam_detail(self):
        resp = self.client.get("/api/exams/MD12T-405Aba22")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["id"], "MD12T-405Aba22")
        self.assertEqual(len(data["questions"]), 140)
        self.assertEqual(len(data["sections"]), 4)

        # Verify Q1 (Bio)
        q1 = data["questions"][0]
        self.assertEqual(q1["utid"], "MD12T-405Aba22-B1")
        self.assertEqual(q1["subject"], "زیست‌شناسی")
        self.assertEqual(q1["correct_opt"], 2)
        self.assertEqual(q1["topic_id"], "B10C2S20")
        self.assertTrue(len(q1["topic_title"]) > 0)
        self.assertEqual(q1["question_type"], "Nokat Shekl")
        self.assertEqual(q1["question_type_fa"], "نکات شکل")
        self.assertEqual(q1["time_taking_profile"], "Standard")
        self.assertEqual(q1["time_profile_fa"], "استاندارد")

        # Verify Q140 (Math)
        q140 = data["questions"][-1]
        self.assertEqual(q140["utid"], "MD12T-405Aba22-M140")
        self.assertEqual(q140["subject"], "ریاضی")
        self.assertEqual(q140["topic_id"], "M12C5S3")
        self.assertTrue(len(q140["topic_title"]) > 0)

    def test_get_exam_detail(self):
        resp = self.client.get("/api/exams/M10T-405Mehr17")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["id"], "M10T-405Mehr17")
        self.assertEqual(len(data["questions"]), 90)
        
        q1 = data["questions"][0]
        self.assertEqual(q1["utid"], "M10T-405Mehr17-B1")
        self.assertEqual(q1["correct_opt"], 3)
        self.assertEqual(q1["topic_id"], "B10C1S1")
        self.assertTrue(len(q1["topic_title"]) > 0)
        self.assertEqual(q1["time_taking_profile"], "Fast")

    def test_pure_metrics_flow(self):
        exam_id = "M10T-405Mehr17"
        # 1. Reset analysis first
        reset_resp = self.client.post(f"/api/exams/{exam_id}/analysis/reset", headers=self.headers)
        self.assertIn(reset_resp.status_code, [200, 404])

        # 2. Submit Keypad:
        # Questions 1-50: user picked correct option
        # Questions 51-70: user picked wrong option
        # Questions 71-90: blank
        # In-exam score: (3*50 - 20) / (3*90) * 100 = 130 / 270 * 100 = 48.15%
        detail = self.client.get(f"/api/exams/{exam_id}").json()
        questions = detail["questions"]

        keypad_answers = {}
        for q in questions:
            q_num = q["q_num"]
            c_opt = q["correct_opt"]
            if q_num <= 50:
                keypad_answers[str(q_num)] = c_opt # correct
            elif q_num <= 70:
                wrong_opt = 1 if c_opt != 1 else 2
                keypad_answers[str(q_num)] = wrong_opt # wrong
            else:
                keypad_answers[str(q_num)] = 0 # blank

        k_resp = self.client.post(
            f"/api/exams/{exam_id}/analysis/keypad",
            json={"answers": keypad_answers},
            headers=self.headers
        )
        self.assertEqual(k_resp.status_code, 200)
        k_data = k_resp.json()
        self.assertAlmostEqual(k_data["exam_score_pct"], 48.15, delta=0.5)
        self.assertEqual(k_data["correct_count"], 50)
        self.assertEqual(k_data["wrong_count"], 20)
        self.assertEqual(k_data["blank_count"], 20)

        # 3. Submit Journal entries:
        # For 10 wrong questions (51-60), outside_status = 'solved_correctly_no_time' (حل صحیح بدون زمان)
        # For 5 blank questions (71-75), outside_status = 'solved_correctly_no_time'
        # For remaining 10 wrong questions (61-70), outside_status = 'unsolved' with error_reason 'ضعف علمی'
        journal_entries = {}
        # Correct questions: 2 fields
        for q in range(1, 51):
            journal_entries[str(q)] = {
                "solve_faster_note": "استفاده از روش تناسب به جای فرمول",
                "personal_journal": "تسلط خوب روی مفهوم"
            }
        # Outside solved
        for q in range(51, 61):
            journal_entries[str(q)] = {
                "outside_status": "solved_correctly_no_time",
                "error_reason": "بی‌دقتی",
                "solve_faster_note": "تمرکز بیشتر روی ضرب و تقسیم",
                "subchapter_bug_note": "مرور مبحث یکاهای SI",
                "personal_journal": "سر آزمون عجله کردم"
            }
        for q in range(71, 76):
            journal_entries[str(q)] = {
                "outside_status": "solved_correctly_no_time",
                "error_reason": "کمبود زمان",
                "solve_faster_note": "رد کردن سوالات دشوارتر ابتدا",
                "subchapter_bug_note": "تمرین تست‌های زمان‌دار",
                "personal_journal": "وقت کم آورده بودم"
            }
        for q in range(61, 71):
            journal_entries[str(q)] = {
                "outside_status": "unsolved",
                "error_reason": "ضعف علمی",
                "solve_faster_note": "",
                "subchapter_bug_note": "نیاز به بازخوانی درسنامه",
                "personal_journal": "مفهوم برایم گنگ بود"
            }

        j_resp = self.client.post(
            f"/api/exams/{exam_id}/analysis/journal",
            json={"entries": journal_entries},
            headers=self.headers
        )
        self.assertEqual(j_resp.status_code, 200)
        j_data = j_resp.json()
        self.assertEqual(j_data["status"], "completed")

        # 4. Fetch Metrics: verify pure mathematical structure
        m_resp = self.client.get(f"/api/exams/{exam_id}/analysis/metrics", headers=self.headers)
        self.assertEqual(m_resp.status_code, 200)
        metrics = m_resp.json()

        # Check in_exam
        self.assertIn("in_exam", metrics)
        in_exam = metrics["in_exam"]
        self.assertEqual(in_exam["correct_count"], 50)
        self.assertEqual(in_exam["wrong_count"], 20)
        self.assertEqual(in_exam["blank_count"], 20)
        self.assertAlmostEqual(in_exam["score_pct"], 48.15, delta=0.5)

        # Check outside_exam
        self.assertIn("outside_exam", metrics)
        outside_exam = metrics["outside_exam"]
        # Outside correct should be 50 + 10 + 5 = 65
        self.assertEqual(outside_exam["correct_count"], 65)
        self.assertEqual(outside_exam["wrong_count"], 10)
        # Score: (3*65 - 10) / (3*90) * 100 = 185 / 270 * 100 = 68.52%
        self.assertAlmostEqual(outside_exam["score_pct"], 68.52, delta=0.5)

        # Verify breakdowns exist
        self.assertTrue(len(in_exam["subjects"]) > 0)
        self.assertTrue(len(in_exam["difficulties"]) > 0)
        self.assertTrue(len(in_exam["question_types"]) > 0)
        self.assertTrue(len(in_exam["time_profiles"]) > 0)
        self.assertTrue(len(in_exam["topics"]) > 0)

        # Verify error reasons
        self.assertIn("error_reasons", metrics)
        reasons_dict = {item["reason"]: item["count"] for item in metrics["error_reasons"]}
        self.assertEqual(reasons_dict["بی‌دقتی"], 10)
        self.assertEqual(reasons_dict["کمبود زمان"], 5)
        self.assertEqual(reasons_dict["ضعف علمی"], 10)

        # Confirm NO "quick_wins" or "diagnostic_comment" in response
        self.assertNotIn("quick_wins", metrics)
        self.assertNotIn("total_study_hours", metrics)

if __name__ == "__main__":
    unittest.main()
