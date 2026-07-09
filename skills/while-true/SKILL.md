---
name: while-true
description: Portable bounded backlog-worker protocol for advancing one concrete, safe, high-value slice from an explicit scoped outcome, canonical BACKLOG, PLAN, ROADMAP, TODO, release checklist, failing validation, or trustworthy repository reality. Use when work needs reality assessment, plan reconciliation, implementation, validation, and an evidence-based handoff. An explicit standalone `while-true` request selects only this worker behavior; never activate or call a continuation scheduler from this skill.
metadata:
  version: 0.4.0
---

# While True

Perform one bounded worker pass:

```text
assess → reconcile → classify → select → execute one slice → validate → hand off
```

Do not execute a second slice in the same invocation. The caller owns continuation beyond this invocation, user-stop intent, commands, runtime tools, and status. A standalone invocation returns its handoff to the caller and never activates or calls a continuation scheduler.

## Source Of Truth

Use exactly one canonical open-work surface:

1. Prefer the actively maintained `BACKLOG.md`, `PLAN.md`, `ROADMAP.md`, `TODO.md`, or release checklist nearest the active scope.
2. If none exists but an explicit scoped user outcome, failing validation, or repository reality defines concrete expected work, create one canonical plan when project conventions allow; otherwise report the gap.
3. If multiple surfaces exist, select the one that actively governs the current scope; do not duplicate state.
4. Trust verified reality over stale plan text and repair the plan before relying on it.
5. If no trustworthy surface exists, stop with the smallest missing input. Do not invent work.

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

### 4. Select One Slice

Choose in this order:

1. Explicit user instruction.
2. Safety or correctness exposed by reality.
3. Project-defined priority.
4. Canonical plan order.
5. Default priority: broken validation or dishonest docs, required implementation, missing regression coverage, active design closure, then bounded research.

Prefer the smallest high-impact slice that materially reduces the highest current risk. At equal priority, prefer a quick unblocker over a larger standalone task and split oversized work around an immediately valuable slice.

#### Anti-Bullshit Gate

Before acting, explicitly test whether the slice is high-value work rather than merely available work:

- **Value**: It advances the active objective or stop condition.
- **Priority**: It addresses the highest current risk or most valuable open item.
- **Evidence**: Reality exposed it; it is not speculative polish.
- **Compression**: Narrowing, deleting, isolating, or documenting a boundary would not solve it better.
- **Safety**: It needs no missing approval or unsafe assumption.
- **Validation cost**: The proof is proportional to the change.
- **Stop honesty**: Continuing is more truthful than stopping because the remainder is gated, low-value, destructive, or ambiguous.

If the gate exposes scope drift, re-rank, narrow, defer, gate, or stop. Do not continue only because another locally valid edit exists.

### 5. Execute

Start the selected slice before reporting progress. Follow project-local engineering instructions and keep the change bounded.

When new evidence changes the task, update the canonical plan immediately. Decompose only enough to preserve the next executable boundary; do not grow speculative task trees.

#### Progressive Hardening

- Observe real friction before adding surface: stale assumptions, brittle feedback, unclear ownership, duplication, missing safeguards, or docs/practice drift.
- When fixing a recurring failure, use `find drift → fix instance → add a narrow guard → record the boundary`; keep guards fast, scoped, explainable, and low-noise.
- Treat tests, audits, checklists, and probes as coordination infrastructure. Expose the practical fast path; keep costly, flaky, or environment-dependent checks opt-in unless required.
- Do not apply suggestions blindly. Distinguish safe bounded improvements, compatibility breaks requiring a gate, external blockers, and risk escalations requiring investigation.
- Audit public surfaces when behavior or contracts change, and update their human entrypoints in the same pass.

### 6. Validate

Use the cheapest check that can falsify the slice, then climb only as required:

1. Focused tests or checks.
2. Type or build checks.
3. Broader unit or integration validation.
4. Project context or documentation validation.
5. Live or manual verification for environment-shaped behavior.

Local checks may prove local completion, but never convert an unrun live/manual check into a completed claim. Record it as a gate with its exact procedure or unblocker.

### 7. Reconcile And Hand Off

After validation:

1. Update the plan item to `closed`, `narrowed`, `split`, `retargeted`, `deferred`, or `gated`.
2. Update README/docs only when setup, behavior, ownership, or design truth changed.
3. Record a meaningful completed outcome in the changelog when project conventions require it.
4. Report compact evidence and stop. Let the caller decide whether to schedule another invocation.

## Convergence And No-Op Control

For open-ended work, keep one convergence item with:

- A durable goal and objective stop conditions.
- The next concrete candidate slice.
- Known risks, gates, and non-goals.
- A repeatable cross-invocation method such as observe → execute → validate → reconcile.

At handoff, compare this practical signature with the previous checkpoint:

- Selected item and actionability class.
- Changed files or surfaces.
- Validation rung and result.
- Remaining blocker and unblocker.
- Plan-state transition.

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

- What changed or was proven.
- Validation evidence.
- The plan-state transition.
- What remains and its exact unblocker.
- Whether another bounded invocation is warranted.

## Invariants

1. Reality outranks stale plans.
2. One invocation executes at most one meaningful slice.
3. Every executed slice ends with proportional validation and a truthful plan transition.
4. No unresolved work is hidden in prose, docs, or changelog history.
5. External gates remain explicit; unverified claims never become completed claims.
6. Continuation beyond this invocation and user intent remain outside this worker skill; standalone `while-true` never self-escalates.
