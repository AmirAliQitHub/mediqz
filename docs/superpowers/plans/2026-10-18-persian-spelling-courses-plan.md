# Implementation Plan: Comprehensive 3-Grade Persian Spelling Courses & Dual-Mode UI
**Spec:** `docs/superpowers/specs/2026-10-18-persian-spelling-courses-spec.md`  
**Date:** 2026-10-18  

---

### Task 1: Comprehensive Data Extraction & Course Generator Script
- Create: `scripts/generate_grade_spelling_courses.py`
  - Extracts spelling candidate words from `persian10_vocab.json`, `persian11_vocab.json`, and `persian12_vocab.json` across all 8 chapters.
  - Pairs each word with its authentic confusable homophone (ص/ث/س، ط/ت، ض/ظ/ذ/ز، ق/غ، ح/ه، ع/ء/ا، واو معدوله).
  - Populates `isolated_prompt`, `context_sentence`, `sentence`, `meaning`, `full_meaning`, `keywords`, and `trap_note`.
  - Generates:
    - `backend/assets/courses/persian10_emla.json` (8 parts)
    - `backend/assets/courses/persian11_emla.json` (8 parts)
    - `backend/assets/courses/persian12_emla.json` (8 parts)
- Verification: generator execution produces 3 JSON files with 8 parts each and valid EUs.

---

### Task 2: Backend Course Alias Mapping & Automated Tests
- Modify: `backend/app/api/courses.py`
  - Register aliases `persian10_emla`, `fa10_emla`, `persian11_emla`, `fa11_emla`, `persian12_emla`, `fa12_emla`.
- Create: `tests/test_grade_spelling_courses.py`
  - Verify all 3 courses exist, have exactly 8 parts each, have valid EUs with pairs and keywords, and resolve via the API.
- Verification: `python3 -m unittest tests/test_grade_spelling_courses.py` passes cleanly.

---

### Task 3: Dual-Mode Interactive UI in Frontend (با یا بدون جمله کمکی)
- Modify: `frontend/src/store/useCourseStore.ts`
  - Add `showContextSentence: boolean` state with persistence in `localStorage`.
  - Add toggle / setter actions.
- Modify: `frontend/src/components/student/CoursePlayer/CoursePlayer.tsx`
  - Add quick toggle button in the player header to switch between contextual and isolated modes on the fly.
- Modify: `frontend/src/components/student/CoursePlayer/FillInTheBlank.tsx`
  - Conditionally render contextual sentence vs isolated prompt based on `showContextSentence`.
- Modify: `frontend/src/components/student/CoursePartsView.tsx`
  - Add pre-start mode selector pill allowing the student to choose contextual mode before starting.
- Verification: `npm run build` succeeds in `frontend/`.

---

### Task 4: Library & Filter Update
- Modify: `frontend/src/components/student/CourseLibrary.tsx`
  - Update course badges and filter mappings for `fa10_emla`, `fa11_emla`, `fa12_emla`.
  - Ensure Grade 10, Grade 11, and Grade 12 filters list their respective spelling courses.
- Verification: `npm run build` succeeds in `frontend/`.

---

### Task 5: Autonomous End-to-End Verification with `agent-browser`
- Start/ensure servers on port 8008 and 5173.
- Use `agent-browser` to:
  - Inspect the library showing the 3 separate spelling courses.
  - Enter `persian10_emla` and verify all 8 parts.
  - Launch player in Contextual Mode (با جمله کمکی) and take screenshot.
  - Toggle to Isolated Mode (بدون جمله کمکی) and take screenshot.
  - Test answer submission, feedback drawer, sound effects, and celebratory confetti.
  - Inspect console for zero errors.
- Run complete test suite (`python3 -m unittest discover -s tests -v`).
