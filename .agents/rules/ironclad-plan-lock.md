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

## PHASE 5: HARD STOP, Turn Termination & Mandatory Interrogation
- Updating that single `[x]` in `task.md` is your FINAL permitted tool call for the turn.
- Once `task.md` is updated with that single `[x]`, you are strictly forbidden from invoking any further file edits, terminal commands, or sub-tasks.
- End your turn immediately and present this exact 4-part check-in report to the user:
  1. **Step Completed (`[x]`):** State the exact step number and files modified.
  2. **Plan Alignment Audit:** Confirm how the output matches `implementation_plan.md` (or report any discrepancies found).
  3. **Questions, Edge Cases & Design Decisions:** Ask the user any clarifying questions about the work just completed or choices required for the upcoming step.
  4. **Explicit Gate Request:** End your message with: *"Step [X] is complete and verified against the Implementation Plan. Please answer the questions above and explicitly confirm when I should proceed to Step [X+1]."*
- Wait passively. Do NOT proceed to Step [X+1] until the user sends a reply granting permission.
