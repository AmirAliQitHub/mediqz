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
