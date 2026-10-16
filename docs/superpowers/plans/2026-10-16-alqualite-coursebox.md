# Alqualite CourseBox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract and craft a standalone interactive learning web application ("Alqualite CourseBox" / "آلکالیت اینتراکتیو") in `/Alqualite CourseBox` without modifying the original `/Alqualite` directory, eliminating all exam/test systems and all importance sliders/metrics, while preserving the full liquid-glass design system, interactive learning units, and AI skills.

**Architecture:** A lightweight high-performance stack composed of a FastAPI backend (WAL SQLite for user authentication, course progress, and spaced repetition) and a Vite + React 18 + TypeScript + Tailwind CSS frontend. Dedicated interactive learning units (FillInTheBlank, LiteraryMatrix, TreeDiagram, CorrectIncorrect, LearnBox) are decoupled from any test bank or importance slider code.

**Tech Stack:** Python 3.10+, FastAPI, SQLite WAL, Vite, React 18, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.

**Spec:** Derived directly from the user requirements and `ALQUALITE_BLUEPRINT.txt`:
- Project Name: English: **Alqualite CourseBox**, Persian: **آلکالیت اینتراکتیو**
- Target Root: `/Users/amiralirakhshani/Projects/Alqualite CourseBox`
- Original Root: `/Users/amiralirakhshani/Projects/Alqualite` (Strictly Read-Only, ZERO modifications)
- Excluded Systems: Exam engine, test-bank (qnbank), Daftarche builder, live exam room, Karname modals, multiple-choice questions, and ALL importance sliders / priority spectrum controls (`ReviewPriorityBar`, `priority_pos`, `نوار اهمیت مرور`).
- Included Systems: Interactive course library, course part player, learning unit types, congrats completion screen (without importance sliders), review hub (for course parts only, without priority sliders), liquid-glass aesthetics, dynamic caustics aura background, Persian RTL typography (Vazirmatn), and the full suite of AI agent skills (`.agents/skills/`).

## Global Constraints

- Never write to or modify any file inside `/Users/amiralirakhshani/Projects/Alqualite`.
- Project English name must be exact: `Alqualite CourseBox`.
- Project Persian name must be exact: `آلکالیت اینتراکتیو`.
- No importance sliders, spectrums, or priority bars anywhere in UI or backend models.
- No exam room, question bank (qnbank), or test-maker code in the new project.
- Full agent customization suite (`.agents/skills/`) and `skills-lock.json` must be present.
- Persian-first RTL ergonomics, Vazirmatn font metrics, and Apple-grade Liquid Glass design system.

## Review Focus

1. **Course Player with pure interactive learning units**: Ensure slides (`fill_in_the_blank`, `literary_matrix`, `tree_diagram`, `correct_incorrect`, `learn_box`) load and submit without any missing dependencies on `qnbank` or exam endpoints.
2. **Elimination of importance slider**: Verify `CongratsView` and `CoursePartsView` have zero slider inputs, zero references to `priority_pos`, and save completion cleanly to backend.
3. **Review system clean isolation**: Verify that reviewing a course part functions purely on learning mastery (EUs due for review) without priority weights or exam mixing.
4. **Original codebase integrity**: Confirm git status of `/Users/amiralirakhshani/Projects/Alqualite` is completely clean and untouched.
5. **Fresh frontend & backend build**: Confirm frontend compiles via TypeScript & Vite with zero errors, and backend starts with zero missing import errors.

---

### Task 1: Customization Suite, Skills & Workspace Scaffolding

**Files:**
- Create: `/Users/amiralirakhshani/Projects/Alqualite CourseBox/.agents/skills/*`
- Create: `/Users/amiralirakhshani/Projects/Alqualite CourseBox/skills-lock.json`
- Create: `/Users/amiralirakhshani/Projects/Alqualite CourseBox/.gitignore`
- Create: `/Users/amiralirakhshani/Projects/Alqualite CourseBox/README.md`

**Interfaces:**
- Produces: Complete AI skills environment, workspace gitignore, and project documentation for Alqualite CourseBox.

