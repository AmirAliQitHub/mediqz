import unittest
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.extract_arabic_vocab import (
    parse_mojam_entry,
    parse_footnote_line,
    clean_arabic_text,
    strip_diacritics
)

class TestExtractionEngine(unittest.TestCase):
    def test_parse_mojam_entry_with_subdefinitions(self):
        text = "اَلصِّراع : کشمکش = اَلنِّزاع ≠ اَلسِّلْم"
        entries = parse_mojam_entry(text)
        words = [e["word"] for e in entries]
        self.assertIn("اَلصِّراع", words)
        self.assertIn("اَلنِّزاع", words)
        self.assertIn("اَلسِّلْم", words)
        
        # Verify individual meanings
        sira_entry = next(e for e in entries if e["word"] == "اَلصِّراع")
        self.assertIn("کشمکش", sira_entry["full_meaning"])
        
        silm_entry = next(e for e in entries if e["word"] == "اَلسِّلْم")
        self.assertTrue("صلح" in silm_entry["full_meaning"] or "آشتی" in silm_entry["full_meaning"] or "متضاد" in silm_entry["full_meaning"])

    def test_parse_mojam_entry_with_singular_plural(self):
        text = "اَلْفَأْس : تبر «جمع: اَلْفُؤوس»"
        entries = parse_mojam_entry(text)
        words = [e["word"] for e in entries]
        self.assertIn("اَلْفَأْس", words)
        self.assertIn("اَلْفُؤوس", words)
        
        plural_entry = next(e for e in entries if e["word"] == "اَلْفُؤوس")
        self.assertIn("تبر", plural_entry["full_meaning"])

    def test_parse_footnote_multi_item_line(self):
        line = "ــ أَنْ أُسافِرَ: که سفر کنم4           ــ مَطار: فرودگاه3           ــ قاعَة: سالن2          ــ تَعارُف: آشنايی1"
        entries = parse_footnote_line(line)
        self.assertGreaterEqual(len(entries), 3)
        words = [strip_diacritics(clean_arabic_text(e["word"])) for e in entries]
        self.assertTrue(any("مطار" in w for w in words))
        self.assertTrue(any("قاعة" in w or "قاعه" in w for w in words))
        self.assertTrue(any("تعارف" in w for w in words))

    def test_parse_footnote_sentence_translation(self):
        line = "١ـ لا شَعْبَ مِنْ شُعوبِ الْأَرضِ: هیچ ملّتی از ملّت‌های زمین نیست. إِلاّ وَ کانَ لَهُ دینٌ وَ طَريقَةٌ لِلْعِبادَةِ: مگر اینکه آیین و روشی برای پرستش داشته باشد."
        entries = parse_footnote_line(line)
        self.assertGreaterEqual(len(entries), 1)
        words = [strip_diacritics(clean_arabic_text(e["word"])) for e in entries]
        self.assertTrue(any("شعب" in w or "شعوب" in w for w in words))

if __name__ == "__main__":
    unittest.main()
