# Alqualite CourseBox (Mediqz) - Architecture & Directory Map
**Current Milestone:** `v3.3.0-deployed` (Dedicated Production Cloud Server Deployed & Operational)

## Tech Stack & Production Deployment
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Lucide React
  - Production build served by Nginx: `/var/www/mediqz/frontend/dist`
- **Backend**: FastAPI (Python 3.10+), Uvicorn, SQLite WAL (`userdata.db`, `exams.db`)
  - Running as systemd daemon: `mediqz.service` on `127.0.0.1:8000`
- **Telegram Integration**: Python Telegram Bot (`@MediqzBot`), Webhook (`/api/telegram/webhook`), TWA
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
  - `frontend/src/components/layout/`: Top bar, adaptive bottom capsule, user profile menu
  - `frontend/src/components/student/`: RoutineHub, CoursePartsView, CoursePlayer, CourseMistakesModal
  - `frontend/src/store/`: Zustand state stores (`useAuthStore`, `useRoutineStore`, `useCourseStore`)
  - `frontend/src/utils/`: Native Iranian Shamsi calendar utility (`shamsiCalendar.ts`)
- `userdata.db`: Unified SQLite database (users, auth, Leitner cards, review logs, `eu_activity_logs`, `user_routines`)
- `scripts/`: Production build, test runner, process checking (`check_processes.sh`), and mobile TWA verification (`verify_mobile_twa.py`)
- `tests/`: Comprehensive test suite (66 tests covering auth, WAL concurrency, webhook HMAC, and full master integration)
- `.agents/rules/`: Supreme Council Governance (`supreme-council-governance.md`) and operational laws
- `docs/`: Master verification artifacts and Supreme Council audit reports (`final_supreme_council_audit_report.md`)
