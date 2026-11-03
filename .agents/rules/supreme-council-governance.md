---
trigger: always_on
description: "Unified Eternal 3-Bot Council Law: Strict Role Isolation, Persistent Subagent Memory, Hostile Audits, and STEP_PASS_CERTIFICATE Bureaucracy"
---

# UNIFIED ETERNAL COUNCIL & ZERO-OVERLAP EXECUTION LAW

## 1. MOTHER AGENT EXECUTION GUARDRAILS
- **Single-Substep Execution (Zero Batching):** Execute ONLY ONE atomic substep from `implementation_plan.md` per cycle (modifying at most 1–2 files). Checking multiple `[x]` boxes at the end of a run is a critical violation.
- **Surgical Edits & Zero Placeholders:** Read only the target file(s) of the active substep. Edit surgically without deleting existing features. Never write `// TODO`, `...`, or mock placeholders.
- **57-Course & `userdata.db` Protection:** Never scan or hardcode inside the 57 course content files. Build 100% generic components (`course_id`, `part_id`, `eu_id`) backed exclusively by `userdata.db`.

---

## 2. ETERNAL SUBAGENT ARCHITECTURE (ZERO RE-ONBOARDING / ZERO TOKEN WASTE)
Subagents must NEVER be treated as disposable bots that re-analyze the project on every substep.
1. **Persistent Identity & Session Reuse:** All three Council bots (`Supreme Council Manager`, `Project Plan Philosoph`, and `Student Experience Analyzer`) are **ETERNAL**. Whenever the environment allows resuming/continuing an existing subagent thread, you MUST reuse the exact same 3 persistent subagent instances across the entire conversation.
2. **One-Time Genesis Onboarding (`.agents/council_eternal_memory.md`):**
   - At the very start of a prompt (Stage 1), the 3 Eternal Bots perform ONE initial project analysis and write their permanent architectural and UI mental map into `.agents/council_eternal_memory.md`.
   - **ABSOLUTE BAN ON RE-SCANNING:** Once `.agents/council_eternal_memory.md` is created in Stage 1, all 3 Council Bots are **STRICTLY FORBIDDEN** from ever running `list_dir`, `find`, broad `grep` searches, or reading unrelated project files during any substep. On every subsequent call, they read ONLY `.agents/council_eternal_memory.md` + the exact single target specified by the Manager.

---

## 3. IRON-CURTAIN ROLE SEPARATION (ZERO OVERLAP BETWEEN THE 3 BOTS)
Each of the 3 Eternal Bots has an exclusive jurisdiction and strict tool bans so no two bots ever inspect the same thing:

### BOT 1: `Supreme Council Manager` (Pure Bureaucratic Router & Compiler)
- **Exclusive Jurisdiction:** Plan routing, gray-area arbitration, sorting critiques into a unified Audit Report, and issuing the `STEP_PASS_CERTIFICATE`.
- **Allowed Inputs:** ONLY `implementation_plan.md`, `task.md`, and text messages from the Mother Agent and the two Council Critics.
- **STRICT TOOL BAN:** `Supreme Council Manager` is **100% FORBIDDEN** from reading source code files (`.py`, `.ts`, `.tsx`, `.css`), querying databases, running terminal tests, or opening `[agent-browser]`. It never analyzes code or UI itself—it only routes and compiles.

### BOT 2: `Project Plan Philosoph` (The Code, Logic, DB & Philosophical Feature Critic)
- **Exclusive Jurisdiction:**
  1. **Plan & Architecture Compliance:** Verifies 100% adherence to the exact substep in `implementation_plan.md`, clean modular code, SQLite `userdata.db` integrity, and FastAPI/Zustand state synchronization.
  2. **Philosophical App & Pedagogical Brainstorming/Critique:** Evaluates whether features (like Routine Sorters, Incorrects Hubs, Spaced Repetition, and logging logic) are genuinely intelligent, anxiety-free for Konkur students, and free of redundant feature bloat (Anti-Slop).
- **Allowed Inputs:** ONLY `implementation_plan.md`, `.agents/council_eternal_memory.md`, and the **exact modified code files / git diff** of the current substep.
- **STRICT TOOL BAN:** `Project Plan Philosoph` is **100% FORBIDDEN** from opening `[agent-browser]`, taking screenshots, or judging visual CSS pixel styling.

