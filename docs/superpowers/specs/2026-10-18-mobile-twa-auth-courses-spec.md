# Specification: Mobile Optimization, Telegram Auth & Onboarding, Superuser Role, and Course Whitelist
Date: 2026-10-18
Status: Approved

## 1. Overview
This specification addresses 4 critical requirements for the Alqualite CourseBox Telegram Mini App ecosystem:
1. **Mobile & Viewport Optimization:** Ensure exceptional UX across phone screens (320px–480px) and varying Telegram WebView sizes, eliminating overflow, excessive padding, and keyboard overlap.
2. **Telegram-Oriented Authentication & Onboarding:** Automatic authentication via Telegram WebApp data. For first-time users, present an elegant onboarding form to collect their Name and Grade.
3. **Superuser Escalation (`amirtaii8123`):** Any user whose name or username is `amirtaii8123` is automatically promoted to Superuser with admin privileges and user management capabilities.
4. **Course Filtering (Stability Control):** Keep only the 12 core stable Persian (Loghat, Emla, Aalam) and Arabic (Loghat) courses visible for normal students. Keep other courses intact but hidden in development mode, accessible only by Superusers.

---

## 2. Technical Architecture

### 2.1 Backend Data Model & Database (`app/core/database.py`, `app/api/auth.py`, `app/api/courses.py`)
- **Users Table Columns:**
  - `id`: INTEGER PRIMARY KEY
  - `username`: TEXT UNIQUE
  - `password_hash`: TEXT
  - `salt`: TEXT
  - `display_name`: TEXT
  - `avatar_url`: TEXT
  - `grade`: TEXT (e.g., '10', '11', '12', 'konkur')
  - `is_onboarded`: INTEGER DEFAULT 0
  - `is_superuser`: INTEGER DEFAULT 0
  - `access_level`: TEXT DEFAULT 'S2' ('SUPERUSER' if superuser)
  - `created_at`: TEXT
- **Superuser Trigger:**
  - If `display_name == 'amirtaii8123'` OR `username == 'amirtaii8123'`:
    - `is_superuser = 1`, `access_level = 'SUPERUSER'`.
- **API Endpoints:**
  - `POST /api/auth/telegram`: Autologin or register via Telegram WebApp user object.
    - Response includes `needs_onboarding: bool` if `grade` is not set or `is_onboarded == 0`.
  - `POST /api/auth/onboarding`: Complete profile with `display_name` and `grade`. Checks for `amirtaii8123` trigger.
  - `GET /api/admin/users`: (Superuser only) List all registered users with stats.
  - `GET /api/courses`: Filtered course list.
    - If `current_user` is superuser: returns all courses with `is_development` flags.
    - If `current_user` is normal student: returns only the 12 stable courses:
      `['FA10', 'FA11', 'FA12', 'fa10_emla', 'fa11_emla', 'fa12_emla', 'FA10E', 'FA11E', 'FA12E', 'AR10', 'AR11', 'AR12']`.

### 2.2 Frontend Components & Styling
1. **Onboarding Modal (`OnboardingModal.tsx`):**
   - Renders if `user && !user.is_onboarded`.
   - Name input (pre-filled with Telegram name).
   - Grade selector capsules (دهم، یازدهم، دوازدهم، کنکور).
   - Submits to `/api/auth/onboarding`.
2. **Mobile Layout Optimizations:**
   - [index.html](file:///Users/amiralirakhshani/Projects/Alqualite%20CourseBox/frontend/index.html): viewport meta with `viewport-fit=cover`.
   - [CourseBoxTopBar.tsx](file:///Users/amiralirakhshani/Projects/Alqualite%20CourseBox/frontend/src/components/layout/CourseBoxTopBar.tsx): compact on mobile (`px-3 py-2`), user pill showing Grade or 👑 Admin badge.
   - [CourseLibrary.tsx](file:///Users/amiralirakhshani/Projects/Alqualite%20CourseBox/frontend/src/components/student/CourseLibrary.tsx): mobile card layout, clean filters, touch friendly.
   - [CoursePartsView.tsx](file:///Users/amiralirakhshani/Projects/Alqualite%20CourseBox/frontend/src/components/student/CoursePartsView.tsx): reduced margins and compact buttons.
   - [CoursePlayer.tsx](file:///Users/amiralirakhshani/Projects/Alqualite%20CourseBox/frontend/src/components/student/CoursePlayer/CoursePlayer.tsx): sticky action buttons, full screen height handling.
3. **Superuser Admin Panel (`AdminUserManagement.tsx`):**
   - Accessible via TopBar for superusers.
   - View all registered students, grades, join dates, and total counts.
   - Toggle to preview unstable/development courses.

---

## 3. Verification Plan
- Unit tests for `/api/auth/telegram`, `/api/auth/onboarding`, superuser promotion, and course catalog filtering.
- Visual inspection via `agent-browser` with mobile viewport (`390x844`).
- Confirmed zero TypeScript errors with `npm run build`.
