# Alqualite CourseBox (Mediqz) - Architecture & Directory Map
**Current Milestone:** `v3.1.0-council` (Master Overhaul Ratified)

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Lucide React
- **Backend**: FastAPI (Python 3.11), Uvicorn, SQLite WAL (`userdata.db`)
- **Telegram Integration**: Python Telegram Bot, Webhook (`/api/telegram/webhook`), TWA
- **Deployment**: Multi-stage Docker, Render / Cloudflare / Vercel SPA serving

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
