# pi-grow-loop

`pi-grow-loop` is a compact Pi extension and skill bundle for visible, interruptible, tool-driven execution loops.

It is **not** a self-replicator, background daemon, autonomous swarm, hidden worker, or runaway scheduler. It is a small rhythm engine: the agent finishes one useful slice, proves what changed, then explicitly schedules the next visible turn only when useful work remains.

## Install

From npm:

```bash
pi install npm:@llblab/pi-grow-loop
```

Or from git:

```bash
pi install git:github.com/llblab/pi-grow-loop
```

The package follows Pi's simple source-extension style: package metadata points directly at `index.ts` and the bundled `skills/` directory. There is no build step or generated `dist/` tree.

## Why It Exists

Long agent tasks fail when they become either too manual or too invisible:

- Too manual: the operator must keep saying “continue”.
- Too invisible: the agent disappears into background autonomy.

`pi-grow-loop` keeps the middle path. It gives Pi a repeatable execution rhythm while preserving operator control, visible turn boundaries, and semantic stop conditions.

It is scope-first rather than command-first. The initiating condition is not merely a phrase like “continue”; it is the presence of a concrete task scope tied to the user's current focus: a project backlog, plan, roadmap, TODO, release checklist, validation failure, repository state, or specific conversation context.

## Value Proposition

For Pi operators who want steady progress through existing backlog, docs, plans, and repository reality, `pi-grow-loop` is a minimal loop runtime that schedules the next visible agent iteration after a short interrupt window. Unlike background agents or command-heavy automation, it uses one no-argument tool, ordinary stop prompts, and skill-level judgment to keep the loop inspectable and safe.

It belongs to the loop-engineering family of agent workflows, but favors visible continuation from a selected work surface over declarative goal sessions or hidden background execution.

## Runtime Surface

It provides one runtime tool:

- `grow_loop` — schedules the next visible Grow Loop iteration. It takes no arguments, waits until Pi is idle and no user messages are pending, then starts the fixed 3-second operator-interrupt grace countdown.

There is no slash-command control surface. Plain stop and pause prompts such as `stop`, `stop grow loop`, `pause`, and `pause grow loop` set a latched stopped/paused status and let the Grow Loop skill stop semantically without resetting the monotonic loop counter. Ordinary operator interjection cancels pending rhythm and hides status without latching a stop. Esc/abort clears deferred scheduling or pending grace-delay timers through the active tool abort signal without becoming a durable stop latch.

## Skill Surface

It also provides two skills:

- `skills/grow-loop/SKILL.md` — meta-protocol: decide whether another iteration should run.
- `skills/while-true/SKILL.md` — worker protocol: execute one bounded actionable iteration.

Both skills can have stop conditions because they operate at different levels:

- `grow-loop` decides whether the overall loop should continue.
- `while-true` decides whether the next concrete slice is actionable, safe, and valuable.

## Scope Discovery

Grow Loop should first identify the task surface that belongs to the user's current focus. Prefer explicit user-selected scope, then project-local `BACKLOG.md`, `PLAN.md`, `ROADMAP.md`, `TODO.md`, active docs, validation failures, and repository reality near the working directory.

When multiple plans exist, choose the one closest to the active project and most clearly tied to the current task. Do not pull work from unrelated repositories, temporary directories, generated folders, dependency folders, caches, archives, or stale plans merely because they are discoverable.

If the current focus does not reveal a trustworthy work surface, the loop should stop with the smallest missing input needed to identify the project and plan.

## Mental Model

```text
grow-loop skill = should we continue?
grow_loop tool = schedule next visible iteration
while-true skill = perform one useful iteration
```

No slash start/stop commands. No arguments. No budgets. No hidden process. Plain operator prompts are interpreted by the runtime and skills. The agent calls `grow_loop` only when the Grow Loop skill decides useful work remains. The skill must stop calling the tool after clear continuation-break intent until the user explicitly restarts Grow Loop.

The tool first defers until Pi is idle and no user messages are pending. During that deferred state, status shows `loop ∞N` with the iteration number in warning color as a quiet hint that another loop prompt is armed but not queued yet. Once idle, the tool shows a `loop 3.0s → 0.1s` countdown, then sends the compact trigger prompt `while true | grow loop`. While an iteration is running, status shows `loop ∞N` with the iteration number dimmed; `N` is monotonic across pauses, cancellations, stops, and restarts in the current extension instance. When no loop turn is active, loop status is hidden to preserve status-line width.

