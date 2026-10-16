# Arabic Textbooks (Grades 10, 11, 12) Vocabulary Courses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract, clean, and build complete interactive vocabulary courses for Iranian 1405–1406 Arabic textbooks (Grades 10, 11, and 12) including all "المعجم", all "پاورقی" (footnotes), and sub-defined terms, with precise trigger keywords and full CourseBox integration.

**Architecture:** Python-based extraction and enrichment pipeline using PyMuPDF (`fitz`) to extract all lesson vocabulary tables, footnotes, and sub-definitions from `pdfs/C110206.pdf`, `pdfs/C111206.pdf`, and `pdfs/C112206.pdf`. Persian trigger keyword generator creating high-precision keyword lists with stop-word suppression. JSON course generator outputting standard CourseBox courses into `backend/assets/courses/`. Backend API alias updates in `backend/app/api/courses.py` and automated verification of evaluation matching.

**Tech Stack:** Python 3.14, PyMuPDF (fitz), FastAPI, pytest / python unittest, React / TypeScript.

**Spec:** `docs/superpowers/specs/2026-10-16-arabic-courses-design.md`

## Global Constraints

- Course schema must strictly match CourseBox structure: `course_id`, `title`, `topic_code`, `subject`, `grade`, `version`, `description`, `parts`.
- Every EU must be `type: "fill_in_the_blank"` with payload containing `word`, `sentence`, `prompt`, `full_meaning`, `target_word`, `keywords`.
- 100% of footnote words across all lessons in all three books must be included.
- Words defined in explanations of other words (singulars, plurals, antonyms, synonyms with separate value) must be extracted as separate EUs.
- No generic auxiliary verbs or function words (e.g. "کرد", "شد", "بود", "یک", "از", "در", "به", "با", "او") are permitted as standalone keywords.
- Old Grade 12 `arabic12_vocab.json` lacking footnotes must be completely replaced.

## Review Focus

1. **Footnote Omission:** Ensure every single footnote number (۱، ۲، ۳...) on text pages in each lesson is captured and verified.
2. **False-Positive Keyword Matching:** Ensure no EU keyword allows arbitrary unrelated Persian sentences to pass as correct.
3. **Sub-defined Vocabulary Separation:** Ensure words like `اَلصِّراع = اَلنِّزاع ≠ اَلسِّلْم` produce separate EUs for `اَلصِّراع`, `اَلنِّزاع`, and `اَلسِّلْم`.
4. **Harakat and Diacritics Preservation:** The target `word` must maintain clear Arabic diacritics (tashkeel), while matching logic in `FillInTheBlank.tsx` normalizes it safely.
5. **Course ID and Topic Code Uniqueness:** All EU IDs (e.g. `AR10-P1-FITB-1`, `AR11-P2-FITB-5`) and Part IDs must be strictly unique.

---

### Task 1: Extraction & Parsing Engine for Vocabulary, Sub-definitions, and Footnotes

**Files:**
- Create: `scripts/extract_arabic_vocab.py`
- Create: `tests/test_extraction_engine.py`

**Interfaces:**
- Produces: `extract_lesson_vocab(pdf_path: str, lesson_meta: dict) -> List[dict]`
- Produces: `extract_lesson_footnotes(pdf_path: str, lesson_meta: dict) -> List[dict]`

- [ ] **Step 1: Write failing test for extraction engine**

```python
# tests/test_extraction_engine.py
import pytest
from scripts.extract_arabic_vocab import parse_mojam_entry, parse_footnote_line

def test_parse_mojam_entry_with_subdefinitions():
    text = "اَلصِّراع : کشمکش = اَلنِّزاع ≠ اَلسِّلْم"
    entries = parse_mojam_entry(text)
    words = [e["word"] for e in entries]
    assert "اَلصِّراع" in words
    assert "اَلنِّزاع" in words
    assert "اَلسِّلْم" in words

def test_parse_mojam_entry_with_singular_plural():
    text = "اَلْفَأْس : تبر «جمع: اَلْفُؤوس»"
    entries = parse_mojam_entry(text)
    words = [e["word"] for e in entries]
    assert "اَلْفَأْس" in words
    assert "اَلْفُؤوس" in words

def test_parse_footnote_line():
    line = "١ـ اال شَعْبَ مِنْ شُعوبِ اأْلَرضِ: هیچ ملّتی از ملّت‌های زمین نیست."
    entries = parse_footnote_line(line)
    assert len(entries) > 0
    assert any("شَعْب" in e["word"] or "شُعوب" in e["word"] for e in entries)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests/test_extraction_engine.py`
Expected: FAIL with ModuleNotFoundError or import error.

- [ ] **Step 3: Implement extraction engine in `scripts/extract_arabic_vocab.py`**

