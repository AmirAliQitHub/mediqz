import unittest
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.extract_arabic_vocab import STOP_WORDS, strip_diacritics

class TestArabic10Course(unittest.TestCase):
    def setUp(self):
        self.course_path = Path("backend/assets/courses/arabic10_vocab.json")

    def test_course_file_exists_and_schema_valid(self):
        self.assertTrue(self.course_path.exists(), "arabic10_vocab.json must exist")
        with open(self.course_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "arabic10_vocab")
        self.assertEqual(data.get("topic_code"), "AR10")
        self.assertEqual(data.get("grade"), "10")
        self.assertEqual(data.get("subject"), "عربی")
        self.assertEqual(len(data.get("parts", [])), 8, "Grade 10 Arabic has 8 lessons")

        all_eus = []
        for p_idx, part in enumerate(data["parts"]):
            self.assertEqual(part["part_id"], f"p{p_idx+1}")
            self.assertTrue(len(part.get("eus", [])) > 0, f"Part {p_idx+1} must have EUs")
            all_eus.extend(part["eus"])

        self.assertGreaterEqual(len(all_eus), 150, "Total Grade 10 EUs should be >= 150")

        # Verify EU schema and keywords
        seen_ids = set()
        for eu in all_eus:
            eu_id = eu["id"]
            self.assertNotIn(eu_id, seen_ids, f"Duplicate EU ID: {eu_id}")
            seen_ids.add(eu_id)

            self.assertEqual(eu["type"], "fill_in_the_blank")
            payload = eu["payload"]
            self.assertTrue(payload.get("word"))
            self.assertTrue(payload.get("full_meaning"))
            self.assertTrue(payload.get("prompt"))
            keywords = payload.get("keywords", [])
            self.assertGreater(len(keywords), 0, f"Keywords missing for EU {eu_id}")
            for kw in keywords:
                if eu["payload"]["word"] not in ["ذاكَ", "ذا", "ذٰلِكَ", "هٰذا", "أَصْبَحَ", "صارَ", "كانَ", "لَيْسَ", "لا"]:
                    self.assertNotIn(kw, STOP_WORDS, f"Stop word '{kw}' found in EU {eu_id}")

        # Footnote verification
        all_words_norm = [strip_diacritics(eu["payload"]["word"]) for eu in all_eus]
        self.assertTrue(any("مطار" in w for w in all_words_norm), "Footnote 'مَطار' should be present")
        self.assertTrue(any("جواز" in w for w in all_words_norm), "Footnote 'جَواز' should be present")
        self.assertTrue(any("شريحة" in w or "شريحه" in w for w in all_words_norm), "Footnote 'شَريحَة' should be present")

if __name__ == "__main__":
    unittest.main()
