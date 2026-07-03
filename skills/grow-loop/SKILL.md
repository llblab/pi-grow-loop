---
name: grow-loop
description: Meta-protocol for autonomous continuation from a concrete user-focus task scope. Use when the user asks to keep making progress, or when the current project context contains a relevant backlog, plan, roadmap, TODO, task list, docs, validation failure, or repository reality that defines useful open work.
metadata:
  version: 0.1.0
---

# Grow Loop

Grow Loop is the meta-protocol above `while-true`. It does not own implementation details. It decides whether another `while-true` iteration should run, and uses the `grow_loop` tool to schedule that next visible iteration.

There is no goal object, budget, cycle count, hidden process, or command surface. Grow Loop starts from a concrete work scope, not from a command alone. The operator can simply say "go" or "continue" when the current project focus already has trustworthy open work.

## Core Model

```text
operator focuses a project or task scope
  -> discover the relevant open-work surface
  -> run one while-true iteration
  -> inspect evidence and stop conditions
  -> if useful work remains: call grow_loop
  -> otherwise: stop with proof
```

## Use When

Use when the operator wants autonomous progress from a concrete user-focus scope:

- `go`, `continue`, `do it`, `while true`, `grow loop` when the active project context already identifies useful open work.
- A newly created or updated `BACKLOG.md`, `PLAN.md`, `ROADMAP.md`, `TODO.md`, task list, release checklist, or similar open-work surface.
- Existing docs, validation failures, repository reality, or conversation context that clearly define the current work scope.
- Grow, harden, finish, release-prepare, clean up, test, document, or otherwise improve a product/repo/system.

Do not use for purely informational answers, trivial one-shot edits, destructive/approval-gated work, or random plans unrelated to the user's current focus.

## Scope Discovery

Grow Loop is scope-first. Before continuing, identify the task surface that applies to the user's current focus.

Preferred task surfaces:

1. Explicit user-selected project, directory, file, issue, or task scope.
2. Project-local open-work files near the working directory, such as `BACKLOG.md`, `PLAN.md`, `ROADMAP.md`, or `TODO.md`.
3. Active repository docs or validation failures that define concrete remaining work.
4. Conversation context only when it is specific enough to select a safe next slice.

When multiple plans exist, prefer the one closest to the active working directory and most clearly tied to the current project. Do not harvest tasks from unrelated repositories, temporary directories, generated folders, dependency folders, caches, archived notes, or stale plans just because they exist.

If no trustworthy scope can be selected, do not start the loop. Stop with the smallest missing input needed to identify the project and open-work surface.

## Explicit Stop Request

If the operator says `stop`, `stop grow loop`, `stop while true`, presses Esc to interrupt, or otherwise asks to stop the loop, do not call `grow_loop` again. Treat the loop as paused until the operator explicitly asks to start or continue Grow Loop again.

A stop request is not an iteration request. If the need to stop is present in context and a queued `while true | grow loop` prompt still arrives, do not perform repository work, do not run validation just for momentum, and do not call `grow_loop` again. Answer with a short acknowledgement and, if useful, the current stop proof or what would restart the loop.

## Cannot Start Cases

If no trustworthy open-work surface exists and repository reality is too ambiguous to derive a safe valuable slice, do not call `grow_loop`. Instead, stop with the smallest missing input needed to start useful work.

If all remaining work is destructive, approval-gated, credential/account-gated, externally blocked, or already complete, do not call `grow_loop`. Stop with exact evidence and unblockers.

## Roles

- **Grow Loop skill**: Meta decision. Should another iteration run?
- **while-true skill**: Worker iteration. What is the next actionable slice and how is it validated?
- **grow_loop tool**: Runtime trigger. Schedule the next visible iteration after a fixed 3-second operator-interrupt grace delay. It takes no arguments. Never call it after an explicit stop request, Esc interrupt, or contextual stop marker until the operator explicitly restarts Grow Loop.

## Iteration Contract

Each iteration should:

1. Read the existing open-work surface and repository reality.
2. Pick the highest-value actionable or gated-but-preparable slice.
3. Execute one bounded useful slice using local engineering discipline.
4. Validate proportionally.
5. Sync plan/context/history when reality changed.
6. Produce compact evidence.
7. Decide whether useful work remains.

A useful iteration must produce at least one of:

- Useful artifact changed.
- Validation confidence increased.
- Blocker narrowed or made actionable.
- Plan/context became more truthful.
- A risky assumption removed.

## Continue Rule

Call `grow_loop` again only when all are true:

- The operator has not asked to stop or pressed Esc since the last loop start.
- High-value actionable or gated-but-preparable work remains.
- Continuing does not require destructive, publishing, account, credential, or external approval.
- The previous iteration produced evidence.
- The next iteration is not a repeated no-op signature.
- The open-work surface remains truthful enough to guide work.

Call `grow_loop` without arguments. Do not pass or invent knobs. The tool intentionally waits 3 seconds before queuing the next iteration so an operator stop prompt can arrive first.

## Stop Conditions

Stop and do not call `grow_loop` when:

- No high-value actionable or preparable work remains.
- Work is complete.
- Remaining work is operator/environment/upstream/approval gated and preparation is complete.
- The checkpoint signature repeats.
- Validation failure requires a strategy change or human decision.
- Continuing would be unsafe, destructive, or speculative farmville.
- The operator asks to stop or presses Esc. After this, do not call `grow_loop` until an explicit new start/continue request.

Stopping with exact evidence and unblockers is progress.

## Final Stop Proof

When stopping, answer concisely with:

- What was closed or narrowed.
- What validation or evidence proves it.
- What remains gated or done.
- What exact input would restart useful work, if any.

## Relationship To Worker Loops

Grow Loop asks: "Should another iteration run?"

while-true asks: "What is the next actionable slice?"

Keep them separate. Do not put product-growth strategy into `while-true`; do not put file-editing implementation discipline into Grow Loop.
