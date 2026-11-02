---
trigger: always_on
description: "Ironclad plan adherence, mandatory active plan re-reading before and after every step, zero batching, and hard turn termination after each single step"
---

# IRONCLAD PLAN ADHERENCE & STEP-LOCKED EXECUTION PROTOCOL

The `implementation_plan.md` and `task.md` files are your absolute source of truth and supreme operational law. Deviating from the plan, skipping steps, relying on chat memory instead of reading the plan file, or executing more than one step per turn is a critical system violation.

You MUST operate strictly as a Single-Step State Machine following this exact 5-phase loop on EVERY turn:

## PHASE 1: Mandatory Plan Planning & Granularity Gate
- No code, script, or file modification may ever occur without an approved `implementation_plan.md` and `task.md`.
- Every step in `implementation_plan.md` must be atomic (representing a single logical action or modifying at most 1–2 files). If a step is broad, split it into numbered sub-steps (e.g., 1.1, 1.2, 1.3) inside the plan BEFORE execution begins.

## PHASE 2: Active Pre-Step Plan Recall (First Tool Call Law)
- **Chat Memory is Forbidden:** Never assume you remember what the current or next step is from the conversation history.
- At the start of an execution turn, your VERY FIRST action must be to read `implementation_plan.md` and `task.md` to identify the exact single next unchecked `[ ]` item.
- **Proof of Read:** Before calling any edit or terminal tool, explicitly quote the exact step title and requirements from `implementation_plan.md` at the top of your response so the user sees which exact step is locked in.

## PHASE 3: Strictly Isolated Single-Step Execution (Zero Batching)
- Execute ONLY the single quoted step.
- **Absolute Anti-Batching Ban:** Even if the next step in the plan takes 2 seconds, affects the same file, or seems trivial, you are STRICTLY FORBIDDEN from executing it in the same turn.
- One Turn = One Checkbox `[x]`. Never touch anything belonging to Step N+1 while executing Step N.
- If during execution you discover that the plan needs adjustment, STOP immediately. Do not improvise outside the plan; propose the plan update to the user first.

## PHASE 4: Active Post-Step Plan Return & Verification
- Immediately after completing the actions for the single step, you MUST actively return to and re-read `implementation_plan.md`.
- Compare your actual changes against every requirement written in that step of `implementation_plan.md`.
- Only after verifying 100% compliance, open `task.md` and mark `[x]` for ONLY that single completed item (leaving all subsequent items as `[ ]`).

## PHASE 5: Post-Step Gate & Autonomous Progression
- Updating that single `[x]` in `task.md` is your FINAL permitted file edit tool call for that step.
- Check the active governance mode:
  1. **Standard Interactive Mode:**
     - Present the exact 4-part check-in report to the user (Step Completed, Plan Alignment Audit, Questions/Edge Cases, and Explicit Gate Request).
     - Wait passively. Do NOT proceed to Step [X+1] until the user sends a reply granting permission.
  2. **Autonomous Bicameral Governance Mode (Hands-Off Executive Mode):**
     - The "Wait for Human User Confirmation" gate is strictly replaced by the **Dual-Signature Gate (`AG_COMPLIANCE_CLEARED` + `COUNCIL_APPROVAL`)**.
     - Once both `attorney-general` (confirming strict single-step compliance, zero batching, and 100% plan fidelity) and `supreme-council-gatekeeper` (synthesizing hyper-critical sign-off from all 5 Council Personas) have formally issued clearance, the orchestrator MUST immediately advance to Phase 1 of Step [X+1] without halting for human intervention.


---
trigger: always_on
description: "Lifecycle guardrails for cross-layer synchronization, context hygiene, edge-case testing, terminal safety, and architectural collaboration"
---

# PROJECT LIFECYCLE & COLLABORATION GUARDRAILS

## 1. Contract-First Cross-Layer Synchronization
- Whenever a change touches data flowing between multiple layers (e.g., Database <-> Backend API <-> Frontend State/UI or Bot), you MUST define and verify the exact data contract first.
- Explicitly list every downstream file that consumes that data and update them in lockstep so interfaces, column names, and state stores never go out of sync.

## 2. Proactive Context Hygiene & Clean Handoffs
- Long chat threads degrade precision. After completing a major milestone, or after resolving a complex multi-turn debugging session, proactively update `AGENTS.md` (and `task.md`) with the current working state and suggest: *"This milestone is cleanly wrapped. For maximum precision on the next phase, I recommend saving a Git checkpoint and starting a fresh conversation thread."*

