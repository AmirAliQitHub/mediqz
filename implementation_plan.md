# Implementation Plan: Telegram Bot Revival, Unified `userdata.db` Sync & Mobile TWA Optimization

## Goal Description
Revive the Mediaz Telegram Bot (`@MediqzBot`, Token `8882238851:AAFdbVIurZXP4nRwZ8EmvtmGwYUIFeOxc50`), resolve process/port collisions, unify the data contract and persistence layer by consolidating bot and web app state into `userdata.db`, optimize the mobile Telegram Mini App (TWA) viewport for standard 375x812 screens with zero horizontal overflow, and provide a critic-first comprehensive UX and educational audit report.

---

## User Review Required

> [!IMPORTANT]
> **Database Consolidation Decision**: Previously, `MediqzBot` created its own local SQLite database (`mediqz_leitner.db`), while `Alqualite CourseBox` maintained `userdata.db`. In Phase 2, we will migrate and unify all user states, Leitner cards, and reviews into `userdata.db` so student progress in Telegram Bot directly syncs with the Web App and vice versa.

> [!NOTE]
> **Port Mapping Alignment**: Vite runs on port `3000` (proxying to FastAPI on `8008`), while older bot scripts were pointed to `5173`. We will align `run_mediqz_service.py` to point Cloudflare Tunnel directly to `http://127.0.0.1:3000`.

---

## Proposed Phases & Atomic Steps (1–2 files per step)

### Phase 1: Bot Revival, Credential Wiring & Process Safety
- [ ] **Step 1.1: Environment & Credential Alignment**
  - **Files:** `/Users/amiralirakhshani/Projects/MediqzBot/.env`, `backend/app/core/config.py`
  - **Details:** Wire extracted bot credentials (`BOT_TOKEN=8882238851:AAFdbVIurZXP4nRwZ8EmvtmGwYUIFeOxc50`, `BOT_NAME=Mediaz`, `BOT_USERNAME=MediqzBot`) into backend config and bot `.env`.
- [ ] **Step 1.2: Process & Port Collision Audit Script**
  - **Files:** `scripts/check_processes.sh`
  - **Details:** Build process watchdog script to safely detect and clear port conflicts (ports 8008, 3000) and kill duplicate polling bot processes preventing `Conflict: terminated by other getUpdates request`.
- [ ] **Step 1.3: Unified Runner & Live Debugging Connectivity Verification**
  - **Files:** `/Users/amiralirakhshani/Projects/MediqzBot/run_mediqz_service.py`
  - **Details:** Update tunnel target to port 3000, verify Cloudflare Tunnel creation, update Telegram Menu Button via API, and test live polling connectivity.

---

### Phase 2: End-to-End `userdata.db` Strengthening & Sync (Contract-First)
- [ ] **Step 2.1: Data Contract Definition & `userdata.db` Schema Migration**
  - **Files:** `backend/app/core/database.py`
  - **Details:** Add `telegram_user_id` (INTEGER UNIQUE) to `users` table, add unified `leitner_cards` and `review_logs` tables in `userdata.db` with non-destructive schema checks and WAL indexing.
- [ ] **Step 2.2: Backend Auth & Telegram Mini App Endpoint Synchronization**
  - **Files:** `backend/app/api/auth.py`, `backend/app/models/schemas.py`
  - **Details:** Update `/api/auth/telegram` to match the data contract, binding `telegram_user_id`, handling existing user linking, and returning complete unified user state.
- [ ] **Step 2.3: Bot Database Layer Unification with `userdata.db`**
  - **Files:** `/Users/amiralirakhshani/Projects/MediqzBot/database.py`
  - **Details:** Point MediqzBot database layer directly to `Alqualite CourseBox/backend/assets/userdata.db`, replacing isolated `mediqz_leitner.db` calls.
- [ ] **Step 2.4: Bot Command & Callback Data Contract Verification**
  - **Files:** `/Users/amiralirakhshani/Projects/MediqzBot/bot.py`
  - **Details:** Ensure bot commands (`/start`, `/vocab`, quizzes, Leitner reviews) read and write user state via the unified `userdata.db` contract without race conditions.
- [ ] **Step 2.5: Database Integrity & Cross-Layer Unit Tests**
  - **Files:** `tests/test_userdata_sync.py`
  - **Details:** Automated test suite validating concurrent writes, migrations, session tokens, and Telegram user ID mapping across backend and bot.

---

### Phase 3: Mobile Viewport & Telegram Mini App (TWA) Optimization
- [ ] **Step 3.1: Frontend Telegram WebApp SDK Integration & Auto-Login**
  - **Files:** `frontend/src/store/useAuthStore.ts`, `frontend/src/App.tsx`
  - **Details:** Auto-detect `window.Telegram?.WebApp`, call `WebApp.ready()` and `WebApp.expand()`, authenticate via `/api/auth/telegram` silently on load.
- [ ] **Step 3.2: Mobile Viewport & Safe-Area CSS Guardrails**
  - **Files:** `frontend/src/index.css`
  - **Details:** Enforce `safe-area-inset-*`, touch targets (>= 44px), prevent horizontal overscroll and keyboard overlap, maintaining liquid-glass aesthetic.
- [ ] **Step 3.3: Mobile Responsive Layout for Navigation & Headers**
  - **Files:** `frontend/src/components/layout/CourseBoxTopBar.tsx`, `frontend/src/components/student/CourseLibrary.tsx`
  - **Details:** Ensure top navigation bar and course library cards adapt gracefully on narrow 375px mobile screens.
- [ ] **Step 3.4: Mobile Course Player & Exercise Responsiveness**
  - **Files:** `frontend/src/components/student/CoursePlayer/CoursePlayer.tsx`, `frontend/src/components/student/CoursePlayer/LearnBox.tsx`
  - **Details:** Ensure exercise cards, bottom action bars, and Persian fonts fit comfortably within mobile viewports without clipping.
- [ ] **Step 3.5: Browser Sub-Agent Mobile Verification (375x812)**
  - **Files:** `scripts/verify_mobile_twa.py`
  - **Details:** Execute mobile browser simulation (375x812) with Telegram WebApp mock, taking visual verification screenshots and verifying 0 console/network errors.

---

### Phase 4: Comprehensive Product & UX Audit (Critic-First Report)
- [ ] **Step 4.1: Architecture & Data Flow Audit**
  - **Files:** `docs/audit_architecture.md`
  - **Details:** Complete technical audit of bot-webapp data contracts, security considerations, and sync latency.
- [ ] **Step 4.2: Comprehensive UX & Educational Roadmap Report**
  - **Files:** `docs/ux_product_audit_report.md`
  - **Details:** Critic-first product audit with actionable recommendations for Telegram-native features (inline queries, study streak reminders, WebApp transitions).

---

## Verification Plan

### Automated Tests
- `python3 -m unittest discover -s tests -v`
- `python3 tests/test_userdata_sync.py`
- `cd frontend && npm run build`

### Manual & Browser Verification
- Verify Telegram bot response: send `/start` to `@MediqzBot`.
- Verify Telegram Menu Button opens public HTTPS tunnel URL.
- Test mobile layout rendering at 375x812 with `agent-browser`.
