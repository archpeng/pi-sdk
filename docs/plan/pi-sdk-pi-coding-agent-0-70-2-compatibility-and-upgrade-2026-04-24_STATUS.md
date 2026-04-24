# PI SDK Pi Coding Agent 0.70.2 Compatibility and Upgrade Readiness 2026-04-24 Status

## Current State

- state: `IN_PROGRESS`
- owner: `execute-plan`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> CLOSEOUT`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `pi-coding-agent-0.70.2-compatibility-and-upgrade-readiness`
- predecessor_pack: `pi-sdk-autopilot-packaged-routed-skills-productization-2026-04-22` (closed out at `PACK_COMPLETE`)
- execution_boundary: `make pi-sdk safe for Pi 0.70.x and only upgrade global Pi when exact 0.70.2 is available`

## Current Step

- active_step: `U1`
- mode: `ready_for_execution`

## Planned Stages

- [ ] `U1` pi-sdk 0.70 schema and dependency compatibility patch
- [ ] `U2` local package startup and smoke proof on the patched repo
- [ ] `U3` exact 0.70.2 availability gate and global Pi upgrade
- [ ] `U4` closeout truth, control-plane writeback, and handoff

## Immediate Focus

### `U1`

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- Update pi-sdk source/dependency truth so the AutoPi extension can typecheck against Pi Coding Agent `0.70.x` without breaking the shipped package surface.

必须交付：

1. `src/extension/index.ts` imports `Type` from `typebox` v1-compatible package instead of `@sinclair/typebox` for Pi tool schema definitions.
2. `package.json` / lockfile dependency truth aligns with Pi `0.70.x` packages and includes `typebox` v1 where required.
3. Focused compatibility proof from the repo, not only a disposable `/tmp` copy.

验证：

1. `npm install --prefer-online --no-audit --no-fund --package-lock-only @mariozechner/pi-coding-agent@0.70.0 @mariozechner/pi-ai@0.70.0 typebox@^1.1.24` or exact equivalent lockfile update.
2. `npm run typecheck` passes.
3. `npm test` passes.

done_when:

1. `src/extension/index.ts` no longer imports `Type` from `@sinclair/typebox` for `AutopilotReportParams`.
2. package dependency and lockfile truth resolve `@mariozechner/pi-coding-agent` / `@mariozechner/pi-ai` to `0.70.x` and include `typebox` v1 for extension schemas.
3. `npm run typecheck` and `npm test` both pass in `/home/peng/dt-git/github/pi-sdk`.

stop_boundary:

1. Stop before global upgrade if repo-local typecheck or tests fail after the compatibility patch.
2. Stop and replan if Pi `0.70.x` requires API changes beyond schema package compatibility.
3. Stop if dependency resolution wants to install anything other than Pi `0.70.x` without explicit operator decision.

必须避免：

1. Global `npm install -g` during U1.
2. Reporting exact `0.70.2` upgrade complete when only repo readiness work was done.
3. Changing autopilot phase progression or routed-skill ownership.

## Machine State

- active_step: `U1`
- latest_completed_step: `none`
- intended_handoff: `execute-plan`
- terminal: `false`

## Recently Completed

- [x] Disposable `/tmp` compatibility probe found the concrete Pi `0.70.x` issue: `@sinclair/typebox` schemas do not typecheck against Pi `0.70.0` tool registration types.
- [x] Disposable `/tmp` proof showed the likely patch (`import { Type } from "typebox"` plus `typebox ^1.1.24`) allows `npm run typecheck` and `npm test` to pass under Pi `0.70.0` dependencies.
- [x] Fresh npm readback found `@mariozechner/pi-coding-agent@0.70.2` unavailable while `0.70.0` is visible.

## Next Step

- `U1`

## Blockers

- Exact requested global upgrade target `@mariozechner/pi-coding-agent@0.70.2` is currently not visible in npm readback; U3 must re-check before any global install.

## Gate State

- repo_compatibility_patch: `ready`
- local_smoke_proof: `pending`
- exact_0_70_2_availability: `blocked_until_rechecked`
- global_upgrade: `not_started`

## Latest Evidence

- `pi --version` currently reports `0.69.0`.
- `npm list -g @mariozechner/pi-coding-agent --depth=0` currently reports `@mariozechner/pi-coding-agent@0.69.0`.
- `npm view @mariozechner/pi-coding-agent@0.70.2 version --json` returned `E404 No match found for version 0.70.2` during pre-plan probe.
- Disposable compatibility copy passed after the `typebox` v1 patch: `npm run typecheck`; `npm test`.

## Notes

- This status file is writeback-friendly parser truth for the active pack.
- Review routes to `execution-reality-audit`; closeout uses the repo-local closeout prompt surface.
