# PI SDK Structure Clarity and Core Task Alignment Cleanup 2026-04-19 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `structure clarity and core task alignment cleanup`
- predecessor_pack: `pi-sdk-extension-driven-autopilot-v1-single-session-plan-completion-2026-04-19` (closed out)
- execution_boundary: `no scope expansion; cleanup only`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `closeout_complete`
- why_done:
  1. `R1` removed synthesized next-stage metadata defaults and now requires explicit control-plane metadata truth
  2. `R2` realigned README / architecture with current local-substrate and dirty-repo behavior
  3. `R3` split the extension driver into clearer seams without behavior regression
  4. final full regression remained green

## Final Gate State

- [x] `R1` control-plane-truth-normalization
- [x] `R2` docs-alignment
- [x] `R3` extension-driver-split
- [x] `R4` closeout

## Completed Stages

### `R1 — control-plane-truth-normalization`

已完成：

1. `parsePlanSliceDefinitions(...)` 现在要求显式 owner/state/priority/avoid metadata
2. next-stage metadata 不再由 parser 默认值合成
3. 当前 cleanup pack 本身已补成显式 metadata truth source

verification evidence:

1. `npx tsx --test test/control-plane.test.ts` → pass
2. `npm test` → pass (`82` tests at the time of slice closeout)
3. `npm run typecheck` → pass
4. `npm run build` → pass

### `R2 — docs-alignment`

已完成：

1. README 现已说明 local substrate 包含 repo-local control-plane read/write 与 local git workspace scanning
2. architecture 现已把 dirty-repo guard 从 missing gap 调整为已落地最小保护
3. 顶层文档与当前代码行为不再直接冲突

verification evidence:

1. `npx tsx --test test/docs-alignment.test.ts` → pass
2. `npm test` → pass (`84` tests at the time of slice closeout)
3. `npm run typecheck` → pass
4. `npm run build` → pass

### `R3 — extension-driver-split`

已完成：

1. `src/extension/runtime-dispatch.ts` landed
2. `src/extension/runtime-guardrails.ts` landed
3. `src/extension/command-handlers.ts` landed
4. `src/extension/index.ts` is thinner and more assembly-oriented

verification evidence:

1. `npx tsx --test test/extension.test.ts test/extension-rebuild.test.ts` → pass
2. `npm test` → pass (`84` tests at the time of slice closeout)
3. `npm run typecheck` → pass
4. `npm run build` → pass

## Final Result

This cleanup pack achieved the three scoped goals:

1. next-stage metadata now comes from control-plane truth instead of parser defaults
2. README / architecture are aligned with current local-substrate and dirty-repo behavior
3. the extension driver is split into clearer seams while preserving behavior

## Final Verification Evidence

- `npm test` → pass (`84` tests)
- `npm run typecheck` → pass
- `npm run build` → pass

## Residuals

1. the parser still depends on the current repo-local `docs/plan` machine contract
2. `src/extension/index.ts` is cleaner, but future small decomposition work remains possible
3. this pack intentionally did not add new feature work

## Next Step

- no immediate successor pack required for this workstream
- intended_handoff: `human decision`
