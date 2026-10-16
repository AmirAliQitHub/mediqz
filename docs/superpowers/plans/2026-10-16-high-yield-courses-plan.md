# High-Yield CourseBox Courses Implementation Plan
**Spec:** `docs/superpowers/specs/2026-10-16-high-yield-courses-design.md`  
**Date:** 2026-10-16  

---

### Task 1: Grade 12 Din-o-Zendegi Ayah & Hadith Course (`dini12_ayat.json`)
**Files:**
- Create: `backend/assets/courses/dini12_ayat.json`
- Create: `tests/test_dini12_course.py`

**Steps:**
1. Write failing test `tests/test_dini12_course.py` checking course structure, lessons, and EUs.
2. Verify test fails.
3. Build generator script and generate `backend/assets/courses/dini12_ayat.json` with 10 lessons, all core Qur'anic verses, messages, and precision keywords.
4. Verify test passes.
5. Commit changes.

---

### Task 2: Grade 12 Health & Hygiene Course (`health12.json`)
**Files:**
- Create: `backend/assets/courses/health12.json`
- Create: `tests/test_health12_course.py`

**Steps:**
1. Write failing test `tests/test_health12_course.py` checking parts, definitions, correct/incorrect, and tree diagrams.
2. Verify test fails.
3. Generate `backend/assets/courses/health12.json` with full coverage of the 14 lessons of Health & Hygiene.
4. Verify test passes.
5. Commit changes.

---

### Task 3: Biology Qualifier Traps Course (`biology_ghayd.json`)
**Files:**
- Create: `backend/assets/courses/biology_ghayd.json`
- Create: `tests/test_biology_ghayd_course.py`

**Steps:**
1. Write failing test `tests/test_biology_ghayd_course.py`.
2. Verify test fails.
3. Generate `backend/assets/courses/biology_ghayd.json` containing high-yield qualifier statements across Grades 10, 11, and 12 with true/false answers and detailed textbook explanations.
4. Verify test passes.
5. Commit changes.

---

### Task 4: Chemistry Periodic Elements & Applications Course (`chemistry_elements.json`)
**Files:**
- Create: `backend/assets/courses/chemistry_elements.json`
- Create: `tests/test_chemistry_elements_course.py`

**Steps:**
1. Write failing test `tests/test_chemistry_elements_course.py`.
2. Verify test fails.
3. Generate `backend/assets/courses/chemistry_elements.json` for elements 1-36 and transition metals with electron configurations, flame colors, and textbook clues.
4. Verify test passes.
5. Commit changes.

---

### Task 5: Backend API & Frontend Filter Integration
**Files:**
- Modify: `backend/app/api/courses.py`
- Modify: `frontend/src/components/student/CourseLibrary.tsx`
- Create: `tests/test_new_courses_integration.py`

**Steps:**
1. Write integration test verifying all 4 new courses are returned by `/courses` and resolve through `/courses/{course_id}`.
2. Add aliases in `backend/app/api/courses.py`.
3. Add subject filter pills in `frontend/src/components/student/CourseLibrary.tsx`.
4. Run integration tests and `npm run build`.
5. Commit changes.

---

### Task 6: Final Verification & SDD Ledger Finalization
1. Run full test suite (`python3 -m unittest discover -s tests`).
2. Run keyword audit script.
3. Run frontend production build.
4. Mark ledger complete.
