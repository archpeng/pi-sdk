# Continuous Autopilot Wave Ladder

Use this reference when a user wants an autopilot-compatible plan to advance across many stages without manual prompting while still preserving review, testing, and replan gates.

## Core rule

Continuous autopilot does **not** mean jumping from an early stage to a late closeout/removal stage.

It also does **not** mean treating `currentWave/maxWaves` or a human wave count as objective-completion proof. Terminal closeout requires repo-local parser truth: active slice `PACK_COMPLETE`, owner `closeout`, state `DONE`, and no non-deferred stages left in the queue.

It means repeating this bounded loop:

```text
wave_plan -> execute -> review -> accepted-writeback -> next wave_plan
```

The local plan pack must make that loop recoverable from `docs/plan/*` alone.

## Required control-plane shape

For machine-compatible repos, the active pack must keep these surfaces aligned in the same turn:

1. `docs/plan/README.md` — active pack, current active slice, intended handoff, transition contract.
2. `*_PLAN.md` — stable slice definitions and the multi-wave ladder.
3. `*_STATUS.md` — current phase truth, latest review verdict, validation evidence, next wave.
4. `*_WORKSET.md` — executable queue, active stage, wave ladder, current wave done/stop law.

Do not create a second planning root unless the repo contract explicitly says to.

## Wave requirements

Every wave in a continuous ladder must include:

1. `waveId` and parent `stepId` / slice ID.
2. One dominant owner boundary.
3. Exact allowed files/surfaces or a bounded discovery rule.
4. Deliverables small enough for one execute/review cycle.
5. Validation commands or probes.
6. Exact `done_when` items suitable for `autopilot_report.doneWhenMet`.
7. Exact `stop_boundary` items suitable for `autopilot_report.stopBoundaryHit`.
8. Explicit non-goals and residuals.
9. Next handoff after accepted review.

If a wave cannot satisfy those requirements, keep planning or replan instead of executing.

## Transition FSM to encode

Use this state machine unless the repo has a stricter one:

```text
wave_plan/completed -> execute same wave
execute/completed -> review same wave
review/completed + accepted -> write evidence/residuals, activate next wave_plan
review/continue -> execute same wave
needs_replan -> replan
blocked|failed -> stop
.done -> repo-local closeout prompt only when full objective is complete and docs/plan parses as PACK_COMPLETE
```

Important distinctions:

- `execute/completed` is not terminal; it routes to review.
- `review/completed` accepts or rejects the wave and writes the next active truth.
- `done` is for the full objective or closeout, not for ordinary wave completion.
- If a scheduler dispatches closeout while `docs/plan/*` still names a non-terminal active slice, the closeout is premature and must hand back to that slice owner/handoff.

## Multi-stage ladder guidance

For long roadmaps, decompose by risk boundary, not by calendar or convenience.

Prefer wave boundaries around:

- contract/schema before storage;
- storage before behavior;
- behavior before customer runtime;
- explicit mode before default mode;
- callback contract before callback migration;
- parity/readiness audit before removal;
- closeout only after verified residual handling.

A late-stage removal/rewrite wave must not start until predecessor review evidence exists.

## Writeback after review acceptance

Accepted review must update the pack before the next phase:

1. record the review verdict and evidence;
2. record successor residuals;
3. update README status/intended handoff;
4. update STATUS current step/mode/wave;
5. update WORKSET active stage/current nominated wave;
6. keep PLAN definitions and the wave ladder consistent;
7. run lightweight parser/format validation such as `plan_sync docs/plan` and `git diff --check`.

## Stop instead of hard-pushing

Route to `replan`, `blocked`, or `failed` instead of continuing when:

- active slice/wave IDs drift across README/PLAN/STATUS/WORKSET;
- validation fails and the fix exceeds the current wave;
- stop boundaries mention security, mutation authority, confirmation, callback, or data ownership;
- the next wave requires an owner boundary not yet accepted by docs/tests;
- the plan relies on hidden chat context rather than pack truth;
- a later removal/closeout stage lacks predecessor review evidence.

## Output checklist for plan-creator

When creating or repairing a continuous ladder, report:

- active pack paths;
- active parent slice and wave;
- phase handoff;
- wave ladder summary;
- current wave `done_when` and `stop_boundary`;
- validation shape;
- exact next phase after this planning turn;
- whether the pack remains single-root `docs/plan/*` machine-compatible.
