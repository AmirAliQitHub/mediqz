# Arabic Textbooks (Grades 10, 11, 12) Vocabulary Courses Design Spec

**Date:** 2026-10-16  
**Status:** Approved  
**Author:** Pair Programming Agent  

---

## 1. Intent & Purpose

High school Arabic textbooks for the Iranian national curriculum (1405–1406) contain critical vocabulary necessary for final examinations (امتحانات نهایی) and college entrance exams (کنکور). 
A significant portion of exam questions target:
1. Words explicitly listed in the chapter vocabulary tables (**اَلْمُعْجَم**).
2. Words and idiomatic expressions translated in page footnotes (**پاورقی**).
3. Words introduced inside descriptions of other words (singular/plural pairs like `مفرد: اَلصَّنَم`, antonyms like `≠ اَلسِّلْم`, synonyms like `= اَلنِّزاع`, or verb derivatives).

The existing 12th-grade course (`arabic12_vocab.json`) was incomplete: it only had 65 words from the main المعجم tables, omitted all footnote words, omitted words in descriptions, and Grades 10 and 11 were entirely absent.

This design establishes the full pipeline and course architecture to generate comprehensive, verified, high-quality interactive vocabulary courses for:
- Grade 10: `arabic10_vocab.json` (8 lessons / parts)
- Grade 11: `arabic11_vocab.json` (7 lessons / parts)
- Grade 12: `arabic12_vocab.json` (4 lessons / parts)

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Full Scope Extraction:**
  - 100% of words in the "اَلْمُعْجَم" tables for all chapters of Grade 10, 11, 12.
  - 100% of words and phrases defined in "پاورقی" (footnotes) for all chapters.
  - Distinct extraction of sub-defined words: when a word is introduced in the explanation of another word with distinct semantic value (e.g. `اَلصِّراع = اَلنِّزاع ≠ اَلسِّلْم`, singulars of plurals like `اَلْفُؤوس` / `اَلْفَأْس`, `اَلصَّنَم` / `اَأْلَصْنام`, `اَلْقُرْبان` / `اَلْقَرابين`), it must have its own standalone learning unit (EU).
- **Trigger Keyword Quality:**
  - Provide a rich, curated list of Persian translation trigger keywords (`keywords`) for every EU.
  - Accommodate student writing variations: past/present forms, infinitives, common Persian synonyms, optional ZWNJ (نیم‌فاصله) forms.
  - Prevent false positives: avoid standalone generic stop-words (e.g., "کرد", "شد", "بود", "یک", "از", "به", "با", "در", "او") that could cause unrelated user inputs to pass as correct.
- **System Integration:**
  - Standard JSON format conforming to CourseBox schema (`course_id`, `parts`, `eus`, `type: fill_in_the_blank`, `payload: {word, sentence, prompt, full_meaning, target_word, keywords}`).
  - Place courses in `backend/assets/courses/`.
  - Register aliases and course mappings in `backend/app/api/courses.py`.
  - Verify seamless operation with frontend `FillInTheBlank.tsx` and `CourseLibrary.tsx`.

### Non-Goals
- Full sentence grammar or translation courses (this is strictly a vocabulary flashcard/quiz course).
- Mutating or recompressing the PDF textbook assets.

### Anti-Goals
- "Loose matching" that accepts nonsense answers: each trigger keyword must strictly evaluate to a correct translation of the target Arabic word.
- Overlooked footnotes: any footnote word skipped degrades the student's preparation.

---

## 3. Data Extraction & Architecture

### 3.1 Course Breakdown

| Course ID | Grade | Textbook | Lessons / Parts | Target EUs |
|-----------|-------|----------|-----------------|------------|
| `arabic10_vocab` | 10 | `C110206.pdf` (عربی، زبان قرآن ۱) | 8 Lessons | ~160–200 EUs |
| `arabic11_vocab` | 11 | `C111206.pdf` (عربی، زبان قرآن ۲) | 7 Lessons | ~150–190 EUs |
| `arabic12_vocab` | 12 | `C112206.pdf` (عربی، زبان قرآن ۳) | 4 Lessons | ~100–130 EUs |

### 3.2 EU Structure (Fill-In-The-Blank)

```json
{
  "id": "AR10-P1-FITB-1",
  "type": "fill_in_the_blank",
  "order": 1,
  "topic_tag": "الدَّرْسُ الْأَوَّلُ",
  "payload": {
    "word": "أَحْضَرَ",
    "sentence": "فَأَحْضَرُوهُ لِلْمُحاكَمَةِ وَ سَأَلُوهُ.",
    "prompt": "معنی یا معادل واژه «أَحْضَرَ» را بنویسید:",
    "full_meaning": "آورد، حاضر کرد",
    "target_word": "أَحْضَرَ",
    "keywords": [
      "آورد",
      "آوردن",
      "حاضر کرد",
      "حاضر ساخت",
      "حاضر کردن"
    ]
  }
}
```

### 3.3 Keyword Formulation Guidelines

The frontend evaluation algorithm (`FillInTheBlank.tsx`) checks:
1. Exact normalized match: `normalizedUser === kw`
2. Substring inclusion if keyword length >= 2: `normalizedUser.includes(kw)`
3. Jaccard / length ratio match if length >= 3: `kw.includes(normalizedUser) && ratio >= 0.7`

To balance sensitivity and precision:
1. **Verbs:** Include past stem, past third person, present stem/form where natural, and infinitive (e.g. `آورد`, `آوردن`, `حاضر کرد`, `حاضر کردن`). Never include auxiliary "کرد" or "شد" alone.
2. **Nouns/Adjectives:** Include singular/plural forms matching the target word, primary synonyms, and hyphenated/non-hyphenated forms (e.g. `یکتاپرست`, `یکتا پرست`, `موحد`).
3. **Purity:** Filter out words <= 2 characters unless they are specific content words. Never include pronouns, prepositions, or vague prefixes.

---

## 4. Verification & Testing Strategy

1. **Extraction Completeness Verification:**
   - Automated check comparing every footnote found on every page against the generated course EUs.
   - Automated check comparing every entry in the textbook `المعجم` table against the generated course EUs.
2. **Keyword Quality Verification:**
   - Automated validation testing each EU's keywords against:
     - Expected valid answers (must pass: positive assertions).
     - Obvious distractor/off-topic strings (must fail: negative assertions, e.g. "من امروز به مدرسه رفتم و تکالیفم را انجام دادم و کار کردم").
3. **Schema & Backend Integration Verification:**
   - Validate JSON syntax, key presence, unique EU IDs across all courses.
   - Test `GET /courses` and `GET /courses/{course_id}` via FastAPI test client / curl.
   - Verify frontend library filtering by subject `عربی` and grades `پایه دهم`, `پایه یازدهم`, `پایه دوازدهم`.
