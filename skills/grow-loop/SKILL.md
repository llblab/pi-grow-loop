---
name: grow-loop
description: Meta-protocol for autonomous, scope-locked continuation through visible bounded worker iterations. Use when the user explicitly names `grow-loop`, or when no protocol is named and a concrete request to build, grow, harden, finish, release-prepare, clean up, test, or document work naturally requires multiple validated slices. Existing plans are optional and an explicit scoped outcome may bootstrap a canonical backlog. Do not activate for an explicit standalone `while-true` request, informational answers, unrelated plans, or work with no safe actionable or preparable slice.
metadata:
  version: 0.4.1
---

# Grow Loop

Own one decision: after a bounded `while-true` worker invocation, either schedule exactly one next visible invocation with `grow_loop` or stop with proof.

```text
lock scope → run one worker invocation → consume handoff → decide once
  ├─ continue: call grow_loop once, then end the turn
  └─ stop: do not call grow_loop; return proof
```

Do not own implementation details. `while-true` owns one portable worker pass; `grow_loop` owns only idle-deferred runtime scheduling.

There is no goal object, budget, cycle count, hidden process, background agent, or slash-command control surface. For generic prompts such as `go`, `continue`, or `do it`, infer intent from context; explicit protocol names remain exact overrides.

## Entrypoint Routing

Apply lexical intent before execution-shape inference:

- Explicit standalone `while-true` selects only the portable worker. Do not activate Grow Loop or call `grow_loop` from its handoff unless the user later requests Grow Loop continuation.
- Explicit `grow-loop` selects this meta-protocol.
- The combined `while true | grow loop` prompt is reserved for internal continuation of an already selected Grow Loop sequence.
- When no protocol is named, use ordinary one-shot execution for a coherent change even when it needs multiple internal steps. Use Grow Loop for a concrete outcome that benefits from multiple independently validated slices, plan reconciliation, and operator-visible checkpoints.

Natural routing into Grow Loop requires a concrete outcome or scope, a truthful backlog that exists or can be bootstrapped, safe actionable or preparable work, and no one-shot instruction. The distinction is the value of independent checkpoint boundaries, not task size, keyword matching, or a confirmation ritual. Routing happens before invoking `while-true`; the worker never escalates itself.

## Scope Lock

Select the user-focus scope in this order:

1. Explicit project, directory, file, issue, or task selected by the user.
2. An explicit scoped outcome that can be decomposed into a truthful canonical backlog.
3. The actively maintained open-work surface nearest that scope: `BACKLOG.md`, `PLAN.md`, `ROADMAP.md`, `TODO.md`, task list, or release checklist.
4. Active docs, validation failure, or repository reality that defines concrete remaining work.
5. Conversation context only when it identifies a safe next slice precisely.

Ignore unrelated repositories, temporary or generated directories, dependencies, caches, archives, and stale plans.

Keep the selected scope stable across iterations. Re-select it only when the user redirects the work, the surface becomes untrustworthy, or verified reality proves another surface governs the same scope. Never harvest available work merely to preserve momentum.

If no trustworthy scope exists, do not invoke the worker or call `grow_loop`; request the smallest missing input.

## Intent Precedence

Interpret the latest context in this order:

1. Latest user direction or change of scope.
2. Explicit continuation-break intent or durable stop marker.
3. Worker evidence, safety gates, and blockers.
4. Remaining backlog availability.

Any ordinary non-extension user prompt exits the runtime rhythm and is authoritative context. Decide whether it means answer, stop, restart, continue, or change direction; do not infer continuation from backlog availability alone.

Escape remains baseline Pi behavior, not a Grow Loop control. Treat it as a continuation break only when session context exposes that intent or a durable stop marker.

If a queued `while true | grow loop` prompt arrives after continuation-break intent, do no repository work, run no validation for momentum, and do not call `grow_loop`. Acknowledge the break and provide the current stop proof when useful. Resume only after explicit restart intent clears the stop context.

## Continuation Checkpoint

After one `while-true` invocation, consume its handoff without redoing worker implementation analysis:

- Locked scope and canonical work surface.
- Artifact or evidence produced.
- Validation result and highest completed rung.
- Plan-state transition.
- Highest-value remaining item and actionability class.
- Gate, blocker, and exact unblocker.
- Checkpoint signature: selected item, changed surfaces, validation result, blocker, and plan transition.
- Latest user intent.

A useful invocation must change an artifact, increase validation confidence, narrow a blocker, improve plan truth, or remove a risky assumption. Otherwise treat it as a possible no-op.

Compare the checkpoint signature with the previous invocation. A repeated signature with only unchanged reads, checks, or blocker restatement is terminal no-op evidence.

## Decide Once

### Continue

Continue only when every condition holds:

- Latest user intent permits continuation and no stop marker is active.
- The locked scope and canonical work surface remain trustworthy.
- The previous invocation produced useful evidence.
- A high-value `local-actionable` or useful `gated-but-preparable` slice remains.
- Continuing crosses no destructive, publishing, credential, account, external, or approval gate.
- The checkpoint signature is not a repeated no-op.
- Validation has not regressed enough to require a strategy change or human decision.

Approval- or externally gated scopes may continue only through safe preparation that materially reduces future risk. Stop when preparation is exhausted; never cross the gate.

When all conditions hold, call `grow_loop` exactly once with no arguments, then end the turn. The tool waits until Pi is idle with no pending messages, shows the fixed 3-second operator-interrupt countdown, and sends the next visible `while true | grow loop` prompt only if the session remains idle.

### Stop

Stop and do not call `grow_loop` when any condition holds:

- User intent means stop, answer, wait, or change direction.
- Scope is missing, ambiguous, redirected, or untrustworthy.
- Work is complete or no high-value actionable or preparable slice remains.
- Remaining work is gated and useful preparation is complete.
- The checkpoint signature repeats.
- Validation requires a strategy change or human decision.
- Continuing would be unsafe, destructive, speculative, or outside scope.

Stopping with exact evidence is progress. Do not schedule speculatively and do not call `grow_loop` more than once per decision.

## Stop Proof

Return a compact terminal handoff:

- Locked scope and what was closed or narrowed.
- Validation or evidence proving the state.
- Terminal checkpoint signature in concise form.
- What remains done, gated, or non-actionable.
- Exact input or state change that would make restart useful, if any.

## Invariants

1. Scope remains locked until user intent or verified reality changes it.
2. `while-true` owns worker execution; Grow Loop consumes its handoff and owns continuation only.
3. User intent outranks repository availability.
4. Each checkpoint produces one decision and at most one `grow_loop` call.
5. Safe preparation may approach a gate but never cross it.
6. Repeated no-op evidence stops the loop.
7. No trustworthy scope or evidence means no continuation.
8. Explicit protocol naming overrides automatic routing; the worker never self-escalates.