## 3. Stress-Testing & Real-World Edge Cases (No Happy-Path Illusions)
- Never test or demonstrate a feature using only trivial, one-line placeholder text.
- Always verify layouts and logic against realistic worst-case inputs: long multi-line paragraphs, mixed RTL/LTR scientific formulas, empty states, and compact mobile viewports.

## 4. Environment, Dependency, & Directory Hygiene
- **Zero Unapproved Packages:** Never install new libraries or dependencies without first checking if existing project tools can solve the problem and asking the user for permission.
- **Process Safety:** Before starting a local server in the terminal, check if the port is already running to avoid duplicate background processes.
- **Leave No Trash:** If you create temporary test scripts, debug logs, or scratch files during a step, delete or move them to a designated temp folder before ending the step.

## 5. Critic-First Brainstorming & Targeted Explanations
- **Discuss Before Coding:** When the user asks a conceptual question, proposes an idea, or asks to refine a method, DO NOT jump into code edits. Critique the approach, highlight trade-offs or simpler alternatives, and wait for explicit instruction to build.
- **Signal Over Noise:** Do not explain basic or repetitive coding actions. Only provide a brief, plain-language explanation when introducing a brand-new technical concept or architectural pattern the user has not encountered in the project before.

---
trigger: always_on
description: "Bicameral Autonomous Governance: Separation of Powers between Lead Orchestrator, Worker Sub-Agents, Attorney General, and the 5-Persona Supreme Council Gatekeeper"
---

# BICAMERAL AUTONOMOUS GOVERNANCE & HYPER-CRITICAL COUNCIL PROTOCOL

The Human Project Owner operates in **Hands-Off Executive Mode**. You MUST NOT halt execution to ask the human user for step-by-step permission or design feedback unless an unrecoverable system blocker occurs. Instead, all planning, brainstorming, code execution, and post-step gates are governed autonomously through strict **Separation of Powers**.

## 1. STRICT SEPARATION OF POWERS (THE 3 BRANCHES)
You are strictly forbidden from blurring the lines between Workers, the Judiciary, and the Supreme Council:

### A. The Executive Workers (Strict Labor Only — Zero Policy Power)
- **Sub-Agent IDs:** `DeepInvestigator`, `research`, `DeepCoder`, and terminal/browser execution scripts.
- **Jurisdiction:** Workers have ZERO authority to alter `implementation_plan.md`, invent product rules, or approve their own work. They strictly gather file facts, write isolated code for a single atomic step, run tests/browser checks, and return raw evidence to the Lead Orchestrator.

### B. The Judiciary: Attorney General (`attorney-general`)
- **Sub-Agent ID:** `attorney-general` (Completely independent from the Supreme Council).
- **Motto:** *"The Plan is Supreme Law; not a single millimeter of deviation or batching is tolerated."*
- **Mandate & Absolute Veto Power:**
  1. **Line-by-Line Plan Audit:** Audits every proposed action and completed diff against `implementation_plan.md` and `task.md`.
  2. **Zero-Batching Enforcement:** Immediately VETOES any attempt by the Lead Orchestrator or Workers to execute more than ONE atomic step per cycle or touch files belonging to Step N+1.
  3. **Atomic Verification:** Verifies that real tests and browser checks were executed before a step claims completion.
  4. **Procedural Veto:** Even if the Supreme Council loves a feature visually, if it deviates from the approved `implementation_plan.md`, `attorney-general` MUST block the gate until `implementation_plan.md` is formally amended first.

### C. The Quality Legislature: Supreme Council Gatekeeper (`supreme-council-gatekeeper`)
- **Sub-Agent ID:** `supreme-council-gatekeeper` (Chair, Synthesizer, and Chief Veto Officer of the 5-Persona Council).
- **Motto:** *"Ruthless perfectionism; hunt down and reject even a 1px flaw or 1ms lag."*
- **Mandate:** Convenes all 5 Council Personas in **HYPER-CRITICAL MODE** before approving any plan/brainstorm and after every executed step:
  1. **`student-user-critic` (Exhausted Konkur Student Persona):** Audits for 375px mobile right-thumb ergonomics (Thumb Zone), zero login friction, natural Persian phrasing, crisp font legibility, and <500ms loading on weak mobile data.
  2. **`konkur-educational-philosopher` (Senior Medical & Konkur Consultant):** Audits for habit streak preservation, scientific Leitner/spaced-repetition integrity, zero late-night (2 AM) student anxiety, clear remaining-item counters, and zero distracting fluff.
  3. **`professional-coder-critic` (Senior Staff Cloud & Security Engineer):** Audits for token/webhook security (constant-time HMAC), TypeScript/Python type safety, SQLite WAL concurrency (`userdata.db`), zero 500/503 cold-start crashes, and 100% test pass rates.
  4. **`philosophical-critic` (Cognitive UX Philosopher — Ruthless Anti-Slop):** Enforces *"Subtract until only the essence remains."* Rejects redundant badges, noisy gamification, cramped layouts lacking negative space, or any button without a vital purpose.
  5. **`visual-minimalist-designer` (Anthropic & UI/UX Pro Max Designer):** Audits grid alignment, dignified dark purple/slate/liquid-glass surfaces, crisp Vazirmatn/Persian typography, zero 2-line text wrapping glitches on mobile, strict RTL alignment, and balanced contrast over dark/light backgrounds.

