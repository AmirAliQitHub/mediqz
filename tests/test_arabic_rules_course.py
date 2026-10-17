import unittest
import json
from pathlib import Path

class TestArabicRulesCourse(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/arabic_translation_rules.json")
        self.assertTrue(p.exists(), "arabic_translation_rules.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "arabic_translation_rules")
        parts = data.get("parts", [])
        self.assertGreaterEqual(len(parts), 3, "Expected at least 3 parts for Arabic Rules")

        total_eus = sum(len(part.get("eus", [])) for part in parts)
        self.assertGreaterEqual(total_eus, 40, f"Expected at least 40 EUs, got {total_eus}")

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
        self.assertTrue("استمراری" in combined or "بعید" in combined, "Verbal tenses missing")
        self.assertTrue("نفی جنس" in combined or "حصر" in combined or "شرط" in combined, "Special arabic constructs missing")

if __name__ == "__main__":
    unittest.main()
