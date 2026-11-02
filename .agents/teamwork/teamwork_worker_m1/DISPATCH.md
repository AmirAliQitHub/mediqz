## 2026-11-02T07:14:18Z
You are teamwork_worker_m1.
Your working directory is: /Users/amiralirakhshani/Projects/Alqualite CourseBox/.agents/teamwork/teamwork_worker_m1/
The authoritative user request is at: /Users/amiralirakhshani/Projects/Alqualite CourseBox/.agents/teamwork/ORIGINAL_REQUEST.md
The project specification is at: /Users/amiralirakhshani/Projects/Alqualite CourseBox/PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership:
You exclusively own and may modify:
- `frontend/src/components/layout/CourseBoxTopBar.tsx`
- `frontend/src/components/layout/UserProfileMenu.tsx`
Do NOT modify any files outside these without explicit need.

Explorer Reports to Review:
- `/Users/amiralirakhshani/Projects/Alqualite CourseBox/.agents/teamwork/teamwork_explorer_survey_1/handoff.md`
- `/Users/amiralirakhshani/Projects/Alqualite CourseBox/.agents/teamwork/teamwork_explorer_survey_2/handoff.md`
- `/Users/amiralirakhshani/Projects/Alqualite CourseBox/.agents/teamwork/teamwork_explorer_survey_3/handoff.md`

Your Objectives:
1. Read the explorer reports carefully to understand the exact DOM ordering under `dir="rtl"`.
2. Refactor `frontend/src/components/layout/CourseBoxTopBar.tsx`:
   - Move `<UserProfileMenu />` to Child 1 (flex-start in RTL = physical RIGHT), anchoring the user's personal identity as requested by the user.
   - Move the brand container (`MediazLogo` + Persian title "مدیاز" + Ferdowsi epigraph «توانا بود هر که دانا بود») to Child 4 (flex-end in RTL = physical LEFT).
   - Maintain the mathematical centering of the desktop 3-button switcher (`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`).
   - Clean up mobile center HUD to guarantee plenty of breathing room, zero clutter, and no horizontal scroll overflow (`scrollWidth <= innerWidth`).
3. In `frontend/src/components/layout/UserProfileMenu.tsx`:
   - Verify that the dropdown container uses `absolute top-full right-0 left-auto mt-2 w-72 max-w-[calc(100vw-20px)]` to expand inward towards the viewport center with zero clipping.
4. Run verification commands:
   - Frontend build: `cd frontend && npm run build` (must pass with 0 errors).
   - Pytest suite: `pytest` (must pass all 57 tests).
   - Multi-scenario E2E: `python3 scripts/verify_all_4_scenarios.py` (all scenarios must pass).
5. Document all code changes, before/after comparisons, and test outputs in `/Users/amiralirakhshani/Projects/Alqualite CourseBox/.agents/teamwork/teamwork_worker_m1/handoff.md`.
6. Send a completion message back to the orchestrator (caller) with your results and the path to your handoff.md.
