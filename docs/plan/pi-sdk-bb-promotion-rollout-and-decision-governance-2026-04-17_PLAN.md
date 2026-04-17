# PI SDK BB Promotion Rollout and Decision Governance 2026-04-17 Plan

## Goal

在已关闭的 `P10` benchmark history / operator inspection pack 之上，把 `pi-sdk × BB` 推进到路线图中的下一个阶段：

> **让 promote / hold / rollback lifecycle 与 decision governance 继续由 `BB` server-owned 持有，而 `pi-sdk` 只做 bounded operator projection / control surface。**

固定目标：

- 保持 `pi-sdk` 为 **Pi-first, session-native interactive workflow shell + shared headless driver**
- 保持 `BB` 为 benchmark / promotion / eval / learning / decision truth owner
- 不在 `pi-sdk` 内创建本地 decision ledger / rollout registry / promotion state store
- 保持 control plane **单根锚定** 于 `/home/peng/dt-git/github/pi-sdk/docs/plan`
- 继承 `P10` 结论：当前 automation shell 初步足够支撑 `P10–P13`；如果 `P11` 证明并非如此，必须显式 stop / handoff，而不是把新的 shell-enabler 工作偷渡进本 pack

## Scope

本计划聚焦 **P11 — promotion rollout and decision governance**：

1. 冻结 cross-repo lifecycle / owner boundary
   - 什么 baseline / candidate / promote / hold / rollback truth 必须由 `BB` server-owned 持有
   - 什么 operator projection / control seams 可在 `pi-sdk` repo-local surfaces 内继续推进
   - 什么情况必须 stop rather than local control-state compensation
2. 冻结 BB-owned decision truth contract方向
   - decision ledger / resources / tools / report family 的最小 vocabulary
   - promote / hold / rollback evidence 的 durable read/write path
   - manual reconcile / operator evidence gate 仍必须遵守 server-owned path
3. 建立 bounded operator projection / control direction
   - `pi-sdk` 只允许在 status / overlay / closeout / hydration / bounded command surfaces 内投影 governed decision truth
   - repo-local control surface 只能发起 server-owned decision intent / reconcile path，不能自己拥有 durable decision state
4. 建立 live governed promote-hold-rollback smoke方向
   - 如果现有 live BB surfaces 足够，则记录 smoke evidence
   - 若不足，记录 exact missing truth surface / environment step / contract gap
   - 不通过 local fallback truth path 假装 governance 已闭环
5. 形成可继续交给 `execute-plan` 的 slice ladder 与 closeout证据

### Execution boundary

- 这是一个 **cross-repo workstream**：
  - `/home/peng/dt-git/github/pi-sdk`
  - `/home/peng/dt-git/github/boston-bot-vp`
- 但 active control plane 仍只允许在：
  - `/home/peng/dt-git/github/pi-sdk/docs/plan`

## Design Basis

主要 SSOT：

- `/home/peng/dt-git/github/pi-sdk/docs/roadmap/pi-sdk-autopilot-endgame-roadmap-2026-04-17.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-bb-benchmark-history-and-operator-inspection-2026-04-17_STATUS.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-bb-benchmark-history-and-operator-inspection-2026-04-17_WORKSET.md`
- `/home/peng/dt-git/github/pi-sdk/docs/architecture.md`
- `/home/peng/dt-git/github/pi-sdk/docs/pi-sdk-bb-integration-architecture.md`
- `/home/peng/dt-git/github/boston-bot-vp/docs/runtime-contracts/system-contracts.md`
- `/home/peng/dt-git/github/boston-bot-vp/packages/memory-contracts/src/autopilotSubstrate.ts`
- `/home/peng/dt-git/github/boston-bot-vp/packages/memory-contracts/src/autopilotReports.ts`
- `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotCanaryReport.ts`
- `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotStrategyFeedbackReport.ts`

必须保持的设计规则：

1. **Pi-first, same-session interactive shell remains primary**
2. **BB remains benchmark / promotion / eval / learning / decision truth owner**
3. **repo-local work is projection / operator control UX, not decision ownership**
4. **no local promotion decision ledger / registry / durable route state in `pi-sdk`**
5. **no second active root pack in `boston-bot-vp/docs/plan`**
6. **if durable decision truth is missing server-side, stop and re-slice explicitly**

