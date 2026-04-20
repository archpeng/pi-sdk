# PI SDK Local Dirty Policy Control-Plane Aware 2026-04-20 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `local dirty policy control-plane aware`
- predecessor_pack: `pi-sdk-structure-clarity-and-core-task-alignment-cleanup-2026-04-19` (closed out)
- execution_boundary: `local-mode dirty policy only; no broader provenance or repo adapter expansion`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `closeout_complete`
- why_done:
  1. `DP1` added path-level dirty truth to local workspace scan
  2. `DP2` replaced the count-only initial-run dirty stop with a control-plane-aware policy
  3. `DP3` added a best-effort owned-path journal for explicit `edit` / `write` calls plus deterministic control-plane writeback
  4. `DP4` realigned README / architecture / docs-alignment tests with the landed policy
  5. final regression remained green

## Final Gate State

- [x] `DP1` local-workspace-dirty-path-truth
- [x] `DP2` control-plane-aware-initial-run-guard
- [x] `DP3` best-effort-owned-path-journal
- [x] `DP4` docs-alignment
- [x] `DP5` closeout

## Completed Stages

### `DP1 — local-workspace-dirty-path-truth`

已完成：

1. `WorkspaceScanEntry` 新增 `dirty_paths` / `dirty_details`
2. local substrate 现在解析 git status path-level truth，而不仅是 dirty count
3. targeted substrate tests 现在验证 returned dirty paths 与 status chars

verification evidence:

1. `npx tsx --test test/substrate-config.test.ts` → pass
2. `npm test` → pass (`87` tests)
3. `npm run typecheck` → pass
4. `npm run build` → pass

### `DP2 — control-plane-aware-initial-run-guard`

已完成：

1. initial local run 现在允许 control-plane-only dirty
2. foreign dirty 仍然会 hard stop
3. missing path-level detail 仍然会 hard stop
4. blocking / allowance reasons 现在更具体

verification evidence:

1. `npx tsx --test test/extension.test.ts` → pass
2. `npm test` → pass (`87` tests)
3. `npm run typecheck` → pass
4. `npm run build` → pass

### `DP3 — best-effort-owned-path-journal`

已完成：

1. runtime state 新增 `autopilotOwnedPaths`
2. local-mode `edit` / `write` tool calls 会 best-effort 记录 owned path
3. deterministic control-plane writeback 的 updated files 会并入 owned path journal

verification evidence:

1. `npx tsx --test test/extension.test.ts` → pass
2. `npm test` → pass (`87` tests)
3. `npm run typecheck` → pass
4. `npm run build` → pass

### `DP4 — docs-alignment`

已完成：

1. README 现在把 local dirty guard 描述为 control-plane-aware initial-run guard
2. architecture 现在明确写出 control-plane-only dirty allowance
3. docs alignment tests 已同步到新 wording

verification evidence:

1. `npx tsx --test test/docs-alignment.test.ts` → pass
2. `npm test` → pass (`87` tests)
3. `npm run typecheck` → pass
4. `npm run build` → pass

## Final Result

This pack closed the specific dirty-policy blocker for repo-local control-plane-first workflows:

1. creating or updating `docs/plan/README.md` + active pack files no longer forces a false dirty-repo stop on the first local run
2. the guard remains honest by refusing foreign dirty or missing path detail
3. `pi-sdk` still does not claim generic mutation provenance; it only records a best-effort owned-path journal for explicit, known local paths

## Final Verification Evidence

- `npx tsx --test test/substrate-config.test.ts test/extension.test.ts test/docs-alignment.test.ts` → pass
- `npm test` → pass (`87` tests)
- `npm run typecheck` → pass
- `npm run build` → pass

## Residuals

1. generic `bash` mutation attribution is still out of scope
2. BB/server-side workspace scan is not yet required to emit the same path-detail schema
3. deeper git checkpoint / rollback automation remains future work

## Next Step

- no immediate successor pack required for this workstream
- intended_handoff: `human decision`
