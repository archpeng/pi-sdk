# PI SDK Pi Coding Agent 0.70.2 Compatibility and Upgrade Readiness 2026-04-24 Plan

## Goal

Make the local AutoPi/pi-sdk extension safe for the requested Pi Coding Agent `0.70.2` upgrade, while preserving repo-local `docs/plan/*` machine truth and avoiding a global Pi upgrade until the exact requested npm version is actually available.

## Scope

- Patch pi-sdk extension/runtime dependencies for Pi `0.70.x` API and schema compatibility.
- Prove the local package still typechecks, tests, builds, and loads as a Pi package after the compatibility patch.
- Gate the global `@mariozechner/pi-coding-agent` upgrade on npm visibility of `0.70.2`.
- If `0.70.2` remains unavailable, leave an explicit stop boundary and upgrade readiness state instead of silently installing a different version.

## Non-Goals

- Do not upgrade global Pi to `0.70.0` as a substitute for `0.70.2` without an explicit human decision.
- Do not change AutoPi autopilot phase semantics, package-owned routed skill behavior, or the single-root `docs/plan/*` contract except as required by Pi `0.70.x` compatibility.
- Do not publish, tag, commit, or push.
- Do not edit unrelated adapter-feishu code.

## Deliverables

1. pi-sdk dependency/schema compatibility patch for Pi `0.70.x` / `typebox` v1.
2. Focused compatibility proof using `npm run typecheck`, `npm test`, and package smoke/build checks.
3. Explicit npm availability gate for `@mariozechner/pi-coding-agent@0.70.2` before any global install.
4. Post-upgrade proof path for `pi --version`, global package version, and local extension/package startup smoke.
5. Closeout docs that record whether the exact `0.70.2` upgrade happened or remained blocked by npm availability.

## Constraints

- This is a single-root autopilot-compatible pack: `docs/plan/*` is the parser and human truth.
- Each active-slice execution/review report must use `stepId` equal to the active slice ID.
- Skill-backed phases require selected tools that include at least `read` and `autopilot_report` when running under extension autopilot.
- Default continuation is automatic; use `done_when` / `stop_boundary` instead of “ask whether to continue” as the normal stop law.
- The currently observed npm registry state says `0.70.2` is not available while `0.70.0` is available; re-check before acting.

## Verification

Minimum ladder by slice:

1. U1: `npm install --package-lock-only` after dependency edits, `npm run typecheck`, `npm test`.
2. U2: `npm run build`, `npm run smoke:pi-autoload`, `npm run smoke:pi-commands`, targeted package smoke tests if full smoke is too broad.
3. U3: `npm view @mariozechner/pi-coding-agent@0.70.2 version --json`; only if available, global install plus `pi --version` and `npm list -g @mariozechner/pi-coding-agent --depth=0`.
4. U4: `npx tsx --test test/control-plane.test.ts`, `plan_sync`, `workspace_scan`, and final readback of `docs/plan/README.md` active pack truth.

## Master Wave Plan

This is the large 推进纲领 for the workstream. It keeps implementation pressure on the smallest proof-carrying slice while preserving the exact `0.70.2` upgrade gate.

### Wave 1 — repo-local Pi `0.70.x` source/dependency compatibility (`U1`)

- Primary objective: remove the known schema-package mismatch that prevents AutoPi from typechecking against Pi Coding Agent `0.70.x`.
- Bounded surfaces: `src/extension/index.ts`, `package.json`, `package-lock.json`.
- Required proof: lockfile readback resolves `@mariozechner/pi-coding-agent` / `@mariozechner/pi-ai` to `0.70.x`, `typebox` v1 is present for extension schemas, `npm run typecheck`, and `npm test`.
- Stop law: do not run global `npm install -g`; stop/replan if Pi `0.70.x` requires API changes beyond the schema-package swap or if dependency resolution leaves the `0.70.x` lane.
- Handoff: `execute-plan` on active slice `U1` now.

### Wave 2 — patched local package startup/smoke proof (`U2`)

- Primary objective: prove the patched source still builds and loads through the Pi package surfaces used by the operator environment.
- Bounded surfaces: `dist/**`, smoke scripts under `scripts/`, and smoke helpers under `src/substrate/`.
- Required proof: `npm run build`, `npm run smoke:pi-autoload`, `npm run smoke:pi-commands`, plus optional `smoke:pi-bb-backed` / `smoke:packaged-install` when environment dependencies permit.
- Stop law: repair local package startup before any global upgrade gate if startup or command smoke fails; record precise blocker for unavailable external credentials/services.
- Handoff: `execute-plan` on `U2` only after U1 review accepts repo-local compatibility proof.

### Wave 3 — exact npm availability gate and global Pi upgrade (`U3`)

