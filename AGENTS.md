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
- `while-true` skill owns one worker iteration: actionable slice, implementation, validation, context sync.
- `grow_loop` tool only schedules the next visible iteration after a fixed 3-second operator-interrupt grace countdown and sends the compact trigger `while true | grow loop`; it takes no arguments. Status shows countdown as `loop 3.0s` and active iterations as `loop ∞N`; `N` is monotonic within the extension instance. Esc/abort cancels pending grace-delay timers through the active tool abort signal.
- There is no slash-command control surface. Plain stop prompts set stopped status without resetting the monotonic counter and rely on the Grow Loop skill to stop semantically.
- No start slash commands, budgets, cycle counts, hidden processes, or background agents.
- Stop-kraan beats momentum: completion, gates, no-op signatures, unsafe actions, validation regressions, or explicit operator stop must end the loop.
- Loop status is dynamic: show `loop 3.0s` only during the grace countdown and `loop ∞N` only while a loop-scheduled turn is active. When ordinary user input interjects, clear pending loop scheduling and hide the loop status without entering stopped state; explicit stop prompts still enter stopped state.
- Stop prompts and Esc aborts clear pending timers and status, but they cannot recall an already queued `deliverAs: "followUp"` trigger; if that queued prompt arrives, runtime context injection plus the skill-level stop contract must make it a no-op turn with no `grow_loop` call.

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
