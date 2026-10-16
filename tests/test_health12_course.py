import unittest
import json
from pathlib import Path

class TestHealth12Course(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/health12.json")
        self.assertTrue(p.exists(), "health12.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "health12")
        self.assertEqual(data.get("grade"), "پایه دوازدهم")
        parts = data.get("parts", [])
        self.assertGreaterEqual(len(parts), 6, "Expected at least 6 thematic parts for Health & Hygiene")

        total_eus = sum(len(part.get("eus", [])) for part in parts)
        self.assertGreaterEqual(total_eus, 40, f"Expected at least 40 EUs, got {total_eus}")

        # Check for multiple EU types
        eu_types = {eu.get("type") for part in parts for eu in part.get("eus", [])}
        self.assertIn("fill_in_the_blank", eu_types)
        self.assertIn("correct_incorrect", eu_types)
        self.assertIn("tree_diagram", eu_types)

        # Check key health concepts
        words_and_stmts = []
        for part in parts:
            for eu in part.get("eus", []):
                p_load = eu.get("payload", {})
                if eu.get("type") == "fill_in_the_blank":
                    words_and_stmts.append(p_load.get("word", ""))
                    self.assertGreater(len(p_load.get("keywords", [])), 0)
                elif eu.get("type") == "correct_incorrect":
                    words_and_stmts.append(p_load.get("statement", ""))
                    self.assertIn("is_correct", p_load)
                elif eu.get("type") == "tree_diagram":
                    self.assertIn("id", p_load)
                    self.assertIn("children", p_load)

        combined_text = " ".join(words_and_stmts)
        self.assertTrue("BMI" in combined_text or "شاخص توده بدنی" in combined_text, "BMI concept missing")
        self.assertTrue("ترانس" in combined_text or "چربی" in combined_text, "Fat types missing")
        self.assertTrue("استرس" in combined_text or "تاب‌آوری" in combined_text or "تاب آوری" in combined_text, "Mental health missing")

if __name__ == "__main__":
    unittest.main()
