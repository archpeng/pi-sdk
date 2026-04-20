# pi-sdk Plan Control Plane

## Active Pack

- `docs/plan/pi-sdk-local-dirty-policy-control-plane-aware-2026-04-20_PLAN.md`
- `docs/plan/pi-sdk-local-dirty-policy-control-plane-aware-2026-04-20_STATUS.md`
- `docs/plan/pi-sdk-local-dirty-policy-control-plane-aware-2026-04-20_WORKSET.md`

## Current Active Slice

- `PACK_COMPLETE`

## Intended Handoff

- `no immediate successor pack required for this workstream`

## Previous Pack

- `docs/plan/pi-sdk-structure-clarity-and-core-task-alignment-cleanup-2026-04-19_PLAN.md`
- `docs/plan/pi-sdk-structure-clarity-and-core-task-alignment-cleanup-2026-04-19_STATUS.md`
- `docs/plan/pi-sdk-structure-clarity-and-core-task-alignment-cleanup-2026-04-19_WORKSET.md`

## Notes

This `docs/plan/` directory remains the repo-level control plane for resumable work.

The cleanup successor pack is still closed out. The current dirty-policy successor pack is now closed out as well: it upgraded local workspace scan from dirty-count-only to path-level truth, refined the initial local dirty-repo guard into a control-plane-aware policy, and added a narrow best-effort owned-path journal without claiming generic mutation provenance.
