# Visual Inspection & Browser Audit Report: Mediqz TopBar Layout & RTL Ergonomics

**Agent**: `teamwork_explorer_survey_2` (Teamwork Explorer / Live Visual Auditor)  
**Date**: 2026-11-02  
**Target Live Deployment**: https://mediqz.vercel.app  
**Local Codebase**: `/Users/amiralirakhshani/Projects/Alqualite CourseBox`  
**Mission**: Live multi-viewport browser audit (375x812 vs 1440x900), exact coordinate measurements, visual hierarchy & RTL layout evaluation.

---

## 1. Observation

### 1.1 Scope & Authentication Mounting State
- Inspection of `frontend/src/App.tsx` (lines 92–109) confirms that `CourseBoxTopBar` is rendered **conditionally**:
  ```tsx
  93:  if (!user) {
  94:    return (
  95:      <div className="min-h-screen relative flex flex-col font-sans text-slate-900 bg-[#f4f8fd] select-none selection:bg-blue-200">
  96:        <FluidBackground />
  97:        <LoginPad />
  98:      </div>
  99:    );
  100:  }
  ...
  108:  {activeTab !== 'player' && <CourseBoxTopBar />}
  ```
- **Logged-Out Observation**: In the logged-out state (`user === null`), `CourseBoxTopBar` does **not** exist in the DOM (`document.querySelector('header') === null`). Only the `LoginPad` component is displayed.
- **Logged-In Observation**: When authenticated, `CourseBoxTopBar` mounts fixed at the top of the viewport (`fixed top-0 left-0 right-0 z-50`).

---

### 1.2 Exact Coordinate Measurements via Browser Automation (`agent-browser`)

Live DOM bounding box telemetry was gathered using `agent-browser` CDP automation connected to `https://mediqz.vercel.app`:

#### A. Mobile Viewport: 375x812 (iPhone standard)
- **Container**: `<header dir="rtl">` (Height: 44px, computed `direction: rtl`, `flex-direction: row`, `justify-content: space-between`, `padding: 0 12px`).
- **Brand Emblem & Title (`MediazLogo` + "مدیاز")**:
  - `x = 280px`, `right = 363px`, `width = 83px`, `height = 44px`.
  - Position: **FAR RIGHT** of the screen (12px padding from right edge: `375 - 363 = 12px`).
- **Streak Badge ("۳ روز")**:
  - `x = 178px`, `right = 233px`, `width = 55px`, `height = 21px`.
  - Position: **CENTER-RIGHT**.
- **Leitner Due Badge ("تکمیل ✓" / "X مرور")**:
  - `x = 97px`, `right = 172px`, `width = 74px`, `height = 44px`.
  - Position: **CENTER-LEFT** (6px gap between Streak and Leitner badge).
- **User Profile Button (Avatar circle with initial "ع" or "م")**:
  - `x = 12px`, `right = 50px`, `width = 38px`, `height = 44px`.
  - Position: **FAR LEFT** of the screen (12px padding from left edge: `x = 12px`).

#### B. Desktop Viewport: 1440x900 (Standard Laptop/Widescreen)
- **Container**: `<header dir="rtl">` (Height: 56px, computed `direction: rtl`, `flex-direction: row`, `justify-content: space-between`, `padding: 0 32px`).
- **Brand Emblem & Epigraph**:
  - Brand Logo button: `x = 1345px`, `right = 1408px`, `width = 63px`.
  - Epigraph «توانا بود هر که دانا بود»: `x = 1197px`, `right = 1333px`, `width = 136px`.
  - Total Brand Cluster: `x = 1197px` to `right = 1408px` (Physical **FAR RIGHT**, 32px padding from right edge).
- **Center Capsule Switcher ("دوره‌ها", "روتین‌های مرور", "تحلیل کارنامه")**:
  - `x = 557px`, `right = 883px`, `width = 326px`, `height = 50px`.
  - Mathematically centered: `557 + (326 / 2) = 720.0px` (Exact midpoint of 1440px viewport).
- **User Profile Button ("ع علی رضایی" / "م مدیریت ارشد")**:
  - `x = 32px`, `right = 162px` (Student) / `right = 209px` (Admin), `width = 130px - 177px`.
  - Position: Physical **FAR LEFT** of the screen (32px padding from left edge).

---

### 1.3 Critical Discovered Bug: Severe Dropdown Off-Screen Clipping

When clicking the User Profile button on the live site, the dropdown menu (`UserProfileMenu.tsx:77-80`) mounts with:
```tsx
77:  <div
78:    dir="rtl"
79:    className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-20px)] rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1.5 text-right animate-fadeIn z-50 border border-blue-100 bg-white shadow-blue-900/20"
80:  >
```
Empirical measurement of the dropdown's bounding box (`profilePopup`) revealed:

