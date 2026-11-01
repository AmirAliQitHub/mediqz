# Implementation Plan: Pure Local Operation on Port 3000 & Liquid Glass Login Pad

**Goal:** Transform the application into a pure standalone local web platform running on `http://localhost:3000` with an intuitive, glassmorphic `LoginPad` supporting `admin` / `password` and `demo` / `demo123`, eliminating all Telegram WebApp dependencies and glitches.

---

### Task 1: Backend Superuser Seeding (`admin` / `password`)
- **Target File:** `backend/app/core/database.py`
- **Actions:**
  - Seed default superuser `admin` with password `password`.
  - Set `display_name = 'مدیر سیستم'`, `access_level = 'SUPERUSER'`, `is_superuser = 1'`, `is_onboarded = 1`, and `grade = '12'`.
  - Ensure existing `demo` (`demo123`) user is also initialized/updated with `is_onboarded = 1`.
  - Write test or verification check in Python.

---

### Task 2: Configure Port 3000 for Frontend & Dev Servers
- **Target Files:**
  - `frontend/vite.config.ts`: Set `server.port = 3000`, `server.host = '0.0.0.0'`.
  - `start.sh`: Update startup script echo messages and port binding documentation.
- **Actions:**
  - Switch Vite configuration to port 3000.
  - Verify proxy to backend at `127.0.0.1:8008` remains active.

---

### Task 3: Auth Store Refactoring (`useAuthStore.ts`)
- **Target File:** `frontend/src/store/useAuthStore.ts`
- **Actions:**
  - Remove Telegram WebApp environment auto-login bypass (`loginWithTelegram` fallback).
  - Update `initAuth()`:
    - If a valid token exists in `localStorage`, call `/auth/me` to restore the user session.
    - If no token or if the token has expired/failed, set `user = null`, `token = null`, and `isInitializing = false`.
  - Update `logout()`:
    - Call `/auth/logout` endpoint.
    - Clear `localStorage` token.
    - Set `user = null`, `token = null`, and cleanly reset `activeTab = 'courses'` without automatically creating a guest session.
  - Implement direct `loginWithCredentials(username, password)` in the store for clean, reactive error handling.

---

### Task 4: Design & Implement `LoginPad.tsx`
- **Target File:** `frontend/src/components/auth/LoginPad.tsx`
- **Design Guidelines (per `web-design-guidelines` and `ui-ux-pro-max`):**
  - **Glassmorphic Card:** `backdrop-blur-2xl bg-white/80 border border-white/90 shadow-2xl shadow-blue-500/10 rounded-3xl`.
  - **Mediaz Emblem:** Large vibrant logo with iridescent ambient glow.
  - **Credentials Inputs:**
    - Standard text inputs for Username and Password.
    - Toggle password visibility (eye icon).
    - Allow paste and autocomplete (`autocomplete="username"`, `autocomplete="current-password"`).
  - **Interactive Tactile Pad:**
    - Keypad layout for rapid entry (0-9, backspace, clear).
    - Can target whichever field is active or act as numeric PIN/password pad.
  - **Quick Preset Pills (1-Click Login):**
    - 👑 **ورود مدیر سیستم** (`admin` / `password` with Superuser badge).
    - 🎓 **ورود دانش‌آموز آزمایشی** (`demo` / `demo123`).
  - **Accessible Error Handling:**
    - Shaking animation on invalid credentials.
    - `aria-live="assertive"` alert box in Persian.
  - **Tab Switcher:** Toggle between "ورود به حساب" (Login) and "ثبت‌نام جدید" (Register).

---

### Task 5: Mount `LoginPad` in `App.tsx`
- **Target File:** `frontend/src/App.tsx`
- **Actions:**
  - When `!user && !isInitializing`: Render `<LoginPad />` centered over the dynamic fluid caustics background.
  - When `user`: Render `CourseBoxTopBar` and active content views (`courses`, `course-parts`, `player`, `routines`, `tahlil`, `admin`).
  - Verify clean transitions and no flash of incorrect UI.

---

### Task 6: Execution, Service Restart & Browser Verification
- **Actions:**
  - Terminate Vite dev server on port 5173.
  - Start Vite dev server on port 3000.
  - Ensure backend is running and healthy on port 8008.
  - Use `agent-browser` to visit `http://localhost:3000`:
    - Confirm `LoginPad` renders with flawless glassmorphism.
    - Click "ورود مدیر سیستم (admin)" and verify instant login to superuser dashboard.
    - Verify all tabs (دوره‌ها, RoutineHub, TahlilHub) are operational.
    - Click profile menu and perform logout -> verify returns cleanly to `LoginPad`.
    - Test logging in as `demo` / `demo123`.
    - Capture screenshots for verification artifact.
