# PI SDK Structure Clarity and Core Task Alignment Cleanup 2026-04-19 Workset

## Stage Order

- [x] `R1` control-plane-truth-normalization
- [x] `R2` docs-alignment
- [x] `R3` extension-driver-split
- [x] `R4` closeout

## Active Stage

### `PACK_COMPLETE`

- Owner: `closeout`
- State: `DONE`
- Priority: `closeout_complete`

目标：

- 当前 cleanup pack 已 closeout，不再继续 claim active execution slice

必须交付：

1. final control-plane truth
2. final verification evidence
3. honest residual handoff

必须避免：

1. reopening cleanup work without a fresh pack
2. claiming new feature work inside this pack

## Slice Ownership

### `R1`

- `src/substrate/control-plane.ts`
- `src/substrate/types.ts`
- `test/control-plane.test.ts`

### `R2`

- `README.md`
- `docs/architecture.md`
- `test/docs-alignment.test.ts`

### `R3`

- `src/extension/index.ts`
- `src/extension/runtime-dispatch.ts`
- `src/extension/runtime-guardrails.ts`
- `src/extension/command-handlers.ts`
- `test/extension.test.ts`
- `test/extension-rebuild.test.ts`

### `R4`

- this pack's `PLAN / STATUS / WORKSET`
- `docs/plan/pi-sdk-structure-clarity-and-core-task-alignment-cleanup-2026-04-19_CLOSEOUT.md`

## Final Verification Evidence

- `npx tsx --test test/control-plane.test.ts`
- `npx tsx --test test/docs-alignment.test.ts`
- `npx tsx --test test/extension.test.ts test/extension-rebuild.test.ts`
- `npm test` (`84` tests)
- `npm run typecheck`
- `npm run build`

## Final Result

已证明：

1. next-stage metadata no longer depends on parser defaults
2. top-level docs reflect current local-mode behavior
3. extension driver responsibilities are split more clearly without behavior drift

## Handoff

- no immediate successor slice remains inside this pack
- future cleanup or new feature work should start from a fresh successor pack
