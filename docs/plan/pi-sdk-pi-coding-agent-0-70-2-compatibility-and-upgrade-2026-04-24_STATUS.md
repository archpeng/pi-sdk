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

- active_step: `U3`
- mode: `blocked_exact_version_unavailable`

## Planned Stages

- [x] `U1` pi-sdk 0.70 schema and dependency compatibility patch
- [x] `U2` local package startup and smoke proof on the patched repo
- [ ] `U3` exact 0.70.2 availability gate and global Pi upgrade
- [ ] `U4` closeout truth, control-plane writeback, and handoff

## Immediate Focus

### `U3`

- Owner: `execute-plan`
- State: `blocked_exact_version_unavailable`
- Priority: `high`

目标：

- Upgrade the global Pi Coding Agent only when the exact requested `@mariozechner/pi-coding-agent@0.70.2` is visible and installable from npm.

必须交付：

1. Fresh npm readback proving whether `0.70.2` exists.
2. If available, global install to `0.70.2` using the current npm prefix/environment.
3. Post-install version proof and local package list proof.
4. If unavailable, explicit blocked/readiness state with no global install performed.

done_when:

1. Fresh npm readback proves whether `@mariozechner/pi-coding-agent@0.70.2` exists in the configured registry.
2. If `0.70.2` is available, global `npm install -g @mariozechner/pi-coding-agent@0.70.2` succeeds without changing npm prefix or Node layout.
3. If global install occurs, `pi --version` and `npm list -g @mariozechner/pi-coding-agent --depth=0` both prove `0.70.2`.
4. If `0.70.2` is unavailable, `STATUS` / `WORKSET` record explicit blocked/readiness state and no global install is performed.

stop_boundary:

1. Stop with `blocked` if npm still reports no matching version for `0.70.2`.
2. Stop for human decision if only `0.70.0` is available and the operator wants to choose whether to install it instead.
3. Stop and revert/replan if global Pi upgrade breaks local extension startup after U1/U2 passed.

必须避免：

1. Installing `0.70.0` while reporting that the requested `0.70.2` upgrade is done.
2. Changing npm prefix or Node installation layout without explicit operator approval.
3. Proceeding to closeout as upgraded when only readiness was achieved.
## Machine State

- active_step: `U3`
- latest_completed_step: `U2`
- intended_handoff: `execution-reality-audit`
- latest_closeout_summary: U3 exact `0.70.2` remains blocked by npm availability; explicit operator substitute install upgraded global Pi to `0.70.0`.
- latest_verification:
  - `npm prefix -g` reported `/home/peng/.local/lib/node-v24.14.1-linux-arm64`.
  - `pi --version` before U3 substitute install path reported `0.69.0`.
  - `npm list -g @mariozechner/pi-coding-agent --depth=0` before U3 substitute install path reported `@mariozechner/pi-coding-agent@0.69.0`.
  - `npm view @mariozechner/pi-coding-agent@0.70.2 version --json --prefer-online` returned `E404 No match found for version 0.70.2` with exit code `1`.
  - `Operator explicitly instructed: install 0.70.0.`
  - Initial `npm install -g @mariozechner/pi-coding-agent@0.70.0` failed with `ETARGET No matching version found for @smithy/core@^3.23.17`; retry with `--prefer-online --no-audit --no-fund` succeeded.
  - `pi --version` after substitute install reported `0.70.0`.
  - `npm list -g @mariozechner/pi-coding-agent --depth=0` after substitute install reported `@mariozechner/pi-coding-agent@0.70.0`.
  - `Repo-local U1/U2 readiness remains valid: typecheck/tests/build/smokes previously passed under local 0.70.x dependencies.`
## Recently Completed

- [x] Disposable `/tmp` compatibility probe found the concrete Pi `0.70.x` issue: `@sinclair/typebox` schemas do not typecheck against Pi `0.70.0` tool registration types.
- [x] Disposable `/tmp` proof showed the likely patch (`import { Type } from "typebox"` plus `typebox ^1.1.24`) allows `npm run typecheck` and `npm test` to pass under Pi `0.70.0` dependencies.
- [x] Fresh npm readback found `@mariozechner/pi-coding-agent@0.70.2` unavailable while `0.70.0` is visible.

## Next Step

