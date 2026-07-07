# Project Context

## Meta-Protocol Principles

- `Constraint-Driven Evolution`: Add loop complexity only after real runs expose durable constraints.
- `Single Source of Truth`: Keep durable rules in `AGENTS.md`, open work in `BACKLOG.md`, completed delivery in `CHANGELOG.md`, and operator-facing usage in `README.md`.
- `Clean Backlog`: `BACKLOG.md` must contain only unresolved open work. When a task is completed, move the outcome into `CHANGELOG.md` and remove the completed item from `BACKLOG.md` instead of leaving checked-off history there.
- `Release Heading Format`: `CHANGELOG.md` release sections use second-level headings in the form `## MAJOR.MINOR.PATCH: Release Summary`, with a compact Title Case summary such as `Initial Release`.
- `Release-Level Changelog`: `CHANGELOG.md` records final release outcomes, not raw iteration telemetry or superseded internal steps. Keep entries linear, domain-tagged, and coherent for a release reader.
- `Docs Directory Purpose`: Create `docs/` only when there are multiple project documentation pages that need an index. A lone extra README under `docs/` is unnecessary; the root `README.md` is the human entrypoint.
- `Boundary Clarity`: Keep meta-loop decision, worker iteration, and runtime trigger separate.
- `Scope-First Activation`: Grow Loop starts from a concrete user-focus task scope, not from command phrasing alone. Prefer project-local open-work surfaces near the active working directory and ignore unrelated, temporary, generated, dependency, archived, or stale plans.
- `Stop Honesty`: Exact proof-of-stop is better than simulated autonomous momentum.

## Concept

`pi-grow-loop` is an experimental Pi extension plus bundled skills for tool-driven loop engineering. The extension exposes one no-argument `grow_loop` tool. The `grow-loop` skill finds the relevant user-focus task scope and decides whether another iteration should run. The `while-true` skill performs one bounded worker iteration.

## Boundaries

- `grow-loop` skill owns continuation semantics: continue or stop.
- `while-true` skill owns only one portable worker pass: assess reality, reconcile the plan, execute one actionable/preparable slice when available, validate, and hand off. It must not own continuation, user-stop semantics, command phrases, runtime tools, status text, or extension-specific controls; `grow-loop` plus `grow_loop` own sequential continuation and stop semantics for this extension.
- `grow_loop` tool only schedules the next visible iteration; it takes no arguments. Scheduling is idle-deferred: the tool first waits until Pi is idle and no user messages are pending, then starts the fixed 3-second operator-interrupt grace countdown and sends the compact trigger `while true | grow loop` only if Pi is still idle and no user messages are pending. If the runtime becomes busy during the countdown, the tool returns to deferred waiting instead of queueing a hidden follow-up. Status shows deferred scheduling as `loop ∞N` with the iteration number in warning color, countdown as `loop 3.0s`, and active iterations as `loop ∞N` with the iteration number dimmed; `N` is monotonic within the extension instance.
- There is no slash-command control surface. Any ordinary user prompt exits the active runtime rhythm by clearing pending scheduling and hiding loop status; restart/continuation intent belongs to the agent and Grow Loop skill, not to a runtime latch or regex.
- No start slash commands, budgets, cycle counts, hidden processes, or background agents.
- Loop status is dynamic: show warning-colored `loop ∞N` only while the next iteration is deferred until idle, `loop 3.0s` only during the grace countdown, and dim `loop ∞N` only while a loop-scheduled turn is active. Any non-extension user input clears pending loop scheduling and hides loop status.
- Grow Loop does not own Escape/abort semantics; Escape remains baseline Pi behavior for active agent turns. The runtime does not block future `grow_loop` tool calls; the skill contract owns whether recent user context means continue, stop, restart, or change direction.

## Topology

```text
index.ts                  no-argument grow_loop tool
skills/grow-loop/SKILL.md meta-loop protocol
skills/while-true/SKILL.md worker-loop protocol baseline
README.md                 human entrypoint
BACKLOG.md                open work
CHANGELOG.md              completed delivery history
```

## Evolution Path

1. Keep the MVP as one no-argument tool.
2. Let the skills dogfood themselves on this extension.
3. Add state only if real runs prove it is necessary.
4. Preserve the separation: decision in skill, execution in while-true, triggering in tool.

## Style

- Prefer small, inspectable TypeScript over framework or actor dependencies.
- Use concise operator copy.
- Keep prompt contracts explicit and bounded.
- Record completed growth evidence in `CHANGELOG.md`; keep `BACKLOG.md` clean and limited to unresolved work.
