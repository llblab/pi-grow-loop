---
name: while-true
description: Portable bounded backlog-worker protocol for advancing one safe, high-value validation cohort from an explicit scoped outcome, canonical BACKLOG, PLAN, ROADMAP, TODO, release checklist, failing validation, or trustworthy repository reality. Batches independent low-coupling tasks by default and uses one task when ordering, risk, size, or diagnosis requires it. Use when work needs reality assessment, plan reconciliation, implementation, validation, and an evidence-based handoff. An explicit standalone `while-true` request selects only this worker behavior; never activate or call a continuation scheduler from this skill.
metadata:
  version: 0.6.0
---

# While True

Perform one bounded worker pass:

```text
assess → reconcile → classify → assemble one validation cohort
  → execute cohort tasks → validate cohort → hand off
```

Execute one validation cohort per invocation. By default, a cohort may contain several independent, low-coupling tasks that can share expensive validation without obscuring failure attribution. Use a single-task cohort when coupling, ordering, size, risk, or diagnosis requires it. Do not begin a second cohort in the same invocation. The caller owns continuation beyond this invocation, user-stop intent, commands, runtime tools, and status. A standalone invocation returns its handoff to the caller and never activates or calls a continuation scheduler.

## Source Of Truth

Use exactly one canonical open-work surface:

1. If relevant project-local delivery instructions for the locked scope explicitly declare `Canonical open work: <path or external reference>`, resolve relative paths from the declaring instruction and use that surface when it remains trustworthy.
2. Otherwise prefer the actively maintained `BACKLOG.md`, `PLAN.md`, `ROADMAP.md`, `TODO.md`, or release checklist nearest the active scope.
3. If none exists but an explicit scoped user outcome, failing validation, or repository reality defines concrete expected work, create one canonical plan when project conventions allow; otherwise report the gap.
4. If multiple surfaces exist, select the one that actively governs the current scope; do not duplicate state. A portfolio-level pointer to a feature-local surface is an index, not a second task list.
5. Trust verified reality over stale plan text and repair the plan before relying on it.
6. If no trustworthy surface exists, stop with the smallest missing input. Do not invent work.

Consult only instructions relevant to the locked scope. Do not scan unrelated skills for available work or infer mutable task state from procedural skill prose; only an explicit canonical-open-work declaration changes discovery precedence.

### Declared Surface Resolution

Resolve declarations without knowing which project-local method produced them:

- **Relative path:** Resolve from the declaring instruction's directory, not the current working directory.
- **External reference:** Require a stable issue, epic, query, or reference precise enough to recover current open work; never mirror it into a speculative local plan.
- **Scope mismatch:** Ignore a declaration that does not govern the locked feature scope, even when its work remains locally actionable.
- **Portfolio pointer:** Treat a parent item that links to a feature-local surface as an index; keep actionable tasks in the declared child owner.
- **Stale or missing surface:** Repair or replace the declaration only from verified scope evidence. Do not fall through to unrelated available work because the declared owner moved or disappeared.
- **Competing declarations:** Select one only when project ownership or verified reality establishes precedence. Otherwise stop with the conflicting declarations and the smallest input needed to choose.

Once selected, preserve the same declared surface across bounded invocations until user intent or verified repository reality changes its ownership. A moved path with unchanged ownership is a repair, not permission to reselect unrelated scope.

### Knowledge And Delivery Boundary

A relevant project-local skill may provide feature knowledge, constraints, or support without owning current tasks. Relevance alone never makes it an open-work surface.

- Without an explicit trustworthy `Canonical open work:` declaration, treat skill content only as guidance for work selected elsewhere.
- Never infer tasks from procedural prose, examples, insights, historical delivery sections, maturity language, or archived organs.
- If a declaration remains but verified reality shows no actionable work, treat it as stale and reconcile its owner rather than using empty or historical content as momentum.
- When the same knowledge skill later declares a new truthful surface for renewed feature work, consume that declaration normally; no lifecycle marker or producer identity is needed.

The worker alone interprets and validates work-surface declarations. Its handoff reports the selected canonical surface and evidence; callers may lock or continue that scope but must not reinterpret project-local skill prose independently.

The plan records what remains, not delivery history. Route durable rules to project instructions, completed outcomes to the changelog, design truth to docs/specs, and enforceable behavior to tests or guards.

Once a trustworthy work surface exists, proceed without asking for preference or confirmation unless ambiguity blocks even a safe subset or the next action requires approval.

