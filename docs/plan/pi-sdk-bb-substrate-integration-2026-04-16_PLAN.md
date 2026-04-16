# PI SDK BB Substrate Integration 2026-04-16 Plan

## Goal

把 `pi-sdk` 从 session-local autopilot MVP 推进到 **BB-backed thin orchestration shell**：

- `pi-sdk` 保持 phase driver / prompt generator / run controller
- `BB` 提供 memory / governance / workspace substrate
- phase 前后通过 substrate 做最小 hydration + writeback
- 为后续 canonical run head、replay/eval、route learning 留出稳定接口

## Scope

本计划只覆盖 **V1 integration foundation**：

1. 为 `pi-sdk` 抽出 substrate adapter seam
2. 引入 BB-backed `MemoryPort / GovernPort / WorkspacePort`
3. 为 phase loop 加入最小 pre-phase hydration
4. 为 phase loop 加入最小 post-phase raw evidence writeback
5. 为高风险 execution 动作引入 governance preflight 接点
6. 更新文档，使 `execute-plan` 可以继续落下一刀

## Non-Goals

1. 不在本阶段实现完整 canonical run/workset head
2. 不在本阶段实现 replay/eval/canary 主循环
3. 不在本阶段实现 subagent planner / reviewer / worker fan-out
4. 不在本阶段实现完整 git checkpoint / rollback
5. 不在本阶段把 repo-level `PLAN / STATUS / WORKSET` projection 自动生成到 BB canonical head 之上
6. 不在本阶段做 end-to-end coding model 微调

## Deliverables

### D1 — Substrate Port Freeze

定义并落地 `pi-sdk` 内部的 substrate abstraction：

- `MemoryPort`
- `GovernPort`
- `WorkspacePort`

要求：

1. orchestrator 不直接写死 BB tool 调用形态
2. ports 可以先有 local/no-op default，再接 BB adapter
3. phase loop 后续只依赖 ports，不依赖具体 MCP 工具名散落在主循环中

### D2 — BB Adapter MVP

落地第一版 BB adapter，至少覆盖：

- memory: `memory_recall` `memory_store`
- govern: `govern_evaluate` `govern_policy`
- workspace: `workspace_scan` `plan_sync`

要求：

1. adapter 失败时不破坏当前 CLI 最小可运行性
2. failure surface 明确，不隐藏在 prompt 中
3. 不把 BB 当成 prompt glue，而是明确的 substrate dependency

### D3 — Phase Hydration + Writeback MVP

在不重写主循环的前提下接入：

1. pre-phase recall hydration
2. post-phase raw phase evidence writeback

要求：

1. hydration 范围要最小、按 phase 区分
2. writeback 先写 raw evidence，不伪造 canonical head
3. 保留将来切换到 server-owned canonicalization 的空间

### D4 — Governance Preflight Hook

为 execution 风险动作引入 governance evaluate 接点。

要求：

1. 至少定义清楚 preflight 发生在哪里
2. 可以先实现最小 hook / summary 注入
3. 不在本阶段扩成复杂审批系统

## Verification Ladder

### Baseline

1. `npm run typecheck`
2. `npm run build`
3. `node dist/sdk/orchestrator.js --help`

### When substrate seam changes

1. 基线全部通过
2. 如新增 small unit/integration tests，则跑对应 targeted tests
3. phase protocol 仍满足当前 `autopilot_report` contract

### When BB adapter lands

1. 基线全部通过
2. adapter failure path 可被明确观察（不 silent fail）
3. 若本机 BB stack 可用，增加一次最小 smoke read path proof

## Execution Outline

### P1.S1 — substrate-port-and-config-freeze

目标：

- 冻结 `pi-sdk` 内部 adapter seam 与配置入口
- 把 orchestrator 从具体 substrate 调用中解耦

预期结果：

1. ports/types/config path 明确
2. 主循环仍可本地运行
3. 后续 slices 不再需要边写 BB 适配边重构主循环边界

### P1.S2 — bb-adapter-mvp

目标：

- 用最小 BB adapter 连通 memory/govern/workspace substrate

预期结果：

1. `MemoryPort/GovernPort/WorkspacePort` 有 BB 实现
2. 至少能做最小 recall/store/evaluate/context read
3. failure surface 明确

### P1.S3 — phase-hydration-and-writeback

目标：

- phase 前后进入最小记忆闭环

预期结果：

1. pre-phase context 有 BB recall 输入
2. post-phase `autopilot_report` 与执行摘要进入 BB raw evidence
3. 不伪装成 canonical workset truth

### P1.S4 — governance-hook-and-closeout-docs

目标：

- 落 execution preflight hook 并更新 repo docs

预期结果：

1. governance hook 位置明确并已接通
2. README / architecture / integration docs 与代码一致
3. 为下一阶段 canonical head / replay-eval 计划提供 clean handoff

## Risks / Blockers

1. **adapter seam drift**
   - 若 ports 抽得太薄，后续 BB integration 仍会把 tool names 洒回主循环
2. **session-local fallback ambiguity**
   - 若 local fallback 与 BB-backed path 语义不同，后续 replay/eval 难以比较
3. **over-hydration risk**
   - 一上来召回过多记忆会污染 phase prompt 与 token budget
4. **fake canonicalization risk**
   - 在 BB canonical head 尚未设计/落地前，把 raw phase report 当 canonical truth 使用
5. **governance sprawl**
   - 若 preflight hook 过度扩张，会把本阶段拖成审批系统改造

## Exit Criteria

1. `pi-sdk` 已具备明确 substrate abstraction
2. BB adapter 能以最小方式接通 memory/govern/workspace substrate
3. phase 前后形成最小记忆闭环
4. execution hook 已具备 governance preflight 入口
5. 下一阶段可以在不重写当前边界的前提下继续实现 canonical head / replay-eval
