# PI SDK Extension Driver Thinning Follow-Up 2026-04-21 Plan

## Goal

落实本轮代码质量 review 的结构结论：

> 在不改变 `pi-sdk` 当前产品边界与交互行为的前提下，
> 把 `src/extension/index.ts` 再拆薄一层，
> 让 interactive driver 更接近装配层，
> 并把最近新增的 Pi 0.68 helper seams 放回更清晰的模块边界。

本 pack 是一个 **small refactor follow-up**，不是新 feature pack。

## Current Core Task

当前 repo 的核心任务保持不变：

> 让 `pi-sdk` 的 extension 在 Pi 内的同一个 session 中，
> 围绕 repo-local active control plane，
> 串行自动推进并完成计划。

这次 refactor 只能让 interactive driver 结构更清晰，不能改变 single-session product boundary。

## Scope

### In scope

1. `src/extension/index.ts`
   - 退化为更清晰的 assembly / event wiring 层
2. new `src/extension/*.ts` helper seams
   - `tool-guard.ts`
   - `runtime-ui.ts`
   - `session-transition.ts`
3. targeted tests for extracted seams + existing extension regressions
4. minimal docs truth updates for the new extension file structure
5. repo-local machine control-plane pack + closeout truth

### Out of scope

1. 不改 autopilot behavior contract
2. 不改 CLI/headless driver 定位
3. 不改 BB substrate ownership boundary
4. 不做新的 UI capability 或新的 session-orchestration feature
5. 不把 driver assembly 再次扩成 generic extension framework

## Success Definition

本 pack 完成时，以下说法必须成立：

1. `src/extension/index.ts` 不再直接承载 tool-allowlist helper、runtime UI rendering、session handoff message formatting 的实现细节
2. extracted modules 的职责清晰：
   - tool guard
   - runtime UI / working indicator
   - session replacement message formatting
3. existing allowlist / working-indicator / session-shutdown behavior does not regress
4. targeted extension tests、`npm test`、`npm run typecheck`、`npm run build` 全绿
5. repo-local `docs/plan` control plane 仍保持 machine-compatible

## Slice Decomposition

### `R1` — tool-guard-seam-extraction

- Owner: `execute-plan`
- State: `DONE`
- Priority: `high`

目标：

- 把 missing-tool / allowlist preflight helper 从 `src/extension/index.ts` 抽到明确模块

交付物：

1. `src/extension/tool-guard.ts`
2. `index.ts` 改为引用 helper，而不是内联实现
3. targeted test coverage for extracted tool-guard behavior

主要文件：

- `src/extension/index.ts`
- `src/extension/tool-guard.ts`
- `test/extension-support.test.ts`
- `test/extension.test.ts`

必须避免：

1. 把 command-side preflight 和 authoritative selected-tools guard 混成一层语义
2. extraction 之后出现 duplicated reason formatting

### `R2` — runtime-ui-and-session-transition-extraction

- Owner: `execute-plan`
- State: `DONE`
- Priority: `high`

目标：

- 把 runtime UI / working-indicator rendering 和 session replacement message formatting 从 `index.ts` 抽出

交付物：

1. `src/extension/runtime-ui.ts`
2. `src/extension/session-transition.ts`
3. `index.ts` 保留 wiring，不再内联这些 helper 细节
4. targeted tests for extracted seam behavior

主要文件：

- `src/extension/index.ts`
- `src/extension/runtime-ui.ts`
- `src/extension/session-transition.ts`
- `test/extension-support.test.ts`
- `test/extension.test.ts`
- `test/extension-rebuild.test.ts`

必须避免：

1. 把 runtime UI helper 变成新的 scheduler owner
2. session shutdown cleanup 语义回退
3. 因 fake UI surface 差异导致测试误报

### `R3` — docs-regression-and-closeout

- Owner: `closeout`
- State: `DONE`
- Priority: `medium`

目标：

- 让 docs truth、plan truth、verification evidence 与 refactor 后结构对齐

交付物：

1. README / architecture 结构说明更新
2. green regression evidence recorded in `STATUS`
3. repo-level active pack pointer updated honestly

必须避免：

1. doc drift after helper extraction
2. leaving stale active-pack truth after closeout

## Execution Order

1. `R1`
2. `R2`
3. `R3`

## Verification Ladder

### After `R1-R2`

1. `npx tsx --test test/extension-support.test.ts test/extension.test.ts test/extension-rebuild.test.ts test/control-plane.test.ts`

### After `R3`

1. `npm test`
2. `npm run typecheck`
3. `npm run build`

## Stop Boundary

以下情况必须 stop / handoff，而不是继续扩 scope：

1. 若 extraction 需要改动 autopilot phase/scheduler behavior，而不仅是 helper ownership
2. 若 split 需要引入新的 hidden session / background runtime / product-surface change
3. 若 docs/plan parser contract 需要改 format，而不是只更新 active pack truth
4. 若 helper split 不能保持当前 allowlist / indicator / session-shutdown 行为等价
