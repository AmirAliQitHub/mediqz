# Clinical Exam Analysis Engine (TahlilHub) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clinical, frictionless Exam Analysis (تحلیل آزمون / TahlilHub) system seeded with the 90-question 17 Mehr Dahom Tajrobi Maze exam, featuring ultra-fast 90-second entry, untimed Home Re-solve (حل در خانه), Twin Score diagnosis (Actual vs Potential), Question Typology breakdown, and a Prescriptive 2-Week Action Plan.

**Architecture:** Decoupled SQLite databases: `exams.db` for the static exam master templates/metadata (syncable from external providers) and `userdata.db` for student analysis sessions. FastAPI backend REST routes mounted on `/api/exams`, with a React + Zustand + Tailwind liquid-glass frontend integrated seamlessly into the top bar capsule switcher.

**Tech Stack:** Python 3.14 + FastAPI + SQLite (WAL mode) + PyMuPDF (`fitz`), TypeScript + React 18 + Vite + TailwindCSS + Zustand + Lucide Icons.

**Spec:** `docs/superpowers/specs/2026-10-19-exam-analysis-tahlilhub-design.md`

## Global Constraints
- Target platform: Web (desktop + mobile-responsive in Alqualite CourseBox).
- Decoupled database architecture: `backend/assets/exams.db` for catalog/templates, `backend/assets/userdata.db` for user submissions.
- Authentic seed dataset: 90 questions of 17 Mehr Dahom Tajrobi Maze exam (`pdfs/10T-17Mehr-A.pdf`) with verified answer keys across 4 subjects (زیست‌شناسی: 30, ریاضی: 20, فیزیک: 20, شیمی: 20).
- Rapid entry flow: Hotkeys (`1` = صحیح, `2` = غلط, `3` = نزده, Arrow keys, Backspace) with instant auto-advance and mobile touch buttons.
- Home Re-solve flow: Isolated card view of missed questions with 1-tap cause tagging and celebratory redemption badge.
- Twin Score metrics: Actual Score %, Potential Score %, and Anxiety/Pacing Tax %.
- Prescriptive Action Plan: Top 3 Quick Wins, Study Hour Budget, and Mistake Review list.

## Review Focus
1. Persian/English keyboard layout handling: typing `1`, `2`, `3` works whether the student's OS keyboard is set to Persian (`۱`, `۲`, `۳`) or English.
2. Incomplete or skipped questions handling: "علامت‌گذاری باقی‌مانده به عنوان نزده" reliably fills all untouched items up to question 90.
3. Zero-division and boundary cases in score calculation: accurate percentage calculation even if a student marks all questions blank or wrong.
4. Mobile viewport keyboard occlusion: touch controls pinned to safe bottom thumb area with no unwanted native keyboard popup during rapid entry.
5. Session persistence: refreshing the browser during Phase 1 or Phase 2 restores student progress without data loss.

---

### Task 1: Seed Script & Database Models for Exams (`exams.db`)

**Files:**
- Create: `backend/app/core/exams_db.py`
- Create: `backend/app/models/exam.py`
- Create: `scripts/seed_17mehr_maze_exam.py`
- Test: `tests/test_exams_db.py`

- [ ] **Step 1: Write test for exam database initialization and question loading**
  Create `tests/test_exams_db.py` verifying `exams.db` creation, table schemas (`exams`, `exam_questions`), and querying the 90 questions of `maze-10t-14030717`.

- [ ] **Step 2: Run test to confirm it fails before implementation**
  Run `pytest tests/test_exams_db.py` and confirm failure.

- [ ] **Step 3: Implement database configuration and models**
  Create `backend/app/core/exams_db.py` defining connection pool to `backend/assets/exams.db` and schema initialization.
  Create `backend/app/models/exam.py` with Pydantic models for Exam, ExamQuestion, and Section.

- [ ] **Step 4: Implement seed extraction script**
  Create `scripts/seed_17mehr_maze_exam.py` to populate `exams.db` with all 90 questions, verified answer keys, topics, and difficulties extracted from `pdfs/10T-17Mehr-A.pdf`. Execute the seed script.

- [ ] **Step 5: Run tests and verify database integrity**
  Run `pytest tests/test_exams_db.py` to confirm all 90 questions pass schema and accuracy assertions.

