# pi-sdk Plan Control Plane

## Active Pack

- `docs/plan/pi-sdk-autopilot-extension-plan-creator-execute-plan-gap-closing-2026-04-22_PLAN.md`
- `docs/plan/pi-sdk-autopilot-extension-plan-creator-execute-plan-gap-closing-2026-04-22_STATUS.md`
- `docs/plan/pi-sdk-autopilot-extension-plan-creator-execute-plan-gap-closing-2026-04-22_WORKSET.md`

## Current Active Slice

- `PACK_COMPLETE`
## Intended Handoff

- `no immediate successor pack required for this workstream`

## Previous Pack

- `docs/plan/pi-sdk-extension-driver-thinning-follow-up-2026-04-21_PLAN.md`
- `docs/plan/pi-sdk-extension-driver-thinning-follow-up-2026-04-21_STATUS.md`
- `docs/plan/pi-sdk-extension-driver-thinning-follow-up-2026-04-21_WORKSET.md`

## Notes

This `docs/plan/` directory remains the repo-level control plane for resumable work.

The prior extension-driver thinning follow-up pack is closed out. The current active pack is now also closed out: it landed deterministic phase routing, skill-aware same-session dispatch, a single-root `docs/plan/*` control-plane contract, machine-checked `done_when / stop_boundary`, and a routed local proof path. No immediate successor pack is required for this workstream unless a new objective reopens scope.

## Deterministic Phase Routing Contract (`G1` freeze)

- `master_plan` -> `plan-creator` via explicit `read` of `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/plan-creator/SKILL.md`
- `wave_plan` -> `plan-creator` via explicit `read` of `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/plan-creator/SKILL.md`
- `execute` -> `execute-plan` via explicit `read` of `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/execute-plan/SKILL.md`
- `review` -> `execution-reality-audit` via explicit `read` of `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/execution-reality-audit/SKILL.md`
- `replan` -> `plan-creator` via explicit `read` of `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/plan-creator/SKILL.md`
- `closeout` -> explicit repo-local closeout prompt surface (no global closeout skill binding in `G1`)

Fail-fast law frozen in `G1`:

- halt if the deterministic phase route is missing or mismatched for the current runtime phase
- halt if a skill-bound phase cannot find its routed `SKILL.md`
- halt if selected tools omit `autopilot_report`, or omit `read` for any skill-bound phase
- halt if `autopilot_report.phase` does not match the runtime phase
- halt if `autopilot_report.stepId` does not match the active slice truth
- halt if `doneWhenMet` / `stopBoundaryHit` reference items outside the active slice stop law

## Single-root control-plane and stop-law contract

- repo-local machine truth is single-root at `docs/plan/*`
- local writeback advances only `README / STATUS / WORKSET` under that root; no dual-root `docs/active/*` mirroring is part of the landed contract
- execute / review prompts surface active-slice `done_when / stop_boundary`
- accepted execute / review reports derive progression from `doneWhenMet / stopBoundaryHit`, not only the raw requested `status`
- `closeout` remains a repo-local prompt surface, not a separate global closeout skill
