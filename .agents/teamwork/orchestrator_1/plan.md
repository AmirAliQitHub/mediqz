# Execution Plan — Mediqz TopBar Redesign & Audit

## Objective
Audit the live application (https://mediqz.vercel.app) and local repository, investigate the visual hierarchy and layout issues in `CourseBoxTopBar.tsx` and `UserProfileMenu.tsx` (specifically moving user profile/logo to the right and decluttering/re-organizing badges and emblem), test across 4 personas, implement the refined responsive design, verify with full build and test suites, and deploy to Vercel.

## Phase 0: Survey & Multi-Perspective Audit (Current)
- [ ] 0.1 Dispatch 3 parallel Explorers:
  - Explorer 1 (Codebase Structure): Deep analysis of `CourseBoxTopBar.tsx`, `UserProfileMenu.tsx`, Tailwind layout classes, RTL/LTR behaviors, responsive breakpoints, state props.
  - Explorer 2 (Live Browser Audit & Visual Inspection): Run browser automation (`agent-browser`) against https://mediqz.vercel.app and local build across desktop and mobile viewports; document layout coordinates and visual hierarchy.
  - Explorer 3 (Persona Evaluation & Design Synthesis): Assess TopBar elements (emblem, streak badge, due badge, user profile) under 4 personas (Student, Professional Engineer, Educational Philosopher, Minimalist Designer) based on Anthropic and UI/UX Pro Max principles.
- [ ] 0.2 Synthesize findings and generate `PROJECT.md` with Feature Inventory and Interface Contracts.

## Phase 1: Dual Track Decomposition
- [ ] 1.1 E2E Testing Track: Build comprehensive automated tests for TopBar positioning, responsiveness, persona states, and RTL alignments.
- [ ] 1.2 Implementation Track: Refactor `CourseBoxTopBar.tsx` and `UserProfileMenu.tsx` to position user profile/logo on the right, reorganize brand emblem and badges with optimal breathing room and zero cognitive clutter.

## Phase 2: Verification, Audit & Hardening
- [ ] 2.1 Worker implementation & local build/test verification.
- [ ] 2.2 Parallel Reviewers (2) and Challengers (2) empirically validating desktop/mobile and multi-persona scenarios.
- [ ] 2.3 Forensic Integrity Auditor validation.
- [ ] 2.4 Vercel production deployment and live verification.
