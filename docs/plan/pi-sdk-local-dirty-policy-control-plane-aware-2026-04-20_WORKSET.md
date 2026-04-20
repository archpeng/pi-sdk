# PI SDK Local Dirty Policy Control-Plane Aware 2026-04-20 Workset

## Stage Order

- [x] `DP1` local-workspace-dirty-path-truth
- [x] `DP2` control-plane-aware-initial-run-guard
- [x] `DP3` best-effort-owned-path-journal
- [x] `DP4` docs-alignment
- [x] `DP5` closeout

## Active Stage

### `PACK_COMPLETE`

- Owner: `closeout`
- State: `DONE`
- Priority: `closeout_complete`

目标：

- 当前 dirty-policy pack 已 closeout，不再 claim 进一步 active execution slice

必须交付：

1. final control-plane truth
2. final verification evidence
3. honest residual handoff

必须避免：

1. pretending generic mutation provenance is solved
2. leaving the active pack pointer stale

## Slice Ownership

### `DP1`

- `src/substrate/types.ts`
- `src/substrate/local.ts`
- `test/substrate-config.test.ts`

### `DP2`

- `src/extension/runtime-guardrails.ts`
- `src/extension/runtime-dispatch.ts`
- `src/extension/index.ts`
- `test/extension.test.ts`

### `DP3`

- `src/autopilot/state.ts`
- `src/extension/index.ts`
- `src/extension/runtime-dispatch.ts`
- `test/extension.test.ts`

### `DP4`

- `README.md`
- `docs/architecture.md`
- `test/docs-alignment.test.ts`

### `DP5`

- this pack's `PLAN / STATUS / WORKSET`
- `docs/plan/pi-sdk-local-dirty-policy-control-plane-aware-2026-04-20_CLOSEOUT.md`
- `docs/plan/README.md`

## Final Verification Evidence

- `npx tsx --test test/substrate-config.test.ts test/extension.test.ts test/docs-alignment.test.ts`
- `npm test` (`87` tests)
- `npm run typecheck`
- `npm run build`

## Final Result

已证明：

1. local workspace scan now returns dirty path truth
2. initial local run allows control-plane-only dirty instead of blindly blocking all dirty repos
3. foreign dirty and no-path-detail cases still hard stop
4. runtime-owned path journal exists, but remains best-effort and narrowly scoped

## Handoff

- no immediate successor slice remains inside this pack
- future broader provenance or rollback work should start from a fresh successor pack
