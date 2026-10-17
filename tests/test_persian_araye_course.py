import unittest
import json
from pathlib import Path

class TestPersianArayeCourse(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/persian_araye.json")
        self.assertTrue(p.exists(), "persian_araye.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "persian_araye")
        parts = data.get("parts", [])
        self.assertGreaterEqual(len(parts), 3, "Expected at least 3 parts for Grades 10, 11, 12")

        total_eus = sum(len(part.get("eus", [])) for part in parts)
        self.assertGreaterEqual(total_eus, 45, f"Expected at least 45 EUs, got {total_eus}")

        all_text = []
        for part in parts:
            for eu in part.get("eus", []):
                p_load = eu.get("payload", {})
                if eu.get("type") == "fill_in_the_blank":
                    self.assertIn("word", p_load)
                    self.assertIn("keywords", p_load)
                    self.assertGreater(len(p_load["keywords"]), 0)
                    all_text.append(p_load["word"])
                    all_text.append(p_load["translation"])
                elif eu.get("type") == "correct_incorrect":
                    self.assertIn("statement", p_load)
                    self.assertIn("is_correct", p_load)
                    all_text.append(p_load["statement"])
                    all_text.append(p_load["explanation"])

        combined = " ".join(all_text)
        self.assertTrue("استعاره" in combined, "Araye esteare missing")
        self.assertTrue("مجاز" in combined, "Araye majaz missing")
        self.assertTrue("حسن تعلیل" in combined or "اسلوب معادله" in combined, "Advanced araye missing")

if __name__ == "__main__":
    unittest.main()
