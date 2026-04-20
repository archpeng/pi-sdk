# PI SDK Structure Clarity and Core Task Alignment Cleanup 2026-04-19 Plan

## Goal

在不扩 scope 的前提下，对 `pi-sdk` 做一轮最小但严格的结构清理，使项目：

1. 更严格围绕当前核心任务
2. 控制面真相读取更纯
3. 顶层文档与代码行为一致
4. extension driver 结构更清晰

本 pack 只解决 3 个明确问题：

1. **next-stage metadata must come entirely from control-plane truth**
2. **README / architecture must match current local-substrate and dirty-repo behavior**
3. **`src/extension/index.ts` must be split into clearer seams**

## Current Core Task

当前 repo 的核心任务固定为：

> 让 `pi-sdk` 的 extension 在 Pi 内的同一个 session 中，
> 围绕 repo-local active control plane，
> 串行自动推进并完成计划，
> 而不是仅仅推进 phase。

这份 cleanup pack 不能改变这个核心任务，只能让实现与叙述更清晰。

## Scope

### In scope

1. `src/substrate/control-plane.ts`
   - 去除对 next stage metadata 的默认填充
   - 让 next stage metadata 完全来自 control-plane truth
2. `README.md`
3. `docs/architecture.md`
4. `src/extension/index.ts`
   - 最小拆分为更清晰的 submodules
5. 相关 targeted tests

### Out of scope

1. 不改产品边界
2. 不改 CLI/headless 的定位
3. 不新增 generic document-driven control-plane system
4. 不改 BB ownership boundary
5. 不做新的 feature work

## Success Definition

本 pack 完成时，以下说法必须成立：

1. next-stage metadata 不再依赖 parser 默认值
2. README / architecture 不再与当前代码行为冲突
3. `src/extension/index.ts` 不再承载过多职责，至少拆为：
   - `runtime-dispatch`
   - `runtime-guardrails`
   - `command-handlers`
4. 行为不回退：
   - `npm test`
   - `npm run typecheck`
   - `npm run build`
   全绿

## Slice Decomposition

### `R1` — control-plane-truth-normalization

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- 让 next-stage metadata 100% 来自 control-plane truth

交付物：

- `parsePlanSliceDefinitions(...)` 不再硬编码 owner/state/priority/avoid
- 对应 targeted tests 覆盖真实 metadata 读取

主要文件：

- `src/substrate/control-plane.ts`
- `src/substrate/types.ts`
- `test/control-plane.test.ts`

必须避免：

1. default metadata fallback
2. silent control-plane format drift

### `R2` — docs-alignment

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 让 README / architecture 与当前代码行为一致

交付物：

- README 中的 local substrate 行为说明更新
- architecture 中的 dirty-repo gap/已落地能力更新
- 明确当前核心任务的两层表达：
  - 产品总体定位
  - 当前已证明的更窄 extension-only same-session path

主要文件：

- `README.md`
- `docs/architecture.md`

必须避免：

1. code/doc drift
2. changing product boundary language

### `R3` — extension-driver-split

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 不改变行为，只提升结构清晰度

交付物：

- 从 `src/extension/index.ts` 抽出至少三个 clearer seams：
  - `src/extension/runtime-dispatch.ts`
  - `src/extension/runtime-guardrails.ts`
  - `src/extension/command-handlers.ts`
- `src/extension/index.ts` 退化为装配层

主要文件：

- `src/extension/index.ts`
- new `src/extension/*.ts`
- `test/extension.test.ts`

必须避免：

1. behavior drift during split
2. moving product logic into the wrong layer

### `R4` — closeout

- Owner: `closeout`
- State: `queued`
- Priority: `medium`

目标：

- 用 evidence-backed closeout 收尾

交付物：

- updated `PLAN / STATUS / WORKSET`
- optional closeout doc if needed

必须避免：

1. claiming completion without final regression
2. leaving the active pack pointer stale

## Execution Order

1. `R1`
2. `review`
3. `replan`
4. `R2`
5. `review`
6. `replan`
7. `R3`
8. `review`
9. `replan`
10. `R4`

## Verification Ladder

### After `R1`

1. targeted substrate/control-plane tests
2. full regression:
   - `npm test`
   - `npm run typecheck`
   - `npm run build`

### After `R2`

1. doc review against current code
2. full regression:
   - `npm test`
   - `npm run typecheck`
   - `npm run build`

### After `R3`

1. targeted extension tests
2. full regression:
   - `npm test`
   - `npm run typecheck`
   - `npm run build`

## Stop Boundary

以下情况必须 stop / replan，而不是继续推进：

1. 若 `R1` 需要改动 control-plane format 本身，而不仅是读取逻辑
2. 若 `R3` 发现 extension 行为耦合过深，无法做最小拆分而不引入新行为
3. 若任何一步要求改变核心任务或产品边界