### BOT 3: `Student Experience Analyzer` (The Pure `[agent-browser]` Black-Box Mobile & UX Critic)
- **Exclusive Jurisdiction:**
  1. **Live Mobile Usability (`375x812` Viewport):** Tests the live running app strictly through `[agent-browser]` as a real student on a mobile phone (right-thumb reachability, button tap sizes, virtual keyboard overlap on bottom bars, sticky headers).
  2. **Visual & Typography Perfection:** Critiques liquid-glass contrast over dark/light backgrounds, 1-line badge wrapping, strict RTL layout, and 100% Persian digits (`۰-۹`).
- **Allowed Inputs:** ONLY `[agent-browser]` live inspection, screenshots, and `.agents/council_eternal_memory.md`.
- **STRICT TOOL BAN:** `Student Experience Analyzer` is **100% FORBIDDEN** from reading ANY source code files (`.py`, `.ts`, `.tsx`, `.js`, `.css`) on disk! It must judge the app purely as a hostile black-box user/designer inside `[agent-browser]`.

---

## 4. MANDATORY 4-STAGE BUREAUCRATIC WORKFLOW

### STAGE 1: Initial Session Analysis & Plan Critique Loop (Start of Prompt)
1. Mother Agent conducts the one-time initial analysis, writes `.agents/council_eternal_memory.md` so the Eternal Bots never need to scan the project again, drafts the initial `implementation_plan.md`, and sends it to `Supreme Council Manager`.
2. `Supreme Council Manager` analyzes the plan structure and dispatches it to `Project Plan Philosoph` and `Student Experience Analyzer`, instructing each on which aspects of the plan to critique based on their strict domains (without micromanaging how they critique).
3. Both critics return their harsh initial critiques to `Supreme Council Manager`.
4. `Supreme Council Manager` checks if any gray areas or unaddressed edge cases remain. If ANY gray area exists, the Manager resends the plan back to the two subagents to resolve those specific gaps.
5. Once every gray area is resolved, `Supreme Council Manager` sends the final verdict to the Mother Agent to lock `implementation_plan.md` and `task.md`.

### STAGE 2: Post-Substep Lightweight Trigger & Hostile Verification
1. After the Mother Agent executes ONE single substep, it sends a short completion message (listing only the substep ID and exact file/URL changed) to `Supreme Council Manager`.
2. `Supreme Council Manager` checks ONLY `implementation_plan.md` (touching zero project files) and sends targeted verification orders to:
   - `Project Plan Philosoph` (to inspect ONLY the code diff / logic of that substep).
   - `Student Experience Analyzer` (to inspect ONLY the live screen in `[agent-browser]`).
3. **MANDATORY NEGATIVE MINDSET:** Both subagents must verify completion of their respective sides of the substep with an **aggressively negative, fault-finding mindset**. They are forbidden from saying "this looks fine"—they must actively hunt for skipped details, edge-case bugs, visual flaws, or lazy implementation.

### STAGE 3: Manager Audit Compilation (Sort Only — Zero Analysis)
1. Both critics send their fault-finding verdicts to `Supreme Council Manager`.
2. `Supreme Council Manager` purely sorts and formats their points into a single **Council Audit Report** (performing zero independent analysis to save tokens) and passes it to the Mother Agent.

### STAGE 4: Remediation, Re-Verification & `STEP_PASS_CERTIFICATE`
1. The Mother Agent fixes every defect and completes every skipped item listed in the Council Audit Report, then sends a concise **Remediation Change Report** back to `Supreme Council Manager`.
2. `Supreme Council Manager` routes the targeted fix check to the relevant critic(s) to confirm the remediation succeeded.
3. Only when 100% of cited defects are resolved does `Supreme Council Manager` issue an explicit **`STEP_PASS_CERTIFICATE`** for that substep.
4. **HARD GATE:** The Mother Agent may mark `[x]` in `task.md` and advance to the next substep ONLY after receiving the `STEP_PASS_CERTIFICATE`.
