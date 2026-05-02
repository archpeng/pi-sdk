# Autopilot-Compatible Control-Plane Pack

Use this reference when the repo depends on a machine-parsed local control plane,
for example a local-mode autopilot that re-reads `docs/plan` instead of trusting
conversation prose.

## What problem this solves

A generic `PLAN/STATUS/WORKSET` pack may be enough for humans, but it is not
enough for a runtime that expects exact markdown sections and deterministic
writeback.

If the repo is machine-parsed, the planning task is not finished until the pack
is parser-compatible.

## Deterministic routed-phase overlay (extension-driven sessions only)

Apply this overlay only when the repo is running under the extension autopilot runtime.
Do **not** claim that every repo or every manual planning session has these routed surfaces.

Canonical routed ownership:

- `master_plan` -> `plan-creator`
- `wave_plan` -> `plan-creator`
- `execute` -> `execute-plan`
- `review` -> `execution-reality-audit`
- `replan` -> `plan-creator`
- `closeout` -> repo-local closeout prompt surface (`autopilot-closeout`)

Planning/reference implications:

1. this reference governs planning-phase truth, not execute/review/closeout ownership
2. skill-backed phases require `selectedTools` that still include `read` and `autopilot_report`
3. routed phases end with exactly one `autopilot_report`
4. when an active slice exists, `autopilot_report.stepId` must match that slice ID
5. default continuation is automatic; do not encode “ask whether to continue” as the normal stop law
6. instead, encode continuation and stopping through explicit `done_when` / `stop_boundary`
7. keep review truthful as `execution-reality-audit` and keep closeout truthful as the repo-local prompt surface, not a separate global closeout skill
8. encode the phase-transition FSM explicitly; do not depend on hidden conversation context or `nextAction` prose alone
9. treat `execute/completed` as same-slice review handoff, not as terminal completion

## Minimal machine contract

## 1. Repo-level anchor: `docs/plan/README.md`

Use exact sections:

- `## Active Pack`
- `## Current Active Slice`
- `## Intended Handoff`

Example:

```md
# Repo Plan Control Plane

## Active Pack

- `docs/plan/my-pack_PLAN.md`
- `docs/plan/my-pack_STATUS.md`
- `docs/plan/my-pack_WORKSET.md`

## Current Active Slice

- `S2`

## Intended Handoff

- `execute-plan`
```

## 2. Machine `PLAN`

Each planned slice should have an exact ID block:

```md
#### `S2` — slice-name

- Owner: `execute-plan`
- State: `READY`
- Priority: `high`

目标：

- do the bounded thing

交付物：

1. proof-carrying result

done_when:

1. what must be true before this slice can report completed/done

stop_boundary:

1. when to stop or hand off instead of expanding scope

必须避免：

1. drift or hidden scope expansion
```

Notes:

- keep slice IDs stable and unique
- do not omit `Owner`, `State`, or `Priority` if the repo parser expects them
- if the repo has an authoritative example, follow it exactly
- for autopilot-compatible packs, prefer concrete `done_when` / `stop_boundary` over prose like “ask whether to continue”

## 3. Machine `WORKSET`

Use exact sections:

- `## Stage Order`
- `## Active Stage`

Example:

```md
## Stage Order

- [x] `S1` previous-slice
- [ ] `S2` current-slice
- [ ] `S3` next-slice

## Active Stage

### `S2`

- Owner: `execute-plan`
- State: `READY`
- Priority: `high`

目标：

- do the bounded thing

必须交付：

1. proof-carrying result

done_when:

1. what must be true before claiming the stage is complete

stop_boundary:

1. when to stop and hand off instead of widening scope

必须避免：

1. drift or hidden scope expansion
```

Notes:

- `Stage Order` should be the source for deterministic next-slice ordering
- `Active Stage` should match `README.md` current active slice
- the active stage ID is the natural `stepId` for routed active-slice reports

## 4. Autopilot transition contract

