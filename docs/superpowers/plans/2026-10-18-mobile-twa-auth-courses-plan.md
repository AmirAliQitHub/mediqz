# Implementation Plan: Mobile Optimization, Telegram Auth & Onboarding, Superuser Role, and Course Whitelist
Date: 2026-10-18
Spec: docs/superpowers/specs/2026-10-18-mobile-twa-auth-courses-spec.md

## Task Checklist
- [ ] Task 1: Backend Database & Auth Enhancements (Onboarding, Superuser, and Admin APIs)
- [ ] Task 2: Course Stability Filtering in Backend & Unit Tests
- [ ] Task 3: Frontend Onboarding Modal, Auth Store, and Superuser Management View
- [ ] Task 4: Mobile UI Optimization Across All Views (Library, Parts, Player, TopBar) & Build
- [ ] Task 5: Mobile Visual Inspection via Agent-Browser & End-to-End Verification

---

## Detailed Task Breakdown

### Task 1: Backend Database & Auth Enhancements
- In `backend/app/core/database.py`, alter/ensure `users` table has:
  `grade TEXT`, `is_onboarded INTEGER DEFAULT 0`, `is_superuser INTEGER DEFAULT 0`.
- In `backend/app/api/auth.py`:
  - Enhance `/auth/telegram`: return `is_onboarded`, `is_superuser`, `grade`.
  - Add `/auth/onboarding`: accepts `display_name` and `grade`. If `display_name == 'amirtaii8123'` or `username == 'amirtaii8123'`, sets `is_superuser = 1` and `access_level = 'SUPERUSER'`.
- Create `backend/app/api/admin.py`:
  - `GET /admin/users`: returns all registered users with their stats.
- Register `admin.router` in `backend/app/main.py`.

### Task 2: Course Stability Filtering & Unit Tests
- In `backend/app/api/courses.py`:
  - Define `STABLE_TOPIC_CODES = {'FA10', 'FA11', 'FA12', 'fa10_emla', 'fa11_emla', 'fa12_emla', 'FA10E', 'FA11E', 'FA12E', 'AR10', 'AR11', 'AR12'}`.
  - Filter courses based on user superuser status or `include_dev` query param.
- Create `tests/test_mobile_auth_courses.py`:
  - Test Telegram login & onboarding.
  - Test Superuser trigger with `amirtaii8123`.
  - Test course catalog filtering (normal user gets 12 courses, superuser gets all).

### Task 3: Frontend Onboarding Modal & Superuser View
- In `frontend/src/types.ts`: add `grade?: string; is_onboarded?: boolean; is_superuser?: boolean` to `User`.
- In `frontend/src/store/useAuthStore.ts`: add `completeOnboarding` and `admin` tab support.
- Create `frontend/src/components/auth/OnboardingModal.tsx`:
  - Modal prompting for Name & Grade (دهم، یازدهم، دوازدهم، کنکور).
- Create `frontend/src/components/admin/AdminUserManagement.tsx`:
  - Superuser view displaying registered users table and platform stats.

### Task 4: Mobile UI Optimization Across All Views
- Update `frontend/src/components/layout/CourseBoxTopBar.tsx`:
  - Compact mobile layout, grade pill, superuser crown button.
- Update `frontend/src/components/student/CourseLibrary.tsx`:
  - Mobile layout (`px-3 sm:px-6 pt-16 md:pt-24 pb-28`), compact touch cards, horizontal scrollable filter pills.
- Update `frontend/src/components/student/CoursePartsView.tsx`:
  - Mobile banner with wrapped pills, compact parts list.
- Update `frontend/src/components/student/CoursePlayer/CoursePlayer.tsx` & `FillInTheBlank.tsx`:
  - Safe mobile viewports, sticky navigation buttons, large tap targets.
- Run `npm run build` in `frontend/` to ensure zero errors.

### Task 5: Mobile Visual Inspection via Agent-Browser & Verification
- Use `agent-browser` with mobile viewport (`--viewport 390x844`).
- Inspect Onboarding, Course Library with 12 stable courses, Superuser admin panel.
- Run full Python test suite (`python3 -m unittest discover -s tests -v`).
