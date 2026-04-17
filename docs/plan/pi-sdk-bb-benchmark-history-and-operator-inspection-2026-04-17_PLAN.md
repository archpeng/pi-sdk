# PI SDK BB Benchmark History and Operator Inspection 2026-04-17 Plan

## Goal

在已关闭的 `P9` benchmark projection / promotion-readiness pack 之上，把 `pi-sdk × BB` 推进到终局路线图中的下一个阶段：

> **让 benchmark / canary / strategy / replay 的历史与 inspection truth 继续由 `BB` server-owned 持有，而 `pi-sdk` 只做 bounded operator projection。**

固定目标：

- 保持 `pi-sdk` 为 **Pi-first, session-native interactive workflow shell + shared headless driver**
- 保持 `BB` 为 benchmark / promotion / eval / learning truth owner
- 不在 `pi-sdk` 内创建本地 benchmark history store / registry / ledger
- 保持 control plane **单根锚定** 于 `/home/peng/dt-git/github/pi-sdk/docs/plan`
- 明确确认：当前 automation shell 已足够支持 `P10–P13` 的初步执行；如果后续证据表明并非如此，应显式 stop / re-slice，而不是把新的 shell-enabler 工作偷渡进本 pack

## Scope

本计划聚焦 **P10 — benchmark history and operator inspection**：

1. 冻结 cross-repo owner boundary
   - 什么历史 truth 必须由 `BB` server-owned 持有
   - 什么 operator inspection / projection 可在 `pi-sdk` repo-local seams 内继续推进
   - 什么情况必须 stop rather than local compensation
2. 确认当前 automation shell readiness
   - 判断当前 Pi-first shell + BB substrate + projection surfaces 是否已足以作为后续 `P10–P13` 的执行底盘
   - 若缺口只是小的边界澄清，可在本 pack 的 boundary freeze 中消化
   - 若需要单独 automation-enabler pack，必须明确 stop-handoff，不得混入 history / inspection implementation
3. 建立 BB-owned benchmark history contract方向
   - objective / wave / candidate / report history 的 vocabulary 与 inspection最小面
   - historical comparison 仍必须以 `BB` truth 为主
4. 建立 bounded operator inspection projection方向
   - `pi-sdk` 只允许在 status / overlay / closeout / hydration 等现有 seams 中投影历史 / inspection truth
   - 不新增本地 decision ledger 或 benchmark history cache 当作真相
5. 形成可继续交给 `execute-plan` 的 slice ladder与 closeout证据

### Execution boundary

- 这是一个 **cross-repo workstream**：
  - `/home/peng/dt-git/github/pi-sdk`
  - `/home/peng/dt-git/github/boston-bot-vp`
- 但 active control plane 仍只允许在：
  - `/home/peng/dt-git/github/pi-sdk/docs/plan`

## Design Basis

主要 SSOT：

- `/home/peng/dt-git/github/pi-sdk/docs/roadmap/pi-sdk-autopilot-endgame-roadmap-2026-04-17.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-pi-native-autopilot-benchmark-projection-and-promotion-readiness-2026-04-17_STATUS.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-pi-native-autopilot-benchmark-projection-and-promotion-readiness-2026-04-17_WORKSET.md`
- `/home/peng/dt-git/github/pi-sdk/docs/architecture.md`
- `/home/peng/dt-git/github/pi-sdk/docs/pi-sdk-bb-integration-architecture.md`
- `/home/peng/dt-git/github/boston-bot-vp/packages/memory-contracts/src/autopilotSubstrate.ts`
- `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotStatusReport.ts`

必须保持的设计规则：

1. **Pi-first, same-session interactive shell remains primary**
2. **BB remains benchmark / promotion / eval / learning truth owner**
3. **repo-local work is projection / operator truth, not history ownership**
4. **no local benchmark history registry / ledger in `pi-sdk`**
5. **no second active root pack in `boston-bot-vp/docs/plan`**
6. **if automation-shell insufficiency becomes real blocking truth, stop and re-slice explicitly**

## Non-Goals

1. 不 reopen `P9` 的 aggregate readiness projection pack
2. 不把 dormant `P6` benchmark pack 重新当作 active queue
3. 不在 `pi-sdk` 内创建 historical benchmark / canary / replay local store
4. 不在本计划内直接进入 promotion governance（那是 `P11`）
5. 不在本计划内直接进入 learned-component implementation（那是 `P12`）
6. 不 patch Pi core / `ModelRegistry` / extension runtime
7. 不把“大范围 automation shell 再设计”伪装成 benchmark-history work

## Deliverables

### D1 — Cross-Repo Owner Boundary Freeze

1. 明确 objective / wave / candidate / report history 哪些必须是 BB-owned truth
2. 明确 `pi-sdk` 只允许做哪些 operator inspection / projection
3. 明确 stop boundary：什么时候必须停并交回 replan / human / ops

### D2 — Automation Executor Readiness Decision

1. 明确记录当前 automation shell 是否已足够支撑 `P10–P13`
2. 若答案是 yes，记录为什么不需要单独 automation-enabler pack
3. 若答案是 no，留下 handoff-ready residual，而不是混入本 pack

### D3 — BB-Owned Benchmark History Contract Direction

1. 定义最小 historical inspection vocabulary / evidence shape
2. 定义 objective / wave / candidate / report history 的 read-path边界
3. 保持 history truth server-owned, not locally mirrored

### D4 — Bounded Operator Inspection Projection Direction