## Loop Rhythm

```text
User: go / continue / while true
Agent loads grow-loop skill
Grow Loop decides to run
Agent calls grow_loop()
Tool arms a deferred iteration and waits for Pi to become idle
Tool shows countdown
Operator may interrupt during the grace window
Tool sends `while true | grow loop`
Agent performs one bounded while-true iteration
Agent reports evidence
Grow Loop decides: schedule again or stop with proof
```

The rhythm is intentionally visible. Every cycle is a normal Pi turn, not a hidden process.

## Stop Semantics

Grow Loop should stop when:

- No high-value actionable or preparable work remains.
- Work is complete.
- Remaining work is gated and preparation is complete.
- The checkpoint signature repeats.
- The next step is unsafe, destructive, or approval-gated.
- Validation regresses enough to require a strategy change.
- The operator asks to stop; after that, the skill must not call `grow_loop` again until an explicit restart request.

Ordinary user interjection cancels any pending loop schedule and hides loop status without entering stopped state. This makes status visibility an emergent mode indicator: if warning-colored `loop ∞N`, `loop 3.0s`, or dim `loop ∞N` is visible, Grow Loop is actively carrying the rhythm; if the operator takes the turn, the loop indicator disappears.

A stop prompt clears pending timers and enters stopped loop state. A pause prompt clears pending timers and enters paused state, which is stop-equivalent until an explicit restart phrase such as `go`, `continue`, `grow loop`, or `while true`. Esc abort clears deferred scheduling or pending grace-delay timers and hides loop status without marking the loop stopped. Neither can recall a `deliverAs: "followUp"` message that Pi has already queued. If that queued prompt still arrives after an explicit stop or pause, the runtime injects a no-op stop instruction and the Grow Loop skill must treat the prior request as authoritative: do no work and do not call `grow_loop` again.

## Runtime State Machine

| State               | Status                          | Trigger                                                          | Cancellation                                                  | Latch                | Can call `grow_loop`?                                |
| ------------------- | ------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- | -------------------- | ---------------------------------------------------- |
| `hidden`            | none                            | No active rhythm or status was cleared                           | none                                                          | no                   | yes, if skill says work remains                      |
| `deferred`          | `loop ∞N` warning               | `grow_loop` called while waiting for idle/no pending messages    | stop, pause, interjection, Esc/abort, shutdown, reschedule    | no unless stop/pause | yes, reschedule replaces handle                      |
| `countdown`         | `loop 3.0s`                     | Pi is idle and grace delay has started                           | stop, pause, interjection, Esc/abort, shutdown, reschedule    | no unless stop/pause | yes, reschedule replaces handle                      |
| `running`           | `loop ∞N` dim                   | Tool sent the compact loop prompt                                | next operator input clears status if not extension-originated | no                   | yes after bounded iteration evidence                 |
| `interjected`       | none                            | Ordinary operator input during deferred/countdown/running rhythm | pending rhythm is cancelled                                   | no                   | yes, if explicitly resumed or skill continues safely |
| `stopped`           | `loop stopped`                  | `stop` / `stop grow loop` / `stop while true`                    | explicit restart phrase clears latch                          | yes                  | no until restart                                     |
| `paused`            | `loop paused`                   | `pause` / `pause grow loop` / `pause while true`                 | explicit restart phrase clears latch                          | yes                  | no until restart                                     |
| `queued-after-stop` | `loop stopped` or `loop paused` | A follow-up prompt was already queued before stop/pause          | runtime injects no-op instruction                             | yes                  | no                                                   |

## Dogfooding Protocol

Start only when the project has a trustworthy open-work surface such as `BACKLOG.md`, a release checklist, a failing validation, or concrete repository reality. Each iteration should complete one bounded slice: inspect the relevant truth, edit or validate proportionally, sync backlog/changelog/docs when reality changed, report evidence, then decide whether another safe useful slice remains.