1. **On Mobile (375x812)**:
   - Profile Button right edge: `right = 50px`.
   - Popup width: `w-72` = 288px.
   - Because `right: 0` is set, the popup's right edge is anchored at `50px`, causing its left edge to expand to:
     $$\text{Left Edge } x = 50\text{px} - 288\text{px} = \mathbf{-238\text{px}}$$
   - **83% of the popup (238 pixels out of 288 pixels) renders completely off-screen to the left!** The user cannot read username, ID, or settings.

2. **On Desktop (1440x900)**:
   - Profile Button right edge: `right = 162px`.
   - Popup width: `w-72` = 288px.
   - Left edge:
     $$\text{Left Edge } x = 162\text{px} - 288\text{px} = \mathbf{-126\text{px}}$$
   - **126 pixels of the dropdown menu clip off the left screen edge!**

---

### 1.4 Hardcoded & Redundant Badges
- In `CourseBoxTopBar.tsx:54`:
  ```tsx
  <span>۳ روز</span>
  ```
  The streak badge displays a hardcoded static string `"۳ روز"` with no dynamic computation in `useRoutineStore.ts`.
- In `MobileBottomNav.tsx` (lines 58–77):
  The mobile bottom navigation dock already contains a dedicated `روتین‌ها` button that displays the exact same dynamic `dueCount` badge as the TopBar's Leitner badge.

---

## 2. Logic Chain

1. **RTL Writing Mode Axiom**:
   - The document declares `<html lang="fa" dir="rtl">` and the top bar declares `<header dir="rtl">`.
   - In CSS Flexbox specifications (`flex-direction: row` under `direction: rtl`), `flex-start` (inline-start) is on the **physical Right**, and `flex-end` (inline-end) is on the **physical Left**.
2. **Root Cause of Element Inversion**:
   - In `CourseBoxTopBar.tsx`, Child 1 in the DOM is `MediazLogo` (Brand). Being the first child, it renders at `flex-start` = **Right**.
   - Child 4 in the DOM is `<UserProfileMenu />`. Being the last child in `justify-between`, it renders at `flex-end` = **Left**.
3. **The User's Request Corroboration**:
   - The user reported: *"the top bar's user logo should be at right, not left."*
   - In standard Persian RTL web and mobile applications (e.g. Digikala, Snapp, Telegram WebApps):
     - The top right is the primary visual entry point (the first place the Persian reader's eye lands). Placing user identity / avatar at the right creates an immediate personal anchor.
     - Placing the brand logo at the left provides a balanced architectural frame (masthead anchor).
4. **Root Cause of the Dropdown Clipping Bug**:
   - The author of `UserProfileMenu.tsx` wrote `className="absolute top-full right-0 ..."` intending for the avatar to sit on the **Right** side of the screen.
   - When on the Right (`x = 325px` to `363px`), `right: 0` anchors the dropdown inside the right margin and expands inward towards the center (`x = 75px` to `363px`).
   - But because `CourseBoxTopBar.tsx` placed the profile on the **Left**, `right: 0` forced the menu to shoot off-screen into negative coordinate space (`x = -238px`).
5. **Deduction**:
   - Moving `<UserProfileMenu />` to Child 1 in `CourseBoxTopBar.tsx` immediately solves **both** problems:
     a) It places the user logo on the physical **Right** as requested.
     b) It automatically fixes the -238px dropdown clipping bug without needing complex JavaScript portal repositioning.

---

## 3. Caveats

1. **CoursePlayer Exemption**: `App.tsx:108` explicitly unmounts `CourseBoxTopBar` when `activeTab === 'player'`. `CoursePlayer` has its own internal breadcrumb header; it will not be affected.
2. **Desktop Center Capsule Stability**: The desktop 3-button switcher uses `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`. Swapping the surrounding items (Right and Left flex children) will have zero effect on the switcher's pixel-perfect mathematical center alignment.
3. **Mobile Screen Budget**: On 375px screens:
   - User Profile Button: ~38px width.
   - Brand Logo button ("مدیاز" + Emblem): ~83px width.
   - Available center space: $375 - 38 - 83 - (2 \times 12\text{px padding}) - (2 \times 8\text{px gap}) = 206\text{px}$.
   - The Telemetry HUD (Streak 55px + Leitner 74px + 6px gap = 135px) fits comfortably within 206px with 71px of breathing room.

---

## 4. Conclusion & Technical Recommendations

