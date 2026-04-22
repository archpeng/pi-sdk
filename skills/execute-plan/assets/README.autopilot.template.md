# <PLAN_ID> Plan Control Plane

## Active Pack

- `docs/plan/<PLAN_ID>_PLAN.md`
- `docs/plan/<PLAN_ID>_STATUS.md`
- `docs/plan/<PLAN_ID>_WORKSET.md`

## Current Active Slice

- `<ACTIVE_SLICE_ID>`

## Intended Handoff

- `execute-plan`

## Notes

- replace `<PLAN_ID>` and `<ACTIVE_SLICE_ID>`
- keep the active slice ID aligned with WORKSET `Active Stage` and any routed `autopilot_report.stepId`
- if this pack runs under extension autopilot, each phase must end with exactly one `autopilot_report`
- skill-backed phases require `selectedTools` that still include `read` and `autopilot_report`
- do not encode “ask whether to continue” as the default next step; extension autopilot continues automatically unless a real blocker exists
- review routes to `execution-reality-audit`; closeout uses the repo-local closeout prompt surface instead of a separate global closeout skill
- use `PACK_COMPLETE` only when the pack is truly terminal and that matches repo convention