1. 只允许 status / overlay / closeout / hydration 等现有 seams 成为 projection target
2. 不让 projection 演变成 local benchmark history ownership
3. 所有 repo-local implementation 都必须可被 targeted TDD 证明

### D5 — Live History Surface Smoke or Stop Handoff

1. 若 live BB surface 已足够，记录 smoke evidence
2. 若不足，记录 exact missing truth surface / environment step
3. 不通过 local fallback truth path 假装 ready

### D6 — Closeout / `P11` Handoff

1. `PLAN / STATUS / WORKSET` 与结果一致
2. pack closeout honest, or stop-handoff honest
3. 下一阶段 promotion governance pack 已被清楚命名

## Verification Ladder

### Planning / control-plane validation

1. 新 pack 存在：`_PLAN.md / _STATUS.md / _WORKSET.md`
2. `docs/plan/README.md` 指向该 active pack
3. active slice singular、stop boundary explicit、validation shape explicit
4. 明确说明：这是 roadmap 中 `P10` 的 materialized active pack
5. 明确说明：当前 automation shell 是否足够初步可用来实现 `P10–P13`

### When `P10.S1` lands

1. cross-repo owner boundary 被明确写死
2. `pi-sdk` vs `BB` 的 history ownership 被明确写死
3. automation-shell readiness decision 被明确写死
4. 下一 slice 的 surfaces 与验证方式已命名
5. 明确 stop boundary：new truth path in local repo / local registry / Pi-core patch / larger shell-enabler required => stop

### When `P10.S2` lands

1. benchmark-history vocabulary / contract freeze exists
2. history read path remains BB-owned
3. operator inspection target surfaces are bounded and named

### When `P10.S3` lands

1. repo-local projection stays inside existing seams
2. targeted TDD covers new operator inspection projection behavior
3. `npm test`
4. `npm run typecheck`
5. `npm run build`
6. `node dist/sdk/orchestrator.js --help`

### When `P10.S4` lands

1. live BB history/inspection smoke evidence exists, or
2. explicit stop-handoff evidence exists naming the exact missing upstream/env dependency
3. no local truth path / fake history ledger was invented

### When `P10.S5` lands

1. closeout docs are synchronized
2. residuals are explicitly named
3. `P11` handoff is clear and bounded

## Execution Outline

### `P10.S1` — benchmark-history-and-inspection owner-boundary freeze

目标：

- 冻结 cross-repo owner boundary
- 冻结 automation executor readiness decision
- 保证 `execute-plan` 下一步无需猜 scope、repo boundary、或是否该先补 automation shell

### `P10.S2` — bb-owned-benchmark-history-contract-and-vocabulary-freeze

目标：

- 提炼最小 historical inspection vocabulary / contract
- 明确 BB-owned history truth path 与 operator inspection read-path
- 若 contract 需要本地 history store，则 stop

### `P10.S3` — bounded-operator-history-inspection-projection-mvp

目标：

- 在 `pi-sdk` 既有 seams 内增加历史 inspection projection
- 保持 projection-only ownership
- 用 targeted TDD 验证 operator surfaces

### `P10.S4` — live-benchmark-history-smoke-or-stop-handoff

目标：

- 验证当前 projection path 依赖的 live BB history/inspection surface
- 若 live surface 不足，写 handoff 而不是本地造 truth
- 若 smoke 成功，留下最小证据

### `P10.S5` — closeout-and-p11-promotion-governance-handoff

目标：

- 完成 control-plane closeout
- 汇总验证与 residual
- 把下一阶段收敛到 `P11` promotion governance pack

## Likely Files / Surfaces

### Control plane

1. `docs/plan/pi-sdk-bb-benchmark-history-and-operator-inspection-2026-04-17_PLAN.md`
2. `docs/plan/pi-sdk-bb-benchmark-history-and-operator-inspection-2026-04-17_STATUS.md`
3. `docs/plan/pi-sdk-bb-benchmark-history-and-operator-inspection-2026-04-17_WORKSET.md`
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

### Likely BB-side read/implementation anchors in later slices

15. `/home/peng/dt-git/github/boston-bot-vp/packages/memory-contracts/src/autopilotSubstrate.ts`
16. `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotStatusReport.ts`
17. related BB resources/tools for report history or inspection surfaces if later slices prove they must exist

### Likely test surfaces in later slices

18. `test/operator.test.ts`
19. `test/closeout.test.ts`
20. `test/extension.test.ts`
21. `test/hydration.test.ts`
22. `test/bb-substrate.test.ts`
23. new targeted tests for history/inspection projection behavior

## Risks / Blockers

1. **workspace already dirty**
   - claims must remain tightly scoped and evidence-based
2. **history truth may still be too aggregate**
   - current live surface is enough for readiness snapshot, not necessarily for historical inspection
3. **projection -> local ownership creep**
   - operator convenience may tempt local history caches or comparison ledgers
4. **cross-repo control-plane confusion**
   - `boston-bot-vp` code may need changes, but active root pack must remain only in `pi-sdk/docs/plan`
5. **automation-shell scope creep**
   - minor execution friction may tempt a broad “one more shell-hardening pack”; this pack must stop instead of widening silently

## Exit Criteria

1. `P10` owner boundary is explicit and stable
2. automation-shell readiness decision is explicit and honest
3. benchmark-history contract direction is frozen without local truth invention
4. any repo-local operator inspection projection stays thin-shell and is backed by tests
5. live BB dependency is either proven for the consumed surface or cleanly handed off
6. closeout docs are synchronized and honest