## Non-Goals

1. 不 reopen `P10` 的 benchmark-history / inspection pack
2. 不把 canary / strategy-feedback report surfaces 直接等同于完整 governed decision workflow，除非 contract freeze 证明其边界足够
3. 不在 `pi-sdk` 内创建 local promotion registry、rollback ledger、candidate head state 或人工补偿状态机
4. 不在本计划内直接进入 first-learned-component implementation（那是 `P12`）
5. 不 patch Pi core / `ModelRegistry` / extension runtime
6. 不把“大范围 automation shell 再设计”伪装成 promotion governance work
7. 不绕过 `BB` 的 durable truth path 直接让 repo-local UI 决定 promote / rollback 最终状态

## Deliverables

### D1 — Cross-Repo Lifecycle and Owner Boundary Freeze

1. 明确 baseline / candidate / rollout decision / rollback trigger 哪些必须是 BB-owned truth
2. 明确 `pi-sdk` 只允许做哪些 operator projection / control
3. 明确 stop boundary：什么时候必须停并交回 replan / human / ops

### D2 — BB-Owned Decision Ledger / Resource / Tool Contract Direction

1. 定义最小 promotion-governance vocabulary / evidence shape
2. 定义 promote / hold / rollback 的 durable decision truth path
3. 保持 decision truth server-owned, not locally mirrored

### D3 — Bounded Operator Projection / Control Surface Direction

1. 只允许 status / overlay / closeout / hydration / bounded command surface 成为 projection target
2. 若需要 control action，则必须经由 server-owned decision / reconcile path，而不是本地直写 truth
3. 所有 repo-local implementation 都必须可被 targeted TDD 证明

### D4 — Live Governed Promote-Hold-Rollback Smoke or Stop Handoff

1. 若 live BB surface 已足够，记录 smoke evidence
2. 若不足，记录 exact missing truth surface / environment step / contract gap
3. 不通过 local fallback truth path 假装 governance ready

### D5 — Closeout / `P12` Handoff

1. `PLAN / STATUS / WORKSET` 与结果一致
2. pack closeout honest, or stop-handoff honest
3. 下一阶段 first-learned-component pack 已被清楚命名

## Verification Ladder

### Planning / control-plane validation

1. 新 pack 存在：`_PLAN.md / _STATUS.md / _WORKSET.md`
2. `docs/plan/README.md` 指向该 active pack
3. active slice singular、stop boundary explicit、validation shape explicit
4. 明确说明：这是 roadmap 中 `P11` 的 materialized active pack
5. 明确说明：`P10` 已 closed，当前 automation shell 仍是初始执行底盘

### When `P11.S1` lands

1. cross-repo lifecycle / owner boundary 被明确写死
2. `pi-sdk` vs `BB` 的 decision ownership 被明确写死
3. 下一 slice 的 surfaces 与验证方式已命名
4. 明确 stop boundary：local decision state / local ledger / Pi-core patch / BB durable ledger gap => stop

### When `P11.S2` lands

1. decision-ledger / resource / tool contract freeze exists
2. promote / hold / rollback durable path remains BB-owned
3. operator projection/control target surfaces are bounded and named

### When `P11.S3` lands

1. repo-local projection/control stays inside existing seams
2. targeted TDD covers new operator projection/control behavior
3. `npm test`
4. `npm run typecheck`
5. `npm run build`
6. `node dist/sdk/orchestrator.js --help`

### When `P11.S4` lands

1. live BB promote-hold-rollback smoke evidence exists, or
2. explicit stop-handoff evidence exists naming the exact missing upstream/env dependency
3. no local truth path / fake decision ledger was invented

### When `P11.S5` lands

1. closeout docs are synchronized
2. residuals are explicitly named
3. `P12` handoff is clear and bounded

## Execution Outline

### `P11.S1` — promotion-rollout-lifecycle-and-owner-boundary-freeze

目标：

