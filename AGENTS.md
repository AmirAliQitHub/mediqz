# Alqualite CourseBox (Mediqz) - Architecture & Directory Map
**Current Milestone:** `v3.5.0-identities` (Tri-Identity Separation, Dynamic Mediqz ID Management & Blocking Legacy Migration Operational on Cloud Production)

## Tech Stack & Production Deployment
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Lucide React
  - Production build served by Nginx: `/var/www/mediqz/frontend/dist`
- **Backend**: FastAPI (Python 3.10+), Uvicorn, SQLite WAL (`userdata.db`, `exams.db`)
  - Running as systemd daemon: `mediqz.service` on `127.0.0.1:8000`
- **Telegram Integration**: Python Telegram Bot (`@MediqzBot`), Webhook (`/api/telegram/webhook`), TWA
  - Telegram Magic Login: zero-password Bot push verification with atomic token issuance (`POST /api/auth/magic-login/request`, `GET /api/auth/magic-login/poll`)
  - TWA Dual Start Cards: quick registration vs 1-to-1 desktop account linking (`POST /api/auth/link-telegram`)
- **Tri-Identity Separation Architecture (Module 9)**:
  - 1. `display_name`: Persian full presentation name (normalized `ی`/`ک`, non-credential).
  - 2. `username`: English Mediqz ID (`^(?=.*[a-z0-9])[a-z0-9_]{3,30}$`). Sole credential for laptop/desktop login and push verification. Editable in profile with live self-collision exemption.
  - 3. `telegram_user_id` / `telegram_username`: Cryptographic bot attachment (HMAC initData / Magic Login). Pure numeric manual inputs completely banned.
  - 4. `LegacyMigrationModal`: Deep translucent purple liquid glass modal with mobile bottom-sheet ergonomics (`375x812`), DOM root-level anti-bypass guard in `App.tsx` preventing course exposure to legacy users.
- **Live Production URL**: `https://195-248-241-36.sslip.io` (Automated Let's Encrypt SSL)
- **Server Infrastructure**:
  - Provider: ParsPack Cloud Server Germany (`deCloud2` - 1 vCore, 2 GB RAM + 2 GB Swap)
  - IPv4: `195.248.241.36` (resolves to `195-248-241-36.sslip.io`)
  - Reverse Proxy: Nginx (ports 80 & 443, SSL termination, Gzip, SPA fallback)
  - Firewall: UFW active (ports 22, 80, 443 only)
  - Database Backups: Nightly atomic cronjob at 03:00 UTC (`/usr/local/bin/backup-mediqz.sh` -> `/var/backups/mediqz/`)

## Directory Structure
- `backend/app/`: FastAPI application endpoints, models, routers, and bot logic
  - `backend/app/api/`: REST APIs (`reviews.py`, `auth.py`, `courses.py`, `exams.py`)
  - `backend/app/bot/`: Repo-internal `@MediqzBot` handlers and webhook routing
  - `backend/app/core/`: Database connections, auth tokens, and SQLite WAL settings
- `frontend/src/`: React 18 SPA application (components, store, styles)
  - `frontend/src/components/auth/`: `LoginPad.tsx` (Magic Login, TWA Dual Start), `OnboardingModal.tsx` (tactile eye toggle, live username checker)
  - `frontend/src/components/layout/`: Top bar, adaptive bottom capsule, user profile menu (`UserProfileMenu.tsx` with 2-step unlink dialog)
  - `frontend/src/components/student/`: RoutineHub, CoursePartsView, CoursePlayer, CourseMistakesModal
  - `frontend/src/store/`: Zustand state stores (`useAuthStore`, `useRoutineStore`, `useCourseStore`)
  - `frontend/src/utils/`: Native Iranian Shamsi calendar utility (`shamsiCalendar.ts`)
- `userdata.db`: Unified SQLite database (`users`, `sessions`, `magic_login_requests`, Leitner cards, review logs, `eu_activity_logs`, `user_routines`)
- `scripts/`: Production build, test runner, remote execution helper (`scripts/remote_exec.py`), process checking (`check_processes.sh`), and mobile TWA verification (`verify_mobile_twa.py`)
- `tests/`: Comprehensive test suite (73 tests covering tri-identity separation, auth, WAL concurrency, webhook HMAC, and full master integration)
- `.agents/rules/`: Supreme Council Governance (`supreme-council-governance.md`) and operational laws
- `docs/`: Master verification artifacts and Supreme Council audit reports (`final_supreme_council_audit_report.md`, `docs/audit_artifacts/`)