Implement `parse_mojam_entry`, `parse_footnote_line`, `extract_lesson_vocab`, and `extract_lesson_footnotes` handling PDF coordinate extraction and text parsing.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests/test_extraction_engine.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/extract_arabic_vocab.py tests/test_extraction_engine.py
git commit -m "feat: implement Arabic vocabulary and footnote extraction engine"
```

---

### Task 2: High-Precision Trigger Keyword Generator with Anti-False-Positive Filtering

**Files:**
- Modify: `scripts/extract_arabic_vocab.py`
- Create: `tests/test_keyword_generator.py`

**Interfaces:**
- Consumes: extracted vocabulary entries from Task 1
- Produces: `generate_keywords(word: str, meaning: str) -> List[str]`
- Produces: `validate_keywords_against_distractors(keywords: List[str]) -> bool`

- [ ] **Step 1: Write failing test for keyword generator**

```python
# tests/test_keyword_generator.py
import unittest
from scripts.extract_arabic_vocab import generate_keywords, validate_keywords_against_distractors

class TestKeywordGenerator(unittest.TestCase):
    def test_verb_keywords_no_standalone_auxiliary(self):
        kws = generate_keywords("أَحْضَرَ", "آورد ، حاضر کرد")
        self.assertIn("آورد", kws)
        self.assertIn("حاضر کرد", kws)
        self.assertNotIn("کرد", kws)  # Crucial: no standalone auxiliary
        self.assertTrue(validate_keywords_against_distractors(kws))

    def test_distractor_sentence_does_not_match(self):
        kws = generate_keywords("اَلْحَنيف", "یکتاپرست")
        distractor = "امروز هوا بسیار سرد بود و من به مدرسه رفتم"
        # Simulate FillInTheBlank.tsx matching
        matched = any(kw in distractor for kw in kws if len(kw) >= 2)
        self.assertFalse(matched)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests/test_keyword_generator.py`
Expected: FAIL with AttributeError or missing functions.

- [ ] **Step 3: Implement `generate_keywords` and `validate_keywords_against_distractors`**

Implement keyword generation expanding synonyms, verb tenses (past/present/infinitive), hyphenated/non-hyphenated forms, and strictly pruning stop words and short generic particles.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests/test_keyword_generator.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/extract_arabic_vocab.py tests/test_keyword_generator.py
git commit -m "feat: implement high-precision trigger keyword generator"
```

---

### Task 3: Grade 10 Course Generation (`arabic10_vocab.json`)

**Files:**
- Create: `backend/assets/courses/arabic10_vocab.json`
- Create: `tests/test_arabic10_course.py`

**Interfaces:**
- Consumes: extraction and keyword tools from Tasks 1 & 2
- Produces: `backend/assets/courses/arabic10_vocab.json` with 8 parts and verified EUs.

- [ ] **Step 1: Write failing test for Grade 10 course**

```python
# tests/test_arabic10_course.py
import unittest, json
from pathlib import Path

class TestArabic10Course(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/arabic10_vocab.json")
        self.assertTrue(p.exists())
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["course_id"], "arabic10_vocab")
        self.assertEqual(len(data["parts"]), 8)
        total_eus = sum(len(part["eus"]) for part in data["parts"])
        self.assertGreaterEqual(total_eus, 150)
        # Check that footnotes are included
        words = [eu["payload"]["word"] for part in data["parts"] for eu in part["eus"]]
        self.assertTrue(any("مَطار" in w for w in words))  # P12 footnote
        self.assertTrue(any("جَواز" in w for w in words))  # P47 footnote
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests/test_arabic10_course.py`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Generate Grade 10 Course**

Execute the generator script on `pdfs/C110206.pdf`, verifying all 8 lessons, all المعجم words, all footnotes, and clean keywords, then save to `backend/assets/courses/arabic10_vocab.json`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests/test_arabic10_course.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/assets/courses/arabic10_vocab.json tests/test_arabic10_course.py
git commit -m "feat: generate comprehensive Grade 10 Arabic vocabulary course"
```

---

### Task 4: Grade 11 Course Generation (`arabic11_vocab.json`)

**Files:**
- Create: `backend/assets/courses/arabic11_vocab.json`
- Create: `tests/test_arabic11_course.py`

**Interfaces:**
- Consumes: extraction and keyword tools from Tasks 1 & 2
- Produces: `backend/assets/courses/arabic11_vocab.json` with 7 parts and verified EUs.

- [ ] **Step 1: Write failing test for Grade 11 course**

```python
# tests/test_arabic11_course.py
import unittest, json
from pathlib import Path