Machine-compatible packs should state the continuation FSM in README and/or STATUS/WORKSET:

```md
## Autopilot Transition Contract

- If active slice owner/state is `execute-plan` / `READY`, dispatch `execute` for the current active slice.
- `execute/completed` dispatches same-slice `review`; do not advance the active slice during execute.
- `review/completed` is the accepted-slice writeback point: mark the reviewed slice done and set the next `Stage Order` item as active.
- `review/continue` keeps the same active slice for another execute cycle.
- `needs_replan` dispatches `replan`; `blocked`/`failed` stop; `done` is reserved for full objective or `PACK_COMPLETE` closeout.
```

This section is not a replacement for runtime state-machine code. It makes repo-local parser truth recoverable after session restart, compaction, or manual resume.

## 5. Writeback-friendly `STATUS`

Even if startup parsing does not depend on `STATUS`, deterministic writeback often does.
Prefer exact sections like:

- `## Current Step`
- `- active_step: \`S2\``
- `## Planned Stages`
- `## Immediate Focus`
- `## Machine State`

Example:

```md
## Current Step

- active_step: `S2`

## Planned Stages

- [x] `S1` previous-slice
- [ ] `S2` current-slice
- [ ] `S3` next-slice

## Immediate Focus

### `S2`

- Owner: `execute-plan`
- State: `READY`
- Priority: `high`

目标：

- do the bounded thing

done_when:

1. what must be true before this stage can honestly complete

stop_boundary:

1. when to stop, replan, or hand off

## Machine State

- active_step: `S2`
- intended_handoff: `execute-plan`
```

## Single-root machine-compatible packs

Keep machine-compatible autopilot packs anchored in `docs/plan/*`.

Treat these repos as **single-root machine-compatible** packs:

- `docs/plan/*` is the primary human and parser truth
- the planning turn is not done until `README` / `PLAN` / `STATUS` / `WORKSET` agree in the same writeback turn

For single-root packs:

1. keep `docs/plan/README.md` pointing at the active machine pack
2. keep `docs/plan/*` aligned on active slice, intended handoff, stage order, and any parser-owned state the repo relies on
3. never invent a second roadmap or mirror outside `docs/plan/*` just to paper over drift
4. if surrounding docs imply another planning root, stop and replan the contract before writing back

## Alignment checklist

Before calling the pack done, verify:

1. `README.md` points to exactly three active pack files
2. `README.md` current active slice matches `WORKSET` active stage ID
3. every queued or active slice has a matching `PLAN` slice block
4. `WORKSET` stage order uses the same IDs as `PLAN`
5. active or queued slices carry concrete `done_when` / `stop_boundary`
6. `STATUS` includes the current active step and stage checklist if the repo writeback expects it
7. the next handoff is explicit
8. the active slice has concrete verification proof, not only narrative intent
9. if the repo uses routed autopilot, the active slice ID stays usable as `autopilot_report.stepId`
10. `docs/plan/README.md`, the active pack, and the current active slice / intended handoff agree
11. the `Autopilot Transition Contract` states execute -> review -> accepted-review writeback -> next-slice routing

## Shadow pack option

If the repo already uses rich narrative planning docs, do not force all prose into
machine form if that makes the pack unreadable.

Instead, use:

- a human-rich pack for narrative planning
- a machine pack for runtime truth

The repo-level `README.md` must still point to the machine pack.

## Stop instead of guessing

Stop and refine rather than pretending compatibility if any of these are true:

- the repo parser/tests are not understood yet
- exact section names are unclear
- slice IDs are drifting across files
- the repo needs a repo-local README anchor but none has been updated
- the status/workset writeback shape is still ambiguous
- the pack still encodes continuation only through vague prose instead of explicit `done_when` / `stop_boundary`
- the pack lacks a transition contract and the scheduler would need to infer execute/review/writeback behavior from prose
- the repo appears to need a second control-plane root that the current pack has not verified
- routed review/closeout ownership is being claimed incorrectly
