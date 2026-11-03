# Project: Mediqz TopBar Redesign & Audit

## Architecture
- **Presentation Layer**: React 18 SPA with Vite and Tailwind CSS.
- **Components**:
  - `CourseBoxTopBar.tsx`: Fixed navigation masthead rendering responsive headers (`h-13 sm:h-14`), safe area insets (`var(--sat)`), and RTL coordinate alignment (`dir="rtl"`).
  - `UserProfileMenu.tsx`: Interactive user avatar button displaying student initials, display name, and contextual dropdown menu (`right-0 left-auto`).
  - `MediazLogo.tsx`: Brand emblem icon (`/mediaz-emblem-transparent.png`) and title.
- **Data Flow & State**:
  - `useAuthStore`: Manages current `user`, `activeTab` navigation state, and logout actions.
  - `useRoutineStore`: Supplies `days`, `currentDayNumber`, and computed `dueCount` for Leitner reviews.
- **RTL Coordinate Mechanics**:
  - Root container: `<html lang="fa" dir="rtl">` and `<header dir="rtl">`.
  - Child 1 at `flex-start` (physical Right): `<UserProfileMenu />` (User personal identity anchor).
  - Child 2 at `flex-center` (Mobile HUD / Desktop Centered Capsule): Nav switcher and telemetry.
  - Child 3 at `flex-end` (physical Left): `MediazLogo` brand container and Ferdowsi epigraph (`«توانا بود هر که دانا بود»`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | RTL Right-Anchored User Profile | Move `<UserProfileMenu />` to Child 1 in `CourseBoxTopBar.tsx` so user avatar renders at physical Right | M1 | Survey (Explorers 1, 2, 3) |
| 2 | RTL Left-Anchored Brand Emblem | Move `MediazLogo` and Persian title / epigraph to Child 3 (physical Left) | M1 | Survey (Explorers 1, 2, 3) |
| 3 | Dropdown Clipping Cure | Ensure `UserProfileMenu.tsx` dropdown popover renders `right-0 left-auto` with zero offscreen clipping | M1 | Survey (Explorers 1, 2) |
| 4 | Mobile Breathing Room & HUD Polish | Eliminate hardcoded streak clutter and redundant badges while maintaining clean mobile layout | M1 | Survey (Explorer 3) |
| 5 | Desktop Centered Capsule Preservation | Retain absolute mathematical centering (`left-1/2 -translate-x-1/2`) for the 3-button switcher | M1 | Survey (Explorers 1, 2, 3) |
| 6 | E2E & Browser Automation Verification | Verify across Phone TWA (375x812), Phone Web (375x812), Desktop TWA (1024x768), Desktop Web (1440x900) | M2 | Survey (Explorers 1, 2) |
| 7 | Full Build & Test Suite Verification | Run `tsc && vite build` and backend pytest suite (57 tests) | M2 | Survey (Explorer 1) |
| 8 | Production Vercel Deployment | Deploy the verified production build to Vercel and verify live site | M3 | User Request |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | TopBar Layout & Component Refactoring | Update `CourseBoxTopBar.tsx` and `UserProfileMenu.tsx` | none | IN_PROGRESS |
| 2 | Multi-Scenario E2E & Visual Verification | Run build, pytest, and multi-scenario browser verification scripts | M1 | PLANNED |
| 3 | Production Deployment & Audit Sign-Off | Deploy to Vercel and execute final live audit | M2 | PLANNED |

## Interface Contracts
### `CourseBoxTopBar` ↔ `UserProfileMenu`
- Container: Flexbox row with `dir="rtl"` and `justify-between`.
- Profile Button: Rendered inside `UserProfileMenu.tsx` with `relative` button anchor.
- Dropdown Menu: Mounted conditionally with `absolute top-full right-0 left-auto mt-2 w-72 max-w-[calc(100vw-20px)]`.
- Positioning Assertion: `userProfileBoundingBox.right > brandLogoBoundingBox.right` in DOM coordinates.

### `CourseBoxTopBar` ↔ `useAuthStore` & `useRoutineStore`
- Navigation: `setActiveTab('courses' | 'routines' | 'tahlil')`.
- Telemetry: `dueCount` computed as `currentDay.items.filter(i => !i.completed).length`.

## Code Layout
- `frontend/src/components/layout/CourseBoxTopBar.tsx`: Owned by Worker
- `frontend/src/components/layout/UserProfileMenu.tsx`: Owned by Worker
- `scripts/verify_all_4_scenarios.py`: Owned by E2E Verifier / Reviewer
