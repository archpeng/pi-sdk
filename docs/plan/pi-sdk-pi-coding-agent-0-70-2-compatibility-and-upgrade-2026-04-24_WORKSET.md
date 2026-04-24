# PI SDK Pi Coding Agent 0.70.2 Compatibility and Upgrade Readiness 2026-04-24 Workset

## Stage Order

- [ ] `U1` pi-sdk 0.70 schema and dependency compatibility patch
- [ ] `U2` local package startup and smoke proof on the patched repo
- [ ] `U3` exact 0.70.2 availability gate and global Pi upgrade
- [ ] `U4` closeout truth, control-plane writeback, and handoff

## Active Stage

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

## Slice Ownership

### `U1`

- `src/extension/index.ts`
- `package.json`
- `package-lock.json`

### `U2`

- `dist/**`
- `scripts/pi-startup-autoload-proof.mjs`
- `scripts/pi-command-smoke.mjs`
- `scripts/pi-bb-backed-smoke.mjs`
- `scripts/packaged-install-smoke.mjs`
- `src/substrate/package-smoke.ts`
- `src/substrate/pi-autoload-proof.ts`
- `src/substrate/pi-command-smoke.ts`
- `src/substrate/pi-bb-backed-smoke.ts`

### `U3`

- global npm install surface for `@mariozechner/pi-coding-agent`
- `/home/peng/.local/node/bin/pi`
- `/home/peng/.local/lib/node-v24.14.1-linux-arm64/lib/node_modules/@mariozechner/pi-coding-agent`
- `/home/peng/.pi/agent/settings.json` readback only unless a version/changelog setting must be reconciled

### `U4`

- `docs/plan/README.md`
- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_STATUS.md`
- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_WORKSET.md`
- optional closeout note if terminal truth needs a separate artifact

## Expected Verification

- U1: `npm run typecheck`; `npm test`.
- U2: `npm run build`; `npm run smoke:pi-autoload`; `npm run smoke:pi-commands`; optional `npm run smoke:pi-bb-backed` / `npm run smoke:packaged-install` if environment permits.
- U3: `npm view @mariozechner/pi-coding-agent@0.70.2 version --json`; if available, `npm install -g @mariozechner/pi-coding-agent@0.70.2`; `pi --version`; `npm list -g @mariozechner/pi-coding-agent --depth=0`.
- U4: `npx tsx --test test/control-plane.test.ts`; `plan_sync`; `workspace_scan`.

## Execution Notes

- Active stage ID `U1` is the `stepId` for active-slice reports under extension autopilot.
- Do not make “ask whether to continue” the default stop rule; use the active stage `done_when` / `stop_boundary`.
- Review routes to `execution-reality-audit`; closeout uses the repo-local closeout prompt surface.
- If `0.70.2` remains unavailable during U3, mark U3 blocked/readiness-complete rather than installing `0.70.0` silently.
