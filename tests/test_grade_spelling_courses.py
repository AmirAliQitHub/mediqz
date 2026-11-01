import unittest
import json
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

class TestGradeSpellingCourses(unittest.TestCase):
    def test_persian10_emla_structure(self):
        p = Path("backend/assets/courses/persian10_emla.json")
        self.assertTrue(p.exists(), "persian10_emla.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "persian10_emla")
        parts = data.get("parts", [])
        self.assertEqual(len(parts), 8, f"Expected 8 parts for Persian 10 Emla, got {len(parts)}")

        total_eus = 0
        for part in parts:
            eus = part.get("eus", [])
            self.assertGreaterEqual(len(eus), 8, f"Part {part.get('part_id')} should have at least 8 EUs")
            total_eus += len(eus)
            for eu in eus:
                self.assertIn("payload", eu)
                payload = eu["payload"]
                self.assertTrue(payload.get("word") or payload.get("statement"))
                if eu.get("type") == "fill_in_the_blank":
                    self.assertIn("keywords", payload)
                    self.assertGreaterEqual(len(payload["keywords"]), 1)
                    self.assertIn("isolated_prompt", payload)
                    self.assertIn("sentence", payload)
        self.assertGreaterEqual(total_eus, 80, f"Expected at least 80 EUs in Persian 10 Emla, got {total_eus}")

    def test_persian11_emla_structure(self):
        p = Path("backend/assets/courses/persian11_emla.json")
        self.assertTrue(p.exists(), "persian11_emla.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "persian11_emla")
        parts = data.get("parts", [])
        self.assertEqual(len(parts), 8, f"Expected 8 parts for Persian 11 Emla, got {len(parts)}")

        total_eus = 0
        for part in parts:
            eus = part.get("eus", [])
            self.assertGreaterEqual(len(eus), 8, f"Part {part.get('part_id')} should have at least 8 EUs")
            total_eus += len(eus)
            for eu in eus:
                payload = eu["payload"]
                if eu.get("type") == "fill_in_the_blank":
                    self.assertIn("keywords", payload)
                    self.assertGreaterEqual(len(payload["keywords"]), 1)
                    self.assertIn("isolated_prompt", payload)
        self.assertGreaterEqual(total_eus, 80, f"Expected at least 80 EUs in Persian 11 Emla, got {total_eus}")

    def test_persian12_emla_structure(self):
        p = Path("backend/assets/courses/persian12_emla.json")
        self.assertTrue(p.exists(), "persian12_emla.json does not exist")
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "persian12_emla")
        parts = data.get("parts", [])
        self.assertEqual(len(parts), 8, f"Expected 8 parts for Persian 12 Emla, got {len(parts)}")

        total_eus = 0
        for part in parts:
            eus = part.get("eus", [])
            self.assertGreaterEqual(len(eus), 8, f"Part {part.get('part_id')} should have at least 8 EUs")
            total_eus += len(eus)
            for eu in eus:
                payload = eu["payload"]
                if eu.get("type") == "fill_in_the_blank":
                    self.assertIn("keywords", payload)
                    self.assertGreaterEqual(len(payload["keywords"]), 1)
                    self.assertIn("isolated_prompt", payload)
        self.assertGreaterEqual(total_eus, 80, f"Expected at least 80 EUs in Persian 12 Emla, got {total_eus}")

    def test_alias_resolution(self):
        from app.api.courses import resolve_course_payload
        for alias, cid in [("fa10_emla", "persian10_emla"), ("fa11_emla", "persian11_emla"), ("fa12_emla", "persian12_emla")]:
            payload = resolve_course_payload(alias)
            self.assertEqual(payload["course_id"], cid)
            self.assertEqual(len(payload["parts"]), 8)

if __name__ == "__main__":
    unittest.main()
