import unittest
import sys
from pathlib import Path

# Add backend to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.api.courses import resolve_course_payload, list_courses

class TestCoursesAPIIntegration(unittest.TestCase):
    def test_list_all_arabic_courses(self):
        items = list_courses(user=None)
        course_ids = [c.id for c in items]
        
        self.assertIn("builtin-arabic10_vocab", course_ids)
        self.assertIn("builtin-arabic11_vocab", course_ids)
        self.assertIn("builtin-arabic12_vocab", course_ids)

        c10 = next(c for c in items if c.id == "builtin-arabic10_vocab")
        self.assertEqual(c10.subject, "عربی")
        self.assertEqual(c10.grade, "پایه دهم")
        self.assertEqual(c10.parts_count, 8)
        self.assertEqual(c10.slides_count, 290)

        c11 = next(c for c in items if c.id == "builtin-arabic11_vocab")
        self.assertEqual(c11.subject, "عربی")
        self.assertEqual(c11.grade, "پایه یازدهم")
        self.assertEqual(c11.parts_count, 7)
        self.assertEqual(c11.slides_count, 204)

        c12 = next(c for c in items if c.id == "builtin-arabic12_vocab")
        self.assertEqual(c12.subject, "عربی")
        self.assertEqual(c12.grade, "پایه دوازدهم")
        self.assertEqual(c12.parts_count, 4)
        self.assertEqual(c12.slides_count, 118)

    def test_get_individual_courses_with_aliases(self):
        for cid in [
            "arabic10", "arabic10_vocab", "builtin-arabic10_vocab",
            "arabic11", "arabic11_vocab", "builtin-arabic11_vocab",
            "arabic12", "arabic12_vocab", "builtin-arabic12_vocab"
        ]:
            data = resolve_course_payload(cid)
            self.assertIn("parts", data, f"Parts missing for {cid}")
            self.assertGreater(len(data["parts"]), 0, f"No parts in {cid}")

    def test_answer_matching_simulation(self):
        # Simulate FillInTheBlank.tsx answer evaluation on sample Arabic 10, 11, 12 EUs
        from scripts.extract_arabic_vocab import normalize_for_lookup
        
        c12 = resolve_course_payload("arabic12_vocab")
        p1_eus = c12["parts"][0]["eus"]
        
        # Test أَحْضَرَ: keywords include "آورد", "حاضر کرد"
        ahzara_eu = next(eu for eu in p1_eus if eu["payload"]["word"] == "أَحْضَرَ")
        kws = ahzara_eu["payload"]["keywords"]
        
        # Positive answer test: user types "آورد"
        user_input_pos = "آورد"
        matched = any(kw == user_input_pos or (len(kw) >= 2 and kw in user_input_pos) for kw in kws)
        self.assertTrue(matched, "Accurate user translation should pass")

        # Negative distractor test: user types unrelated Persian text
        user_input_neg = "من امروز به مدرسه رفتم و کتاب خواندم"
        matched_neg = any(kw == user_input_neg or (len(kw) >= 2 and kw in user_input_neg) for kw in kws)
        self.assertFalse(matched_neg, "Irrelevant sentence should NOT pass")

if __name__ == "__main__":
    unittest.main()