---

### Task 2: Backend API Endpoints for Exam Analysis

**Files:**
- Create: `backend/app/api/exams.py`
- Modify: `backend/app/core/database.py` (add `student_exam_analyses` table to `userdata.db`)
- Modify: `backend/app/main.py` (mount `exams_router` at `/api`)
- Test: `tests/test_exams_api.py`

- [ ] **Step 1: Write integration tests for exam analysis API endpoints**
  Create `tests/test_exams_api.py` testing:
  - `GET /api/exams` (returns catalog)
  - `GET /api/exams/{id}` (returns exam with 90 questions)
  - `POST /api/exams/{id}/analysis/phase1` (saves rapid outcomes)
  - `POST /api/exams/{id}/analysis/phase2` (saves home re-solves and tags)
  - `GET /api/exams/{id}/analysis/report` (computes Twin Scores, Anxiety Tax, and Action Plan)

- [ ] **Step 2: Run test to confirm it fails**
  Run `pytest tests/test_exams_api.py`.

- [ ] **Step 3: Add `student_exam_analyses` table to `userdata.db`**
  Update `backend/app/core/database.py` in `init_databases()` to create the `student_exam_analyses` table with necessary indexes.

- [ ] **Step 4: Implement `/api/exams` endpoints in `backend/app/api/exams.py`**
  Implement catalog lookup, question details, Phase 1 submission, Phase 2 submission, and clinical report calculation engine (Twin Scores, Question Typology, Topic Heatmap, Top 3 Quick Wins).
  Mount router in `backend/app/main.py`.

- [ ] **Step 5: Run integration tests to verify all endpoints pass**
  Run `pytest tests/test_exams_api.py`.

---

### Task 3: Frontend TypeScript Types, API Service, and Zustand Store

**Files:**
- Create: `frontend/src/types/tahlil.ts`
- Create: `frontend/src/services/tahlilService.ts`
- Create: `frontend/src/store/useTahlilStore.ts`
- Test: `tests/test_tahlil_store.test.ts` (or node verification script)

- [ ] **Step 1: Define TypeScript interfaces in `frontend/src/types/tahlil.ts`**
  Define `ExamSummary`, `ExamQuestion`, `StudentAnalysis`, `Phase1Answer`, `Phase2Resolve`, `ClinicalReport`, and `CauseTag`.

- [ ] **Step 2: Implement API service in `frontend/src/services/tahlilService.ts`**
  Implement axios/fetch methods for catalog, details, session retrieval, Phase 1 submit, Phase 2 submit, and report.

- [ ] **Step 3: Implement Zustand store in `frontend/src/store/useTahlilStore.ts`**
  State management for:
  - Active exam ID and exam metadata.
  - Active phase: `'catalog' | 'phase1' | 'phase2' | 'report'`.
  - Phase 1 draft answers (`{ [qNum]: 'correct' | 'wrong' | 'blank' }`) and active question index.
  - Phase 2 draft resolves (`{ [qNum]: { home_status, cause, notes } }`).
  - Hotkey listener actions (with Persian + English digit normalization).
  - Submission and state sync with backend.

---

### Task 4: Frontend UI: Catalog & Rapid Keypad Entry (Phase 1)

**Files:**
- Create: `frontend/src/components/student/TahlilHub/ExamCatalogView.tsx`
- Create: `frontend/src/components/student/TahlilHub/QuestionGrid.tsx`
- Create: `frontend/src/components/student/TahlilHub/RapidKeypadView.tsx`

- [ ] **Step 1: Implement `ExamCatalogView.tsx`**
  Display card for "آزمون ۱۷ مهر دهم تجربی ماز" with subject badges, total questions, status badge (آغاز نشده / در حال تکمیل / تحلیل شده), and "شروع تحلیل آزمون" button.

- [ ] **Step 2: Implement `QuestionGrid.tsx`**
  Interactive 90-question matrix grouped by the 4 subjects with responsive columns, displaying current selection and status color (Green for Correct, Coral for Wrong, Slate for Blank).