- [ ] **Step 1: Copy .agents/skills and skills-lock.json to Alqualite CourseBox**
- [ ] **Step 2: Create .gitignore and README.md with Alqualite CourseBox documentation**
- [ ] **Step 3: Verify skills directory exists and contains all 15 skills**

---

### Task 2: Backend Architecture & Clean Database Models

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/run.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/security.py`
- Create: `backend/app/core/database.py`
- Create: `backend/app/models/schemas.py`
- Create: `backend/app/api/deps.py`
- Create: `backend/app/api/auth.py`
- Create: `backend/app/api/courses.py`
- Create: `backend/app/api/reviews.py`
- Create: `backend/app/services/review_service.py`
- Create: `backend/app/main.py`

**Interfaces:**
- Produces: REST API on port 8000 serving `/api/auth`, `/api/courses`, `/api/reviews` with zero exam endpoints and zero `priority_pos` fields.
- Consumes: JSON course definitions and SQLite WAL database `assets/userdata.db`.

- [ ] **Step 1: Define database schema in `database.py` without exam tables and without priority_pos in `part_reviews`**
- [ ] **Step 2: Define Pydantic models in `schemas.py` omitting all exam and priority slider structures**
- [ ] **Step 3: Implement auth routes in `auth.py` and token dependencies in `deps.py`**
- [ ] **Step 4: Implement courses router in `courses.py` (list courses, resolve course payload, complete course part, import JSON)**
- [ ] **Step 5: Implement reviews router in `reviews.py` (fetch review list, get part details, submit review session)**
- [ ] **Step 6: Assemble FastAPI app in `main.py` with CORS, static assets, and health check**
- [ ] **Step 7: Test backend startup and verify all routes initialize without errors**

---

### Task 3: Interactive Course Assets Migration & Purification

**Files:**
- Create: `backend/assets/courses/persian10_vocab.json`
- Create: `backend/assets/courses/persian10_elam.json`
- Create: `backend/assets/courses/persian11_vocab.json`
- Create: `backend/assets/courses/persian11_elam.json`
- Create: `backend/assets/courses/persian12_vocab.json`
- Create: `backend/assets/courses/persian12_elam.json`
- Create: `backend/assets/courses/arabic12_vocab.json`
- Create: `backend/assets/courses/sample.json` (purged of konkur_test units)

**Interfaces:**
- Consumes: Raw course JSON from `/Users/amiralirakhshani/Projects/Alqualite/backend/assets/courses/`.
- Produces: 8 standalone interactive course files with clean educational units.

- [ ] **Step 1: Copy vocabulary and literary matrix course datasets**
- [ ] **Step 2: Purify `sample.json` to retain only interactive learning units (learn_box, tree_diagram, correct_incorrect)**
- [ ] **Step 3: Verify all course JSON files parse validly and can be queried by the backend**

---

### Task 4: Frontend Infrastructure, Design System & Typography

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/services/api.ts`
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/components/common/AlqualiteLogo.tsx`
- Create: `frontend/src/components/common/FluidBackground.tsx`

**Interfaces:**
- Produces: Fully styled liquid-glass web application with Vazirmatn Persian typography, custom branding ("Alqualite CourseBox" / "آلکالیت اینتراکتیو"), and types cleanly purged of exam interfaces.

- [ ] **Step 1: Create package.json and vite/tailwind configs**
- [ ] **Step 2: Install frontend dependencies via npm**
- [ ] **Step 3: Define types in `types/index.ts` containing only Course, Part, EU, Review, and User models**
- [ ] **Step 4: Create branding logo (`AlqualiteLogo.tsx`) and dynamic caustics background (`FluidBackground.tsx`)**
- [ ] **Step 5: Configure `api.ts` with token handling and error interceptors**

---

### Task 5: Interactive Learning Units & Course Player

**Files:**
- Create: `frontend/src/components/student/CoursePlayer/CoursePlayer.tsx`
- Create: `frontend/src/components/student/CoursePlayer/LearnBox.tsx`
- Create: `frontend/src/components/student/CoursePlayer/FillInTheBlank.tsx`
- Create: `frontend/src/components/student/CoursePlayer/LiteraryMatrix.tsx`
- Create: `frontend/src/components/student/CoursePlayer/CorrectIncorrect.tsx`
- Create: `frontend/src/components/student/CoursePlayer/TreeDiagram.tsx`
- Create: `frontend/src/store/useCourseStore.ts`

**Interfaces:**
- Produces: Interactive slide player supporting all 5 interactive question and content types with keyboard navigation (Enter key progression) and sound feedback / confetti.
- Consumes: Course and EU payloads from `useCourseStore`.

- [ ] **Step 1: Implement `useCourseStore.ts` managing active course, active part, slide navigation, and EU results**
- [ ] **Step 2: Implement `LearnBox.tsx`, `FillInTheBlank.tsx`, `CorrectIncorrect.tsx`, `TreeDiagram.tsx`**
- [ ] **Step 3: Implement `LiteraryMatrix.tsx` (4-quadrant interactive author/work/genre discovery)**
- [ ] **Step 4: Build `CoursePlayer.tsx` orchestrating slide navigation, breadcrumb, and bottom floating pill**

---

### Task 6: Course Library, Parts View & Navigation

**Files:**
- Create: `frontend/src/components/student/CourseLibrary.tsx`
- Create: `frontend/src/components/student/CoursePartsView.tsx`
- Create: `frontend/src/components/layout/CourseBoxTopBar.tsx`
- Create: `frontend/src/components/layout/UserProfileMenu.tsx`
- Create: `frontend/src/components/auth/AuthModal.tsx`
- Create: `frontend/src/store/useAuthStore.ts`

**Interfaces:**
- Produces: Liquid-glass course catalog with search and filters, chapter & part breakdown, user profile menu, and authentication modal.
- Constraints: Completely free of any importance sliders (`ReviewPriorityBar` is omitted).

- [ ] **Step 1: Implement `useAuthStore.ts` with active tabs (`courses`, `course-parts`, `player`, `reviews`, `account`)**
- [ ] **Step 2: Implement `CourseLibrary.tsx` with Persian grade & subject filters, search, and JSON import**
- [ ] **Step 3: Implement `CoursePartsView.tsx` with part listing, history modal, review setup modal (without importance slider)**
- [ ] **Step 4: Implement `CourseBoxTopBar.tsx` with "Alqualite CourseBox" logo and clean dual capsule tabs**
- [ ] **Step 5: Implement `UserProfileMenu.tsx` and `AuthModal.tsx`**

---

### Task 7: Congrats Screen & Review Hub (Purged of Importance Sliders)

**Files:**
- Create: `frontend/src/components/student/CongratsView.tsx`
- Create: `frontend/src/components/student/ReviewHub.tsx`
- Create: `frontend/src/store/useReviewStore.ts`

**Interfaces:**
- Produces: Celebratory completion screen summarizing mastery and answer accuracy, and dedicated Review Hub tracking due course parts using spaced repetition intervals (without importance slider or spectrum).

- [ ] **Step 1: Implement `useReviewStore.ts` for fetching due reviews and submitting spaced repetition results**
- [ ] **Step 2: Implement `CongratsView.tsx` with score percentage, interactive summary, and clean review hub entry without importance sliders**
- [ ] **Step 3: Implement `ReviewHub.tsx` displaying due course parts, review queues, and automatic review launch**

---

### Task 8: App Integration, Build Verification & Quality Assurance

**Files:**
- Create: `frontend/src/App.tsx`
- Create: `start.sh` (one-click runner for both backend and frontend)
- Verify: Full TypeScript compilation (`npm run build`)
- Verify: Original `/Users/amiralirakhshani/Projects/Alqualite` git status (must be 100% clean and untouched)
- Verify: End-to-end functionality via agent-browser / curl

- [ ] **Step 1: Assemble `App.tsx` with dynamic view mounting, Suspense loaders, and FluidBackground**
- [ ] **Step 2: Create root `start.sh` script**
- [ ] **Step 3: Run `npm run build` in `frontend` and ensure zero TypeScript or bundling errors**
- [ ] **Step 4: Launch backend and frontend, verify landing and course loading**
- [ ] **Step 5: Confirm git status of `/Users/amiralirakhshani/Projects/Alqualite` is clean**
