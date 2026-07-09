# pi-grow-loop

`pi-grow-loop` is a semantic loop-engineering layer for Pi. It pairs the portable `while-true` worker protocol with a visible, interruptible scheduler to advance concrete work from project state or an explicit scoped outcome.

The agent owns scope, evidence, priority, safety, and the decision to continue or stop; the runtime only schedules the next turn, while the operator retains normal conversational control. There is no hidden queue, fixed workflow, regex latch, or runtime state machine replacing agent judgment.

## Quick Start

Install from npm:

```bash
pi install npm:@llblab/pi-grow-loop
```

Or install from git:

```bash
pi install git:github.com/llblab/pi-grow-loop
```

Then focus Pi on trustworthy open work or provide a concrete multi-slice outcome and ask for continuation:

```text
grow loop
```

The agent should run one bounded `while-true` slice, report what changed or what was proven, and schedule another visible turn only if useful work remains.

## When To Use It

Use `pi-grow-loop` when a project already has a real work surface or the operator provides a concrete outcome that can truthfully create one:

- `BACKLOG.md`, `PLAN.md`, `ROADMAP.md`, or `TODO.md`.
- A release checklist.
- A failing validation command.
- A known cleanup/refactor/documentation stream.
- Repository state that clearly exposes the next safe slice.
- A scoped multi-slice request such as creating a new project directory and building an MVP.

Decomposing an explicit requested outcome into a canonical backlog is not inventing work. Harvesting unrelated improvements merely to keep the loop alive is. If neither an existing surface nor a concrete outcome exists, the correct result is a stop proof or a request for the missing scope.

## Compared With `/goal`

`/goal` is the nearest mental model, but it solves a different problem. It creates a goal-shaped session around a declared outcome. `pi-grow-loop` selects an iterative execution shape and keeps its source of truth in a canonical open-work surface, whether discovered or bootstrapped from an explicit scoped outcome.

| Dimension | `/goal` | `pi-grow-loop` |
| --- | --- | --- |
| Starting point | A declared objective | Existing project evidence or an explicit scoped outcome |
| Planning mode | Decompose a goal-shaped session | Bootstrap or reconcile a canonical open-work surface |
| Agent question | "How do we reach this outcome?" | "What is the next safe useful slice?" |
| Runtime shape | Goal/session frame | Normal visible Pi turns |
| Continuation | Driven by the goal session | Re-decided after each `while-true` checkpoint |
| Work shape | Goal-organized initiative | Multi-slice MVP work, release prep, hardening, cleanup, docs, tests |

The distinction is session shape and source of truth: `/goal` owns a goal object; `pi-grow-loop` has no goal object and advances a canonical backlog one visible checkpoint at a time. An explicit outcome may seed that backlog, but only requested work belongs there.

## Execution Model

```text
lock the user-focus scope
  → checkpoint current reality
  → reconcile the open-work surface
  → select one actionable or preparable slice
  → execute and validate proportionally
  → hand off evidence and remaining state
  → decide once: stop, or schedule one next visible turn
```

The selected scope stays stable across iterations unless the operator redirects it or verified reality proves that a different surface governs the same work. The runtime does not decide what matters; the skills do.

## The Three Pieces

- `while-true` skill — the portable worker protocol. It assesses reality, reconciles backlog/plan state, executes at most one bounded actionable or preparable slice, validates it, and hands off evidence. It knows nothing about Grow Loop or its runtime.
- `grow-loop` skill — the continuation meta-protocol. It locks the relevant scope, interprets recent user intent, consumes the worker handoff, and decides exactly once whether another iteration should run.
- `grow_loop` tool — the scheduler. It waits briefly, shows status, and sends the next visible Pi prompt. It takes no arguments.

Protocol selection happens before worker execution:

```text
explicit while-true → one portable worker pass → handoff to caller
explicit grow-loop  → Grow Loop → while-true → decide → grow_loop or stop
natural small task  → ordinary one-shot execution
natural MVP/task    → Grow Loop → bootstrap backlog → bounded iterations
runtime continuation prompt: while true | grow loop
```

Explicit protocol names are lexical overrides: asking for `while-true` never silently expands into Grow Loop. Automatic routing applies only when no protocol is named, and selects Grow Loop from the shape of a concrete multi-slice task. This preserves exact entrypoints without giving up the automatic path for outcomes such as “create a directory and build an MVP.”

## Protocol Contract

Each visible iteration has one checkpoint boundary:

