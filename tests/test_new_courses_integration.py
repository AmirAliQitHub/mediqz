import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
from app.api.courses import list_courses, resolve_course_payload

class TestNewCoursesIntegration(unittest.TestCase):
    def test_list_all_new_courses(self):
        courses = list_courses(user=None, include_dev=True)
        course_ids = [c.id for c in courses]
        self.assertIn("builtin-dini12_ayat", course_ids)
        self.assertIn("builtin-health12", course_ids)
        self.assertIn("builtin-biology_ghayd", course_ids)
        self.assertIn("builtin-chemistry_elements", course_ids)

    def test_resolve_new_courses_and_aliases(self):
        alias_groups = [
            ["dini12", "dini12_ayat", "di12_ayat", "builtin-dini12_ayat"],
            ["health12", "he12", "builtin-health12"],
            ["biology_ghayd", "bi_ghayd", "builtin-biology_ghayd"],
            ["chemistry_elements", "ch_pt", "builtin-chemistry_elements"]
        ]
        for group in alias_groups:
            for alias in group:
                data = resolve_course_payload(alias)
                self.assertIn("parts", data, f"Failed resolving {alias}")
                self.assertGreater(len(data["parts"]), 0)

    def test_fill_in_blank_answer_matching(self):
        # Dini test: student inputs "فقر ذاتی در بقا"
        dini_data = resolve_course_payload("dini12_ayat")
        l1_eu1 = dini_data["parts"][0]["eus"][0]
        kws = l1_eu1["payload"]["keywords"]
        student_input = "وابستگی و فقر ذاتی انسان به خداوند در بقا"
        matched = any(kw in student_input for kw in kws)
        self.assertTrue(matched, "Legitimate student answer for Lesson 1 Dini should match")

        # Chemistry test: student inputs "مس"
        chem_data = resolve_course_payload("chemistry_elements")
        # Cu is in Part 3
        cu_eu = None
        for part in chem_data["parts"]:
            for eu in part["eus"]:
                if "مس" in eu["payload"]["word"]:
                    cu_eu = eu
                    break
        self.assertIsNotNone(cu_eu)
        cu_kws = cu_eu["payload"]["keywords"]
        student_chem_input = "پاسخ صحیح عنصر مس با نماد Cu است"
        chem_matched = any(kw in student_chem_input for kw in cu_kws)
        self.assertTrue(chem_matched, "Legitimate student answer for Copper should match")

if __name__ == "__main__":
    unittest.main()
