# RoutineHub & Mobile Experience Redesign Specification

## 1. Executive Summary & Intent
Transform the application's secondary workflow from the legacy review model into a modern **RoutineHub (برنامه روتین روزانه و شکارگاه اشتباهات)**, while dramatically refining the mobile visual identity:
1. **Logo Refinement**: Transparent emblem with no background and no bottom text, scaled up in the top bar.
2. **Top Bar Capsule**: Centered mathematically, thinner header bar, luxurious glassmorphism effects, tabs: `دوره‌ها` and `RoutineHub`.
3. **User Profile Capsule**: Removed grade attribute from the compact header pill to maximize space on small screens.
4. **Android Keyboard UX**: Fixed inputs sliding under soft keyboards by adopting `interactive-widget=resizes-content`, elevated interactive cards, ample bottom safe padding, and auto-scroll into view on input focus.
5. **Complete Removal of ReviewHub**: Cleanly purge all review tables, stores, and references.
6. **RoutineHub Implementation**:
   - Multi-course daily part scheduling (e.g., Day 1: Arabic Part 1 + Persian Spelling Part 1).
   - "شروع خودکار روتین امروز" (Automatic Start) launching sequential playlist of today's parts.
   - "اشتباهات" (Mistakes Hub): Records every wrong answer in daily routines with date/question/user answer/expected answer, and provides a 1-click **«شروع دوره اشتباهات»** to practice and master only the failed units.

---

## 2. Requirements & UI/UX Specifications

### 2.1 Logo & Top Bar (Items 1, 2, 6)
- **Emblem**: Use `/mediaz-emblem-transparent.png` (tightly cropped, transparent, no text). Height `h-9 sm:h-10` in header.
- **Top Bar Layout**:
  - Thinner container: `h-12 sm:h-13`.
  - Capsule switcher: `absolute left-1/2 -translate-x-1/2` (perfect horizontal centering).
  - Capsule Effects: Glassmorphic glow, `backdrop-blur-2xl`, subtle indigo/blue ambient gradient rim, spring transition.
  - Capsule Tabs: `دوره‌ها` (Courses) and `RoutineHub` (روتین روزانه).
  - User Pill: Compact single-row layout displaying avatar circle + display name + chevron (grade removed from header pill; grade remains inside dropdown).

### 2.2 Android Keyboard UX Enhancement (Item 3)
- `index.html`: `viewport` meta tag updated with `interactive-widget=resizes-content, viewport-fit=cover`.
- `CoursePlayer.tsx` & `FillInTheBlank.tsx`:
  - Position interactive cards higher in the screen (`justify-start pt-2 sm:pt-6`).
  - Ample bottom clearance: `pb-40 sm:pb-28` to prevent android virtual keyboards from obscuring the answer input or action buttons.
  - Auto-scroll on focus: `onFocus={(e) => { e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}`.

### 2.3 Purge ReviewHub (Item 4)
- Delete `frontend/src/components/student/ReviewHub.tsx` and `frontend/src/store/useReviewStore.ts`.
- Remove review tabs and urgent notifications from `App.tsx`, `CourseBoxTopBar.tsx`, `CoursePartsView.tsx`, and `CongratsView.tsx`.
- Replace with `useRoutineStore.ts` and `RoutineHub.tsx`.

### 2.4 RoutineHub & Mistakes Practice (Item 5)
- **Schedule Management**:
  - Days array (`days: [{ day_number: 1, title: 'روز ۱', items: [...] }]`).
  - Add part modal: Select course -> select parts -> add to designated day.
  - Quick auto-distribute wizard: automatically spread selected courses into daily routines.
- **Automatic Routine Playback**:
  - "شروع خودکار روتین امروز": Starts first uncompleted part of active day.
  - When part completes: automatically transitions to the next scheduled part in today's routine.
  - When all parts complete: Displays celebratory completion banner.
- **Mistakes Tracker & Custom Course**:
  - Slide mistakes recorded in `useRoutineStore.recordMistake(...)`.
  - RoutineHub "اشتباهات" tab: Filter by day/date, inspect question, your answer, and correct answer.
  - **«شروع دوره اشتباهات»**: Generates a dynamic course containing exactly the failed Execution Units and launches `CoursePlayer`.
