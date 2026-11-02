# Architectural Survey & Codebase Investigation Report: Mediqz TopBar

**Author**: `teamwork_explorer_survey_1` (Read-Only Codebase Architecture Explorer)  
**Date**: 2026-11-02  
**Target Project**: Alqualite CourseBox (`https://mediqz.vercel.app`)  
**Mission**: Codebase Structure, DOM Layout, RTL/LTR Hierarchy, and Technical Recommendation for TopBar User Logo / Profile Repositioning.

---

## 1. Observation

### 1.1 Relevant Files and Component Hierarchy
1. `frontend/src/App.tsx`:
   - Mounts `<CourseBoxTopBar />` conditionally: `{activeTab !== 'player' && <CourseBoxTopBar />}` (Line 108).
   - Contains `<MobileBottomNav />` mounted conditionally at line 118.
2. `frontend/src/components/layout/CourseBoxTopBar.tsx` (127 lines):
   - The primary navigation header component.
3. `frontend/src/components/layout/UserProfileMenu.tsx` (217 lines):
   - The interactive user avatar button and dropdown menu component.
4. `frontend/src/components/common/MediazLogo.tsx` (44 lines):
   - Renders the brand logo (`/mediaz-emblem-transparent.png`) and optional Persian title.
5. `frontend/index.html`:
   - Root document explicitly sets `<html lang="fa" dir="rtl">` (Line 2).
6. `frontend/package.json`:
   - Build script: `"build": "tsc && vite build"`.
7. `backend/app/main.py`:
   - Serves `frontend/dist` as an SPA via `/{full_path:path}` catch-all (Lines 116-133).

---