1. `while-true` executes at most one coherent useful slice, which may include multiple related edits and validation commands.
2. The worker hands off the locked scope, plan transition, evidence, validation result, highest-value remaining item, actionability, blocker, and exact unblocker.
3. `grow-loop` gives latest operator intent precedence over repository availability and compares the checkpoint with the previous iteration to reject repeated no-ops.
4. If continuation remains safe and valuable, it calls `grow_loop` exactly once and ends the turn. Otherwise it does not call the tool and returns a stop proof.

Bounded does not mean one file, command, or tiny edit. It means one complete risk-reducing slice followed by validation and an operator-visible continuation boundary.

A standalone `while-true` invocation ends at that handoff. Only a previously selected `grow-loop` meta-protocol may consume it as a continuation checkpoint and schedule another turn.

## Runtime Behavior

`grow_loop` is intentionally narrow:

- Waits until Pi is idle and no user messages are pending.
- Shows a fixed 3-second interrupt countdown.
- Sends the compact prompt `while true | grow loop` only if Pi is still idle.
- If Pi becomes busy during the countdown, returns to deferred waiting instead of queueing a hidden follow-up.
- Shows loop status only while it is actively carrying the rhythm.
- Clears pending scheduling and hides loop status when any non-extension user prompt arrives.

The tool never blocks future calls. Whether to continue belongs to the agent and skills, not to a runtime latch, regex, slash command, or hidden state machine.

## Runtime Statuses

- No status — no active loop rhythm, or the operator took the turn.
- `loop ∞N` warning — the next loop prompt is armed and waiting for idle/no pending messages.
- `loop 3.0s` countdown — Pi is idle and the interrupt window is open.
- `loop ∞N` dim — the compact loop prompt was sent for this iteration.

`N` is monotonic within the current extension instance. Active status clears when the scheduled agent run ends without arming a successor. There is no `loop stopped` or `loop paused` status; absence of loop status means the runtime rhythm is no longer active.

## Interruption Model

Any non-extension user prompt exits the active runtime rhythm:

```text
Runtime: loop 3.0s or loop ∞2
User: What changed?
Runtime: hides loop status and cancels pending scheduling
Agent: answers, stops, changes direction, or later continues based on intent and context
```

The runtime only clears the rhythm. It does not decide whether the user meant stop, answer first, change direction, or continue afterward. That interpretation belongs to `grow-loop`, and operator intent outranks remaining backlog availability.

## Stop Conditions

Grow Loop should stop and not call `grow_loop` when:

- No high-value actionable or preparable work remains.
- Work is complete.
- Remaining work is gated and preparation is complete.
- The checkpoint signature repeats.
- The next step is unsafe, destructive, approval-gated, credential-gated, account-affecting, or externally blocked.
- Validation regresses enough to require a strategy change.
- Recent user intent means stop, answer, change direction, or wait.

Stopping with exact evidence is progress.

## What It Does Not Do

- No background worker.
- No hidden task queue.
- No slash-command control surface.
- No cycle budget or goal-session state.
- No Escape/abort ownership; Escape remains baseline Pi behavior for active agent turns.
- No replacement for approval on destructive, publishing, credential, account, or external actions.

## Operator Examples

Normal continuation:

```text
User: grow loop
Agent: closes one backlog slice, validates, reports evidence, calls grow_loop
Runtime: loop ∞1 → loop 3.0s → while true | grow loop
```

Terminal stop proof:

```text
Agent: closed release checklist, npm run validate passed, remaining npm publish is approval-gated; restart with "grow loop" after publish approval is ready.
```

## Package Shape

The package uses Pi's source-extension shape: package metadata points directly at `index.ts` and the bundled `skills/` directory. There is no build step or generated `dist/` tree.

Repository files:

- [`index.ts`](index.ts) — no-argument `grow_loop` tool and status scheduler.
- [`skills/while-true/SKILL.md`](skills/while-true/SKILL.md) — bounded worker-loop protocol.
- [`skills/grow-loop/SKILL.md`](skills/grow-loop/SKILL.md) — continuation meta-protocol.
- [`AGENTS.md`](AGENTS.md) — durable project protocol and routing invariants.
- [`BACKLOG.md`](BACKLOG.md) — canonical open work and next growth slices.
- [`CHANGELOG.md`](CHANGELOG.md) — completed delivery history and package-version release notes.
- [`tsconfig.json`](tsconfig.json) — maintainer-side strict no-emit validation for extension and test sources; it is not required by the installed runtime package.
