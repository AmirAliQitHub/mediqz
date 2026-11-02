# Implementation Plan: Alqualite (Mediaz) Multiagent Autonomous Overhaul (v3.0.0-master)

## Goal Description
Perform a complete, multiagent autonomous overhaul of the Alqualite (Mediaz) Telegram Bot, Telegram Mini App (TWA), Mobile Web UI, and `userdata.db` architecture. Deliver a rock-solid, generic educational engine with Iranian Shamsi calendar scheduling, smart RoutineHub sorter, granular EU activity logging, generic course "Incorrects & Skipped Hub" (`مرور غلط‌ها و نزده‌ها`), in-memory Duolingo redemption loop with zero database pollution, mobile virtual keyboard (`visualViewport`) stability, and adaptive liquid-glass surfaces.

---

## Supreme Governance & Operational Laws
1. **Autonomous Execution (Hands-Off Executive Mode):** No pauses for human confirmation. Every step is governed by the Dual-Signature Gate (`AG_COMPLIANCE_CLEARED` + `COUNCIL_APPROVAL`).
2. **Strict Separation of Powers:**
   - **Workers:** Labor only, zero policy or self-approval authority.
   - **Attorney General (`attorney-general`):** 100% plan fidelity, zero batching enforcement (1 step = 1 turn = 1-2 files max).
   - **Supreme Council Gatekeeper (`supreme-council-gatekeeper`):** Hyper-Critical audit across all 5 Personas.
3. **Absolute Ban on Touching 57 Course Content Files:** All features are 100% generic engines driven dynamically by `course_id`, `part_id`, and `eu_id`.
4. **Strict Database Isolation for Redemption:** In-memory Duolingo-style retry loop never overwrites or pollutes first-pass `incorrect`/`null` logs in `userdata.db`.

---

## Master Modules & Atomic Execution Steps

### Module 1: Bot Revival, Credential Wiring & Live Debugging Setup
- [ ] **Step 1.1: Backend & Bot Credential Alignment**
  - **Files:** `backend/app/core/config.py`, `backend/.env`
  - **Details:** Ensure `config.py` cleanly resolves `.env` from both project root and `backend/`, verifying Telegram Bot Token (`8882238851:AAFdbVIurZXP4nRwZ8EmvtmGwYUIFeOxc50`), username (`MediqzBot`), secret token HMAC, and ensure no missing configs.
  - **Verification:** Unit verification of config loading without errors.
- [ ] **Step 1.2: Process & Port Watchdog Script**
  - **Files:** `scripts/check_processes.sh`
  - **Details:** Enhance process checker to audit ports 8000, 8008, 3000, 8095 and kill stale uvicorn/python/vite instances to prevent Telegram `getUpdates` conflicts.
  - **Verification:** Run script and confirm zero conflict exit code.
- [ ] **Step 1.3: Live Service & Bot Webhook Sanity Check**
  - **Files:** `tests/test_bot_connectivity.py`
  - **Details:** Create automated FastAPI test verifying `/api/telegram/webhook` handles updates, validates HMAC tokens, and verifies bot dispatcher.
  - **Verification:** `pytest tests/test_bot_connectivity.py` passes 100%.

### Module 2: Project-Wide `userdata.db` Strengthening & EU Logging Engine
- [ ] **Step 2.1: `userdata.db` Schema Strengthening & Migration**
  - **Files:** `backend/app/core/database.py`
  - **Details:** Add `eu_activity_logs` table (`user_id`, `course_id`, `part_id`, `eu_id`, `status` IN ('correct','incorrect','null'), `user_answer`, `shamsi_date`, `created_at`) and `user_routines` table for cloud-synced daily schedules with WAL indexing.
  - **Verification:** SQLite schema inspection confirms tables, check constraints, foreign keys, and WAL pragmas.
