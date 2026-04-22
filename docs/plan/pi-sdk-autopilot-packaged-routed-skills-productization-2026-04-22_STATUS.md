# PI SDK Autopilot Packaged Routed Skills Productization 2026-04-22 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> CLOSEOUT`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `autopilot packaged routed skills productization`
- predecessor_pack: `pi-sdk-autopilot-extension-plan-creator-execute-plan-gap-closing-2026-04-22` (closed out)
- execution_boundary: `close out packaged routed-skill productization without reopening phase semantics, Pi core, broader skill discovery, or single-root docs/plan truth`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `closeout_complete`
- why_done:
  1. `README.md`, `docs/architecture.md`, and the operator runbook now describe the landed package-owned `<packageRoot>/skills/*` primary path, `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/*` compatibility fallback, and honest clean-room proof / recovery boundaries.
  2. the routed global-skill audit was rerun and confirmed no drift for `plan-creator`, `execute-plan`, and `execution-reality-audit`; extra host-global-only non-routed skills are now recorded explicitly as residual context instead of implicit runtime dependency.
  3. `docs/plan/README.md`, this `STATUS`, and this `WORKSET` now close out at `PACK_COMPLETE` with explicit validation evidence, residuals, and no hidden parser-safe control-plane drift.

## Planned Stages

- [x] `P1` package-owned routed skill bundle and contract freeze
- [x] `P2` runtime route resolution and dispatch fallback wiring
- [x] `P3` clean-room packaged proof without host global skills
- [x] `P4` docs, global-skill audit, and closeout truth

## Recently Completed

- [x] aligned `README.md` with package-owned routed skills as the primary shipped/runtime surface, explicit agent-dir compatibility fallback, clean-room proof boundaries, and operator recovery guidance
- [x] aligned `docs/architecture.md` with package-first routed skill resolution plus dispatch visibility for resolved skill source / file and package-vs-fallback paths
- [x] aligned `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md` with doctor expectations, installed-package clean-room proof scope, repo-local BB-backed clean-room proof scope, and package-first recovery steps
- [x] reran the routed global-skill audit and confirmed `diff -rq` reports no drift between repo `skills/{plan-creator,execute-plan,execution-reality-audit}` and `/home/peng/.pi/agent/skills/{plan-creator,execute-plan,execution-reality-audit}`
- [x] recorded extra host-global-only non-routed skills as residual context only: `context-bootstrap`, `dense-documentation`, `doc-coauthoring`, `skill-creator`, `vibe-coding`
- [x] rewrote `docs/plan/README.md`, this `STATUS`, and this `WORKSET` so repo-local truth now closes out at `PACK_COMPLETE`
- [x] reran the bounded validation ladder for this docs/audit closeout pass: targeted `rg` readback, `npx tsx --test test/control-plane.test.ts`, `npx tsx --test test/package-smoke.test.ts test/pi-bb-backed-smoke.test.ts`, `plan_sync`, and `workspace_scan`

## Machine State

- active_step: `PACK_COMPLETE`
- latest_completed_step: `P4`
- intended_handoff: `no immediate successor pack required for this workstream`
- latest_closeout_summary: Closed P4: operator docs, routed global-skill audit, and PACK_COMPLETE truth now match the shipped package-first contract.
- latest_verification:
  - ``rg` confirms README, architecture, runbook, and pack docs now mention package-owned `<packageRoot>/skills/*`, explicit `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/*` fallback, clean-room proof boundaries, and `PACK_COMPLETE`.`
  - ``diff -rq` found no routed-skill drift for `plan-creator`, `execute-plan`, and `execution-reality-audit`; extra host-global-only non-routed skills are recorded as residual context.`
  - ``npx tsx --test test/control-plane.test.ts` passed (`10` tests).`
  - ``npx tsx --test test/package-smoke.test.ts test/pi-bb-backed-smoke.test.ts` passed (`3` tests).`
  - ``plan_sync` reports `STATUS done=11/11` and `WORKSET done=4/4`.`
  - ``workspace_scan` reports `pi-sdk@main` on branch `main` with `19` changed paths.`
  - `README.md`
  - `docs/architecture.md`
  - `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
  - `docs/plan/README.md`
  - `docs/plan/pi-sdk-autopilot-packaged-routed-skills-productization-2026-04-22_STATUS.md`
  - `docs/plan/pi-sdk-autopilot-packaged-routed-skills-productization-2026-04-22_WORKSET.md`
- terminal: `true`
## Final Result

This pack closed the remaining productization gap between runtime behavior, shipped package contents, operator docs, and compatibility mirrors:

1. package-owned routed skills under `<packageRoot>/skills/*` are now the primary shipped/runtime path, with `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/*` preserved only as explicit compatibility fallback
2. operator docs now describe the clean-room proof surfaces honestly: `smoke:pi-bb-backed` proves repo-local clean-room routed execution under an empty/isolated agent-dir, and `smoke:packaged-install` proves both shipped routed-skill presence and one installed-package clean-room routed phase
3. the routed global-skill audit confirms the three shipped routed skills match the package-owned bundle; extra host-global-only non-routed skills remain outside this package-owned routed-skill scope and are treated as residual context, not runtime dependency
4. repo-local machine truth closes out at `PACK_COMPLETE`, so the control plane no longer leaves a stale active `P4` pointer behind

## Final Verification Evidence

- `rg -n "<packageRoot>/skills|PI_CODING_AGENT_DIR|smoke:packaged-install|smoke:pi-bb-backed|clean-room agent-dir routed skills|routed-skill-sources|PACK_COMPLETE|no immediate successor pack required" README.md docs/architecture.md docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md docs/plan/README.md docs/plan/pi-sdk-autopilot-packaged-routed-skills-productization-2026-04-22_STATUS.md docs/plan/pi-sdk-autopilot-packaged-routed-skills-productization-2026-04-22_WORKSET.md`
- `diff -rq /home/peng/dt-git/github/pi-sdk/skills/plan-creator /home/peng/.pi/agent/skills/plan-creator && diff -rq /home/peng/dt-git/github/pi-sdk/skills/execute-plan /home/peng/.pi/agent/skills/execute-plan && diff -rq /home/peng/dt-git/github/pi-sdk/skills/execution-reality-audit /home/peng/.pi/agent/skills/execution-reality-audit`
- `npx tsx --test test/control-plane.test.ts`
- `npx tsx --test test/package-smoke.test.ts test/pi-bb-backed-smoke.test.ts`
- `plan_sync`
- `workspace_scan`

## Residuals

1. this pack intentionally stops at the landed runtime contract: package-owned `<packageRoot>/skills/*` primary plus explicit `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/*` fallback; it does not claim broader project-local `.pi/skills` discovery
2. extra host-global-only non-routed skills remain outside the shipped routed-skill bundle: `context-bootstrap`, `dense-documentation`, `doc-coauthoring`, `skill-creator`, `vibe-coding`
3. workspace state remains dirty/uncommitted after this local closeout pass; publication / commit / push decisions remain outside this pack

## Next Step

- no immediate successor pack required for this workstream
- intended_handoff: `human decision`

## Immediate Focus

- none; pack complete