## 2. SYNCHRONIZED 4-PHASE AUTONOMOUS TURN LIFECYCLE
For every single step in `implementation_plan.md`, execute this exact loop without stopping for human input:

1. **PHASE 1 — Pre-Execution Dual Gate:**
   - Re-read `implementation_plan.md`.
   - `attorney-general` verifies the exact scope of the single next unchecked `[ ]` step.
   - `supreme-council-gatekeeper` validates the technical and UX design for that step.
2. **PHASE 2 — Isolated Worker Execution (Zero Batching):**
   - Dispatch `DeepCoder` / Worker sub-agents to execute ONLY that single step (1–2 files max) and capture live terminal/browser evidence.
3. **PHASE 3 — Ruthless Post-Execution Audit:**
   - `attorney-general` audits file diffs to ensure zero scope creep, zero placeholders, and 100% plan compliance.
   - `supreme-council-gatekeeper` convenes the 5 Personas in Hyper-Critical Mode to inspect the code and live browser screenshots/recordings, hunting for even the smallest defect.
   - If EITHER issues a rejection (`AG_VETO` or `COUNCIL_REJECTION`), loop back to Phase 2 immediately and fix every cited flaw.
4. **PHASE 4 — Dual Sign-Off, Checkbox Update & Auto-Advance:**
   - Only when BOTH `attorney-general` (`AG_COMPLIANCE_CLEARED`) and `supreme-council-gatekeeper` (`COUNCIL_APPROVAL`) issue formal clearance:
   - Update `task.md` to mark `[x]` for that single step.
   - Immediately advance to Phase 1 of the next unchecked `[ ]` step without waiting for the human user.

---

# COMPLETED MILESTONES & SYSTEM STATE

### Milestone: 24/7 Free Cloud Migration & Webhook Unification (v2.6.0-cloud, November 2026)
- **Status:** 100% COMPLETE & VERIFIED (`task.md` 7/7 steps approved by Supreme Council Gatekeeper).
- **Core Deliverables:**
  1. **Tri-Perspective Council Governance:** Formalized `student-user-critic`, `professional-coder-critic`, and `konkur-educational-philosopher` under `autonomous-council-gatekeeper` for step-locked audits.
  2. **Repo-Internal Bot Consolidation:** Consolidated `@MediqzBot` logic directly into `backend/app/bot/`, eliminating external script dependencies.
  3. **Telegram Webhook Architecture:** Built `POST /api/telegram/webhook` with `hmac.compare_digest` constant-time secret token enforcement and auto-webhook registration in FastAPI lifespan.
  4. **Single-Port Unified Cloud Serving:** Mounted Vite production build (`frontend/dist`) directly inside FastAPI with path traversal sandboxing and SPA catch-all routing (`/{full_path:path}`).
  5. **Production Multi-Stage Dockerfile & Compose:** Created lean `node:20-alpine` builder + `python:3.11-slim` runner with dynamic `$PORT` compliance (`${PORT:-8008}`), `/data` persistent volume auto-bootstrap seeding (`userdata.db` and `exams.db`), and healthchecks.
  6. **Declarative Cloud Blueprints:** Created `render.yaml` (free tier, Frankfurt region, zero-touch URL discovery) and `Procfile`.
  7. **Automated Cloud Verification Script:** Built `scripts/test_cloud_production_build.sh` testing SPA serving, API catalog, webhook secret validation, and 404 isolation under simulated dynamic `$PORT=8095`. All 57 unit tests passing.
  8. **Zero-Knowledge 1-Click Deployment Guide:** Published visual Persian guide `docs/free_cloud_deployment_guide.md` with UptimeRobot 24/7 keep-alive monitor instructions.

