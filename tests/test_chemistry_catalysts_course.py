import unittest
import json
from pathlib import Path

class TestChemistryCatalystsCourse(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/chemistry_catalysts_colors.json")
        self.assertTrue(p.exists(), "chemistry_catalysts_colors.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "chemistry_catalysts_colors")
        parts = data.get("parts", [])
        self.assertGreaterEqual(len(parts), 3, "Expected at least 3 parts for Chemistry Catalysts & Colors")

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
        self.assertTrue("شعله" in combined, "Flame colors missing")
        self.assertTrue("کاتالیزور" in combined or "کاتالیزگر" in combined, "Catalysts missing")
        self.assertTrue("هابر" in combined or "رسوب" in combined, "Precipitates or Haber missing")

if __name__ == "__main__":
    unittest.main()
