import unittest
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))
from scripts.extract_arabic_vocab import STOP_WORDS, strip_diacritics

class TestArabic12Course(unittest.TestCase):
    def setUp(self):
        self.course_path = Path("backend/assets/courses/arabic12_vocab.json")

    def test_course_file_exists_and_schema_valid(self):
        self.assertTrue(self.course_path.exists(), "arabic12_vocab.json must exist")
        with open(self.course_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data.get("course_id"), "arabic12_vocab")
        self.assertEqual(data.get("topic_code"), "AR12")
        self.assertEqual(data.get("grade"), "12")
        self.assertEqual(data.get("subject"), "عربی")
        self.assertEqual(len(data.get("parts", [])), 4, "Grade 12 Arabic has 4 lessons")

        all_eus = []
        for p_idx, part in enumerate(data["parts"]):
            self.assertEqual(part["part_id"], f"p{p_idx+1}")
            self.assertTrue(len(part.get("eus", [])) > 0, f"Part {p_idx+1} must have EUs")
            all_eus.extend(part["eus"])

        # Old file had 65 EUs; new comprehensive file must have >= 110 EUs
        self.assertGreaterEqual(len(all_eus), 110, f"Expected >= 110 EUs, found {len(all_eus)}")

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

        all_words_norm = [strip_diacritics(eu["payload"]["word"]) for eu in all_eus]

        # 1. Footnotes from all 4 lessons
        self.assertTrue(any("شعب" in w or "شعوب" in w for w in all_words_norm), "P14 footnote 'شَعْب' missing")
        self.assertTrue(any("طريقه" in w or "طريقة" in w for w in all_words_norm), "P14 footnote 'طَريقَة' missing")
        self.assertTrue(any("شاهد" in w for w in all_words_norm), "P30 footnote 'شاهَدَ' missing")
        self.assertTrue(any("كلاهما" in w for w in all_words_norm), "P46 footnote 'كِلاهُما' missing")
        self.assertTrue(any("جاء به" in w or "جاء ب" in w for w in all_words_norm), "P62 footnote 'جاءَ بِـ' missing")
        self.assertTrue(any("استلم" in w for w in all_words_norm), "P62 footnote 'اِسْتَلَمَ' missing")
        self.assertTrue(any("انشد" in w or "أنشد" in w for w in all_words_norm), "P63 footnote 'أَنْشَدَ' missing")

        # 2. Sub-defined terms (antonyms, synonyms, singulars/plurals)
        self.assertTrue(any("النزاع" in w for w in all_words_norm), "Subdefinition 'اَلنِّزاع' missing")
        self.assertTrue(any("السلم" in w for w in all_words_norm), "Subdefinition 'اَلسِّلْم' missing")
        self.assertTrue(any("الصغار" in w for w in all_words_norm), "Subdefinition 'اَلصِّغار' missing")
        self.assertTrue(any("الفؤوس" in w for w in all_words_norm), "Subdefinition 'اَلْفُؤوس' missing")
        self.assertTrue(any("الصنم" in w for w in all_words_norm), "Subdefinition 'اَلصَّنَم' missing")

if __name__ == "__main__":
    unittest.main()
