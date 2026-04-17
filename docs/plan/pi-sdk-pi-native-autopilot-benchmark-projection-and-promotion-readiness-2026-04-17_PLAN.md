# PI SDK Pi-Native Autopilot Benchmark Projection and Promotion Readiness 2026-04-17 Plan

## Goal

在已关闭的 `P8` runtime hardening / BB alignment pack 之上，把 `pi-sdk` 推进到一个 **Pi-first、thin-shell、BB-truth-owned** 的下一阶段：

> **只在 repo-local seams 内消费/投影 benchmark 与 promotion-readiness truth，而不把 benchmark / promotion / learning truth 拉回本地。**

固定目标：

- 保持 `pi-sdk` 为 **Pi-native interactive workflow shell + shared headless driver**
- 保持 `BB` 为 benchmark / promotion / eval / learning 的 truth substrate
- 把此前 dormant 的 `P6` benchmark workstream 作为**前置边界上下文**，但不直接恢复为当前 active pack
- 先证明 post-P8 条件下哪些 benchmark / promotion-readiness surfaces 仍可在本 repo 继续推进，再决定是否存在更深实现空间

## Scope

本计划聚焦 **P9 — benchmark projection and promotion readiness after P8**：

1. **post-P8 owner boundary freeze**
   - 冻结哪些 benchmark / promotion-readiness 工作仍属于 `pi-sdk` repo-local seams
   - 冻结哪些工作继续属于 BB server-owned truth / environment / ops
   - 明确 learned-components experimentation 在本 pack 内为什么继续 deferred
2. **supersede the dormant P6 benchmark pack explicitly**
   - 继承其仍然有效的 boundary truth
   - 不让 pre-P7 / pre-P8 的旧 workset 继续充当当前 active execution pack
3. **doc + contract sync for benchmark/promotion wording drift**
   - 让 `README.md`、`docs/architecture.md`、`docs/pi-sdk-bb-integration-architecture.md` 与 post-P8 reality 对齐
4. **bounded repo-local benchmark/promotion-readiness projection**
   - 只允许消费 BB-owned status / canary / strategy-feedback truth
   - 允许在 status / overlay / closeout / hydration 等现有 seams 内增加 operator-facing projection
   - 不新增本地 registry / benchmark ledger / eval runtime
5. **live BB-backed smoke or explicit stop handoff**
   - 如果 repo-local projection需要的 live BB surfaces 可达，则记录 smoke evidence
   - 若继续推进需要 BB repo changes、new server-owned truth path、或 env/ops work，则显式 stop-handoff

本计划保持 **单 repo workstream**，控制面仍只锚定：

- `/home/peng/dt-git/github/pi-sdk/docs/plan`

## Design Basis

主要 SSOT：

- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-pi-native-interactive-autopilot-runtime-hardening-and-bb-alignment-2026-04-16_STATUS.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-pi-native-interactive-autopilot-runtime-hardening-and-bb-alignment-2026-04-16_WORKSET.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16_PLAN.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16_STATUS.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16_WORKSET.md`
- `/home/peng/dt-git/github/pi-sdk/docs/architecture.md` (§11.1)
- `/home/peng/dt-git/github/pi-sdk/docs/pi-sdk-bb-integration-architecture.md` (§12.5)
- `/home/peng/dt-git/github/pi-sdk/README.md`

必须保持的设计规则：

1. **official Pi docs/examples first**
2. **same-session Pi-native interactive execution remains primary**
3. **BB remains benchmark / promotion / eval / learning truth owner**
4. **repo-local work is consumption / projection / operator truth, not truth invention**
5. **learned components stay deferred until benchmark-consumption seams are proven without widening scope**

## Non-Goals

1. 不 reopen `P8` 的 runtime hardening pack
2. 不把 dormant `P6` 直接当成今天的 active pack 继续执行
3. 不在 `pi-sdk` 内创建 benchmark / promotion / replay / eval 的本地 registry
4. 不在本计划内推进 learned model training、fine-tuning、或 end-to-end heuristic tree
5. 不在没有明确 BB truth path 的情况下本地伪造 benchmark / promotion state
6. 不把 BB repo implementation、service restart/redeploy、或 broader ops 恢复伪装成 `pi-sdk` repo-local 完成
7. 不引入 Pi core / `ModelRegistry` / extension runtime patch

## Deliverables

### D1 — Post-P8 Benchmark Boundary Freeze

1. 明确 post-P8 之后哪些 benchmark / promotion-readiness surfaces 仍是 repo-local 可做
2. 明确哪些内容仍然必须停在 BB / environment / ops 边界
3. 明确 learned-components work 为什么继续 deferred，而不是混入本 pack

### D2 — Dormant P6 Supersession Freeze

1. 明确 `P6` 只作为 read-only predecessor context
2. 明确本 successor pack 如何继承 `P6` 的 boundary truth，但不继承其 pre-P7/pre-P8 active queue
3. 避免出现两个“看似都该继续”的 benchmark workstream

### D3 — Benchmark / Promotion Doc Sync

1. `README.md`、`docs/architecture.md`、`docs/pi-sdk-bb-integration-architecture.md` 与 post-P8 reality 不再漂移
2. 文档明确：`pi-sdk` 消费/投影 benchmark / promotion-readiness truth，而不是拥有它
3. 若文档对齐需要新 truth path / local registry，则停止而不是强补

### D4 — Bounded Repo-Local Projection MVP

1. 只在现有 repo-owned seams 内暴露 benchmark / promotion-readiness projection
2. 允许目标 surface 限于：status、overlay、closeout、hydration、operator summary
3. 任何实现都必须可被 targeted TDD 验证

### D5 — Live BB Smoke or Stop Handoff

1. 若当前 live BB surfaces 足够支持 projection，记录 smoke evidence
2. 若不足，记录 exact missing surface / missing environment step
3. 不通过 local fallback truth path 来“假装 ready”

### D6 — Closeout / Successor Handoff

1. `PLAN / STATUS / WORKSET` 与最终结果一致
2. pack closeout honest, or stop-handoff honest
3. 下一阶段若存在，已被清楚命名

## Verification Ladder

### Planning / control-plane validation

1. 新 pack 存在：`_PLAN.md / _STATUS.md / _WORKSET.md`
2. `docs/plan/README.md` 指向该 active pack
3. active slice singular、stop boundary explicit、validation shape explicit
4. 新 pack 明确说明如何 supersede dormant `P6`

### When `P9.S1` lands

1. post-P8 benchmark / promotion-readiness owner boundary 被明确写死
2. dormant `P6` 与新 pack 的关系被明确说明
3. 下一 slice 的 doc/code surfaces 与验证方式已命名
4. 明确 stop boundary：new truth path / local registry / BB repo changes / Pi-core patch => stop

### When `P9.S2` lands

1. `README.md`、`docs/architecture.md`、`docs/pi-sdk-bb-integration-architecture.md` 的 wording drift 被修正或明确证明不存在
2. `docs/plan/README.md` 与 successor routing 一致
3. docs 仍维持 thin-shell / BB-truth-owned boundary

### When `P9.S3` lands

1. projection surface stays inside existing repo-owned seams
2. targeted TDD covers any new projection behavior
3. `npm test`
4. `npm run typecheck`
5. `npm run build`
6. `node dist/sdk/orchestrator.js --help`

### When `P9.S4` lands

1. live BB-backed smoke evidence exists for the surfaces actually consumed by the projection path, or
2. explicit stop-handoff evidence exists naming the exact missing upstream/env dependency
3. no local truth path / registry / fake benchmark ledger was invented

### When `P9.S5` lands

1. closeout docs are synchronized
2. residuals are explicitly named
3. next successor target, if any, is clear and bounded

## Execution Outline

### `P9.S1` — post-p8-benchmark-projection-and-promotion-readiness-boundary-freeze

目标：

- 以 P8 closeout 为起点，冻结 benchmark / promotion-readiness 的下一刀 owner boundary
- 明确 supersede dormant `P6` 的方式
- 保证 `execute-plan` 下一步无需猜“是继续 P6 还是开新线”

### `P9.S2` — benchmark-doc-sync-and-p6-supersession-proof

目标：

- 同步 post-P8 reality 到 repo docs
- 把 benchmark / promotion wording drift 收口
- 明确 `P6` 只作为 predecessor context，不再作为当前 active pack

### `P9.S3` — bounded-bb-benchmark-projection-mvp

目标：

- 在 status / overlay / closeout / hydration 等既有 seams 中增加 bounded projection
- 只消费 BB-owned autopilot / canary / strategy-feedback truth
- 用 targeted TDD 验证 projection honesty

### `P9.S4` — live-bb-promotion-readiness-smoke-or-stop-handoff

目标：

- 验证当前 projection path 所依赖的 live BB surfaces 真可达
- 若 live surface 不足，写 handoff 而不是本地造 truth
- 若 smoke 成功，留下最小证据

### `P9.S5` — closeout-and-next-phase-handoff

目标：

- 完成 control-plane closeout
- 汇总验证与 residual
- 明确 learned-components / deeper promotion work 是否值得成为下一 successor pack

## Likely Files / Surfaces

### Control plane

1. `docs/plan/pi-sdk-pi-native-autopilot-benchmark-projection-and-promotion-readiness-2026-04-17_PLAN.md`
2. `docs/plan/pi-sdk-pi-native-autopilot-benchmark-projection-and-promotion-readiness-2026-04-17_STATUS.md`
3. `docs/plan/pi-sdk-pi-native-autopilot-benchmark-projection-and-promotion-readiness-2026-04-17_WORKSET.md`
4. `docs/plan/README.md`

### Likely doc surfaces

5. `README.md`
6. `docs/architecture.md`
7. `docs/pi-sdk-bb-integration-architecture.md`

### Likely repo-local code surfaces for later slices

8. `src/autopilot/operator.ts`
9. `src/autopilot/closeout.ts`
10. `src/extension/index.ts`
11. `src/substrate/hydration.ts`
12. `src/substrate/types.ts`
13. `src/substrate/bb.ts`
14. `src/sdk/orchestrator.ts`

### Likely test surfaces for later slices

15. `test/operator.test.ts`
16. `test/closeout.test.ts`
17. `test/extension.test.ts`
18. `test/hydration.test.ts`
19. `test/bb-substrate.test.ts`

### Read-only predecessor / context anchors

20. dormant `P6` plan/status/workset docs
21. closed `P7` / `P8` status/workset docs
22. live local BB endpoint only as a bounded runtime probe target

## Risks / Blockers

1. **workspace already dirty**
   - claims must remain tightly scoped and evidence-based
2. **dormant P6 ambiguity**
   - without explicit supersession wording, future sessions may misroute execution
3. **projection -> truth-invention creep**
   - operator convenience may tempt local benchmark ledgers or fake readiness state
4. **live BB drift**
   - currently reachable tools may drift again over time; reachability must be reproven when needed
5. **learned-components overreach**
   - benchmark/promotion work may prematurely expand into model/heuristic experimentation before thin-shell consumption is stabilized

## Exit Criteria

1. P9 owner boundary is explicit and stable
2. dormant `P6` is explicitly superseded as active execution control plane
3. post-P8 benchmark/promotion wording drift is resolved or honestly stopped
4. any repo-local projection stays thin-shell and is backed by tests
5. live BB dependency is either proven for the consumed surface or cleanly handed off
6. closeout docs are synchronized and honest