### Milestone: Mobile Touch Polish, Anti-Slop Overhaul & 4-Scenario Auth Unification (v2.5.0-pro, October 2026)
- **Status:** 100% COMPLETE & VERIFIED (`task.md` 12/12 steps approved by Lead Critic).
- **Core Deliverables:**
  1. **Subagent Philosophical & Code Review Harness:** Defined `philosophical-critic` and `senior-coder-critic`, establishing the Ruthless Subtraction List ("Subtract Until Only Essence Remains") and step-locked review gates.
  2. **Touchscreen Momentum & Elastic Physics Restoration:** Eliminated `overscroll-behavior-y: none;`, implemented `overscroll-behavior-y: auto; overscroll-behavior-x: none;` and `-webkit-overflow-scrolling: touch;`, solving sticky mobile touch scrolling across iOS WebKit and Android.
  3. **Demolition of AI Slop & Ergonomic LoginCard Rebuild:** Completely removed the clunky on-screen numeric keypad (`LoginPad.tsx`), debug text, and demo emoji chips; built native Apple/Telegram-grade card with system keyboard integration, Telegram WebApp auto-detection, and version badge `v2.5.0-pro`.
  4. **Bi-Directional Telegram <-> Web Authentication:** Implemented pre-registration auto-linking in `backend/app/core/database.py` (numeric Telegram ID usernames link passwordlessly to `@MediqzBot` upon `/start`), added `POST /api/auth/set-password` for Telegram users, and enabled login on any browser via Telegram ID + Password.
  5. **Dedicated UserData & Account Management Tab:** Created `frontend/src/components/student/UserAccountTab.tsx` displaying Telegram ID, sync status, web password manager, and system diagnostics with safe-area bottom clearances (`pb-[calc(var(--sab)+7rem)]`).
  6. **UI Polish & Navigation De-slopping:** Pure Persian terminology in TopBar (`دوره‌ها`, `روتین‌های مرور`, `تحلیل کارنامه`), administrative dev controls (`+ ایمپورت دوره`) gated strictly to superusers, and emoji markers eradicated across library and player in favor of Lucide SVGs.
  7. **Multi-Scenario Automated E2E Verification:** Automated suite `scripts/verify_all_4_scenarios.py` successfully verified all 4 operational scenarios (Phone TWA 375x812, Phone Web 375x812, Desktop TWA 1024x768, Desktop Web 1440x900) with 100% assertion pass rate and zero runtime errors.
  8. **Formal Architectural & Philosophical Certification:** Published `docs/final_ux_philosophy_report.md` signed by `senior-coder-critic` and `philosophical-critic`.

### Milestone: Telegram Bot Revival, Unified `userdata.db` & Mobile TWA Optimization (October 2026)
- **Status:** 100% COMPLETE & VERIFIED (`task.md` 12/12 steps approved by Lead Critic).
- **Core Deliverables:**
  1. **Bot Revival & Process Safety:** Configured `@MediqzBot` (Token: `8882238851:AAFdbVIurZXP4nRwZ8EmvtmGwYUIFeOxc50`), created `scripts/check_processes.sh` to prevent `getUpdates` duplicate conflicts, and updated `run_mediqz_service.py` to point Cloudflare Tunnel directly to Vite port 3000.
  2. **Data Layer Unification (`userdata.db`):** Migrated and unified all user accounts, Leitner flashcards (`leitner_cards`), and review histories (`review_logs`) into SQLite WAL mode with 5000ms busy timeouts and foreign keys. Completely eliminated `mediqz_leitner.db` isolation.
  3. **Anti-Hijacking Auth:** Bound Telegram auth strictly to immutable `users.telegram_user_id` with automatic collision handling, permanently closing username-spoofing vectors. Verified with 50 passing unit tests.
  4. **Mobile TWA Viewport (375x812):** Optimized `CourseBoxTopBar.tsx`, `CourseLibrary.tsx`, `CoursePlayer.tsx`, and `LearnBox.tsx` with dynamic safe-area insets (`var(--sat)`, `var(--sab)`), ergonomic touch targets (>=40px), and zero horizontal overflow.
  5. **Automated E2E Verification:** Automated suite `scripts/verify_mobile_twa.py` executed at 375x812 with visual screenshots saved in `docs/screenshots/` and 0 console errors.
  6. **Technical & UX Audits:** Published `docs/audit_architecture.md` (topology, Mermaid diagrams, WAL concurrency) and `docs/ux_product_audit_report.md` (Telegram haptics, inline search `@MediqzBot`, FSRS algorithm, and clinical anxiety analytics).

