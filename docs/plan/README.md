# pi-sdk Plan Control Plane

## Active Pack

- `docs/plan/pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_PLAN.md`
- `docs/plan/pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_STATUS.md`
- `docs/plan/pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_WORKSET.md`

## Current Active Slice

- `PACK_COMPLETE`
## Intended Handoff

- `autopilot-closeout`

## Previous Pack

- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_PLAN.md`
- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_STATUS.md`
- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_WORKSET.md`

## Notes

This `docs/plan/` directory remains the repo-level control plane for resumable work.

The previous Pi Coding Agent `0.70.2` compatibility pack is historically paused at `U3`: fresh npm readback reported `@mariozechner/pi-coding-agent@0.70.2` unavailable (`E404`) while an operator-approved substitute install moved global Pi to `0.70.0`. Later operator-requested out-of-pack updates moved global Pi and this package's Pi dependencies to `0.71.1`; this hardening pack does not rewrite or close the old exact-`0.70.2` objective.

The current active pack addresses a higher-priority local autopilot safety issue discovered from the downstream `pos-lite-cashier` order-runtime roadmap run: `execute/completed` writeback can advance Stage Order or write `PACK_COMPLETE` before `review`, leaving `WORKSET ## Active Stage` unparsable (`Missing active stage heading`). ERW0 reconciled this pack around the current pi-sdk state, ERW1 repaired/reviewed the downstream parser recovery without accepting downstream member behavior, ERW2 reviewed/accepted ordinary execute-vs-review writeback gating, and ERW3 reviewed/accepted terminal `PACK_COMPLETE` parser safety with a handoff-drift fix. ERW4 docs/smoke/reload closeout execution and final review are complete; this pack is terminal at parser-compatible `PACK_COMPLETE` with repo-local closeout as the next prompt surface.

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
- execute / review report outcome derives from `doneWhenMet / stopBoundaryHit`, not only the raw requested `status`; accepted-slice Stage Order writeback is owned by `review/completed` or objective-terminal `done`, not ordinary `execute/completed`
- `closeout` remains a repo-local prompt surface, not a separate global closeout skill