class TestArabic11Course(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/arabic11_vocab.json")
        self.assertTrue(p.exists())
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["course_id"], "arabic11_vocab")
        self.assertEqual(len(data["parts"]), 7)
        total_eus = sum(len(part["eus"]) for part in data["parts"])
        self.assertGreaterEqual(total_eus, 140)
        # Check that footnotes are included
        words = [eu["payload"]["word"] for part in data["parts"] for eu in part["eus"]]
        self.assertTrue(any("أَهْدیٰ" in w or "اهدی" in w for w in words))  # P18 footnote
        self.assertTrue(any("صَيْدَليَّة" in w or "صيدلية" in w for w in words))  # P80 footnote
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests/test_arabic11_course.py`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Generate Grade 11 Course**

Execute the generator script on `pdfs/C111206.pdf`, verifying all 7 lessons, all المعجم words, all footnotes, and clean keywords, then save to `backend/assets/courses/arabic11_vocab.json`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests/test_arabic11_course.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/assets/courses/arabic11_vocab.json tests/test_arabic11_course.py
git commit -m "feat: generate comprehensive Grade 11 Arabic vocabulary course"
```

---

### Task 5: Grade 12 Course Generation (`arabic12_vocab.json`)

**Files:**
- Modify: `backend/assets/courses/arabic12_vocab.json`
- Create: `tests/test_arabic12_course.py`

**Interfaces:**
- Consumes: extraction and keyword tools from Tasks 1 & 2
- Produces: Updated `backend/assets/courses/arabic12_vocab.json` with 4 parts, all المعجم words, all footnotes, and sub-defined terms.

- [ ] **Step 1: Write failing test for Grade 12 course replacement**

```python
# tests/test_arabic12_course.py
import unittest, json
from pathlib import Path

class TestArabic12Course(unittest.TestCase):
    def test_course_structure_and_completeness(self):
        p = Path("backend/assets/courses/arabic12_vocab.json")
        self.assertTrue(p.exists())
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["course_id"], "arabic12_vocab")
        self.assertEqual(len(data["parts"]), 4)
        total_eus = sum(len(part["eus"]) for part in data["parts"])
        # Old course only had 65 EUs; new course must have > 90 EUs including footnotes
        self.assertGreaterEqual(total_eus, 90)
        words = [eu["payload"]["word"] for part in data["parts"] for eu in part["eus"]]
        # Check footnotes from lesson 1 & 4 that were missing
        self.assertTrue(any("شَعْب" in w or "شُعوب" in w for w in words))  # P14 footnote
        self.assertTrue(any("جاءَ بِـ" in w or "جاءَ بِهِ" in w for w in words))  # P62 footnote
        # Check sub-definitions from lesson 1
        self.assertTrue(any("اَلنِّزاع" in w for w in words))
        self.assertTrue(any("اَلسِّلْم" in w for w in words))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests/test_arabic12_course.py`
Expected: FAIL (missing footnote words and < 90 EUs in old file).

- [ ] **Step 3: Generate replacement Grade 12 Course**

Execute the generator script on `pdfs/C112206.pdf`, verifying all 4 lessons, all المعجم words, all footnotes, and all sub-definitions, overwriting `backend/assets/courses/arabic12_vocab.json`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests/test_arabic12_course.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/assets/courses/arabic12_vocab.json tests/test_arabic12_course.py
git commit -m "feat: replace Grade 12 Arabic course with complete vocabulary and footnotes"
```

---

### Task 6: Backend & Frontend Course Integration & End-to-End Verification

**Files:**
- Modify: `backend/app/api/courses.py`
- Modify: `frontend/src/components/student/CourseLibrary.tsx` (if needed for grade filtering)
- Create: `tests/test_courses_api_integration.py`

**Interfaces:**
- Consumes: `arabic10_vocab.json`, `arabic11_vocab.json`, `arabic12_vocab.json`
- Produces: Working API endpoints and proper course listing.

- [ ] **Step 1: Write failing test for API resolution of all three courses**

```python
# tests/test_courses_api_integration.py
import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

class TestCoursesAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_list_all_arabic_courses(self):
        resp = self.client.get("/courses")
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        course_ids = [c["id"] for c in items]
        self.assertIn("builtin-arabic10_vocab", course_ids)
        self.assertIn("builtin-arabic11_vocab", course_ids)
        self.assertIn("builtin-arabic12_vocab", course_ids)

    def test_get_individual_courses(self):
        for cid in ["arabic10", "arabic11", "arabic12"]:
            resp = self.client.get(f"/courses/{cid}")
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("parts", data)
            self.assertGreater(len(data["parts"]), 0)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests/test_courses_api_integration.py`
Expected: FAIL on `arabic10` / `arabic11` missing aliases.

- [ ] **Step 3: Update `backend/app/api/courses.py` and frontend filter support**

Add aliases for `arabic10`, `arabic10_vocab`, `arabic11`, `arabic11_vocab`, `arabic12`, `arabic12_vocab` in `ALIAS_MAP`. Ensure `CourseLibrary.tsx` filters by `عربی` and respective grade tags.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests/test_courses_api_integration.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/courses.py tests/test_courses_api_integration.py
git commit -m "feat: register Arabic courses in backend ALIAS_MAP and API"
```