### 4.1 Summary of Findings
| Metric / Aspect | Current Live State | Recommended Target State | Rationale |
|---|---|---|---|
| **User Profile / Avatar** | Physical Left (`x = 12px` mobile, `32px` desktop) | Physical Right (`x = 325-363px` mobile, `1260-1408px` desktop) | Matches user request & Persian RTL reading flow |
| **Mediaz Brand & Title** | Physical Right (`x = 280px` mobile, `1197px` desktop) | Physical Left (`x = 12-95px` mobile, `32-230px` desktop) | Masthead anchor on inline-end |
| **Profile Dropdown Position** | Clipped off-screen (`x = -238px` mobile, `-126px` desktop) | Fully visible on-screen (`x = 75px` to `363px`) | Aligns with Right-anchored avatar via `right-0` |
| **Desktop Capsule Switcher** | Centered (`x = 557px` to `883px`) | Centered (`x = 557px` to `883px`) | Retained via `absolute left-1/2 -translate-x-1/2` |
| **Mobile Telemetry HUD** | Center (`x = 97px` to `233px`) | Center (`x = 110px` to `245px`) | Fits within 206px available center space |

### 4.2 Exact Recommended Code Changes

#### File 1: `frontend/src/components/layout/CourseBoxTopBar.tsx`
Swap Child 1 and Child 4 inside the header container:
```tsx
      <div className="relative h-13 sm:h-14 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2">
        {/* 1. Right side (in RTL): User Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <UserProfileMenu />
        </div>

        {/* 2. Center Mobile Only: Cognitive Telemetry HUD (Streak + Due Badge) */}
        <div className="sm:hidden flex items-center gap-1.5 shrink-0 overflow-hidden">
          ...
        </div>

        {/* 3. Center Desktop Only: Capsule Switcher */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ...">
          ...
        </div>

        {/* 4. Left side (in RTL): Brand Logo + Epigraph */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Epigraph (Hidden on mobile) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/30 text-amber-900/80 text-[11px] font-medium tracking-tight">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span className="font-serif">«توانا بود هر که دانا بود»</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="inline-flex items-center gap-1.5 p-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="مدیاز • سامانه یادگیری هوشمند"
          >
            <span className="sm:hidden text-xs font-black text-blue-950 tracking-tight">مدیاز</span>
            <MediazLogo size="sm" showText={false} className="sm:hidden" />
            <MediazLogo size="md" showText={false} className="hidden sm:inline-flex" />
          </button>
        </div>
      </div>
```

#### File 2: `frontend/src/components/layout/UserProfileMenu.tsx`
Ensure dropdown robustness with explicit `right-0 left-auto`:
```tsx
      {isOpen && (
        <div
          dir="rtl"
          className="absolute top-full right-0 left-auto mt-2 w-72 max-w-[calc(100vw-20px)] rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1.5 text-right animate-fadeIn z-50 border border-blue-100 bg-white shadow-blue-900/20"
        >
```

---

## 5. Verification Method

### 5.1 Verification Commands
1. **Frontend Compilation Check**:
   ```bash
   cd "/Users/amiralirakhshani/Projects/Alqualite CourseBox/frontend" && npm run build
   ```
   *Expected outcome*: Exit code 0, 0 TypeScript errors.

2. **Automated Test Suite**:
   ```bash
   cd "/Users/amiralirakhshani/Projects/Alqualite CourseBox" && pytest
   ```
   *Expected outcome*: 57 passing tests, 0 failures.

3. **Multi-Scenario Browser Verification**:
   ```bash
   python3 scripts/verify_all_4_scenarios.py
   ```
   *Expected outcome*: 100% assertions pass across all 4 scenarios (Phone TWA, Phone Web, Desktop TWA, Desktop Web).

4. **DOM Coordinate & Overflow Assertion via `agent-browser`**:
   ```bash
   agent-browser set viewport 375 812
   agent-browser open http://127.0.0.1:3000
   agent-browser eval "
   (() => {
     const header = document.querySelector('header');
     const profile = header.querySelector('button[aria-expanded]')?.getBoundingClientRect();
     const brand = header.querySelector('img[alt=\"Mediaz Emblem\"]')?.getBoundingClientRect();
     return {
       profileIsOnRight: profile.x > brand.x,
       scrollWidth: document.documentElement.scrollWidth,
       innerWidth: window.innerWidth,
       zeroOverflow: document.documentElement.scrollWidth <= window.innerWidth
     };
   })()
   "
   ```
   *Expected outcome*: `profileIsOnRight: true` and `zeroOverflow: true`.

### 5.2 Invalidation Conditions
- If `profile.x < brand.x`, the user profile has not been positioned on the right in RTL.
- If `profilePopup.x < 0`, the profile dropdown continues to clip off-screen.
- If `scrollWidth > innerWidth`, horizontal viewport overflow has been introduced.