## Worker Protocol

### 1. Assess Reality

Read only what is needed to establish the current state: user scope, canonical plan, relevant changes, implementation, tests, validation output, and governing docs.

Identify what is done, broken, missing, blocked, stale, or newly actionable.

Classify each material discovery as `done`, `follow-up`, `research`, or `assumption/risk`, then map it to a plan transition. If evidence changes the task's exit criteria, update the plan rather than leaving the change as a note.

### 2. Reconcile The Plan

Apply explicit state transitions before selecting work:

- **Close**: exit criteria are satisfied.
- **Narrow**: completed work leaves a smaller remainder.
- **Split**: one vague item became independently executable slices.
- **Retarget**: reality changed the correct remaining objective.
- **Defer**: valid work is no longer the best next slice.
- **Gate**: progress now depends on a named external condition.

Refine existing items instead of adding synonyms. If an epic remains open, represent its next concrete slice. Keep completed detail out of the open-work surface.

### 3. Classify Actionability

Classify the highest-priority candidates:

- `local-actionable`: can advance through local reads, edits, or deterministic checks.
- `gated-but-preparable`: final proof is external, but local preparation still reduces risk.
- `human-gated`: requires human input, observation, or action.
- `environment-gated`: requires unavailable hardware, runtime, credentials, account, or network.
- `upstream-gated`: requires another project, API, or maintainer decision.
- `approval-gated`: destructive, irreversible, publishing, account-affecting, or otherwise permission-sensitive.

Execute only `local-actionable` or useful `gated-but-preparable` work. Record the exact unblocker for every other class.

### 4. Assemble One Validation Cohort

Choose the anchor task in this order:

1. Explicit user instruction.
2. Safety or correctness exposed by reality.
3. Project-defined priority.
4. Canonical plan order.
5. Default priority: broken validation or dishonest docs, required implementation, missing regression coverage, active design closure, then bounded research.

Prefer the smallest high-impact anchor that materially reduces the highest current risk. At equal priority, prefer a quick unblocker over a larger standalone task and split oversized work around an independently valuable boundary.

Then inspect nearby eligible tasks and batch them into the same validation cohort when every added task:

- Belongs to the same locked scope and canonical work surface.
- Has no prerequisite or ordering dependency on another cohort task.
- Touches disjoint or predictably low-conflict surfaces.
- Has compatible risk and validation requirements.
- Has a cheap focused check that can falsify its own change before shared validation.
- Keeps the cohort bounded enough that a shared validation failure remains attributable from changed surfaces and focused-check evidence.

Prefer batching as the default because one expensive typecheck, build, integration suite, context validator, or live smoke pass can prove several independent changes together. Cohort size follows diagnostic clarity and context capacity, not a fixed task count.

Use a single-task cohort when the task is large, cross-cutting, migration-shaped, high-risk, hard to falsify locally, likely to overlap other work, or ordered behind a prerequisite. Also use single-task mode when one failure could plausibly arise from several cohort tasks and focused checks cannot separate them.

A cohort is one coherent checkpoint unit, not one file, command, internal step, or necessarily one backlog item. Do not batch unrelated scope merely to amortize validation.

#### Anti-Bullshit Gate

Before acting, test the anchor and every added task:

- **Value**: It advances the active objective or stop condition.
- **Priority**: The cohort does not postpone a higher current risk for convenient batching.
- **Evidence**: Reality exposed each task; none is speculative polish.
- **Independence**: Batched tasks need no hidden ordering and do not create ambiguous combined behavior.
- **Compression**: Narrowing, deleting, isolating, or documenting a boundary would not solve it better.
- **Safety**: It needs no missing approval or unsafe assumption.
- **Validation economy**: Focused checks preserve task-level diagnosis while expensive checks are safely shared.
- **Stop honesty**: Continuing is more truthful than stopping because the remainder is gated, low-value, destructive, or ambiguous.

If the gate exposes scope drift, coupling, or weak attribution, remove the candidate from the cohort, switch to single-task mode, re-rank, narrow, defer, gate, or stop. Do not include work only because it is locally available.

### 5. Execute

Execute cohort tasks one at a time while retaining one shared checkpoint boundary. After each task, run its cheapest focused falsifier before touching the next task. If that check fails, stop adding cohort work, correct or truthfully reconcile that task, and preserve the evidence needed for attribution.

