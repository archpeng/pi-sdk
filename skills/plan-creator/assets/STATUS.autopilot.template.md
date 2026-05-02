# <PLAN_ID> Status

## Current State

- state: `IN_PROGRESS`
- owner: `execute-plan`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> CLOSEOUT`
- workstream: `<PLAN_ID>`

## Current Step

- active_step: `<ACTIVE_SLICE_ID>`
- mode: `ready_for_execution`

## Planned Stages

- [ ] `<ACTIVE_SLICE_ID>` <active-slice-summary>
- [ ] `<NEXT_SLICE_ID>` <next-slice-summary>

## Immediate Focus

### `<ACTIVE_SLICE_ID>`

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- <bounded objective>

必须交付：

1. <primary proof>

done_when:

1. <what must be true before this stage can honestly complete>

stop_boundary:

1. <when to stop, replan, or hand off>

必须避免：

1. <drift>

## Machine State

- active_step: `<ACTIVE_SLICE_ID>`
- latest_completed_step: `<PREVIOUS_SLICE_ID_OR_NONE>`
- intended_handoff: `execute-plan`

## Autopilot Transition Contract

- `execute/completed` dispatches same-slice `review`; do not advance `active_step` during execute.
- `review/completed` accepts the slice and performs deterministic docs/plan writeback to the next active stage.
- `review/continue` keeps `active_step` unchanged for another execute cycle.
- `needs_replan` routes to `replan`; `blocked`/`failed` stop; `done` routes to closeout only when the whole objective is complete.
- After accepted review, `README`, `STATUS`, and `WORKSET` must agree on the new active slice and intended handoff before another execute phase runs.

## Recently Completed

## Next Step

- `<ACTIVE_SLICE_ID>`

## Blockers

## Gate State

## Latest Evidence

## Notes

- if this pack runs under extension autopilot, each phase ends with exactly one `autopilot_report`
- active-slice phases use `stepId` equal to `active_step`
- skill-backed phases require `selectedTools` including `read` and `autopilot_report`
- use `done_when` / `stop_boundary` above instead of “ask whether to continue” as the normal continuation rule
- review routes to `execution-reality-audit`; closeout uses the repo-local closeout prompt surface
- transition FSM above is part of machine-compatible truth, not optional prose
