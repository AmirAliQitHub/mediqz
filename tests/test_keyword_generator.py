import unittest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.extract_arabic_vocab import (
    generate_keywords,
    validate_keywords_against_distractors,
    STOP_WORDS
)

class TestKeywordGenerator(unittest.TestCase):
    def test_verb_keywords_no_standalone_auxiliary(self):
        kws = generate_keywords("أَحْضَرَ", "آورد ، حاضر کرد")
        self.assertIn("آورد", kws)
        self.assertIn("حاضر کرد", kws)
        self.assertNotIn("کرد", kws)
        self.assertNotIn("شد", kws)
        self.assertTrue(validate_keywords_against_distractors(kws))

    def test_stop_words_never_in_keywords(self):
        for stop in STOP_WORDS:
            kws = generate_keywords("فِعْل", f"کاری {stop} است")
            self.assertNotIn(stop, kws)

    def test_distractor_sentence_does_not_match(self):
        kws = generate_keywords("اَلْحَنيف", "یکتاپرست")
        distractor = "امروز هوا بسیار سرد بود و من به مدرسه رفتم و غذا خوردم"
        # Simulate FillInTheBlank.tsx matching
        matched = any(kw in distractor for kw in kws if len(kw) >= 2)
        self.assertFalse(matched)

    def test_noun_variations_with_and_without_zwnj(self):
        kws = generate_keywords("اَلْحَنيف", "یکتاپرست")
        # Should include both space and ZWNJ / no space variants
        has_joined = any("یکتاپرست" in k or "یکتا پرست" in k for k in kws)
        self.assertTrue(has_joined)

    def test_infinitive_and_past_forms_generated(self):
        kws = generate_keywords("عَلَّقَ", "آویخت")
        self.assertIn("آویخت", kws)
        self.assertTrue("آویختن" in kws or "آویزان کرد" in kws or "آویزان کردن" in kws)

if __name__ == "__main__":
    unittest.main()
