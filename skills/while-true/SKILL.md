---
name: while-true
description: Continuous execution-loop protocol — assess reality, refine the plan, execute the next task, repeat until a real stop condition is reached.
metadata:
  version: 0.2.0
---

# While True

## Purpose

A continuous planning-and-execution loop that turns the canonical backlog/plan into iterative execution. It keeps the open-work file aligned with reality, captures every implementation insight as it emerges, chains into the next actionable task automatically, and never stalls on planning or reporting alone.

## Core Model

The loop is built around a single universal **checkpoint** operation that occurs at every boundary between execution slices:

```text
checkpoint → execute → checkpoint → execute → ... → checkpoint
    ^                                                   ^
  entry                                              terminal
```

**Checkpoint** is always the same: assess reality, refine the plan, select and start the next task.

Boundary cases:

- **Entry checkpoint** — may need to create the plan from scratch or rebuild it from repo/conversation state
- **Mid-loop checkpoint** — folds iteration insights back into the plan and continues
- **Terminal checkpoint** — no actionable work remains; the loop ends

There is no separate "pre-iteration" vs "post-iteration" protocol. Between any two execution slices, the operation is identical. The entry and terminal checkpoints cover the edges.

## Activation

Activate when at least one of:

- A canonical BACKLOG, PLAN, ROADMAP, TODO, task list, or release checklist exists
- A meaningful iteration just finished and follow-up insight exists
- No trustworthy plan exists yet and work is expected
- The plan is materially out of sync with reality
- A task is actionable from the current plan or repository reality

Do not wait for user opinion or preference once a work surface exists. Do not activate when there is no concrete work surface, or when continuing the current invocation would require approval for destructive or externally sensitive actions.

## Backlog Engine Framing

Treat `while-true` as the agent's backlog execution engine: its job is to move epic open-work items toward implementation through repeated reality checks, small validated slices, and plan reconciliation. `BACKLOG.md` is the preferred name when present because it naturally represents open work; `ROADMAP.md`, `PLAN.md`, and `TODO.md` are accepted aliases for repositories with different naming conventions.

The canonical file is not a diary. It is the current contract for what remains to be done, what is blocked, and what should happen next.

## Plan File Selection

Use exactly one canonical file: `BACKLOG.md`, `ROADMAP.md`, `PLAN.md`, or `TODO.md`.

- If exactly one exists — use it
- If multiple exist — use the one actively maintained for open work; do not duplicate across files
- If none exists — create one if project conventions allow; otherwise report the gap

**Reality-over-plan rule**: when the plan and repo state disagree, trust reality. Repair the plan before relying on it.

## Checkpoint Protocol

The single operation performed at every loop boundary.

### Guardrails

- Prefer targeted updates over wholesale plan rewrites
- Do not reorganize the plan cosmetically or split tasks unless it improves execution clarity
- If an existing plan item already captures the issue, refine it instead of creating a near-duplicate
- Every checkpoint must reconcile the just-executed slice back into the plan with an explicit state transition: `done`, `narrowed`, `split`, `blocked`, or `deferred`.
- If a task stays open after meaningful progress, rewrite it to describe the remaining work instead of leaving stale pre-iteration wording untouched
- Epics are allowed, but the currently active next slice must be represented concretely under the epic before continuing execution
- Do not leave evergreen maintenance disciplines as unchecked backlog items; move those into durable instructions or architecture/spec docs instead
- Keep the canonical plan as an **open-work surface**, not a delivery-history mirror. Completed iteration detail belongs in changelog/release history, and should be compressed into grouped outcomes when it starts reading like an implementation diary.
- Do not re-enter planning repeatedly without execution progress — a checkpoint should be smaller than the next execution phase

### Step 1: Assess current reality

Review only the sources needed for an accurate picture: invocation scope, canonical plan file, modified files, failing tests, validation output, logs, relevant docs/specs.

Build a snapshot: what is done, in progress, broken, missing, blocked, and what obvious work should be decomposed now.

### Step 2: Extract and classify insights

Capture only material items: newly discovered tasks, missing validation/regression coverage, clarified acceptance criteria, broken surfaces, assumptions/risks, deferred follow-ups, and stale plan entries exposed by reality.

For each material item, decide both:

1. **Insight class** — `done`, `follow-up required`, `future research`, or `assumption/risk`.
2. **Plan effect** — `close existing`, `narrow existing`, `split existing`, `add sibling`, `defer existing`, or `move to blocked/gated`.

If the iteration changed the true exit criteria of the current task, that is not a note — it is a required plan edit.

### Step 3: Update the plan file

Write all unresolved items into the canonical plan file.

Rules:

- Preserve existing file structure and style
- Place items in the correct section, not a generic bucket
- Write concise but specific tasks with discovered nuance
- Mark completed items done; add new tasks immediately
- Keep research items visible but separated from implementation work
- Update the status of the item that drove the iteration before selecting the next task
- If work completed indirectly or opportunistically, still close the corresponding stale item immediately
- If an epic remains open, record the next concrete executable slice under it before continuing
- If a task was too vague to execute cleanly, decompose it now rather than carrying the same vague wording forward

Backlog sync operations:

- **Close**: when the exit criteria are satisfied in reality
- **Narrow**: when part of the task is done and the remainder is smaller/clearer than before
- **Split**: when one vague item turned into multiple independently executable tasks
- **Retarget**: when reality showed the original wording was aimed at the wrong remaining work
- **Defer**: when the work remains valid but is no longer the best next slice
- **Move to blocked/gated**: when the remaining work now depends on an external condition

Deduplication:

- Refine an existing entry when new insight narrows scope or adds edge cases
- Create a sibling only when work is truly separate in execution
- Consolidate synonym duplicates into one canonical item when safe
- Tighten vague items with newly discovered constraints instead of appending duplicates

### Step 4: Update in-progress documentation

Only when the iteration closed a real white spot in a design/spec doc still under active refinement. Skip stable reference docs, cosmetic edits, and insights that belong in the plan file rather than documentation.

Decompose insights into actionable new tasks and fixate them in the most appropriate documentation, prioritizing existing files (like `BACKLOG.md`, `ROADMAP.md`, or active specs) over creating new ones. Ensure that discovered nuances map directly to updated or new specific tasks rather than vague observations.

Do not use docs as a substitute for backlog state: if an insight changes what remains to be built, the plan file must still be updated even when the same nuance is also recorded in a spec or architecture doc.

When a local guard, helper, or validation stack becomes the new coordination truth, update the human entrypoint docs in the same pass. Documentation must describe the real operational boundary (for example bootstrap vs seeding, direct gate vs aggregate fast gate) rather than inherited assumptions.

### Step 5: Anti-Bullshit Gate

Before selecting the next slice, explicitly ask whether continuing would still be high-value work or merely available work.

Use these checks:

- **Value**: Does this slice directly move the active backlog epic toward its stop condition?
- **Priority**: Is this still the highest current risk or highest-value open item?
- **Evidence**: Did reality expose this task, or am I inventing speculative polish?
- **Compression**: Can I delete, narrow, isolate, or document a boundary instead of adding surface?
- **Validation cost**: Is the validation ladder proportional to the change?
- **Stop honesty**: Would stopping now be more truthful because the remaining work is gated, low-value, destructive, or ambiguous?

If the gate shows scope drift, re-rank the backlog, narrow the slice, mark the item gated/deferred, or stop. Do not continue just because another locally valid edit is available.

### Step 6: Select and start the next task

1. Re-read the updated plan
2. Pick the highest-priority actionable task that survives the Anti-Bullshit Gate (see Priority Rules)
3. **Start executing before emitting any checkpoint report** — read relevant files, run validation, make the first edit
4. Only then emit a concise progress update if needed

If a checkpoint update is emitted, summarize the plan delta explicitly in one short line when useful: which item was closed, narrowed, split, or added.

If the highest-priority item is not actionable, skip to the next one.
If a full item is ambiguous but a safe subset is clear, execute the subset and keep the item open.

## Progressive Improvement Rules

Use these rules for open-ended improvement loops. Keep this skill abstract: project-specific checks, terminology, scripts, and policies belong in project-local instructions or skills.

