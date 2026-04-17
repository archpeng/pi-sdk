# PI SDK BB Autopilot Benchmark Promotion and Learned Components 2026-04-16 Plan

## Goal

把 `pi-sdk` 从已完成的 BB substrate foundation 推进到 **可执行的 benchmark / promotion / learned-surface boundary freeze**，为后续 replay/eval/canary 与 narrow learned components 落地建立明确边界，同时保持：

- `pi-sdk` 继续做 thin orchestration shell
- benchmark / promotion / learning truth 仍以 `BB` substrate 为主
- 不在边界未冻结前盲目扩写本地 registry、truth path 或 Pi core 依赖

## Scope

本计划聚焦 **P6 — benchmark promotion and learned components boundary freeze**：

1. 盘点当前 repo 已存在的 benchmark / replay / canary / learned-component truth
2. 冻结 benchmark objective family、promotion/rollback decision shape、learned-surface ownership
3. 把 stop boundary 写清楚：一旦需要新 truth path、本地 registry、或 Pi-core patch，立即停止并交回 replan/human
4. 产出可直接交给 `execute-plan` 的 `PLAN / STATUS / WORKSET` 控制面

## Non-Goals

1. 不在本阶段实现 canonical run/workset head 服务端真相路径
2. 不在本阶段落地本地 benchmark registry 或数据集持久层
3. 不在本阶段修改 Pi core、ModelRegistry、extension runtime 或 TUI 基础设施
4. 不在本阶段实现完整 replay/eval/canary runtime
5. 不在本阶段做 end-to-end coding model fine-tuning

## Deliverables

### D1 — Current Truth Audit

明确当前 repo 已有哪些证据可支撑 benchmark / promotion / learned surfaces：

- `docs/pi-sdk-bb-integration-architecture.md` 中的 replay/eval/canary 与 learned-components 设计意图
- `docs/architecture.md` 对当前 thin orchestration shell 边界的约束
- `src/sdk/orchestrator.ts`、`src/substrate/*` 暴露的现有 substrate seams
- `docs/plan/` 当前 active-pack reality

### D2 — Benchmark and Promotion Boundary Freeze

把以下边界冻结到文档与控制面：

1. benchmark 要评估的 objective family 与 success KPI
2. promotion / rollback 使用的最小 evidence shape
3. 什么属于 canary/shadow 比较，什么仍是 out-of-scope
4. 什么条件会把当前 slice 升级成需要新 truth path / registry / core patch 的阻塞项

### D3 — Learned Surface Freeze

明确仅允许进入下一阶段实现的 learned surfaces：

1. retrieval reranker
2. next-step route classifier
3. repair strategy ranker
4. review verdict classifier
5. artifact summarizer

并明确这些 learned surfaces **不等于**：

- 本地 workflow rule 爆炸
- orchestrator 内硬编码策略树
- 端到端模型微调

### D4 — Control-Plane Handoff

让 `execute-plan` 不需要再猜：

1. 当前 active slice 是什么
2. 应先读哪些文档与代码 anchors
3. 应更新哪些文件
4. 何时完成，何时停止

## Verification Ladder

### Planning-level validation

1. `docs/plan/*` 新 pack 存在且 `README.md` 指向该 active pack
2. `PLAN / STATUS / WORKSET` 对 active slice id、目标、验证、stop boundary 的描述一致
3. 当前 active slice 明确列出 likely files/surfaces，不要求执行期临场决定范围

### Slice execution validation (for the next prompt)

1. `docs/pi-sdk-bb-integration-architecture.md` 明确 benchmark inputs、promotion gate、learned-surface boundary
2. `docs/architecture.md` 与 boundary freeze 不冲突
3. 如执行期出现代码改动需求，仅允许 touching existing `pi-sdk` surfaces；若需要新 truth path / registry / Pi-core patch，则停止
4. 若执行期确实触发代码改动，再补跑最小相关验证（优先 targeted checks，必要时 `npm run typecheck` / `npm run build`）

## Execution Outline

### `P6.S1` — benchmark-promotion-and-learned-surface-boundary-freeze

目标：

