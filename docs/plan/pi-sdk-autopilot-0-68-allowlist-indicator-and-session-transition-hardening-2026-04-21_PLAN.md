# PI SDK Autopilot 0.68 Allowlist Indicator and Session Transition Hardening 2026-04-21 Plan

## Goal

Harden `pi-sdk` against Pi 0.68 runtime drift on the primary interactive autopilot path.

This pack lands three bounded improvements that directly strengthen the repo's core task:

1. fail fast when tool allowlists make `autopilot_report` unavailable
2. make the interactive autopilot's streaming indicator phase-aware instead of generic
3. use `session_shutdown` metadata to handle reload / replacement / fork transitions more honestly and cleanly

## Current Core Task

当前 repo 的核心任务保持不变：

> 让 `pi-sdk` 的 extension 在 Pi 内的同一个 session 中，
> 围绕 repo-local active control plane，
> 串行自动推进并完成计划。

本 pack 只强化 Pi 0.68 对这个主路径的 execution seam，不改变 single-session product boundary。

## Scope

### In scope

1. `src/extension/command-handlers.ts`
   - 为 `/autopilot-run` / `/autopilot-resume` 增加 tool allowlist preflight
2. `src/extension/index.ts`
   - 增加 authoritative `before_agent_start` tool availability guard
   - 增加 phase-aware working indicator
   - 利用 `session_shutdown.reason` / `targetSessionFile` 做 cleaner transition handling
3. `test/extension.test.ts`
   - 覆盖 fail-fast / indicator / session transition behavior
4. user-facing docs + repo-local plan truth

### Out of scope

1. 不做 automatic multi-session clone/fork scheduler
2. 不把 arbitrary tool capability negotiation 扩成 generic planner subsystem
3. 不改 Pi core 或 `pi-sdk` primary product boundary
4. 不在这个 pack 内引入新的 control-plane format

## Success Definition

本 pack 完成时，以下说法必须成立：

1. `autopilot_report` 不在 active tool set 时，`/autopilot-run` / `/autopilot-resume` 会明确 fail fast，而不是静默进入错误运行路径
2. 即使 command-side preflight 漏过，`before_agent_start` 也会用 Pi 0.68 的 `systemPromptOptions.selectedTools` 做 authoritative guard
3. autopilot running / paused / stopping / closed state 会反映到 phase-aware working indicator，而不是 generic spinner
4. `session_shutdown.reason` / `targetSessionFile` 被用于更干净的 teardown / handoff 处理，避免 replacement flow 语义过于一刀切
5. targeted tests、`npm test`、`npm run typecheck`、`npm run build` 全绿
6. repo-local control plane 仍保持 autopilot-compatible

## Slice Decomposition

### `Q1` — autopilot-report-tool-guard

- Owner: `execute-plan`
- State: `DONE`
- Priority: `highest`

目标：

- 让 autopilot 在 Pi 0.68 tool allowlist 语义下对 `autopilot_report` 缺失做明确 fail-fast

交付物：

1. command-side preflight for `/autopilot-run` / `/autopilot-resume`
2. authoritative `before_agent_start` selected-tools guard
3. targeted extension tests

主要文件：

- `src/extension/command-handlers.ts`
- `src/extension/index.ts`
- `test/extension.test.ts`

必须避免：

1. allowlist drift 时仍然 silent hang
2. 把 generic missing-tool policy 扩成不必要的大系统

### `Q2` — phase-aware-working-indicator

- Owner: `execute-plan`
- State: `DONE`
- Priority: `high`

目标：

- 让 interactive autopilot 的 streaming indicator 反映 runtime mode / phase truth

交付物：

1. runtime-aware indicator mapping
2. UI update integration with existing status/widget refresh path
3. targeted extension tests

主要文件：

- `src/extension/index.ts`
- `test/extension.test.ts`

必须避免：

1. indicator state sticky after autopilot exits
2. 把 indicator 逻辑和 core scheduler state 耦合得不可测试

### `Q3` — session-transition-handoff-cleanup

- Owner: `execute-plan`
- State: `DONE`
- Priority: `high`

目标：

- 使用 Pi 0.68 `session_shutdown` metadata 让 reload / new / resume / fork replacement 行为更干净

交付物：

1. reason-aware teardown semantics
2. explicit operator-facing handoff message for replacement flows
3. targeted extension tests

主要文件：

- `src/extension/index.ts`
- `test/extension.test.ts`

必须避免：

1. 把 replacement path 误报成 generic stop/closeout
2. 留下 stale runtime/UI state

### `Q4` — docs-regression-and-closeout

- Owner: `closeout`
- State: `DONE`
- Priority: `medium`

目标：

- 用 docs + regression + control-plane closeout 收尾

交付物：

1. updated user-facing capability docs
2. green regression evidence recorded in `STATUS`
3. repo-level active pack pointer updated honestly

必须避免：

1. implementation/doc drift
2. stale active pack pointer after closeout

## Execution Order

1. `Q1`
2. `Q2`
3. `Q3`
4. `Q4`

## Verification Ladder

### After `Q1-Q3`

1. `npx tsx --test test/extension.test.ts`
2. `npm test`
3. `npm run typecheck`
4. `npm run build`

### After `Q4`

1. `npx tsx --test test/extension.test.ts`
2. `npm test`
3. `npm run typecheck`
4. `npm run build`

## Stop Boundary

以下情况必须 stop / handoff，而不是继续扩 scope：

1. 若需要把 single-session autopilot 扩成 automatic cross-session branching
2. 若需要 Pi core 新 API 才能让 allowlist guard 成立
3. 若 session replacement 需要引入 background daemon / detached runtime
4. 若 docs/control-plane format 需要改变而不是只做行为强化