1. **Observe before growing** — look for real friction, stale assumptions, unclear ownership, brittle feedback, doc/practice mismatch, duplication, and missing safeguards. Prefer the smallest correction that prevents recurrence.
2. **Guard the lesson** — when a recurring failure is fixed, add or refine a narrow guard only if it is fast enough for its role, explainable, scoped, and low-noise: `find drift → fix instance → guard → record boundary`.
3. **Keep feedback discoverable** — treat tests, audits, reviews, checklists, and probes as coordination infrastructure. Expose the practical fast path clearly; keep costly, flaky, or environment-dependent checks opt-in unless required.
4. **Avoid regressive fixes** — do not apply suggestions blindly. Classify each change as safe bounded improvement, gated compatibility break, external blocker, or risk escalation that needs investigation.
5. **Consolidate boundaries, compress history** — repeated decisions should move into the right named boundary. Public changes need surface audits. Release/handoff notes should become grouped outcomes, not raw telemetry.
6. **Re-rank by current risk** — after each validated slice, ask what risk now dominates: correctness, security, invariant coverage, doc truth, integration/live behavior, or polish. Continue with the highest-risk actionable slice, not with the next stale checklist item.
7. **Use the right artifact for the lesson** — put remaining work in the plan, user-visible change history in changelog/release notes, durable operating rules in project instructions, design truth in architecture/spec docs, and only enforceable behavior in tests/guards.

## Gate And Validation Discipline

Long loops often reach a point where local implementation is complete but the remaining risk is external, slow, or manual. Treat that as a first-class state instead of pretending the loop is done.

### Validation ladder

Choose the cheapest rung that can falsify the current slice, then climb only as needed:

1. Focused checks for the changed surface
2. Type/build checks
3. Broader unit/integration test suites
4. Project context/docs validators
5. Live/manual smoke verification for transport, credentials, remote APIs, UI clients, or other environment-shaped behavior

A slice may be **locally complete** when the relevant local rungs pass, but it is not fully done if a required live/manual rung remains unverified.

### External gate handling

When the top remaining risk is gated by credentials, hardware, remote services, human action, or live UI behavior:

- Mark the plan item as `blocked/gated` or narrow it to the exact remaining live verification.
- Continue only with `gated-but-preparable` work: smoke checklists, diagnostics, safe config examples, fallback handling, docs honesty, and local regressions that improve the future live run.
- Stop the current invocation when all useful preparation is complete and the next meaningful step truly requires the external gate.
- Do not convert unverified assumptions into completed claims; document them as risks or live-test items.

### Actionability classification

Before choosing the next slice, classify the highest-priority open item:

- `local-actionable`: can be advanced now with local reads, edits, tests, validators, or deterministic fixtures.
- `gated-but-preparable`: the final proof is external, but local preparation can still reduce risk for the future live/manual run.
- `human-gated`: needs a human to click, observe, approve, provide input, or run a client-specific/manual check.
- `environment-gated`: needs hardware, OS, credentials, network, external accounts, or a runtime not available in the current environment.
- `upstream-gated`: needs another project/API/maintainer decision before this repo can implement honestly.
- `approval-gated`: safe technically, but destructive, irreversible, publishing, account-affecting, or otherwise requiring explicit permission.

Execute `local-actionable` and useful `gated-but-preparable` work. For every other class, record the exact unblocker for that item, then re-rank the remaining backlog. Stop the current invocation only when no obvious high-value `local-actionable` or useful `gated-but-preparable` work remains.

### Checkpoint signature and no-op detection

At each checkpoint, remember the practical signature of the loop:

- Selected open item and actionability class;
- Files or surfaces changed since the previous checkpoint;
- Validation rung last run and result;
- Remaining blocker/unblocker;
- Whether the plan became more truthful.

If the next checkpoint has the same signature and the only available actions are repeating validators, re-reading unchanged plans, or restating the same blocker, treat the loop as no-op. Stop with concise evidence instead of creating activity noise.

### Evidence ledger and terminal handoff

Prefer compact evidence over verbose progress narration. A good checkpoint leaves a small ledger such as `typecheck ✅`, `validate ✅ 993 pass / 1 skip`, `context ✅`, or `live state: badVisibleNames=0`.

When the invocation stops, produce a handoff with:

- What was closed or narrowed;
- What validation proves it;
- What remains gated or non-actionable;
- The exact human/environment/upstream input that would make useful work actionable.

## Priority Rules

Determine priority in this order:

1. Explicit user instruction
2. Safety or correctness issues exposed by current reality
3. Project-specific canonical priority source
4. Section ordering inside the plan file
5. Default type priority (below), weighted by task size

