# Mediaz TWA Pure WebApp & Brand Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the application into the official Mediaz Telegram Mini App by replacing all Alqualite branding with Mediaz, moving topbar utility buttons into the user profile dropdown, eliminating all traditional login forms and startup glitches, and enforcing seamless Telegram WebApp authentication.

**Architecture:** Frontend React SPA refactored for Telegram WebApp environment with an initialization gate, Mediaz logo asset integration, cleaned topbar layout, and zero-password onboarding. Backend FastAPI endpoints for Telegram authentication and onboarding support.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vite, Zustand, Python 3.12/FastAPI, SQLite, Telegram WebApp SDK.

**Spec:** `docs/superpowers/specs/2026-10-18-mediaz-twa-pure-auth-design.md`

## Global Constraints
- Remove "Alqualite CourseBox" completely from the top bar.
- Replace the current logo with the official Mediaz logo (`Mediaz Logo.png`).
- Rename all Alqualite references to Mediaz (مدیاز).
- Move the Crown 👑 and Sound toggle 🔊 buttons from topbar into the user profile menu.
- Eliminate the traditional login page and modal completely.
- Startup must be instant and glitch-free via Telegram auth with onboarding modal for new users.

## Review Focus
1. Telegram WebApp auto-login: `Telegram.WebApp.initDataUnsafe.user` triggers instant authentication without any login prompt.
2. Direct browser preview fallback: In development or non-Telegram browsers, auto-provisions a student session without showing a password form.
3. Topbar on mobile: Clean 3-element layout (Mediaz logo left, 2-capsule switcher center, user capsule right) with zero overflow.
4. User options dropdown: Contains the sound toggle button with live status and the superuser crown panel button (if superuser).
5. Onboarding completion: Correctly saves name and grade, detects `amirtaii8123` superuser flag, and transitions seamlessly to course library.

---

### Task 1: Asset Setup & Mediaz Brand Identity
**Files:**
- Create: `frontend/public/mediaz-logo.png`
- Create: `frontend/src/components/common/MediazLogo.tsx`
- Modify: `frontend/index.html`
- Modify: `frontend/src/components/student/CourseLibrary.tsx`
- Modify: `frontend/src/components/student/ReviewHub.tsx`

**Interfaces:**
- Consumes: `Mediaz Logo.png` from root directory
- Produces: `<MediazLogo size="sm"|"md"|"lg" />` component

- [ ] **Step 1: Copy logo asset to frontend public folder**
- [ ] **Step 2: Create `MediazLogo.tsx` using the official Mediaz emblem**
- [ ] **Step 3: Update `index.html` title and metadata to Mediaz**
- [ ] **Step 4: Update brand copy in `CourseLibrary.tsx` and `ReviewHub.tsx`**
- [ ] **Step 5: Verify build compiles cleanly**

---

### Task 2: Top Bar Refactor & Profile Dropdown Enhancement
**Files:**
- Modify: `frontend/src/components/layout/CourseBoxTopBar.tsx`
- Modify: `frontend/src/components/layout/UserProfileMenu.tsx`

**Interfaces:**
- Consumes: `useAuthStore`, `soundEffects`, `MediazLogo`
- Produces: Streamlined topbar without Crown/Sound; UserProfileMenu containing Sound toggle and Superuser panel rows.

- [ ] **Step 1: Move Sound toggle and Superuser Crown from `CourseBoxTopBar.tsx` to `UserProfileMenu.tsx`**
- [ ] **Step 2: Replace `AlqualiteLogo` with `MediazLogo` in `CourseBoxTopBar.tsx` and remove "Alqualite CourseBox" text**
- [ ] **Step 3: Test dropdown interactions in `UserProfileMenu.tsx` with Sound on/off and Admin navigation**
- [ ] **Step 4: Verify mobile responsiveness (viewport 390px)**

---

### Task 3: Pure Telegram WebApp Authentication & Startup Glitch Elimination
**Files:**
- Modify: `frontend/src/store/useAuthStore.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/auth/OnboardingModal.tsx`
- Remove: `frontend/src/components/auth/AuthModal.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/telegram`, `POST /api/auth/onboarding`, `Telegram.WebApp`
- Produces: Zero-login startup gate with Mediaz splash loader and seamless onboarding modal.

- [ ] **Step 1: Update `useAuthStore.ts` with `isInitializing` state and browser preview auto-login fallback**
- [ ] **Step 2: Update `App.tsx` to render Mediaz Splash Loader during initialization, eliminate `<AuthModal />` completely**
- [ ] **Step 3: Update `OnboardingModal.tsx` branding to Mediaz and refine grade selection UX**
- [ ] **Step 4: Delete or retire `AuthModal.tsx`**
- [ ] **Step 5: Run tests and frontend build to confirm zero regressions**

---

### Task 4: Comprehensive Mobile & End-to-End Verification with Agent-Browser
**Files:**
- Test: `tests/test_mobile_auth_courses.py`

- [ ] **Step 1: Run Python unit tests suite**
- [ ] **Step 2: Run frontend production build (`npm run build`)**
- [ ] **Step 3: Use agent-browser to navigate mobile viewport `390x844` and inspect startup, topbar, and user profile menu**
- [ ] **Step 4: Capture screenshots of the refined Mediaz UI and verify all requirements**
