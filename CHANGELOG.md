# Changelog

## 0.1.2: Skill Discovery Hotfix

- [Skills] Added runtime resource discovery for the co-located `skills/` directory and preserved `sourceSkills` metadata so source checkouts contribute the bundled `grow-loop` and `while-true` skills the same way installed packages do.

## 0.1.1: Idle-Deferred Scheduling Hotfix

- [Runtime] Changed `grow_loop` scheduling to wait until Pi is idle and no user messages are pending before starting the 3-second grace countdown or queueing the next `while true | grow loop` prompt. Impact: active agent work and operator interjections keep priority over the next loop iteration.
- [UX] Added a deferred-schedule status state: `loop ∞N` uses warning color while the next iteration is armed but not yet counting down, then switches to the countdown and dim running state at the appropriate phases. Impact: operators get a quiet visible hint that a future loop prompt is pending.
- [Controls] Made Esc/abort cancel deferred scheduling or grace-delay timers without entering stopped state, while explicit stop prompts still set stopped state and protect already queued loop prompts with no-op guidance.
- [Docs] Updated README and project context to describe idle-deferred scheduling, deferred warning status, and the refined Esc/stop split.

## 0.1.0: Initial Release

- [Release] Completed live Grow Loop dogfooding against this repository: the extension selected a backlog task, executed release-readiness validation, reconciled context, and returned to a clean backlog.
- [Release] Created the initial `pi-grow-loop` extension as a compact, visible, interruptible loop rhythm for Pi.
- [Runtime] Added one no-argument `grow_loop` tool that schedules the next visible iteration after a fixed 3-second operator-interrupt grace countdown.
- [Runtime] Sends the compact trigger `while true | grow loop`, pauses when user messages are pending, and uses follow-up delivery only when the session is not idle.
- [Runtime] Added plain-English stop/restart handling, abort-aware timer cleanup, stopped-state scheduling guard, session shutdown cleanup, and queued-prompt no-op instruction injection.
- [UX] Added dynamic status rhythm: `loop 3.0s` appears only during grace countdown, `loop ∞N` appears only while a loop-scheduled turn is active, and ordinary user interjection hides loop status without entering stopped state.
- [Skills] Bundled the `grow-loop` meta-protocol for scope-first continuation decisions and the `while-true` worker protocol for one bounded actionable iteration.
- [Skills] Reframed activation as scope-first rather than command-first: the agent must select a trustworthy user-focus task surface before continuing.
- [Docs] Expanded `README.md` into the primary RhythmE entrypoint with install commands, value proposition, scope discovery, loop rhythm, stop semantics, goal-command comparison, release stance, and non-goals.
- [Context] Added durable project rules for clean backlog state, changelog release-heading format, docs-directory purpose, scope-first activation, and context/changelog/backlog ownership.
- [Manifest] Prepared the simple source-TS package shape: `pi.extensions` points at `./index.ts`, `pi.skills` points at `./skills`, and there is no build step or generated `dist/` tree.
- [Manifest] Prepared npm package metadata for publication with repository, homepage, bugs, keywords, engines, `private: false`, and host-aligned peer dependencies.
- [Tests] Added runtime and packaging regression coverage for prompt matching, delayed scheduling, pending-message pause, repeated schedule cancellation, ordinary user interjection status hiding, stop/restart, abort cleanup, shutdown cleanup, queued stop no-op injection, round-trip delivery, and bundled skills metadata.