### Default type priority

1. Correctness or safety fixes
2. Broken validation, failing tests, compile errors, doc/spec dishonesty
3. Missing implementation required by the active roadmap
4. Missing regression coverage for newly discovered invariants
5. In-progress design/spec updates closing resolved white spots
6. Deferred research with a clear safe subset

### Size-aware scheduling

When multiple tasks share the same type-priority level:

- Prefer higher effort-to-impact ratio — small effort, large impact first
- A quick fix that unblocks other work outranks a large standalone task at the same level
- If a large task can be split into an immediately valuable slice and deferred remainder, execute the slice
- If an epic has no concrete next slice yet, creating that slice in the plan is part of the checkpoint and should happen before execution continues

## Decomposition Rules

Decompose when the next work is clearly larger than one step, the plan is too vague for immediate execution, or a failure implies 2–5 concrete follow-ups.

### Convergence decomposition

For open-ended improvement work, use a convergence task instead of a premature checklist. The goal is to make the task progress fractally through validated iterations and prevent early closure after one successful slice.

A convergence task must include:

- **Goal**: The durable direction of travel and the quality boundary being protected
- **Iteration loop**: A repeatable sequence such as observe → classify → execute/extract → guard invariants → validate → reconcile context → reassess
- **Candidate slices**: Concrete near-term areas to inspect, phrased as candidates rather than mandatory one-shot subtasks
- **Stop conditions**: Objective closure criteria that require reassessment, validation, and context truth, not just a completed edit
- **Non-goals**: Explicit traps to avoid, such as cosmetic churn, speculative subtrees, broad facades, hidden state, or line-count-only work

Use this pattern when the work should narrow through reality checks over multiple cycles, especially architecture convergence, refactoring, cleanup, reliability hardening, and documentation/context reconciliation. Do not mark the parent complete until its stop conditions hold in the same pass.

### General rules

- Decompose only to the depth needed for immediate clarity
- Prefer a small number of concrete siblings over one vague umbrella task
- Do not create speculative subtrees for work that is not yet real
- If only the first slice is clear, plan it and record remaining uncertainty explicitly
- When decomposing an epic, preserve the epic if useful, but always materialize the immediately executable child slice
- After decomposition, retarget the parent so it reflects the remaining umbrella scope rather than duplicating the new children verbatim
- For convergence tasks, keep the parent open and rewrite candidate slices/stop conditions as reality changes rather than carrying stale wording forward

### Task quality

Good: `Add regression for rounding remainder when proportional split leaves dust`
Good epic + slice: epic `Productize proposal workflow` + child `Add typed status adapter used by list/detail views`
Bad: `Fix rewards`

## Stop Conditions

Stop only when:

- The next step is destructive or irreversible
- The next step requires secrets, credentials, or external accounts
- Remaining ambiguity blocks even a safe subset
- No actionable backlog items remain
- Only blocked, externally gated, no-op, or low-value speculative work remains

If a safe subset exists, continue with that subset.

## Behavioral Axioms

1. **Reality over plan** — assess reality first; repair stale plans before relying on them
2. **Continue by default** — checkpoints are not stopping points; the loop ends only on a real stop condition
3. **Execute, don't just plan** — start work before reporting; never terminate on a planning or reporting step alone
4. **No hidden debt** — every discovered limitation, compromise, or follow-up becomes visible in the plan immediately
5. **Backlog state must move** — each meaningful iteration must leave the canonical plan more truthful: close, narrow, split, retarget, or gate something
6. **Anti-bullshit before momentum** — do not keep editing merely because more locally valid work exists; re-rank, narrow, gate, or stop when the next slice is not the best move
7. **Proof-of-stop is progress** — when only gated/no-op work remains, stopping with exact evidence and unblockers is better than simulating activity
8. **Compress, don't bloat** — capture insight in the shortest form that preserves future usefulness; prefer the smallest plan edit that preserves truth

## Loop Invariant

```text
while actionable, safe work remains:
  checkpoint (assess → refine plan → classify actionability → anti-bullshit gate → select task → start execution)
  execute a meaningful slice
  reconcile evidence and checkpoint signature
  stop when no obvious high-value actionable or preparable work remains
```
