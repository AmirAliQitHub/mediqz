import unittest
import json
from pathlib import Path

class TestBiologyGhaydCourse(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/biology_ghayd.json")
        self.assertTrue(p.exists(), "biology_ghayd.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "biology_ghayd")
        parts = data.get("parts", [])
        self.assertGreaterEqual(len(parts), 3, "Expected at least 3 parts for Grades 10, 11, 12")

        total_eus = sum(len(part.get("eus", [])) for part in parts)
        self.assertGreaterEqual(total_eus, 45, f"Expected at least 45 EUs, got {total_eus}")

        # Check that all EUs are correct_incorrect and have clear explanations
        qualifier_words = ["همه", "هیچ", "اغلب", "برخی", "بیشتر", "همیشه", "به ندرت", "هر"]
        found_qualifiers = 0
        for part in parts:
            for eu in part.get("eus", []):
                self.assertEqual(eu.get("type"), "correct_incorrect")
                p_load = eu.get("payload", {})
                self.assertIn("statement", p_load)
                self.assertIn("is_correct", p_load)
                self.assertIn("explanation", p_load)
                self.assertTrue(len(p_load["explanation"]) > 10, "Explanation too brief")
                stmt = p_load["statement"]
                if any(q in stmt for q in qualifier_words):
                    found_qualifiers += 1

        self.assertGreaterEqual(found_qualifiers, 35, "Expected high proportion of qualifier-focused statements")

if __name__ == "__main__":
    unittest.main()
