import unittest
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.api.courses import resolve_course_payload, list_courses

class TestAllNewCoursesIntegration(unittest.TestCase):
    def test_new_courses_in_course_catalog(self):
        courses = list_courses(user=None)
        course_ids = {c.id for c in courses}
        expected_ids = {
            "builtin-persian_emla",
            "builtin-persian_araye",
            "builtin-chemistry_catalysts_colors",
            "builtin-physics_units_si",
            "builtin-arabic_translation_rules",
            "builtin-chemistry_functional_groups"
        }
        for exp in expected_ids:
            self.assertIn(exp, course_ids, f"Course {exp} should be listed in courses catalog")

    def test_new_courses_alias_resolution(self):
        alias_checks = [
            ("fa_emla", "persian_emla"),
            ("fa_araye", "persian_araye"),
            ("ch_catalysts", "chemistry_catalysts_colors"),
            ("ph_units", "physics_units_si"),
            ("ar_rules", "arabic_translation_rules"),
            ("ch_groups", "chemistry_functional_groups")
        ]
        for alias, canonical in alias_checks:
            payload = resolve_course_payload(alias)
            self.assertEqual(payload["course_id"], canonical)
            self.assertIn("parts", payload)
            self.assertGreaterEqual(len(payload["parts"]), 1)
            total_eus = sum(len(p.get("eus", [])) for p in payload["parts"])
            self.assertGreaterEqual(total_eus, 30)

if __name__ == "__main__":
    unittest.main()
