# Project Context

## Meta-Protocol Principles

- `Constraint-Driven Evolution`: Add loop complexity only after real runs expose durable constraints.
- `Single Source of Truth`: Keep durable rules in `AGENTS.md`, open work in `BACKLOG.md`, completed delivery in `CHANGELOG.md`, and operator-facing usage in `README.md`.
- `Clean Backlog`: `BACKLOG.md` must contain only unresolved open work. When a task is completed, move the outcome into `CHANGELOG.md` and remove the completed item from `BACKLOG.md` instead of leaving checked-off history there.
- `Release Heading Format`: `CHANGELOG.md` release sections use second-level headings in the form `## MAJOR.MINOR.PATCH: Release Summary`, with a compact Title Case summary such as `Initial Release`.
- `Release-Level Changelog`: `CHANGELOG.md` records final release outcomes, not raw iteration telemetry or superseded internal steps. Keep entries linear, domain-tagged, and coherent for a release reader.
- `Docs Directory Purpose`: Create `docs/` only when there are multiple project documentation pages that need an index. A lone extra README under `docs/` is unnecessary; the root `README.md` is the human entrypoint.
- `Boundary Clarity`: Keep meta-loop decision, worker iteration, and runtime trigger separate.
- `Scope-First Activation`: Grow Loop starts from a concrete user-focus task scope, not from command phrasing alone. Prefer a canonical open-work surface explicitly declared by relevant project-local delivery instructions, then project-local surfaces near the active working directory; resolve declarations relative to their owner, reject scope mismatch, and stop on unresolved competing ownership instead of selecting unrelated work.
- `Lexical Intent Precedence`: An explicitly named protocol selects its exact behavior. Standalone `while-true` runs only the portable worker; standalone `grow-loop` selects the meta-protocol; `while true | grow loop` is reserved for runtime continuation.
- `Structural Routing`: When no protocol is named, route by delegated execution shape and checkpoint topology, never by verbs, work categories, prompt length, apparent size, or internal step count. One coherent change with one natural validation/reporting boundary remains ordinary execution; a concrete outcome may select Grow Loop when it benefits from multiple independently useful validated slices and visible continuation checkpoints. Bootstrapping a canonical backlog from an explicit requested outcome is decomposition, not speculative work invention.
- `Stop Honesty`: Exact proof-of-stop is better than simulated autonomous momentum.

## Concept

`pi-grow-loop` is a semantic loop-engineering layer for agent-owned, visible, interruptible continuation from real project state. The runtime exposes one `grow_loop` scheduling tool with an optional `after_seconds` delay; the agent retains semantic ownership of scope, evidence, priority, safety, and continuation. The `grow-loop` skill decides whether another iteration should run, and the portable `while-true` skill performs one bounded worker pass.

## Boundaries

- `grow-loop` skill owns continuation semantics: continue or stop.
- Routing selects the protocol before worker execution: explicit names override inference; otherwise concrete iterative tasks may select Grow Loop when multiple validated slices and visible checkpoints are useful.
- `while-true` skill owns only one portable worker pass: discover one canonical work surface, including neutral `Canonical open work: <path>` declarations from relevant project-local delivery instructions, assess reality, reconcile the plan, assemble one bounded validation cohort, execute independent low-coupling tasks with per-task falsification, run shared validation, and hand off. It batches by default when diagnosis remains clear and falls back to a single task for coupled, ordered, large, high-risk, or ambiguous work. A standalone invocation must not activate or call a continuation scheduler. It must not own continuation, user-stop semantics, command phrases, runtime tools, status text, or extension-specific controls; `grow-loop` plus `grow_loop` own sequential continuation only after Grow Loop was selected.
- `grow_loop` tool only schedules the next visible iteration; its optional `after_seconds` argument accepts `3` through `3600` and defaults to `3`; the minimum preserves an operator-interrupt window before every continuation. Scheduling is idle-deferred: the tool first waits until Pi is idle and no user messages are pending, then starts the configured countdown and sends the compact trigger `while true | grow loop` only if Pi is still idle and no user messages are pending. A longer delay may serve as a continuation timer while asynchronous work finishes. The agent chooses it from evidence about expected remaining duration and reassesses after every wake; the one-hour maximum is exceptional rather than a polling default. If the runtime becomes busy during the countdown, the tool returns to deferred waiting instead of queueing a hidden follow-up. Status shows deferred scheduling as `loop ∞N` with the iteration number in warning color, countdown as `loop Ns`, and active iterations as `loop ∞N` with the iteration number dimmed; `N` is monotonic within the extension instance.
- There is no slash-command control surface. Any ordinary user prompt exits the active runtime rhythm by clearing pending scheduling and hiding loop status; restart/continuation intent belongs to the agent and Grow Loop skill, not to a runtime latch or regex.
- No start slash commands, budgets, cycle counts, hidden processes, or background agents.
- Loop status is dynamic: show warning-colored `loop ∞N` only while the next iteration is deferred until idle, `loop Ns` only during the configured countdown, and dim `loop ∞N` only while a loop-scheduled turn is active. Clear active status only after Pi fully settles without an armed successor; low-level run endings may still lead to retry or compaction recovery. Any user input except the runtime's exact expected continuation prompt clears pending loop scheduling and hides loop status, including operator input injected through another extension.
- Grow Loop does not own Escape/abort semantics; Escape remains baseline Pi behavior for active agent turns. The runtime does not block future `grow_loop` tool calls; the skill contract owns whether recent user context means continue, stop, restart, or change direction.

## Topology

```text
index.ts                  optionally delayed grow_loop tool
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
5. Preserve exact named entrypoints while allowing natural multi-slice tasks to bootstrap a truthful backlog and select Grow Loop automatically.

## Style

- Prefer small, inspectable TypeScript over framework or actor dependencies.
- Use concise operator copy.
- Keep prompt contracts explicit and bounded.
- Record completed growth evidence in `CHANGELOG.md`; keep `BACKLOG.md` clean and limited to unresolved work.