- Primary objective: decide the requested global upgrade using fresh registry truth, not the fallback-compatible `0.70.0` readiness proof.
- Bounded surfaces: npm registry readback, current global npm prefix, `pi --version`, and global `@mariozechner/pi-coding-agent` package readback.
- Required proof: `npm view @mariozechner/pi-coding-agent@0.70.2 version --json --prefer-online`; if available, successful `npm install -g @mariozechner/pi-coding-agent@0.70.2`, `pi --version == 0.70.2`, and `npm list -g @mariozechner/pi-coding-agent --depth=0`.
- Stop law: block rather than substitute if `0.70.2` is still unavailable; require explicit operator decision before installing any non-`0.70.2` global target.
- Handoff: `execute-plan` on `U3` after U2 smoke proof is accepted.

### Wave 4 — final control-plane truth and honest closeout (`U4`)

- Primary objective: close the workstream as one clear terminal truth: exact `0.70.2` upgraded, or repo-ready but exact global target unavailable.
- Bounded surfaces: `docs/plan/README.md`, active `STATUS`, active `WORKSET`, and optional closeout artifact.
- Required proof: `npx tsx --test test/control-plane.test.ts`, `plan_sync`, `workspace_scan`, and final version evidence if the global upgrade occurred.
- Stop law: do not mark `PACK_COMPLETE` if parser tests fail or if U1/U2 evidence is missing; do not mix “upgraded” and “blocked” as simultaneous terminal states.
- Handoff: repo-local closeout prompt surface after U4 docs/parser proof is accepted.

### Wave 5 — residual operator handoff / post-closeout verification window

- Primary objective: make any residual state operationally safe after the pack terminal state is known.
- Bounded surfaces: final closeout note/runbook references only; no extra code edits unless closeout/review identifies a concrete regression.
- Required proof: final operator-facing summary includes current local package state, global Pi state, whether exact `0.70.2` was installed, and the next safe command if the registry block clears later.
- Stop law: do not reopen implementation inside closeout unless a verified regression invalidates U1/U2/U3 evidence; route any such regression back to `replan`.
- Handoff: scheduler closeout if terminal; otherwise `plan-creator` replan with the precise failed gate.

### Best First Wave

Wave 1 (`U1`) is the correct first wave now because repo inspection confirms the active code still imports `Type` from `@sinclair/typebox`, `package.json` and `package-lock.json` still resolve Pi packages to `0.68.0`, and `typebox` v1 is not present. This is the least-risk path because it stays repo-local, avoids global installation, and directly attacks the known Pi `0.70.x` typecheck blocker before broader smoke or upgrade work.

## Blockers / Risks

- `@mariozechner/pi-coding-agent@0.70.2` may still be absent from the configured npm registry; this blocks the exact requested global upgrade.
- Pi `0.70.x` depends on `typebox` v1, while current pi-sdk imports `Type` from `@sinclair/typebox`; the compatibility patch must remove that schema mismatch for extension tool registration.
- The local package is loaded from `../../dt-git/github/pi-sdk`; a broken local package can affect interactive Pi startup.
- Registry proxy cache may be stale; use `--prefer-online` or explicit registry readback before deciding version availability.

## Slice Definitions

#### `U1` — pi-sdk 0.70 schema and dependency compatibility patch

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- Update pi-sdk source/dependency truth so the AutoPi extension can typecheck against Pi Coding Agent `0.70.x` without breaking the shipped package surface.

交付物：

1. `src/extension/index.ts` imports `Type` from `typebox` v1-compatible package instead of `@sinclair/typebox` for Pi tool schema definitions.
2. `package.json` / lockfile dependency truth aligns with Pi `0.70.x` packages and includes `typebox` v1 where required.
3. Focused compatibility proof from the repo, not only a disposable `/tmp` copy.

验证：

1. `npm install --prefer-online --no-audit --no-fund --package-lock-only @mariozechner/pi-coding-agent@0.70.0 @mariozechner/pi-ai@0.70.0 typebox@^1.1.24` or exact equivalent lockfile update.
2. `npm run typecheck` passes.
3. `npm test` passes.

交付边界：

1. Keep this slice limited to repo-local pi-sdk compatibility; do not run global `npm install -g` here.
2. Do not substitute `0.70.0` for the requested global `0.70.2` upgrade.

必须避免：

1. Adding deprecated schema compatibility fields to the public tool parameters just to silence types.
2. Leaving both `@sinclair/typebox` and `typebox` as ambiguous schema sources for the extension entrypoint.
3. Changing autopilot phase progression or routed-skill ownership while doing the dependency patch.

#### `U2` — local package startup and smoke proof on the patched repo

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- Prove the patched local pi-sdk package still builds and loads through the Pi package surfaces used by the operator environment.

交付物：

1. Built `dist/` output from the patched source.
2. Passing package/local startup smoke evidence for the local extension route.
3. Any necessary docs note if a smoke is intentionally skipped due to an external service dependency.

验证：

1. `npm run build` passes.
2. `npm run smoke:pi-autoload` passes.
3. `npm run smoke:pi-commands` passes.
4. If feasible in the current environment, run `npm run smoke:pi-bb-backed` and/or `npm run smoke:packaged-install`; otherwise record the exact blocker.

done_when:

1. `npm run build` passes in `/home/peng/dt-git/github/pi-sdk` and produces patched `dist/` output.
2. `npm run smoke:pi-autoload` and `npm run smoke:pi-commands` both pass in `/home/peng/dt-git/github/pi-sdk`.
3. Optional U2 smoke commands are either passed or skipped with an exact blocker recorded in `STATUS` / `WORKSET`.

stop_boundary:

1. Stop if Pi startup/package smoke fails after U1; repair the package before moving to global upgrade gating.
2. Stop if smoke requires external credentials or live services not available in the current environment; record as blocker instead of faking proof.

交付边界：

1. Stop if Pi startup/package smoke fails after U1; repair the package before moving to global upgrade gating.
2. Stop if smoke requires external credentials or live services not available in the current environment; record as blocker instead of faking proof.

必须避免：

1. Treating `npm test` alone as sufficient startup proof.
2. Hiding a smoke failure behind broad “environment issue” prose without command output or a precise blocker.

#### `U3` — exact 0.70.2 availability gate and global Pi upgrade

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- Upgrade the global Pi Coding Agent only when the exact requested `@mariozechner/pi-coding-agent@0.70.2` is visible and installable from npm.

交付物：

1. Fresh npm readback proving whether `0.70.2` exists.
2. If available, global install to `0.70.2` using the current npm prefix/environment.
3. Post-install version proof and local package list proof.
4. If unavailable, explicit blocked/readiness state with no global install performed.

验证：

1. `npm view @mariozechner/pi-coding-agent@0.70.2 version --json --prefer-online` or equivalent fresh readback.
2. If available: `npm install -g @mariozechner/pi-coding-agent@0.70.2` exits 0.
3. If installed: `pi --version` reports `0.70.2`.
4. If installed: `npm list -g @mariozechner/pi-coding-agent --depth=0` reports `@mariozechner/pi-coding-agent@0.70.2`.

done_when:

1. Fresh npm readback proves whether `@mariozechner/pi-coding-agent@0.70.2` exists in the configured registry.
2. If `0.70.2` is available, global `npm install -g @mariozechner/pi-coding-agent@0.70.2` succeeds without changing npm prefix or Node layout.
3. If global install occurs, `pi --version` and `npm list -g @mariozechner/pi-coding-agent --depth=0` both prove `0.70.2`.
4. If `0.70.2` is unavailable, `STATUS` / `WORKSET` record explicit blocked/readiness state and no global install is performed.

stop_boundary:

1. Stop with `blocked` if npm still reports no matching version for `0.70.2`.
2. Stop for human decision if only `0.70.0` is available and the operator wants to choose whether to install it instead.
3. Stop and revert/replan if global Pi upgrade breaks local extension startup after U1/U2 passed.

交付边界：

1. Stop with `blocked` if npm still reports no matching version for `0.70.2`.
2. Stop for human decision if only `0.70.0` is available and the operator wants to choose whether to install it instead.
3. Stop and revert/replan if global Pi upgrade breaks local extension startup after U1/U2 passed.

必须避免：

1. Installing `0.70.0` while reporting that the requested `0.70.2` upgrade is done.
2. Changing npm prefix or Node installation layout without explicit operator approval.
3. Proceeding to closeout as upgraded when only readiness was achieved.

#### `U4` — closeout truth, control-plane writeback, and handoff

- Owner: `execute-plan`
- State: `queued`
- Priority: `medium`

目标：

- Close the workstream honestly as either `0.70.2 upgraded` or `0.70.2-ready but blocked by npm availability`, with parser-compatible docs/plan truth.

交付物：

1. `docs/plan/README.md`, `STATUS`, and `WORKSET` updated to the final active state (`PACK_COMPLETE` only if terminal truth is proven).
2. Closeout evidence records exact repo/package/global Pi versions and validation commands.
3. Residual/handoff states distinguish `0.70.2 unavailable` from implementation failure.

验证：

1. `npx tsx --test test/control-plane.test.ts` passes after docs writeback.
2. `plan_sync` reports the active pack state accurately.
3. `workspace_scan` records final repo branch/dirty state.
4. Final `pi --version` and `npm list -g @mariozechner/pi-coding-agent --depth=0` evidence is included if the global upgrade happened.

交付边界：

1. Do not mark `PACK_COMPLETE` unless U1/U2 are done and U3 is either successfully upgraded to `0.70.2` or explicitly blocked by npm availability with readiness evidence.
2. If control-plane parser tests fail, replan/repair docs before closeout.

必须避免：

1. Leaving `docs/plan/README.md` pointing at this pack with a stale active slice after terminal closeout.
2. Mixing “upgrade complete” and “upgrade blocked” in the same final status without a single clear truth.

## Exit Criteria

- U1/U2 prove the local extension will not be broken by Pi `0.70.x` schema/runtime changes.
- U3 either installs exact `0.70.2` and proves it, or records an exact npm availability block without global install.
- U4 closes or hands off with parser-compatible `docs/plan/*` truth.