### 1.2 Exact DOM & Flex Layout Breakdown in `CourseBoxTopBar.tsx`
Lines 19–125 verbatim:
```tsx
  return (
    <header
      dir="rtl"
      style={{ paddingTop: 'var(--sat, 0px)' }}
      className="fixed top-0 left-0 right-0 z-50 select-none bg-white/85 backdrop-blur-xl border-b border-white/80 shadow-xs"
    >
      <div className="relative h-13 sm:h-14 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2">
        {/* Child 1: Currently Right side in RTL: Brand Logo + Epigraph */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="inline-flex items-center gap-1.5 p-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="مدیاز • سامانه یادگیری هوشمند"
          >
            <MediazLogo size="sm" showText={false} className="sm:hidden" />
            <MediazLogo size="md" showText={false} className="hidden sm:inline-flex" />
            <span className="sm:hidden text-xs font-black text-blue-950 tracking-tight">مدیاز</span>
          </button>

          {/* Epigraph (Hidden on mobile) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/30 text-amber-900/80 text-[11px] font-medium tracking-tight">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span className="font-serif">«توانا بود هر که دانا بود»</span>
          </div>
        </div>

        {/* Child 2: Center Mobile Only: Telemetry HUD (🔥 Streak + ⚡ Leitner Due Badge) */}
        <div className="sm:hidden flex items-center gap-1.5 shrink-0 overflow-hidden">
          {/* Active Streak Badge */}
          <div
            title="روزهای استمرار مطالعه متوالی"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-900 text-[10px] font-black tracking-tight"
          >
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
            <span>۳ روز</span>
          </div>

          {/* Leitner Due Badge (Clickable Quick Jump) */}
          <button
            type="button"
            onClick={() => setActiveTab('routines')}
            title="مرورهای آماده امروز در جعبه لایتنر"
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-tight transition-all active:scale-95 cursor-pointer border ${
              dueCount > 0
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs shadow-blue-600/30'
                : 'bg-emerald-500/10 text-emerald-800 border-emerald-400/30'
            }`}
          >
            <Zap className={`w-3 h-3 shrink-0 ${dueCount > 0 ? 'text-amber-300 fill-amber-300 animate-pulse' : 'text-emerald-600'}`} />
            <span>{dueCount > 0 ? `${dueCount} مرور` : 'تکمیل ✓'}</span>
          </button>
        </div>

        {/* Child 3: Center Desktop Only: Capsule Switcher (Absolute Positioning) */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 p-1 rounded-2xl bg-white/95 backdrop-blur-2xl border border-blue-200/80 shadow-[0_4px_20px_-3px_rgba(37,99,235,0.18)] ring-1 ring-blue-500/10">
          ...
        </div>

        {/* Child 4: Currently Left side in RTL: User Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
```

---

### 1.3 Empirical In-Browser Coordinate Measurements (Live via `agent-browser`)

Executing runtime DOM box inspection via `agent-browser` confirmed the exact physical layout:

#### Desktop Viewport (1440x900):
- **Child 1 (Brand Logo & Epigraph)**: `x = 1196.8px, right = 1408px` (Physical **Right Edge**, 32px padding).
- **Child 3 (Capsule Switcher)**: `x = 557.1px, right = 882.9px` (Width: 325.8px, Center: 720.0px = exact 1440 / 2).
- **Child 4 (User Profile Menu)**: `x = 32px, right = 161.8px` (Physical **Left Edge**, 32px padding).

#### Mobile Viewport (375x812):
- **Child 1 (Brand Logo + "مدیاز")**: `x = 279.9px, right = 363.0px` (Physical **Right Edge**, 12px padding).
- **Child 2 (Telemetry HUD: Streak + Due)**: `x = 97.3px, right = 232.6px` (Physical **Center**).
- **Child 4 (User Profile Button: "م")**: `x = 12.0px, right = 50.0px` (Physical **Left Edge**, 12px padding).

---

### 1.4 Secondary Latent Bug Discovered: Dropdown Coordinate Overflow in `UserProfileMenu.tsx`
Lines 76–80 in `UserProfileMenu.tsx`:
```tsx
      {isOpen && (
        <div
          dir="rtl"
          className="absolute top-full right-0 mt-2 w-72 max-w-[calc(100vw-20px)] rounded-2xl shadow-2xl p-2.5 flex flex-col gap-1.5 text-right animate-fadeIn z-50 border border-blue-100 bg-white shadow-blue-900/20"
        >
```
- The dropdown has `position: absolute; top: 100%; right: 0;`.
- Because the containing block is on the **left side** of the screen (`x = 12px` to `x = 50px` on mobile), `right: 0` aligns the right edge of the dropdown with the button's right edge (`x = 50px`).
- The dropdown width is `w-72` = 288px.
- The left edge extends to: `x = 50px - 288px = -238px`!
- **Over 230 pixels of the dropdown menu render outside the left viewport edge!**
- The original author coded `right-0` expecting the component to reside on the **right side** of the screen (where `right: 0` anchors to the right screen margin and expands inwards towards the center).

---

### 1.5 Element Inventory & Data Contracts

| Component | Element / Badge | Props / Data Source | Visibility Condition | Behavior |
|---|---|---|---|---|
| `CourseBoxTopBar` | Mediaz Brand Emblem | `MediazLogo` (`dim.imgClass`, transparent PNG) | Always visible (`sm:hidden` sm, `hidden sm:inline-flex` md) | Click switches `activeTab` to `'courses'` |
| `CourseBoxTopBar` | Brand Persian Title "مدیاز" | Static text `text-xs font-black text-blue-950` | `sm:hidden` (Mobile only) | Part of brand button |
| `CourseBoxTopBar` | Epigraph «توانا بود هر که دانا بود» | Static text + `Sparkles` icon | `hidden xl:flex` (Screens >= 1280px) | Decorative Persian educational masthead |
| `CourseBoxTopBar` | Active Streak Badge | `useRoutineStore` (hardcoded placeholder "۳ روز") | `sm:hidden` (Mobile only) | Displays study consistency |
| `CourseBoxTopBar` | Leitner Due Badge | `useRoutineStore.days`, `dueCount` | `sm:hidden` (Mobile only) | Click switches `activeTab` to `'routines'`. Shows `{dueCount} مرور` or `تکمیل ✓` |
| `CourseBoxTopBar` | Capsule Switcher | `useAuthStore.activeTab`, `useRoutineStore` | `hidden sm:flex` (Desktop only) | 3 tabs: `دوره‌ها`, `روتین‌های مرور` (with badge), `تحلیل کارنامه` |
| `UserProfileMenu` | User Avatar Circle | `useAuthStore.user.display_name` initial | Always visible (if `user` not null) | Initial letter with cyan-to-indigo gradient |
| `UserProfileMenu` | Display Name | `useAuthStore.user.display_name` | `hidden sm:inline` (Desktop only) | Truncated at `max-w-[110px]` |
| `UserProfileMenu` | Dropdown Chevron | Lucide SVG chevron down | `hidden sm:block` (Desktop only) | Rotates 180° when `isOpen` is true |
| `UserProfileMenu` | Sound FX Toggle | `soundEffects.toggleMute()`, `soundEffects.isMuted()` | Dropdown item | Plays chime on unmute; persists in audio service |
| `UserProfileMenu` | Superuser Admin Link | `useAuthStore.user.is_superuser` | Superuser only | Quick jump to `'admin'` tab |
| `UserProfileMenu` | Logout Action | `useAuthStore.logout()` | Dropdown item | Clears auth token and resets stores |

---

## 2. Logic Chain

1. **RTL Flexbox Coordinate Rule**: Under `dir="rtl"` (set on `<html lang="fa" dir="rtl">` and `<header dir="rtl">`), the CSS inline-start axis begins on the **right** side of the viewport and ends on the **left** side of the viewport.
2. **Current Order in `CourseBoxTopBar.tsx`**:
   - Child 1 in the DOM is `MediazLogo`. Because it is the first child, it is placed at `flex-start` (the physical **right**).
   - Child 4 in the DOM is `<UserProfileMenu />`. Because it is the last child in `justify-between`, it is placed at `flex-end` (the physical **left**).
3. **User's Request**: The user noted that the top bar's user profile/logo feels visually displaced and should be on the **right**, not the **left**.
4. **Natural RTL Ergonomics**:
   - In Persian RTL design systems (e.g. Digikala, Snapp, Divar, Balad, Telegram WebApp in Persian):
     - The user identity / avatar belongs at the top right (primary reading anchor for personalized tools), or the brand logo on the right and user profile on the left if mimicking LTR mirroring.
     - However, when the user avatar is on the right, the eye immediately anchors on the student's personal identity and active state.
     - Placing the brand mark on the left (the masthead anchor) creates a clean, balanced frame across the top bar.
5. **Architectural Resolution of the Dropdown Bug**:
   - Moving `<UserProfileMenu />` to Child 1 (flex-start) places the user avatar at the physical **right** edge.
   - At the right edge, `UserProfileMenu`'s dropdown style `absolute top-full right-0` aligns the right edge of the dropdown with the avatar, causing the menu to expand leftward into the center of the viewport (`x = 75px` to `363px` on mobile, `1120px` to `1408px` on desktop).
   - This completely eliminates the 238px off-screen clipping bug without needing custom JavaScript portal positioning!
6. **Mobile Space & Visual Clutter Audit**:
   - On mobile (375px), `MobileBottomNav` already features a dedicated `روتین‌ها` tab with the active `dueCount` badge, plus a `پروفایل` tab.
   - In the TopBar, having both `🔥 ۳ روز` and `⚡ X مرور` in the middle crowded the viewport.
   - When User Profile is at the right and Mediaz Emblem is at the left, the center space has ample breathing room for the Telemetry HUD (`🔥 ۳ روز` + `⚡ X مرور`), OR a cleaner, more minimalist layout where the Streak badge is placed next to the User Profile, keeping the center clear.

---

## 3. Caveats

1. **CoursePlayer Isolation**: When `activeTab === 'player'`, `CourseBoxTopBar` is unmounted by `App.tsx` (line 108). `CoursePlayer` uses its own custom internal header with a breadcrumb and exit prompt; it is not affected by changes to `CourseBoxTopBar.tsx`.
2. **Read-Only Scope**: This report is strictly an architecture and structural survey. No production code was modified during this exploration.
3. **Desktop Centering**: The Desktop Capsule Switcher uses `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`. Swapping the surrounding flex items (right and left) does not affect its mathematical centering at all.
4. **Existing E2E Test Assertion**: `scripts/verify_all_4_scenarios.py` asserts that `document.querySelector('header')?.innerText` contains `'روتین‌های مرور'` and `'تحلیل کارنامه'`. As long as the center capsule switcher retains these exact strings, tests will remain 100% green.

---

## 4. Conclusion & Technical Recommendations

### 4.1 Recommendation Summary
1. **Swap Left and Right Flex Containers in `CourseBoxTopBar.tsx`**:
   - Move `<UserProfileMenu />` to the **first position** in the flex layout (rendering at physical **Right** in RTL).
   - Move the `MediazLogo` brand container and epigraph to the **last position** in the flex layout (rendering at physical **Left** in RTL).
2. **Keep the Desktop Capsule Switcher Center-Locked**:
   - Retain `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` for pixel-perfect mathematical centering across desktop viewports.
3. **Refine Mobile Telemetry HUD Placement**:
   - Position the Mobile HUD cleanly in the center (between User Profile on the right and Brand Logo on the left), maintaining zero horizontal overflow (`scrollWidth <= innerWidth`).
4. **Verify `UserProfileMenu.tsx` Dropdown Alignment**:
   - With the menu on the right, `right-0` aligns the menu within the viewport bounds. Add `left-auto right-0` to guarantee stability.

---

### 4.2 Proposed Code Refactoring

#### Target File: `frontend/src/components/layout/CourseBoxTopBar.tsx`

```tsx
<<<<
      <div className="relative h-13 sm:h-14 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2">
        {/* Right side (in RTL): Brand Logo + Persian Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className="inline-flex items-center gap-1.5 p-1 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="مدیاز • سامانه یادگیری هوشمند"
          >
            <MediazLogo size="sm" showText={false} className="sm:hidden" />
            <MediazLogo size="md" showText={false} className="hidden sm:inline-flex" />
            <span className="sm:hidden text-xs font-black text-blue-950 tracking-tight">مدیاز</span>
          </button>

          {/* Epigraph (Hidden on mobile) */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/30 text-amber-900/80 text-[11px] font-medium tracking-tight">
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
            <span className="font-serif">«توانا بود هر که دانا بود»</span>
          </div>
        </div>

        {/* Center Mobile Only: Cognitive Telemetry HUD (🔥 Streak + ⚡ Leitner Due Badge) */}
        <div className="sm:hidden flex items-center gap-1.5 shrink-0 overflow-hidden">
          ...
        </div>

        {/* Center Desktop Only: Mathematically Centered 3-Button Capsule Switcher */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ...">
          ...
        </div>

        {/* Left side (in RTL): User Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <UserProfileMenu />
        </div>
      </div>
====
      <div className="relative h-13 sm:h-14 px-3 sm:px-6 md:px-8 flex items-center justify-between gap-2">
        {/* 1. Right Side (in RTL): User Profile Menu & Identity */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <UserProfileMenu />
        </div>

        {/* 2. Center Mobile Only: Cognitive Telemetry HUD (🔥 Streak + ⚡ Leitner Due Badge) */}
        <div className="sm:hidden flex items-center gap-1.5 shrink-0 overflow-hidden">
          {/* Active Streak Badge */}
          <div
            title="روزهای استمرار مطالعه متوالی"
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-900 text-[10px] font-black tracking-tight"
          >
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
            <span>۳ روز</span>
          </div>

          {/* Leitner Due Badge (Clickable Quick Jump) */}
          <button
            type="button"
            onClick={() => setActiveTab('routines')}
            title="مرورهای آماده امروز در جعبه لایتنر"
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-tight transition-all active:scale-95 cursor-pointer border ${
              dueCount > 0
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs shadow-blue-600/30'
                : 'bg-emerald-500/10 text-emerald-800 border-emerald-400/30'
            }`}
          >
            <Zap className={`w-3 h-3 shrink-0 ${dueCount > 0 ? 'text-amber-300 fill-amber-300 animate-pulse' : 'text-emerald-600'}`} />
            <span>{dueCount > 0 ? `${dueCount} مرور` : 'تکمیل ✓'}</span>
          </button>
        </div>

        {/* 3. Center Desktop Only: Mathematically Centered 3-Button Capsule Switcher */}
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1 p-1 rounded-2xl bg-white/95 backdrop-blur-2xl border border-blue-200/80 shadow-[0_4px_20px_-3px_rgba(37,99,235,0.18)] ring-1 ring-blue-500/10">
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-97 flex items-center justify-center ${
              isCourseActive
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/35 border border-white/20'
                : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/70'
            }`}
          >
            دوره‌ها
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routines')}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-97 ${
              isRoutineActive
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/35 border border-white/20'
                : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/70'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
            <span>روتین‌های مرور</span>
            {dueCount > 0 && (
              <span className="min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {dueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tahlil')}
            className={`min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-97 ${
              isTahlilActive
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-md shadow-blue-600/35 border border-white/20'
                : 'text-slate-600 hover:text-blue-950 hover:bg-blue-50/70'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>تحلیل کارنامه</span>
          </button>
        </div>

        {/* 4. Left Side (in RTL): Brand Logo + Persian Title + Epigraph */}
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
>>>>
```

---

## 5. Verification Method

### 5.1 Verification Commands
1. **Frontend Compilation & Bundle Check**:
   ```bash
   cd "/Users/amiralirakhshani/Projects/Alqualite CourseBox/frontend" && npm run build
   ```
   *Expected outcome*: `tsc && vite build` completes with exit code 0 and 0 TypeScript errors.

2. **Backend & Integration Unit Tests**:
   ```bash
   cd "/Users/amiralirakhshani/Projects/Alqualite CourseBox" && pytest
   ```
   *Expected outcome*: All 57 tests pass with 0 failures.

3. **Multi-Scenario Automated E2E Verification**:
   ```bash
   python3 scripts/verify_all_4_scenarios.py
   ```
   *Expected outcome*: Scenarios 1 (Phone TWA), 2 (Phone Web), 3 (Desktop TWA), and 4 (Desktop Web) pass all DOM assertions.

4. **DOM Coordinate & Overflow Check via `agent-browser`**:
   ```bash
   agent-browser set viewport 375 812
   agent-browser open http://127.0.0.1:3000
   agent-browser eval "
   (() => {
     const header = document.querySelector('header');
     const profileBox = header.querySelector('button[aria-expanded]')?.getBoundingClientRect();
     const brandBox = header.querySelector('img[alt=\"Mediaz Emblem\"]')?.getBoundingClientRect();
     return {
       profileIsOnRight: profileBox.x > brandBox.x,
       scrollWidth: document.documentElement.scrollWidth,
       innerWidth: window.innerWidth,
       zeroHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth
     };
   })()
   "
   ```
   *Expected outcome*: `profileIsOnRight === true` and `zeroHorizontalOverflow === true`.

### 5.2 Invalidation Conditions
- If `profileBox.x < brandBox.x`, the user profile remains erroneously positioned to the left of the brand emblem in RTL.
- If `document.documentElement.scrollWidth > window.innerWidth`, horizontal scrolling or container overflow has occurred.
- If clicking the user avatar causes the dropdown to clip off-screen (`rect.x < 0` or `rect.right > window.innerWidth`).