- 冻结 cross-repo lifecycle / owner boundary
- 冻结 governed promotion decision truth 的最小边界
- 保证 `execute-plan` 下一步无需猜 scope、repo boundary、或是否该先补 automation shell / local state machine

### `P11.S2` — bb-owned-decision-ledger-resource-and-tool-contract-freeze

目标：

- 提炼最小 promotion-governance contract vocabulary / durable path
- 明确 BB-owned decision ledger / resource / tool boundary
- 若 contract 需要本地 durable decision state，则 stop

### `P11.S3` — bounded-operator-projection-and-control-surface-mvp

目标：

- 在 `pi-sdk` 既有 seams 内增加 governed decision projection / bounded control surface
- 保持 projection/control-only ownership
- 用 targeted TDD 验证 operator surfaces

### `P11.S4` — live-promote-hold-rollback-smoke-or-stop-handoff

目标：

- 验证当前 projection / control path 依赖的 live BB decision surface
- 若 live surface 不足，写 handoff 而不是本地造 truth
- 若 smoke 成功，留下最小证据

### `P11.S5` — closeout-and-p12-first-learned-component-handoff

目标：

- 完成 control-plane closeout
- 汇总验证与 residual
- 把下一阶段收敛到 `P12` first learned component pack

## Likely Files / Surfaces

### Control plane

1. `docs/plan/pi-sdk-bb-promotion-rollout-and-decision-governance-2026-04-17_PLAN.md`
2. `docs/plan/pi-sdk-bb-promotion-rollout-and-decision-governance-2026-04-17_STATUS.md`
3. `docs/plan/pi-sdk-bb-promotion-rollout-and-decision-governance-2026-04-17_WORKSET.md`
4. `docs/plan/README.md`

### Likely repo-local doc/code surfaces in later slices

5. `README.md`
6. `docs/architecture.md`
7. `docs/pi-sdk-bb-integration-architecture.md`
8. `src/autopilot/operator.ts`
9. `src/autopilot/closeout.ts`
10. `src/extension/index.ts`
11. `src/substrate/hydration.ts`
12. `src/substrate/types.ts`
13. `src/substrate/bb.ts`
14. `src/sdk/orchestrator.ts`

### Likely BB-side contract / implementation anchors in later slices

15. `/home/peng/dt-git/github/boston-bot-vp/packages/memory-contracts/src/autopilotSubstrate.ts`
16. `/home/peng/dt-git/github/boston-bot-vp/packages/memory-contracts/src/autopilotReports.ts`
17. `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotCanaryReport.ts`
18. `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotCanaryReportTools.ts`
19. `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotCanaryReportResources.ts`
20. `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotStrategyFeedbackReport.ts`
21. `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotStrategyFeedbackReportTools.ts`
22. `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotStrategyFeedbackReportResources.ts`
23. related BB decision/resource surfaces if later slices prove they must exist

### Likely test surfaces in later slices

24. `test/operator.test.ts`
25. `test/closeout.test.ts`
26. `test/extension.test.ts`
27. `test/hydration.test.ts`
28. `test/bb-substrate.test.ts`
29. new targeted tests for promotion governance projection/control behavior

## Risks / Blockers

1. **workspace already dirty**
   - claims must remain tightly scoped and evidence-based
2. **current canary / strategy surfaces may still be advisory-only**
   - current live surface may be enough for visibility, not yet enough for governed rollout lifecycle
3. **projection/control -> local ownership creep**
   - operator convenience may tempt local decision caches or repo-owned rollback state
4. **cross-repo control-plane confusion**
   - `boston-bot-vp` code may need changes, but active root pack must remain only in `pi-sdk/docs/plan`
5. **automation-shell scope creep**
   - minor execution friction may tempt a broad shell-hardening detour; this pack must stop instead of widening silently

## Exit Criteria

1. `P11` owner boundary is explicit and stable
2. BB-owned promotion-governance contract direction is frozen without local truth invention
3. any repo-local operator projection/control stays thin-shell and is backed by tests
4. live BB dependency is either proven for the consumed decision surface or cleanly handed off
5. closeout docs are synchronized and honest
6. next-stage `P12` handoff is explicit and bounded