- 冻结 benchmark / promotion / learned-surface 的最小可信边界
- 让下一刀可以先做 docs+control-plane 对齐，再决定是否值得实现 runtime scaffolding

线性步骤：

1. 审计当前 truth：`workspace_scan`、`plan_sync`、现有 plan pack、architecture docs、substrate/orchestrator seams
2. 从 architecture 与现有代码中抽出 benchmark objective family、KPI、promotion/rollback evidence shape
3. 冻结 learned-surface ownership，只保留 narrow learned components，拒绝扩成本地 heuristics / registry / core patch
4. 将结论写回 `docs/plan/*`，并列出 likely implementation surfaces 与 stop boundary

预期验证：

1. 新 active pack 明确声明 `P6.S1`
2. wave exit criteria 在 `PLAN / STATUS / WORKSET` 中一致
3. 下一次 `execute-plan` 可直接执行，不需要再做 planning fan-out

### `P6.S2` — benchmark-doc-sync-or-stop-handoff

目标：

- 基于 `P6.S1` 冻结结果，做最小 architecture/doc sync
- 只修正文档漂移与 cross-reference，不扩大到新的 truth path / registry / runtime 设计
- 若触发 stop boundary，则产出 residual / handoff 而不是硬做实现

线性步骤：

1. 重新核对 `README.md`、`docs/architecture.md`、`docs/pi-sdk-bb-integration-architecture.md`、`docs/plan/README.md`
2. 仅提取与 `P6.S1` 冻结边界冲突或缺失 cross-reference 的文档点
3. 落最小 doc-only sync；若发现必须引入新 truth path / 本地 registry / Pi-core patch 才能“对齐”，立即停止并写 residual
4. 将 execution 结果写回 `STATUS / WORKSET`，明确是成功 sync 还是 stop-handoff

预期验证：

1. 相关 docs 对 benchmark / promotion / learned-surface boundary 的表述不再互相漂移
2. 任何后续实现主张仍被限制在现有 repo-owned seams 内
3. 若没有需要改的 doc，也要留下已核对且无需修改的证据

### `P6.S3` — scoped implementation spike only if boundary stays local

目标：

- 仅在不引入新 truth path、本地 registry、或 Pi-core patch 的前提下，考虑最小 local scaffolding

## Likely Files / Surfaces

### Control plane (planning + execution)

1. `docs/plan/pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16_PLAN.md`
2. `docs/plan/pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16_STATUS.md`
3. `docs/plan/pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16_WORKSET.md`
4. `docs/plan/README.md`

### Docs likely to change during execution

1. `docs/pi-sdk-bb-integration-architecture.md`
2. `docs/architecture.md`
3. `README.md` (if public-facing wording must reflect the frozen boundary)
4. `docs/plan/README.md` (if active slice / handoff wording needs sync)

### Code surfaces to inspect before any implementation claim

1. `src/sdk/orchestrator.ts`
2. `src/substrate/types.ts`
3. `src/substrate/hydration.ts`
4. `src/extension/index.ts`

## Risks / Blockers

1. **missing local active pack reality**
   - bb-memory indicates a newer pack was intended, but local `docs/plan/` only contains the completed substrate V1 pack
2. **boundary creep**
   - benchmark/promotion work can easily expand into canonical head, registry design, or runtime eval plumbing
3. **false-local optimization**
   - trying to solve BB-owned learning/promotion truth inside `pi-sdk` docs or code would violate the thin-shell direction
4. **Pi-core temptation**
   - if the slice is framed poorly, it may drift into core patching or local model registry work that this repo should not own yet

## Exit Criteria

当前 wave 进入 `P6.S2` 前，必须满足下面的 replanned exit shape：

1. `P6.S1` 已 review 通过并关闭，不再作为 active slice 反复执行
2. active slice 固定为 `P6.S2`
3. `P6.S2` 的文档表面、线性步骤、验证方式、stop boundary 已命名且无需临场补规划
4. stop boundary 继续明确写出：需要新 truth path、本地 registry、或 Pi-core patch 时立即停止
5. `execute-plan` 可以直接接手 `P6.S2`，并在完成后把下一步明确收敛到 `P6.S3` 或 residual handoff
