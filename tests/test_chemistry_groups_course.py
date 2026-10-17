import unittest
import json
from pathlib import Path

class TestChemistryGroupsCourse(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/chemistry_functional_groups.json")
        self.assertTrue(p.exists(), "chemistry_functional_groups.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "chemistry_functional_groups")
        parts = data.get("parts", [])
        self.assertGreaterEqual(len(parts), 3, "Expected at least 3 parts for Functional Groups")

        total_eus = sum(len(part.get("eus", [])) for part in parts)
        self.assertGreaterEqual(total_eus, 36, f"Expected at least 36 EUs, got {total_eus}")

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
        self.assertTrue("استر" in combined or "اتر" in combined, "Ester or Ether missing")
        self.assertTrue("آسپرین" in combined or "استامینوفن" in combined, "Drugs missing")
        self.assertTrue("آمید" in combined or "آمین" in combined, "Amide or Amine missing")

if __name__ == "__main__":
    unittest.main()