- `review U3 blocked exact-version gate`

## Current Wave Plan

- selected_slice: `U3`
- reason: U2 smoke proof is accepted; the next bounded gate is exact `0.70.2` npm availability and global upgrade only if the exact version exists.
- execution_steps:
  1. run fresh `npm view @mariozechner/pi-coding-agent@0.70.2 version --json --prefer-online`
  2. if available, verify current npm prefix/environment and run `npm install -g @mariozechner/pi-coding-agent@0.70.2`
  3. if installed, prove `pi --version` reports `0.70.2`
  4. if installed, prove `npm list -g @mariozechner/pi-coding-agent --depth=0` reports `@mariozechner/pi-coding-agent@0.70.2`
  5. if unavailable, record explicit blocked/readiness state without performing any global install
- wave_exit: U3 exact `0.70.2` stopped on npm availability, then explicit operator substitute decision installed global `0.70.0`; review should audit this as `0.70.0` substitute-installed and `0.70.2` still blocked, not exact-upgrade completion.

## Blockers

- Exact requested global upgrade target `@mariozechner/pi-coding-agent@0.70.2` is currently not visible in npm readback; U3 must re-check before any global install.

## Gate State

- repo_compatibility_patch: `reviewed`
- local_smoke_proof: `validated_for_review`
- exact_0_70_2_availability: `blocked_e404_2026-04-24`
- global_upgrade: `operator_approved_substitute_0.70.0_installed`

## Latest Evidence

- `pi --version` currently reports `0.69.0`.
- `npm list -g @mariozechner/pi-coding-agent --depth=0` currently reports `@mariozechner/pi-coding-agent@0.69.0`.
- `npm view @mariozechner/pi-coding-agent@0.70.2 version --json` returned `E404 No match found for version 0.70.2` during pre-plan probe.
- Disposable compatibility copy passed after the `typebox` v1 patch: `npm run typecheck`; `npm test`.
- U1 repo patch changed `src/extension/index.ts` to import `Type` from `typebox`, updated root dependencies to `@mariozechner/pi-ai` / `@mariozechner/pi-coding-agent` `^0.70.0`, and replaced direct `@sinclair/typebox` with `typebox` v1.
- U1 dependency readback after local install: `@mariozechner/pi-coding-agent=0.70.0`, `@mariozechner/pi-ai=0.70.0`, `typebox=1.1.33`, no direct `@sinclair/typebox` package in lockfile.
- U1 validation passed in `/home/peng/dt-git/github/pi-sdk`: `npm run typecheck`; `npm test` (112/112).
- U2 build passed in `/home/peng/dt-git/github/pi-sdk`: `npm run build`; patched `dist/index.js`, `dist/index.d.ts`, and `dist/extension/index.js` exist.
- U2 required local startup/package smokes passed: `npm run smoke:pi-autoload`; `npm run smoke:pi-commands`.
- U2 optional smokes also passed without skip/blocker: `npm run smoke:pi-bb-backed`; `npm run smoke:packaged-install`.
- U3 fresh global environment readback: `npm prefix -g` reported `/home/peng/.local/lib/node-v24.14.1-linux-arm64`; `pi --version` reported `0.69.0`; `npm list -g @mariozechner/pi-coding-agent --depth=0` reported `@mariozechner/pi-coding-agent@0.69.0`.
- U3 fresh npm availability readback: `npm view @mariozechner/pi-coding-agent@0.70.2 version --json --prefer-online` returned `E404 No match found for version 0.70.2` and exit code `1`.
- U3 operator override: user explicitly instructed `安装0.70.0` after exact `0.70.2` block.
- U3 substitute global install: initial `npm install -g @mariozechner/pi-coding-agent@0.70.0` failed with `ETARGET No matching version found for @smithy/core@^3.23.17`; retry `npm install -g @mariozechner/pi-coding-agent@0.70.0 --prefer-online --no-audit --no-fund` succeeded.
- U3 substitute proof: `pi --version` reports `0.70.0`; `npm list -g @mariozechner/pi-coding-agent --depth=0` reports `@mariozechner/pi-coding-agent@0.70.0`.

## Notes

- This status file is writeback-friendly parser truth for the active pack.
- Review routes to `execution-reality-audit`; closeout uses the repo-local closeout prompt surface.