Follow project-local engineering instructions and keep each task plus the whole cohort bounded. When new evidence exposes coupling, ordering, scope growth, or ambiguous failure ownership, end the cohort early rather than forcing the original batch.

When new evidence changes a task, update the canonical plan immediately. Decompose only enough to preserve the next executable boundary; do not grow speculative task trees.

#### Progressive Hardening

- Observe real friction before adding surface: stale assumptions, brittle feedback, unclear ownership, duplication, missing safeguards, or docs/practice drift.
- When fixing a recurring failure, use `find drift → fix instance → add a narrow guard → record the boundary`; keep guards fast, scoped, explainable, and low-noise.
- Treat tests, audits, checklists, and probes as coordination infrastructure. Expose the practical fast path; keep costly, flaky, or environment-dependent checks opt-in unless required.
- Do not apply suggestions blindly. Distinguish safe bounded improvements, compatibility breaks requiring a gate, external blockers, and risk escalations requiring investigation.
- Audit public surfaces when behavior or contracts change, and update their human entrypoints in the same pass.

### 6. Validate

Validation has two levels:

1. **Per-task falsification:** After each cohort task, run the cheapest focused test, check, inspection, or type boundary that can identify failure in that task's surface.
2. **Shared cohort validation:** After all retained tasks pass focused falsification, run the cheapest broader check that can falsify their combined integration, then climb only as required.

Shared validation may include:

1. Type or build checks.
2. Broader unit or integration validation.
3. Project context or documentation validation.
4. Live or manual verification for environment-shaped behavior.

If shared validation fails, use changed surfaces and per-task evidence to narrow the failure before starting any new cohort. Split or retarget the affected plan items when attribution remains uncertain.

Local checks may prove local completion, but never convert an unrun live/manual check into a completed claim. Record it as a gate with its exact procedure or unblocker.

### 7. Reconcile And Hand Off

After validation:

1. Update each affected plan item to `closed`, `narrowed`, `split`, `retargeted`, `deferred`, or `gated`.
2. Update README/docs only when setup, behavior, ownership, or design truth changed.
3. Record a meaningful completed outcome in the changelog when project conventions require it.
4. Report compact evidence and stop. Let the caller decide whether to schedule another invocation.

## Convergence And No-Op Control

For open-ended work, keep one convergence item with:

- A durable goal and objective stop conditions.
- The next concrete candidate cohort or single-task slice.
- Known risks, gates, and non-goals.
- A repeatable cross-invocation method such as observe → execute → validate → reconcile.

At handoff, compare this practical signature with the previous checkpoint:

- Selected cohort items and actionability classes.
- Changed files or surfaces per item.
- Per-task falsification and shared validation result.
- Remaining blocker and unblocker.
- Plan-state transitions.

If the signature repeats and the only actions are rereading unchanged state, rerunning unchanged checks, or restating the same blocker, stop as a no-op.

## Stop Conditions

Stop without executing or continuing when:

- No high-value actionable or preparable work remains.
- Work is complete or the checkpoint signature repeats.
- Remaining work is human-, environment-, upstream-, or approval-gated and preparation is complete.
- Validation regresses enough to require a strategy change.
- The next action is destructive, unsafe, speculative, or outside user scope.
- Ambiguity blocks even a safe subset.

Stopping with exact evidence is progress.

## Handoff

Return only what the caller needs:

- Locked scope and canonical work surface.
- Cohort items and why they were safe to batch or why single-task mode applied.
- What changed or was proven per item.
- Per-task falsification, shared validation evidence, and highest completed rung.
- The plan-state transitions.
- Highest-value remainder and its actionability class.
- Blocker and exact unblocker, when present.
- Checkpoint signature: selected items, changed surfaces, validation results, blocker, and plan transitions.
- Whether another bounded invocation is warranted.

## Invariants

1. Reality outranks stale plans.
2. One invocation executes at most one bounded validation cohort.
3. Independent low-coupling tasks batch by default; coupled, ordered, large, high-risk, or diagnostically ambiguous work runs as a single-task cohort.
4. Every cohort task gets focused falsification, and every completed cohort gets proportional shared validation and truthful plan transitions.
5. No unresolved work is hidden in prose, docs, or changelog history.
6. External gates remain explicit; unverified claims never become completed claims.
7. Continuation beyond this invocation and user intent remain outside this worker skill; standalone `while-true` never self-escalates.
