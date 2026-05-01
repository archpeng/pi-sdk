# pi-sdk Plan Control Plane

## Active Pack

- `docs/plan/pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_PLAN.md`
- `docs/plan/pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_STATUS.md`
- `docs/plan/pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_WORKSET.md`

## Current Active Slice

- `ERW0.plan-workset-reconcile`

## Intended Handoff

- `plan-creator`

## Previous Pack

- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_PLAN.md`
- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_STATUS.md`
- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_WORKSET.md`

## Notes

This `docs/plan/` directory remains the repo-level control plane for resumable work.

The previous Pi Coding Agent `0.70.2` compatibility pack is paused at `U3`: fresh npm readback reported `@mariozechner/pi-coding-agent@0.70.2` unavailable (`E404`) while an operator-approved substitute install moved global Pi to `0.70.0`. This hardening pack does not close or relabel that objective.

The current active pack addresses a higher-priority local autopilot safety issue discovered from the downstream `pos-lite-cashier` order-runtime roadmap run: `execute/completed` writeback can advance Stage Order or write `PACK_COMPLETE` before `review`, leaving `WORKSET ## Active Stage` unparsable (`Missing active stage heading`). The active slice is now a plan/workset reconciliation pass for this pack itself: it must classify the current dirty pi-sdk source/dependency changes, repair README / PLAN / STATUS / WORKSET truth, and only then route to downstream recovery or SDK implementation.

## Deterministic Phase Routing Contract (`G1` freeze)

- `master_plan` -> `plan-creator` via explicit `read` of `<packageRoot>/skills/plan-creator/SKILL.md` (fallback `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/plan-creator/SKILL.md`)
- `wave_plan` -> `plan-creator` via explicit `read` of `<packageRoot>/skills/plan-creator/SKILL.md` (fallback `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/plan-creator/SKILL.md`)
- `execute` -> `execute-plan` via explicit `read` of `<packageRoot>/skills/execute-plan/SKILL.md` (fallback `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/execute-plan/SKILL.md`)
- `review` -> `execution-reality-audit` via explicit `read` of `<packageRoot>/skills/execution-reality-audit/SKILL.md` (fallback `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/execution-reality-audit/SKILL.md`)
- `replan` -> `plan-creator` via explicit `read` of `<packageRoot>/skills/plan-creator/SKILL.md` (fallback `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/plan-creator/SKILL.md`)
- `closeout` -> explicit repo-local closeout prompt surface (no global closeout skill binding in `G1`)

Fail-fast law frozen in `G1`:

- halt if the deterministic phase route is missing or mismatched for the current runtime phase
- halt if a skill-bound phase cannot find its package-owned or compatibility-fallback routed `SKILL.md`
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
