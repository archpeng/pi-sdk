# pi-sdk Plan Control Plane

## Active Pack

- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_PLAN.md`
- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_STATUS.md`
- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_WORKSET.md`

## Current Active Slice

- `U3`
## Intended Handoff

- `execution-reality-audit`

## Previous Pack

- `docs/plan/pi-sdk-autopilot-packaged-routed-skills-productization-2026-04-22_PLAN.md`
- `docs/plan/pi-sdk-autopilot-packaged-routed-skills-productization-2026-04-22_STATUS.md`
- `docs/plan/pi-sdk-autopilot-packaged-routed-skills-productization-2026-04-22_WORKSET.md`

## Notes

This `docs/plan/` directory remains the repo-level control plane for resumable work.

The previous packaged routed-skills productization pack is closed out at `PACK_COMPLETE`: it productized package-owned routed skills as the primary runtime surface under `<packageRoot>/skills/*`, kept `${PI_CODING_AGENT_DIR:-~/.pi/agent}` as explicit compatibility fallback only, landed honest clean-room proof for both repo-local and installed-package routed execution, and completed the routed global-skill audit.

The current active pack prepares the local `pi-sdk`/AutoPi extension for the requested Pi Coding Agent `0.70.2` upgrade. Fresh U3 npm readback still reports `@mariozechner/pi-coding-agent@0.70.2` unavailable (`E404`). After explicit operator instruction to install `0.70.0` as a substitute, global Pi was upgraded to `0.70.0` with `--prefer-online`; this is an operator-approved substitute state, not completion of the exact requested `0.70.2` objective. `U1` is complete and reviewed; `U2` local package startup/smoke proof is accepted; the active slice remains `U3` for review of exact-version block plus substitute-install truth.

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
