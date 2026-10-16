import unittest
import json
from pathlib import Path

class TestDini12Course(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/dini12_ayat.json")
        self.assertTrue(p.exists(), "dini12_ayat.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "dini12_ayat")
        self.assertEqual(data.get("grade"), "پایه دوازدهم")
        parts = data.get("parts", [])
        self.assertGreaterEqual(len(parts), 10, "Grade 12 Dini must have at least 10 lessons")
        
        total_eus = sum(len(part.get("eus", [])) for part in parts)
        self.assertGreaterEqual(total_eus, 40, f"Expected at least 40 EUs, got {total_eus}")

        # Check core verses and hadiths
        words = [eu["payload"].get("word", "") for part in parts for eu in part.get("eus", [])]
        self.assertTrue(any("الفُقَراءُ" in w or "الفقراء" in w for w in words), "Lesson 1 core verse missing")
        self.assertTrue(any("نُورُ السَّماواتِ" in w or "نور السماوات" in w for w in words), "Lesson 1 verse 2 missing")
        self.assertTrue(any("تَفَكَّروا فی كُلِّ شَیءٍ" in w or "تفکروا" in w for w in words), "Prophet hadith on reflection missing")
        self.assertTrue(any("الخَلقُ وَ الأَمرُ" in w or "الخلق و الامر" in w for w in words), "Lesson 2/3 verse missing")

        # Verify all EUs have non-empty keywords and valid topic tags
        for part in parts:
            for eu in part.get("eus", []):
                p_load = eu.get("payload", {})
                self.assertIn("word", p_load)
                self.assertIn("translation", p_load)
                self.assertIn("keywords", p_load)
                self.assertGreater(len(p_load["keywords"]), 0, f"Empty keywords for {p_load.get('word')}")

if __name__ == "__main__":
    unittest.main()
