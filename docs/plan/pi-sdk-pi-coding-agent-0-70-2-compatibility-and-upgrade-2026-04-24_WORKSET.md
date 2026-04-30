# PI SDK Pi Coding Agent 0.70.2 Compatibility and Upgrade Readiness 2026-04-24 Workset

## Stage Order

- [x] `U1` pi-sdk 0.70 schema and dependency compatibility patch
- [x] `U2` local package startup and smoke proof on the patched repo
- [ ] `U3` exact 0.70.2 availability gate and global Pi upgrade
- [ ] `U4` closeout truth, control-plane writeback, and handoff

## Active Stage

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
## Wave 1 Execution Plan

Selected bounded slice: `U3` — exact npm availability gate and global Pi upgrade only if the requested version exists.

Linear execution steps:

1. Run fresh registry readback:
   - `npm view @mariozechner/pi-coding-agent@0.70.2 version --json --prefer-online`
2. If exact `0.70.2` is available:
   - verify current npm prefix/environment without changing Node layout
   - run `npm install -g @mariozechner/pi-coding-agent@0.70.2`
   - prove `pi --version` reports `0.70.2`
   - prove `npm list -g @mariozechner/pi-coding-agent --depth=0` reports `@mariozechner/pi-coding-agent@0.70.2`
3. If exact `0.70.2` is unavailable:
   - record explicit blocked/readiness state in `STATUS` / `WORKSET`
   - perform no global install
4. Report U3 truth through `autopilot_report`:
   - include only exact active-slice `done_when` items that are proven by the commands above
   - include any exact active-slice `stop_boundary` item if npm availability or operator-decision boundaries force a stop

Likely changed files/surfaces:

- global npm install surface for `@mariozechner/pi-coding-agent`
- `/home/peng/.local/node/bin/pi`
- `/home/peng/.local/lib/node-v24.14.1-linux-arm64/lib/node_modules/@mariozechner/pi-coding-agent`
- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_STATUS.md`
- `docs/plan/pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24_WORKSET.md`

Wave 1 validation shape:

1. Fresh npm readback proves whether exact `0.70.2` exists.
2. If available, global install succeeds without npm prefix or Node layout changes.
3. If installed, `pi --version` and global package list prove exact `0.70.2`.
4. If unavailable, docs record blocked/readiness state and no global install occurred.

Wave 1 exit criteria before review:

- U3 exact availability/install truth is satisfied with concrete evidence, or execution stops with the exact matching U3 `stop_boundary` item.
- No non-`0.70.2` version is installed as a substitute.
- The next handoff after U3 execution is `review` routed to `execution-reality-audit` for U3 evidence audit.

Wave 1 execution evidence:

- U1: `src/extension/index.ts` now imports `Type` from `typebox`.
- U1: `package.json` / `package-lock.json` now resolve `@mariozechner/pi-coding-agent=0.70.0`, `@mariozechner/pi-ai=0.70.0`, and `typebox=1.1.33`; direct `@sinclair/typebox` root dependency was removed.
- U1: `npm run typecheck` passed; `npm test` passed (112/112).
- U2: `npm run build` passed and produced patched `dist/index.js`, `dist/index.d.ts`, and `dist/extension/index.js`.
- U2: `npm run smoke:pi-autoload` passed; control command exited 1 only for expected missing OpenAI API key outside the autoload proof path.
- U2: `npm run smoke:pi-commands` passed for `/autopilot-status`, `/autopilot-run`, `/autopilot-resume`, `/autopilot-pause`, and `/autopilot-stop`.
- U2: Optional `npm run smoke:pi-bb-backed` passed with package-owned routed skill source and BB-backed same-process progression proof.
- U2: Optional `npm run smoke:packaged-install` passed, including npm pack/install, doctor checks, installed package routed skills, and clean-room routed-phase proof.
- U3: `npm prefix -g` reported `/home/peng/.local/lib/node-v24.14.1-linux-arm64`; `pi --version` before substitute install reported `0.69.0`; `npm list -g @mariozechner/pi-coding-agent --depth=0` before substitute install reported `@mariozechner/pi-coding-agent@0.69.0`.
- U3: `npm view @mariozechner/pi-coding-agent@0.70.2 version --json --prefer-online` returned `E404 No match found for version 0.70.2` and exit code `1`.
- U3: After explicit operator instruction to install `0.70.0`, initial `npm install -g @mariozechner/pi-coding-agent@0.70.0` failed with `ETARGET No matching version found for @smithy/core@^3.23.17`; retry with `--prefer-online --no-audit --no-fund` succeeded.
- U3: Substitute install proof: `pi --version` reports `0.70.0`; `npm list -g @mariozechner/pi-coding-agent --depth=0` reports `@mariozechner/pi-coding-agent@0.70.0`.
- U3: Exact requested `0.70.2` remains unavailable; `0.70.0` is an explicit operator-approved substitute state, not exact objective completion.

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

- Active stage ID `U3` is the `stepId` for active-slice reports under extension autopilot.
- Do not make “ask whether to continue” the default stop rule; use the active stage `done_when` / `stop_boundary`.
- Review routes to `execution-reality-audit`; closeout uses the repo-local closeout prompt surface.
- If `0.70.2` remains unavailable during U3, mark U3 blocked/readiness-complete rather than installing `0.70.0` silently.

## Machine Queue

- active_step: `U3`
- latest_completed_step: `U2`
- intended_handoff: `execution-reality-audit`
- latest_closeout_summary: U3 exact `0.70.2` remains blocked by npm availability; explicit operator substitute install upgraded global Pi to `0.70.0`.
- latest_verification:
  - `npm prefix -g reported /home/peng/.local/lib/node-v24.14.1-linux-arm64.`
  - `pi --version reported 0.69.0 before U3 substitute install path.`
  - `npm list -g @mariozechner/pi-coding-agent --depth=0 reported @mariozechner/pi-coding-agent@0.69.0 before U3 substitute install path.`
  - `npm view @mariozechner/pi-coding-agent@0.70.2 version --json --prefer-online returned E404 No match found for version 0.70.2 with exit code 1.`
  - `Operator explicitly instructed install of 0.70.0 after exact 0.70.2 block.`
  - `npm install -g @mariozechner/pi-coding-agent@0.70.0 --prefer-online --no-audit --no-fund succeeded.`
  - `pi --version reported 0.70.0 after substitute install.`
  - `npm list -g @mariozechner/pi-coding-agent --depth=0 reported @mariozechner/pi-coding-agent@0.70.0 after substitute install.`