# <PLAN_ID> Plan Control Plane

## Active Pack

- `docs/plan/<PLAN_ID>_PLAN.md`
- `docs/plan/<PLAN_ID>_STATUS.md`
- `docs/plan/<PLAN_ID>_WORKSET.md`

## Current Active Slice

- `<ACTIVE_SLICE_ID>`

## Intended Handoff

- `execute-plan`

## Autopilot Transition Contract

- If active slice owner/state is `execute-plan` / `READY`, dispatch `execute` for the current active slice.
- `execute/completed` means implementation evidence is ready for same-slice `review`; it does not advance the active slice by itself.
- `review/completed` is the accepted-slice writeback point: mark the reviewed slice done, set the next stage as `Current Active Slice`, and set `Intended Handoff` from that next stage owner.
- `review/continue` keeps the same active slice and dispatches another bounded `execute` cycle.
- `needs_replan` dispatches `replan`; `blocked`/`failed` stop; `done` is reserved for full objective or `PACK_COMPLETE` closeout.
- `PACK_COMPLETE` with `Intended Handoff` `autopilot-closeout` is the only terminal parser state.

## Notes

- replace `<PLAN_ID>` and `<ACTIVE_SLICE_ID>`
- keep the active slice ID aligned with WORKSET `Active Stage` and any routed `autopilot_report.stepId`
- if this pack runs under extension autopilot, each phase must end with exactly one `autopilot_report`
- skill-backed phases require `selectedTools` that still include `read` and `autopilot_report`
- do not encode “ask whether to continue” as the default next step; extension autopilot continues automatically unless a real blocker exists
- review routes to `execution-reality-audit`; closeout uses the repo-local closeout prompt surface instead of a separate global closeout skill
- keep the `Autopilot Transition Contract` aligned with README/STATUS/WORKSET active truth
- use `PACK_COMPLETE` only when the pack is truly terminal and that matches repo convention