Operator controls are ordinary text and runtime interruption: `stop` and `pause` latch a stopped state until `go`, `continue`, `grow loop`, or `while true`; ordinary interjection cancels pending rhythm without latching; Esc/abort cancels pending runtime scheduling without becoming a durable stop unless Pi exposes such context. Release discipline is simple: unresolved work stays in `BACKLOG.md`, completed outcomes move to `CHANGELOG.md`, and durable operating rules belong in `AGENTS.md`. A terminal stop proof should state what was closed or narrowed, what evidence proves it, what remains gated or done, and the exact restart input if useful work can resume.

## Operator Transcript Examples

Normal continuation:

```text
User: grow loop
Agent: closes one backlog slice, validates, reports evidence, calls grow_loop
Runtime: loop ∞1 → loop 3.0s → while true | grow loop
```

Stop during countdown:

```text
Runtime: loop 3.0s
User: stop grow loop
Runtime: loop stopped; pending prompt is cancelled
Agent: does not call grow_loop again until restart
```

Pause during countdown:

```text
Runtime: loop 3.0s
User: pause
Runtime: loop paused; pending prompt is cancelled
User: continue
Agent: may resume if a safe open slice remains
```

Ordinary interjection:

```text
Runtime: loop ∞2
User: What changed?
Runtime: loop status hidden; pending rhythm is cancelled without stop latch
Agent: answers the question instead of treating it as a durable stop
```

Queued prompt after stop:

```text
Runtime: follow-up prompt was already queued
User: stop
Queued prompt arrives: while true | grow loop
Agent: receives no-op stop instruction, performs no work, does not call grow_loop
```

Terminal stop proof:

```text
Agent: closed release checklist, npm run validate passed, remaining npm publish is approval-gated; restart with "grow loop" after publish credentials/approval are ready.
```

## Compared With Goal Commands

Goal-command workflows usually start from an explicit declarative objective, then ask the model to plan and execute toward that objective. `pi-grow-loop` starts from existing project truth instead: backlog, docs, tests, repository state, and the last checkpoint. It does not replace goal commands; it provides a smaller rhythm for continuing known work without creating a new top-level command surface.

| Dimension       | `/goal` command workflow                        | `pi-grow-loop`                                         |
| --------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Entry point     | User declares a high-level goal                 | User asks to continue useful work                      |
| Planning source | Fresh goal decomposition                        | Existing backlog, docs, tests, and repo reality        |
| Runtime shape   | Goal session or command mode                    | Normal visible Pi turns                                |
| Control surface | Dedicated goal command                          | One no-argument `grow_loop` tool                       |
| Stop model      | Goal completion or interruption                 | Semantic stop proof after each bounded slice           |
| Best fit        | New initiatives with a clear declared objective | Ongoing repository improvement and release preparation |

## What It Is Not

- Not a self-replicating agent.
- Not a background worker.
- Not a hidden task queue.
- Not a cycle-budget command system.
- Not a replacement for human approval on destructive, publishing, credential, or account-affecting actions.
- Not a claim that all remaining work should be done automatically.

The loop continues only when the agent can show evidence that another local, safe, useful slice remains.

## Project Context

- `AGENTS.md` — durable project protocol for agents changing this extension.
- `BACKLOG.md` — open work and next growth slices.
- `CHANGELOG.md` — completed delivery history and package-version release notes.

## Release Stance

This component is suitable for experimental dogfooding as of `0.2.x`. Keep the runtime surface intentionally small: one no-argument `grow_loop` tool, bundled skills for semantics, and no slash-command, budget, cycle-count, or hidden-process control layer. The package uses a simple source-TS shape: `pi.extensions` points at `./index.ts` and `pi.skills` points at `./skills`.

## Release Smoke Checklist

Before publishing a release:

- Run `npm run validate`.
- Run `npm pack --dry-run` and verify the package includes:
  - `index.ts`
  - `skills/`
  - `README.md`
  - `AGENTS.md`
  - `BACKLOG.md`
  - `CHANGELOG.md`
- Install from git and reload Pi with `/reload`.
- Confirm `grow-loop` and `while-true` skills are visible from a source checkout install.
- After publish, install from npm and reload Pi with `/reload`.
- Confirm `grow-loop` and `while-true` skills are visible from the package install.

## Development

```bash
npm run check
npm test
npm run pack:dry
```

Reload Pi after changes with `/reload`.
