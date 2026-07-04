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

There is no slash-command control surface. Plain stop prompts such as `stop` set stopped status and let the Grow Loop skill stop semantically without resetting the monotonic loop counter. Esc/abort clears deferred scheduling or pending grace-delay timers through the active tool abort signal.

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

No start commands. No stop commands. No arguments. No budgets. No hidden process. The agent calls `grow_loop` only when the Grow Loop skill decides useful work remains. The skill must stop calling the tool after an explicit user stop request until the user explicitly restarts Grow Loop.

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

A stop prompt clears pending timers and enters stopped loop state. Esc abort clears deferred scheduling or pending grace-delay timers and hides loop status without marking the loop stopped. Neither can recall a `deliverAs: "followUp"` message that Pi has already queued. If that queued prompt still arrives after an explicit stop, the runtime injects a no-op stop instruction and the Grow Loop skill must treat the prior stop request as authoritative: do no work and do not call `grow_loop` again.

## Compared With Goal Commands

Goal-command workflows usually start from an explicit declarative objective, then ask the model to plan and execute toward that objective. `pi-grow-loop` starts from existing project truth instead: backlog, docs, tests, repository state, and the last checkpoint. It does not replace goal commands; it provides a smaller rhythm for continuing known work without creating a new top-level command surface.

| Dimension | `/goal` command workflow | `pi-grow-loop` |
|---|---|---|
| Entry point | User declares a high-level goal | User asks to continue useful work |
| Planning source | Fresh goal decomposition | Existing backlog, docs, tests, and repo reality |
| Runtime shape | Goal session or command mode | Normal visible Pi turns |
| Control surface | Dedicated goal command | One no-argument `grow_loop` tool |
| Stop model | Goal completion or interruption | Semantic stop proof after each bounded slice |
| Best fit | New initiatives with a clear declared objective | Ongoing repository improvement and release preparation |

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

This component is suitable for an experimental `0.1.x` release. Keep the runtime surface intentionally small: one no-argument `grow_loop` tool, bundled skills for semantics, and no slash-command, budget, cycle-count, or hidden-process control layer. The package uses a simple source-TS shape: `pi.extensions` points at `./index.ts` and `pi.skills` points at `./skills`.

## Development

```bash
npm run check
npm test
npm run pack:dry
```

Reload Pi after changes with `/reload`.
