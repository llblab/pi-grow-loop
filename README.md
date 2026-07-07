# pi-grow-loop

A small continuation layer for Pi agents working from real project state.

`pi-grow-loop` packages the `while-true` execution protocol with a visible scheduler. It is for repositories where the next useful work already exists in a backlog, plan, failing check, release list, or current code reality. The agent keeps taking bounded, validated steps; the operator keeps normal turn-by-turn control.

## Quick Start

Install from npm:

```bash
pi install npm:@llblab/pi-grow-loop
```

Or install from git:

```bash
pi install git:github.com/llblab/pi-grow-loop
```

Then focus Pi on a project with trustworthy open work and ask for continuation:

```text
grow loop
```

The agent should run one bounded `while-true` slice, report what changed or what was proven, and schedule another visible turn only if useful work remains.

## When To Use It

Use `pi-grow-loop` when a project already has a real work surface:

- `BACKLOG.md`, `PLAN.md`, `ROADMAP.md`, or `TODO.md`.
- A release checklist.
- A failing validation command.
- A known cleanup/refactor/documentation stream.
- Repository state that clearly exposes the next safe slice.

Do not use it to invent work. If there is no trustworthy surface, the correct result is a stop proof or a request for the missing scope.

## Compared With `/goal`

`/goal` is the nearest mental model, but it solves a different problem. It starts a goal-shaped session from a declared outcome. `pi-grow-loop` continues from project evidence that already exists.

| Dimension | `/goal` | `pi-grow-loop` |
| --- | --- | --- |
| Starting point | A declared objective | A backlog, plan, failing check, release list, or repo reality |
| Planning mode | Decompose a new goal | Reconcile the current work surface |
| Agent question | "How do we reach this outcome?" | "What is the next safe useful slice?" |
| Runtime shape | Goal/session frame | Normal visible Pi turns |
| Continuation | Driven by the goal session | Re-decided after each `while-true` checkpoint |
| Work shape | New initiative or broad objective | Ongoing repo work, release prep, hardening, cleanup, docs, tests |

The distinction is the source of truth: `/goal` organizes a session around declared intent; `pi-grow-loop` stays attached to existing project evidence and advances it one checkpoint at a time.

## Execution Model

```text
checkpoint current reality
  → reconcile the open-work surface
  → select one actionable or preparable slice
  → execute and validate proportionally
  → report the result
  → stop, or schedule the next visible turn
```

The runtime does not decide what matters. The skills do.

## The Three Pieces

- `while-true` skill — the worker protocol. It assesses reality, reconciles backlog/plan state, selects the next actionable slice, executes, validates, and stops when only gated or no-op work remains.
- `grow-loop` skill — the continuation protocol. It selects the relevant work surface, interprets recent user intent, and decides whether another iteration should run.
- `grow_loop` tool — the scheduler. It waits briefly, shows status, and sends the next visible Pi prompt. It takes no arguments.

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

`N` is monotonic within the current extension instance. There is no `loop stopped` or `loop paused` status; absence of loop status means the runtime rhythm is no longer active.

## Interruption Model

Any non-extension user prompt exits the active runtime rhythm:

```text
Runtime: loop 3.0s or loop ∞2
User: What changed?
Runtime: hides loop status and cancels pending scheduling
Agent: answers, stops, changes direction, or later continues based on intent and context
```

The runtime only clears the rhythm. It does not decide whether the user meant stop, answer first, change direction, or continue afterward. That interpretation belongs to the agent through the `grow-loop` skill.

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

Project files:

- `index.ts` — no-argument `grow_loop` tool and status scheduler.
- `skills/while-true/SKILL.md` — bounded worker-loop protocol.
- `skills/grow-loop/SKILL.md` — continuation meta-protocol.
- `AGENTS.md` — durable project protocol for agents changing this extension.
- `BACKLOG.md` — open work and next growth slices.
- `CHANGELOG.md` — completed delivery history and package-version release notes.

## Development

```bash
npm run check
npm test
npm run pack:dry
```

Reload Pi after changes with `/reload`.
