# RoutineHub & Mobile Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the secondary tab from ReviewHub into RoutineHub with multi-course daily scheduling, automatic routine playlist playback, and mistakes review with dynamic remediation courses; refine topbar with transparent emblem, centered glowing capsule (`دوره‌ها` / `RoutineHub`), thinner header, single-row user pill; and optimize mobile/Android keyboard layout.

**Architecture:** Frontend React SPA with a new `useRoutineStore` (Zustand with localStorage persistence) managing daily schedules, auto-play queue, and mistake records; `RoutineHub.tsx` with Schedule and Mistakes views; refactored `CourseBoxTopBar` and `MediazLogo`; responsive styling tweaks in `CoursePlayer` and `FillInTheBlank`.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Lucide icons, Canvas-confetti, Zustand.

**Spec:** `docs/superpowers/specs/2026-10-18-routine-hub-and-mobile-enhancements-design.md`

## Global Constraints
- Logo must use the transparent emblem without background and without text, slightly larger in topbar.
- Top bar capsule must be mathematically centered, have beautiful effects, and feature `دوره‌ها` and `RoutineHub`.
- Top row must be thinner and the user pill must omit the grade attribute on the bar itself.
- Android keyboard experience must prevent elements from hiding under the keyboard.
- ReviewHub and all its traces must be completely deleted.
- RoutineHub must support multi-course parts per day, automatic sequential start, and mistakes review + practice course generation.

## Review Focus
1. Transparent emblem rendering in top bar with no background box.
2. Centered glowing capsule with `دوره‌ها` and `RoutineHub` tabs.
3. No grade under name in top bar pill (clean single row).
4. Auto-start in RoutineHub starts sequential routine playback.
5. Mistakes recorded upon wrong answer and can be practiced via dynamic course.

---

### Task 1: Top Bar & Logo Polish (Items 1, 2, 6)
**Files:**
- Modify: `frontend/src/components/common/MediazLogo.tsx`
- Modify: `frontend/src/components/layout/CourseBoxTopBar.tsx`
- Modify: `frontend/src/components/layout/UserProfileMenu.tsx`

- [ ] **Step 1: Point `MediazLogo.tsx` to `/mediaz-emblem-transparent.png` with increased size scale**
- [ ] **Step 2: Center capsule in `CourseBoxTopBar.tsx`, add glassmorphism effects, reduce header height to `h-12`**
- [ ] **Step 3: Update `UserProfileMenu.tsx` topbar trigger to single-row layout without grade**
- [ ] **Step 4: Verify build compiles cleanly**

---

### Task 2: Mobile & Android Soft Keyboard Optimization (Item 3)
**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/src/components/student/CoursePlayer/CoursePlayer.tsx`
- Modify: `frontend/src/components/student/CoursePlayer/FillInTheBlank.tsx`

- [ ] **Step 1: Update viewport meta tag in `index.html` with `interactive-widget=resizes-content`**
- [ ] **Step 2: Elevate interactive slide containers and increase bottom safe padding in `CoursePlayer.tsx`**
- [ ] **Step 3: Add auto-scroll on focus and elevate input in `FillInTheBlank.tsx`**
- [ ] **Step 4: Verify build compiles cleanly**

---

### Task 3: Purge ReviewHub (Item 4)
**Files:**
- Remove: `frontend/src/components/student/ReviewHub.tsx`
- Remove: `frontend/src/store/useReviewStore.ts`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/CourseBoxTopBar.tsx`
- Modify: `frontend/src/components/student/CoursePartsView.tsx`
- Modify: `frontend/src/components/student/CongratsView.tsx`
- Modify: `frontend/src/store/useCourseStore.ts`
- Modify: `frontend/src/store/useAuthStore.ts`

- [ ] **Step 1: Remove review imports and state from stores and components**
- [ ] **Step 2: Delete `ReviewHub.tsx` and `useReviewStore.ts`**
- [ ] **Step 3: Update `activeTab` type in `useAuthStore.ts` (`'courses' | 'routines' | ...`)**
- [ ] **Step 4: Verify build compiles cleanly**

---

### Task 4: RoutineHub Store & Implementation (Item 5)
**Files:**
- Create: `frontend/src/store/useRoutineStore.ts`
- Create: `frontend/src/components/student/RoutineHub/RoutineHub.tsx`
- Create: `frontend/src/components/student/RoutineHub/AddPartToRoutineModal.tsx`
- Modify: `frontend/src/components/student/CoursePlayer/CoursePlayer.tsx`
- Modify: `frontend/src/components/student/CoursePlayer/FillInTheBlank.tsx`
- Modify: `frontend/src/components/student/CoursePlayer/CorrectIncorrect.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `useRoutineStore.ts` managing daily schedules, auto-start queue, and recorded mistakes**
- [ ] **Step 2: Connect slide mistake recording in `CoursePlayer`, `FillInTheBlank`, and `CorrectIncorrect`**
- [ ] **Step 3: Create `RoutineHub.tsx` with Daily Routine view, Auto-start, and Mistakes review with 1-click practice course generation**
- [ ] **Step 4: Connect `RoutineHub` view mount in `App.tsx` under `activeTab === 'routines'`**
- [ ] **Step 5: Verify build compiles cleanly**

---

### Task 5: End-to-End Verification with Agent-Browser
- [ ] **Step 1: Run frontend production build**
- [ ] **Step 2: Run Python unit tests suite**
- [ ] **Step 3: Use agent-browser at viewport `390x844` to verify new topbar, RoutineHub, scheduling, and mistakes review**
- [ ] **Step 4: Capture screenshots and confirm all deliverables are achieved**