- [ ] **Step 3: Implement `RapidKeypadView.tsx`**
  - Desktop keyboard event listener capturing `1`, `2`, `3` (and Persian `۱`, `۲`, `۳`), arrow keys, and Backspace with instant auto-advance.
  - Mobile touch keypad: 3 large ergonomic thumb buttons (درست, غلط, نزده) fixed at the bottom.
  - Top progress tracker: Current question number, subject label, and completion counter.
  - Emergency action: "علامت‌گذاری باقی‌مانده به عنوان نزده" button.
  - "اتمام ثبت اولیه و ورود به فاز حل در خانه" button.

---

### Task 5: Frontend UI: Home Re-solve (Phase 2) & Clinical Diagnostic Report (Phase 3)

**Files:**
- Create: `frontend/src/components/student/TahlilHub/HomeResolveView.tsx`
- Create: `frontend/src/components/student/TahlilHub/ClinicalReportView.tsx`
- Create: `frontend/src/components/student/TahlilHub/TahlilHub.tsx`

- [ ] **Step 1: Implement `HomeResolveView.tsx`**
  - Card-by-card carousel/stepper filtering only questions marked as `غلط` or `نزده`.
  - Resolution selector: "در خانه حل شد 🎯" vs "هنوز بلد نیستم / نیاز به بررسی 🔍".
  - 1-Tap Cause Tag selector: 5 cognitive chips (ندانسته علمی, یادگیری ناقص, بی‌دقتی محاسباتی, کمبود وقت/استرس, تله طراح).
  - Optional short note input.
  - "تکمیل تحلیل و مشاهده گزارش جامع" button.

- [ ] **Step 2: Implement `ClinicalReportView.tsx`**
  - **Twin Score Hero Card:** Actual Exam Score % vs. Home Potential Score % with animated Anxiety/Pacing Tax banner.
  - **Question Typology Section:** Visual progress bars for مفهومی, محاسباتی, حفظی, ترکیبی with counselor diagnostic commentary.
  - **Subject & Topic Heatmap:** Chapter cards showing mastery percentages across زیست, ریاضی, فیزیک, شیمی.
  - **Prescriptive 2-Week Action Plan:** Top 3 Quick Wins, Study Hour Budget, and Mistake Review list with booklet page references and explanations.
  - "شروع مجدد یا آزمون جدید" action.

- [ ] **Step 3: Implement main container `TahlilHub.tsx`**
  Assemble views (`catalog`, `phase1`, `phase2`, `report`) with fluid glass aesthetic, animated tab transitions, and loading states.

---

### Task 6: Top Bar Navigation Integration & App Mounting

**Files:**
- Modify: `frontend/src/components/layout/CourseBoxTopBar.tsx`
- Modify: `frontend/src/store/useAuthStore.ts`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add `'tahlil'` active tab to `useAuthStore.ts`**
  Extend `activeTab` union type with `'tahlil'`.

- [ ] **Step 2: Update `CourseBoxTopBar.tsx` center capsule switcher**
  Add a third pill button: `تحلیل آزمون (TahlilHub)` with analytics/bar chart icon, glowing active state, and smooth switching between Courses, RoutineHub, and TahlilHub.

- [ ] **Step 3: Mount `TahlilHub` in `App.tsx`**
  Add lazy import and switch case for `'tahlil'`.

---

### Task 7: Comprehensive Verification with Agent-Browser & End-to-End Walkthrough

**Files:**
- Test script / Browser validation

- [ ] **Step 1: Start backend and frontend dev servers**
  Launch `python3 run.py` (port 8008) and `npm run dev` (port 5173).

- [ ] **Step 2: Run browser automated test using `agent-browser`**
  - Navigate to `http://localhost:5173`.
  - Click on "تحلیل آزمون (TahlilHub)" in top capsule.
  - Select "آزمون ۱۷ مهر دهم تجربی ماز".
  - Enter outcomes for all 90 questions using rapid keypad.
  - Proceed to Phase 2 Home Re-solve, re-solve several questions at home, and assign cause tags.
  - View the Clinical Report: confirm Twin Scores, Anxiety Tax, Typology Breakdown, and Action Plan render accurately.
  - Test mobile responsive viewport (375x812) to verify keypad usability.
  - Capture artifacts/screenshots of all stages.
