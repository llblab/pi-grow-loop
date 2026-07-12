# Changelog

## 0.4.1: Semantic Annealing

- [Runtime] Keep active loop status visible through low-level agent endings and clear it on Pi's `agent_settled` event, preventing automatic retry or compaction recovery from appearing idle; require Pi `0.80.4` or newer for this lifecycle contract.
- [Tests] Cover settled lifecycle cleanup, preservation of an armed successor, and package-to-skill version synchronization.
- [Routing] Clarify that multiple internal steps may remain one-shot work; Grow Loop applies when a concrete outcome benefits from independently validated slices and visible continuation checkpoints.
- [Skills] Align the portable worker handoff with the meta-protocol checkpoint contract and define a bounded slice as one coherent unit rather than an artificially tiny file, command, or step.
- [Docs] Explain the project-cultivation boundary as semantic execution-shape judgment without adding keyword classification, confirmation rituals, or a narrower automatic-routing range.
- [Release] Synchronize package, lockfile, and bundled-skill metadata at `0.4.1` while preserving the existing autonomy and operator-control envelope.

## 0.4.0: Bounded Worker Meta-Protocol

- [Runtime] Clear active loop status when a loop-scheduled agent run ends without arming a successor, while preserving deferred status when the ending run schedules another iteration.
- [Skills] Consolidate `while-true` into one canonical bounded-worker protocol while preserving its named Anti-Bullshit Gate, plan bootstrap and insight classification, autonomous execution boundary, progressive-hardening safeguards, unblocker-aware priority, validation discipline, convergence controls, and visible Grow Loop continuation boundary.
- [Skills] Consolidate `grow-loop` around scope locking, intent precedence, explicit worker-handoff consumption, checkpoint-signature comparison, gated preparation, and exactly-once continuation decisions.
- [Docs] Strengthen the README as the human protocol contract with explicit entrypoint routing, ownership boundaries, bounded-slice semantics, worker handoff, scope continuity, operator-intent precedence, exactly-once continuation, and navigable project context.
- [Routing] Give explicit protocol names lexical precedence: standalone `while-true` remains worker-only, explicit `grow-loop` selects the meta-protocol, the combined prompt remains runtime-internal, and unnamed multi-slice outcomes may bootstrap a backlog and route automatically into Grow Loop.
- [Positioning] Define the project concisely as semantic loop engineering: portable bounded work plus visible, interruptible scheduling, with continuation meaning owned by the agent rather than runtime machinery.
- [Validation] Add strict TypeScript no-emit checking for extension and test sources, isolated from transitive peer-package declaration defects.
- [Tests] Cover terminal active-status cleanup and successor-status preservation across the `agent_end` lifecycle boundary.
- [Release] Advance package and bundled-skill metadata to 0.4.0, reflecting the new bounded worker and explicit continuation contracts alongside lifecycle and validation hardening.

## 0.3.0: Status-Only Runtime

- [Runtime] Removed hidden follow-up delivery from countdown races; if Pi becomes busy before dispatch, Grow Loop returns to deferred waiting and keeps the next prompt visible/interruption-friendly.
- [Controls] Reduced runtime interruption semantics to status-only behavior: any user prompt clears pending loop scheduling and hides loop status, while agent/skill intent handling decides whether future turns call `grow_loop` again.
- [Controls] Removed Grow Loop-owned Escape/abort handling from runtime tests and documentation; Escape is treated as baseline Pi behavior outside this extension's control surface.
- [Docs] Reworked README as a product-facing guide with early `/goal` comparison, clearer use cases, `while-true` as the worker protocol, compact runtime status language, and skill-owned continuation decisions.
- [Tests] Replaced follow-up, synthetic abort, restart-regex, no-op injection, and stop/pause allowlist expectations with deferred retry and generic user-interjection coverage.

## 0.2.1: Runtime Prompt Polish

- [Controls] Added a conservative allowlist for polite continuation-break prompts: `please stop`, `stop please`, `please pause`, `pause please`, `cancel loop`, and `cancel grow loop`.
- [Tests] Covered polite stop/pause/cancel latching, queued prompt no-op injection, and ordinary interjection non-latching behavior.

## 0.2.0: Dogfood-Ready Runtime

- [Runtime] Fixed grace-countdown timeout ownership so cancellation paths clear both the countdown interval and the already-created send timeout through the same pending iteration handle.
- [Controls] Added explicit `pause` prompt handling as a latched stop-equivalent state with `loop paused` status and restart through existing start prompts.
- [Docs] Aligned README and project context around the runtime control model: stop/pause latch, ordinary interjection cancels rhythm only, and Esc/abort is not a durable stop latch without contextual evidence.
- [Docs] Added README runtime state-machine, dogfooding protocol, and compact operator transcript examples so operators can infer loop states, controls, release discipline, no-op queued stops, and stop-proof shape without reading runtime code.
- [Skills] Restored `while-true` as the fractal work loop while making the responsibility boundary explicit: it runs from an existing backlog/plan/TODO/work surface without waiting for user opinion; no-actionability stop belongs to `while-true`; cross-turn continuation and user continuation-break intent belong to `grow-loop`/runtime.
- [Tests] Added regressions proving all mid-countdown cancellation paths clear already-created send timeouts, including stop, pause, ordinary interjection, repeated scheduling, abort, and shutdown.
- [Tests] Added runtime harness helpers for tool execution, input injection, shutdown, latest status, and no-prompt assertions to keep cancellation coverage easier to extend.
- [Tests] Covered source-checkout skill discovery for present and missing co-located `skills/` directories.
- [Release] Added GitHub Actions validation on pull requests and `main` pushes using Node 22.19.0, `npm ci`, and `npm run validate`.
- [Release] Added a README release smoke checklist covering validation, dry pack contents, git/npm install checks, `/reload`, and skill visibility in source/package modes.

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