- [ ] **Step 2.2: EU Activity Logging & Routine Schedule API Endpoints**
  - **Files:** `backend/app/api/reviews.py`, `backend/app/models/schemas.py`
  - **Details:** Implement `POST /api/reviews/log-eu` (batch/single first-pass outcome logging) and `GET /api/reviews/course-mistakes` (querying `incorrect` and `null` EUs by `course_id` and optional `shamsi_date`), plus routine sync endpoints `GET /api/reviews/routines` and `POST /api/reviews/routines`.
  - **Verification:** Automated API test asserting valid logging and retrieval.

### Module 3: RoutineHub Overhaul, Iranian Shamsi Calendar & Smart Sorter
- [ ] **Step 3.1: Single-Line Course Badge & Duplicate `+` Icon Fix**
  - **Files:** `frontend/src/components/student/RoutineHub/RoutineHub.tsx`
  - **Details:** Remove duplicate `+` icon from "+ افزودن پارت". Fix course badge styling with `whitespace-nowrap truncate max-w-[180px] sm:max-w-xs inline-block` and sleek pill geometry so long titles never wrap into two lines.
  - **Verification:** Browser check at 375px mobile viewport confirming single `+` and 1-line badge.
- [ ] **Step 3.2: True Iranian Shamsi (Jalali) Calendar Utility & Store Integration**
  - **Files:** `frontend/src/utils/shamsiCalendar.ts`, `frontend/src/store/useRoutineStore.ts`
  - **Details:** Implement zero-dependency Iranian Shamsi date calculator (weekday names, month names, Persian numerals `۰-۹`, today's Shamsi date). Update `useRoutineStore` to use real Shamsi dates for days rather than sequential "روز ۱, ۲".
  - **Verification:** Unit tests verifying Shamsi date calculation and store day initialization.
- [ ] **Step 3.3: Strict Future-Date Execution Lock**
  - **Files:** `frontend/src/components/student/RoutineHub/RoutineHub.tsx`
  - **Details:** Lock/disable "Start Routine" and individual part play buttons when viewing any date other than Today. Display a clear informative badge ("اجرا فقط برای روتین امروز مجاز است؛ برنامه‌ریزی روزهای آینده فعال است"). Keep add/edit/delete/sort fully enabled for future days.
  - **Verification:** Browser verification confirming Today is playable while future days are locked.
- [ ] **Step 3.4: Advanced Routine Sorter Popup (`چینش`) Modal**
  - **Files:** `frontend/src/components/student/RoutineHub/RoutineSortModal.tsx`
  - **Details:** Create Thumb-zone Bottom Sheet modal for `چینش` supporting: Course selection, Shamsi Start Date, Duration, and 4 Council-approved modes: Even Daily, Konkur Leitner Spaced-Repetition, Exam-Cram Frontloading, and Friday Consolidation Buffer.
  - **Verification:** Modal opens cleanly, selects modes, and populates routine items correctly.

### Module 4: CourseHub, Adaptive Bottom Capsule & Liquid-Glass Top Bar
- [ ] **Step 4.1: Mediaz Logo Transparency Fix**
  - **Files:** `frontend/src/components/common/MediazLogo.tsx`, `frontend/public/mediaz-emblem-transparent.png`
  - **Details:** Remove solid white background pixels from `mediaz-emblem-transparent.png` to yield pure alpha transparency. Remove all solid white wrapper boxes in `MediazLogo.tsx`.
  - **Verification:** Visual check showing transparent logo over dark and glass backgrounds with zero white box.
- [ ] **Step 4.2: Liquid-Glass Top Bar & User Name Display**
  - **Files:** `frontend/src/components/layout/CourseBoxTopBar.tsx`, `frontend/src/components/layout/UserProfileMenu.tsx`
  - **Details:** Convert Top Bar to adaptive liquid glass (`bg-slate-900/40 backdrop-blur-2xl border-b border-white/10`). Display user's name directly next to avatar on both mobile and desktop (`max-w-[90px] sm:max-w-[140px] truncate`).
  - **Verification:** Browser verification at 375px viewport confirming user name and liquid glass styling.
- [ ] **Step 4.3: Thinner Adaptive Floating Bottom Capsule**
  - **Files:** `frontend/src/components/layout/MobileBottomNav.tsx`
  - **Details:** Reduce vertical height by ~30% (from `h-16` equivalent to sleek `h-11`/`h-12`). Implement adaptive dark liquid-glass styling (`bg-slate-950/80 backdrop-blur-2xl border border-white/15 text-slate-300`) with glowing active indicators that provide 100% contrast over both dark CourseHub cards and light RoutineHub cards.
  - **Verification:** Visual screenshot on dark and light screens verifying sharpness and reduced vertical footprint.

### Module 5: Generic CourseView, Mobile Keyboard Fix, "Incorrects Hub" & Duolingo Loop
- [ ] **Step 5.1: Mobile Study Player Viewport Flush Top & Virtual Keyboard Fix**
  - **Files:** `frontend/src/components/student/CoursePlayer/CoursePlayer.tsx`
  - **Details:** Reduce top gap to sit flush under Top Bar (`pt-[calc(3rem+var(--sat,0px))]`). Bind dynamic bottom positioning and container height to `window.visualViewport` so opening virtual keyboard dynamically moves bottom controls and never obstructs input fields or question cards.
  - **Verification:** Simulated mobile keyboard open/close check verifying zero layout overlap.
- [ ] **Step 5.2: "View Answer" = `null` First-Pass Outcome Rule**
  - **Files:** `frontend/src/components/student/CoursePlayer/FillInTheBlank.tsx`, `frontend/src/components/student/CoursePlayer/LearnBox.tsx`
  - **Details:** Ensure clicking "مشاهده پاسخ" registers first-pass outcome strictly as `status: 'null'` (Not Answered / Skipped) in `euResults` and logs to backend `eu_activity_logs`.
  - **Verification:** Test verifying View Answer logs `null` instead of `wrong`.
- [ ] **Step 5.3: In-Memory Duolingo End-of-Part Redemption Loop**
  - **Files:** `frontend/src/store/useCourseStore.ts`, `frontend/src/components/student/CoursePlayer/CoursePlayer.tsx`
  - **Details:** Implement in-memory redemption queue. At end of part, re-present all `incorrect` and `null` EUs sequentially until answered correctly before showing CongratsView. STRICT DB ISOLATION: Redemption retry outcomes are in-memory only and NEVER overwrite first-pass DB records.
  - **Verification:** Unit test and interactive run verifying redemption cycle and first-pass DB immutability.
- [ ] **Step 5.4: Generic Course "Incorrects & Skipped Hub" (`مرور غلط‌ها و نزده‌ها`)**
  - **Files:** `frontend/src/components/student/CoursePartsView.tsx`, `frontend/src/components/student/CourseMistakesModal.tsx`
  - **Details:** Add generic button in `CoursePartsView` for all courses opening `CourseMistakesModal`. Allows filtering by Shamsi date (Today, 3 days, All-time) and launches a targeted review session of failed/skipped EUs without any per-course hardcoding.
  - **Verification:** Open course view, click Incorrects Hub, verify filtered EU count and session launcher.

### Module 6: Comprehensive Telegram Bot & Mini App Audit & Product Roadmap
- [ ] **Step 6.1: Full-Suite Verification & Browser Automated E2E Testing**
  - **Files:** `scripts/verify_mobile_twa.py`, `tests/test_full_suite.py`
  - **Details:** Run complete automated suite testing backend APIs, SQLite concurrency, frontend builds, and capture live screenshots at 375x812 mobile viewport.
  - **Verification:** 100% test pass rate with zero errors.
- [ ] **Step 6.2: Supreme Council Final Audit & Strategic Product Roadmap**
  - **Files:** `docs/final_supreme_council_audit_report.md`, `AGENTS.md`
  - **Details:** Convene all 5 Personas of the Supreme Council to perform exhaustive review of the updated Bot and Mini App, deliver product roadmap, update AGENTS.md checkpoint.
  - **Verification:** Formal signed audit report with Council and AG sign-offs.