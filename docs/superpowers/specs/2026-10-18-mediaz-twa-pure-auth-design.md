# Mediaz TWA Pure WebApp & Brand Pivot Specification

## 1. Executive Summary & Intent
Transform the application from a generic web app branded as "Alqualite CourseBox" into **Mediaz (مدیاز)** — a native, high-performance Telegram Mini App (TWA).

The core intent is:
1. **Zero-Glitch, Pure Telegram WebApp Authentication**: Eliminate traditional username/password forms completely. Users access the app exclusively via Telegram or direct authenticated session. There is NO login modal flash or screen. On first visit, students complete a 1-step onboarding (Name & Grade). On subsequent visits, the app boots directly to their Course Library without any friction.
2. **Mediaz Visual Identity**: Adopt the official Mediaz brand logo (`Mediaz Logo.png`), rename all UI elements, headings, and metadata from "Alqualite" to "Mediaz" / "مدیاز".
3. **Streamlined Top Bar for Mobile**: Completely remove the "Alqualite CourseBox" text. The top bar is decluttered to contain only:
   - Left: Mediaz Brand Logo emblem (`mediaz-logo.png`).
   - Center: 2-tab switcher (`دوره‌ها` / `مرور`).
   - Right: User Profile Capsule (`UserProfileMenu`).
   - The Superuser Crown button 👑 and Sound toggle button 🔊 are moved inside the user dropdown menu (`UserProfileMenu.tsx`), keeping the mobile top bar clean and distraction-free.

---

## 2. Requirements & Scope

### 2.1 Brand Pivot (Mediaz / مدیاز)
- Copy `Mediaz Logo.png` from root to `frontend/public/mediaz-logo.png`.
- Create `MediazLogo.tsx` displaying the Mediaz logo with sleek responsive dimensions.
- Update `frontend/index.html` title to: `مدیاز (Mediaz) | سامانه یادگیری تعاملی`.
- Update all Persian strings:
  - "آلکالیت اینتراکتیو" / "Alqualite CourseBox" -> "مدیاز" / "Mediaz".
  - In `CourseLibrary.tsx`: "مدیاز • موتور یادگیری هوشمند واژگان و املا".
  - In `ReviewHub.tsx`: "مرکز مرور و تثبیت مدیاز".
  - In `OnboardingModal.tsx`: "به مدیاز خوش آمدید!".

### 2.2 Top Bar Clean-up (`CourseBoxTopBar.tsx` & `UserProfileMenu.tsx`)
- Top Bar contains:
  - Left: `MediazLogo` (clickable, returns to courses).
  - Center: Capsule switcher (`دوره‌ها`, `مرور`).
  - Right: `UserProfileMenu`.
- Remove Crown button and Sound toggle button from `CourseBoxTopBar.tsx`.
- Inside `UserProfileMenu.tsx` dropdown:
  - User avatar, name, grade, superuser badge.
  - **Row 1 - Audio Sound Toggle**: Displays current state (با صدا / بی‌صدا) with volume icon, toggles on click.
  - **Row 2 - Superuser Panel (if `is_superuser`)**: Button with 👑 "پنل مدیریت کاربران" navigating to `activeTab = 'admin'`.
  - **Row 3 - Logout / Reset**: "خروج از حساب".

### 2.3 Pure Telegram WebApp Auth Flow & Zero Login Screen (`App.tsx` & `useAuthStore.ts`)
- **Delete/Eliminate `AuthModal.tsx` completely**:
  - The app must NEVER render an `AuthModal` or password form.
- **Startup Lifecycle**:
  - App starts in `isInitializing: true`.
  - App renders a sleek Mediaz Splash screen with animated Mediaz emblem and message: "در حال اتصال به مدیاز...".
  - Auth resolution logic:
    1. Check `window.Telegram?.WebApp`.
    2. If `tg?.initDataUnsafe?.user`: Call `loginWithTelegram(tg.initDataUnsafe.user)`. Call `tg.ready()` and `tg.expand()`.
    3. If running in a regular desktop browser (testing/development) and a valid token exists in `localStorage`: Call `fetchUser()`.
    4. If running in a regular desktop browser with no token and no Telegram: Auto-initialize via `loginWithTelegram({ id: 1001, first_name: "دانش‌آموز مدیاز", username: "student_preview" })` so browser previews load immediately with zero blockers.
    5. Once user is loaded:
       - If `!user.is_onboarded`: show `OnboardingModal`.
       - If `user.is_onboarded`: show Course Library or saved tab.
       - End splash screen (`isInitializing: false`).
- **Onboarding Modal**:
  - Pre-fills display name from Telegram name.
  - Lets user select grade (دهم، یازدهم، دوازدهم، کنکور).
  - If user sets name to `amirtaii8123`, activates superuser privileges immediately.
  - Submits to `POST /api/auth/onboarding`, updates user in store, transitions instantly to library.

---

## 3. Non-Goals & Anti-Goals
- **Anti-Goal**: Do not retain any legacy username/password login modal that could flash or appear during network lag or initial boot.
- **Anti-Goal**: Do not crowd the top navigation bar on mobile with extra buttons (crown, sound) that steal space from tabs.
- **Non-Goal**: Do not delete hidden courses (they remain hidden for regular users, visible for dev/admin).
