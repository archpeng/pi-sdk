# PI SDK Local Dirty Policy Control-Plane Aware 2026-04-20 Plan

## Goal

Refine `pi-sdk` local-mode dirty-repo policy so repo-local control-plane-first workflows can start honestly without disabling safety.

This pack lands a narrower, workflow-aware policy:

1. allow initial local runs when dirty paths are limited to the repo-local active control plane
2. keep blocking foreign dirty paths
3. keep blocking when path-level dirty truth is unavailable
4. preserve room for future richer dirty attribution without pretending it already exists

## Current Core Task

当前 repo 的核心任务保持不变：

> 让 `pi-sdk` 的 extension 在 Pi 内的同一个 session 中，
> 围绕 repo-local active control plane，
> 串行自动推进并完成计划。

本 pack 只解决 local dirty policy 这一条 execution seam，不改变产品边界。

## Scope

### In scope

1. `src/substrate/local.ts`
   - 为 local workspace scan 增加 path-level dirty truth
2. `src/substrate/types.ts`
   - 补 workspace dirty path schema
3. `src/autopilot/state.ts`
   - 增加 best-effort autopilot-owned path journal
4. `src/extension/runtime-guardrails.ts`
   - 实现 control-plane-aware dirty guard policy
5. `src/extension/runtime-dispatch.ts`
   - 把 control-plane readme path / dirty workspace truth 暴露给 guard
   - accepted control-plane writeback 回填 owned paths
6. `src/extension/index.ts`
   - initial local dispatch 改用新 dirty policy
   - `edit` / `write` tool call best-effort 记录 owned paths
7. docs / tests / repo-local plan control truth

### Out of scope

1. 不实现 generic `bash` mutation attribution
2. 不改 BB server-side `workspace_scan` schema 作为硬依赖
3. 不做 per-wave git checkpoint / rollback system
4. 不扩写 arbitrary repo adapter system

## Success Definition

本 pack 完成时，以下说法必须成立：

1. local workspace scan 不再只有 dirty count，还能返回 path-level dirty truth
2. local-mode initial run 在 dirty path 仅限 repo-local active control plane 时允许继续
3. local-mode initial run 在出现 foreign dirty 或缺少 path detail 时仍然 hard stop
4. accepted control-plane writeback 与 best-effort `edit` / `write` calls 会进入 runtime-owned path journal
5. docs、tests、implementation 对 dirty policy 的叙述一致
6. `npm test`、`npm run typecheck`、`npm run build` 全绿

## Slice Decomposition

### `DP1` — local-workspace-dirty-path-truth

- Owner: `execute-plan`
- State: `DONE`
- Priority: `highest`

目标：

- 让 local workspace scan 提供 dirty path truth，而不仅是 dirty count

交付物：

1. `WorkspaceScanEntry` dirty path schema
2. local git status path parsing
3. targeted substrate tests

主要文件：

- `src/substrate/types.ts`
- `src/substrate/local.ts`
- `test/substrate-config.test.ts`

必须避免：

1. hidden path truncation
2. pretending BB already provides the same schema everywhere

### `DP2` — control-plane-aware-initial-run-guard

- Owner: `execute-plan`
- State: `DONE`
- Priority: `highest`

目标：

- 把 local initial-run dirty guard 从 count-only block 改成 control-plane-aware policy

交付物：

1. dirty policy evaluator
2. control-plane dirty allowance
3. foreign-dirty / no-path-detail hard-stop coverage

主要文件：

- `src/extension/runtime-guardrails.ts`
- `src/extension/runtime-dispatch.ts`
- `src/extension/index.ts`
- `test/extension.test.ts`

必须避免：

1. silently allowing foreign dirty
2. disabling the guard entirely

### `DP3` — best-effort-owned-path-journal

- Owner: `execute-plan`
- State: `DONE`
- Priority: `high`

目标：

- 为已知续跑现场补一个最小、诚实的 owned-path journal

交付物：

1. runtime-owned path state
2. `edit` / `write` best-effort ownership capture
3. control-plane writeback ownership capture

主要文件：

- `src/autopilot/state.ts`
- `src/extension/index.ts`
- `src/extension/runtime-dispatch.ts`
- `test/extension.test.ts`

必须避免：

1. claiming full mutation provenance
2. treating arbitrary `bash` writes as owned without proof

### `DP4` — docs-alignment

- Owner: `execute-plan`
- State: `DONE`
- Priority: `high`

目标：

- 让 README / architecture 与当前 dirty policy 行为一致

交付物：

1. top-level README dirty policy wording update
2. architecture dirty policy wording update
3. docs alignment tests updated

主要文件：

- `README.md`
- `docs/architecture.md`
- `test/docs-alignment.test.ts`

必须避免：

1. code/doc drift
2. overstating the scope of ownership tracking

### `DP5` — closeout

- Owner: `closeout`
- State: `DONE`
- Priority: `medium`

目标：

- 用 evidence-backed closeout 收尾

交付物：

1. updated `PLAN / STATUS / WORKSET`
2. closeout summary
3. repo-level active pack pointer update

必须避免：

1. stale active-pack pointer
2. claiming broader dirty-policy generality than actually landed

## Execution Order

1. `DP1`
2. `DP2`
3. `DP3`
4. `DP4`
5. `DP5`

## Verification Ladder

### After `DP1-DP3`

1. `npx tsx --test test/substrate-config.test.ts test/extension.test.ts`
2. `npm test`
3. `npm run typecheck`
4. `npm run build`

### After `DP4-DP5`

1. `npx tsx --test test/substrate-config.test.ts test/extension.test.ts test/docs-alignment.test.ts`
2. `npm test`
3. `npm run typecheck`
4. `npm run build`

## Stop Boundary

以下情况必须 stop / handoff，而不是继续扩 scope：

1. 若需要 generic `bash` mutation ownership 才能成立当前包内结论
2. 若要把 local-only policy 扩成 BB/global schema promise
3. 若需要引入更重的 git checkpoint / rollback subsystem
4. 若 dirty policy 需要脱离 repo-local control plane 才能表达
