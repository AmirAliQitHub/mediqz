import unittest
import json
from pathlib import Path

class TestChemistryElementsCourse(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/chemistry_elements.json")
        self.assertTrue(p.exists(), "chemistry_elements.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "chemistry_elements")
        parts = data.get("parts", [])
        self.assertGreaterEqual(len(parts), 3, "Expected at least 3 parts for periodic table")

        total_eus = sum(len(part.get("eus", [])) for part in parts)
        self.assertGreaterEqual(total_eus, 36, f"Expected at least 36 EUs, got {total_eus}")

        # Check key elements (e.g., Cu, Fe, Na, He, Cl)
        words_and_symbols = []
        for part in parts:
            for eu in part.get("eus", []):
                p_load = eu.get("payload", {})
                self.assertIn("word", p_load)
                self.assertIn("translation", p_load)
                self.assertIn("keywords", p_load)
                self.assertGreater(len(p_load["keywords"]), 0)
                words_and_symbols.append(p_load.get("word", ""))

        all_text = " ".join(words_and_symbols)
        self.assertTrue("Cu" in all_text or "مس" in all_text, "Copper missing")
        self.assertTrue("Fe" in all_text or "آهن" in all_text, "Iron missing")
        self.assertTrue("Na" in all_text or "سدیم" in all_text, "Sodium missing")

if __name__ == "__main__":
    unittest.main()
