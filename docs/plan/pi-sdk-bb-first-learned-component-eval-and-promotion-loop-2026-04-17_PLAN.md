# PI SDK BB First Learned Component Eval and Promotion Loop 2026-04-17 Plan

## Goal

在已关闭的 `P11` promotion-governance pack 之上，进入路线图中的下一阶段：

> **从 narrow learned surfaces 中只选择一个 first learned component，建立 BB-owned eval / promotion truth 下的 bounded candidate loop。**

固定目标：

- 保持 `pi-sdk` 为 **Pi-first, session-native interactive workflow shell + shared headless driver**
- 保持 `BB` 为 eval / promotion / rollback / learning truth owner
- 不在 `pi-sdk` 内创建本地 eval ledger、candidate registry、promotion store、或 learned-component truth cache
- 保持 control plane **单根锚定** 于 `/home/peng/dt-git/github/pi-sdk/docs/plan`
- 严格限制 first learned component 为 **exactly one** bounded surface

## Scope

本计划聚焦 **P12 — first learned component eval and promotion loop**：

1. 选择 exactly one first learned component，并冻结 benchmark / baseline / candidate 比较边界
2. 冻结该 component 的 eval input/output contract 与 replay / evidence path
3. 在 BB-owned eval truth 下建立 bounded candidate integration direction
4. 验证 promote / hold / rollback loop 是否能在单一 component 上诚实闭环
5. 形成可继续执行的 slice ladder 与 closeout/handoff 证据

## Design Basis

主要 SSOT：

- `/home/peng/dt-git/github/pi-sdk/docs/roadmap/pi-sdk-autopilot-endgame-roadmap-2026-04-17.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-bb-promotion-rollout-and-decision-governance-2026-04-17_STATUS.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-bb-promotion-rollout-and-decision-governance-2026-04-17_WORKSET.md`
- `/home/peng/dt-git/github/pi-sdk/docs/architecture.md`
- `/home/peng/dt-git/github/pi-sdk/docs/pi-sdk-bb-integration-architecture.md`
- `/home/peng/dt-git/github/boston-bot-vp/docs/runtime-contracts/system-contracts.md`

## Non-Goals

1. 不在 `P12` 同时混入多个 learned components
2. 不把 replay/eval truth 拉回 `pi-sdk` 本地 durable storage
3. 不把 `P11` 的 authority projection/control-only work重新打开成新的 local control path
4. 不 patch Pi core / `ModelRegistry` / extension runtime
5. 不把 broader model platforming 伪装成 first-component loop

## Deliverables

### D1 — First Component Selection and Benchmark Freeze

`P12.S1` 执行冻结结果：

1. first learned component = `artifact summarizer`
2. benchmark tuple frozen as:
   - baseline = current deterministic repo-local summary builders already living in:
     - `src/autopilot/closeout.ts`
     - `src/autopilot/operator.ts`
     - `src/autopilot/history-projection.ts`
   - candidate = one BB-owned learned artifact-summary output consumed through the same thin seams
   - benchmark/evidence home = BB-owned replay / eval / promotion truth only
3. deferred alternatives explicitly named:
   - `review verdict classifier`
   - `next-step route classifier`
   - `repair strategy ranker`
   - `retrieval reranker`
4. defer reason freeze:
   - `review verdict classifier` is the nearest alternative but touches workflow-control semantics more directly via review/replan transitions
   - the remaining three candidates are further from today’s bounded projection seams and would widen scope before the first loop is proven

### D2 — Eval Contract and Replay Boundary Freeze

`P12.S2` 执行冻结结果：

1. input contract frozen to already-landed structured inputs only:
   - closeout inputs from `AutopilotRunSummary` / `AutopilotReport[]`
   - operator inputs from `AutopilotRuntimeState` / `AutopilotReport[]`
   - history inputs from `AutopilotHistoryPayload`
2. baseline output contract frozen to current deterministic summaries already emitted by:
   - `buildCloseoutSummaryLines(...)`
   - `buildAutopilotStatusLines(...)` / `buildAutopilotOverlayLines(...)`
   - `buildAutopilotHistoryProjection(...)`
3. candidate output contract frozen in owner-boundary terms only:
   - any learned artifact-summary payload must be BB-owned
   - repo-local consumption, if later added, may only project that payload back through existing thin seams
   - no orchestrator control-semantic mutation is allowed under this contract
4. current observed gap is now explicit:
   - `src/substrate/types.ts` / `src/substrate/bb.ts` currently expose status / history / authority families, but no explicit artifact-summary candidate payload family
   - targeted search in `/home/peng/dt-git/github/boston-bot-vp/{docs,packages,apps}` did not surface a named autopilot artifact-summary contract either
   - therefore `P12.S2` closes as a contract freeze plus explicit upstream-gap finding, not as proof that the BB-side payload family already exists
5. replay / eval / evidence path remains frozen as BB-owned replay / eval / promotion truth only
6. hard stop law confirmed:
   - `pi-sdk` must not create local durable eval truth, candidate store, learned-component registry, or workflow-control shortcut to compensate for the missing upstream surface

### D3 — Bounded Candidate Integration Direction

前置条件：`P12.S3` 只有在 BB-owned artifact-summary candidate payload family 已被明确证实或上游 materialize 后才能开始。

1. 只允许在现有 repo-local seams 内接入 candidate behavior
2. 保持 repo-local consumption thin-shell and reversible
3. 所有 repo-local behavior change必须可被 targeted TDD 证明
4. 若 `P12.H1` 尚未关闭，则不得假装 `P12.S3` 已具备可执行 contract

### D4 — Promote / Hold / Rollback Loop Proof

1. 若现有 BB surfaces 足够，则记录 single-component governed loop evidence
2. 若不足，记录 exact missing truth surface / environment step / contract gap
3. 不通过 local fallback truth path 假装 loop 已闭环

### D5 — Closeout / Scale-or-Defer Handoff

1. `PLAN / STATUS / WORKSET` 与结果一致
2. pack closeout honest, or stop-handoff honest
3. 下一阶段 scale-or-defer decision 已被清楚命名

## Verification Ladder

### Planning / control-plane validation

1. 新 pack 存在：`_PLAN.md / _STATUS.md / _WORKSET.md`
2. `docs/plan/README.md` 指向该 active pack
3. active slice singular、stop boundary explicit、validation shape explicit
4. 明确说明：这是 roadmap 中 `P12` 的 materialized active pack
5. 明确说明：`P11` 已 closed，当前 authority/governance boundary 已 frozen

### When `P12.S1` lands

1. first learned component is singular and justified
2. benchmark / baseline / candidate boundary is explicit
3. stop boundary for multi-component drift is explicit

### When `P12.S2` lands

1. eval input/output contract freeze exists
2. replay / evidence path remains BB-owned
3. repo-local non-goals stay explicit

### When `P12.S3` lands

1. repo-local candidate integration stays inside existing seams
2. targeted TDD covers new bounded behavior
3. `npm test`
4. `npm run typecheck`
5. `npm run build`
6. `node dist/sdk/orchestrator.js --help`

### When `P12.S4` lands

1. live single-component promote/hold/rollback evidence exists, or
2. explicit stop-handoff evidence exists naming the exact missing upstream/env dependency
3. no local eval/promotion truth path was invented

### When `P12.S5` lands

1. closeout docs are synchronized
2. residuals are explicitly named
3. scale-or-defer handoff is clear and bounded

## Execution Outline

### `P12.S1` — first-learned-component-selection-and-benchmark-freeze

目标：

- 从 roadmap 推荐候选中选择 exactly one first learned component
- 冻结 benchmark / baseline / candidate / stop boundary
- 保证后续执行无需猜“先做哪个 component”

执行结果冻结：

- selected component: `artifact summarizer`
- selection rationale:
  1. it maps cleanly onto already-landed repo-local summary/compression seams
  2. it can remain projection-only and reversible
  3. it is less likely than `review verdict classifier` to reopen workflow-control semantics before BB-owned eval truth is frozen
- benchmark tuple:
  - baseline = current deterministic summary builders + existing targeted summary tests
  - candidate = BB-owned learned artifact-summary output through the same seams
  - evidence path = BB-owned replay / eval / promotion truth, never repo-local durable state
- explicit stop law:
  - if later slices require local eval/promotion truth, workflow-control mutation, or multi-component mixing, stop and re-slice instead of widening `P12.S1`

### `P12.S2` — eval-input-output-contract-and-replay-boundary-freeze

目标：

- 冻结 `artifact summarizer` 的 eval contract vocabulary / replay boundary
- 保持 BB-owned eval truth and evidence home
- 若 contract 需要本地 durable eval truth，则 stop

执行结果冻结：

- input side remains limited to existing structured summary inputs
- baseline output side remains limited to current deterministic summary builders
- candidate output side remains BB-owned by rule, but the concrete payload family is not yet observed in current repo-visible or targeted upstream evidence
- therefore `P12.S2` leaves an explicit upstream-gap handoff rather than pretending `P12.S3` can already implement against a stable payload contract

### `P12.H1` — upstream-artifact-summary-payload-contract-handoff

目标：

- 把 `P12.S2` 发现的 upstream gap 收敛成一个可执行 handoff/blocker 记录
- 明确需要 BB 提供的最小 artifact-summary candidate payload family / resource / tool contract
- 定义 `pi-sdk` 何时允许恢复到 `P12.S3`

执行结果冻结：

- 当前可复用的 upstream pattern 已被命名：
  - shared contract vocabulary: `LearnedStrategyFeedbackCandidate` in `packages/memory-contracts/src/autopilotLearning.ts`
  - report-carriage pattern: optional `learned_candidate` on persisted `strategy_feedback` reports in `packages/memory-contracts/src/autopilotReports.ts`
  - MCP/resource delivery pattern: recent/detail `strategy-feedback` resources in `apps/mcp-servers/bb-memory-mcp/src/autopilotStrategyFeedbackReportResources.ts`
- 因此，`pi-sdk` 对 BB 的最小 upstream need 现在被精确收敛为二选一：
  1. **generalize** the existing learned-candidate advisory pattern so an artifact-summary candidate can be carried under the same `candidate_only` + `shadow_only | advisory_only` + no-regression guard law, or
  2. **materialize** a sibling BB-owned artifact-summary candidate payload/report family that obeys the same owner-boundary and advisory-only law
- 无论采用哪条路径，`pi-sdk` 需要的最小 payload fields 现已冻结为：
  - `objective_key`
  - artifact-summary output lines/payload projected for existing seams (`closeout`, `operator`, `history`)
  - `candidate_only=true`
  - `stage=shadow_only | advisory_only`
  - `confidence`
  - `evidence_summary[]`
  - `no_regression_guard`
  - `governance_no_regression_guard`
  - `source_refs[]`
- 预期 delivery shape 现已冻结为：
  - BB-owned report/resource or equivalent repo-visible substrate contract
  - optional tool alias is acceptable, but repo-local runtime MUST consume it as projection-only evidence rather than activation truth
- `P12.S3` resume gate is now explicit:
  - resume only after one BB-owned artifact-summary candidate payload surface is repo-visibly nameable and carries the minimal fields above
  - do not resume merely because an abstract “learned candidate” idea exists elsewhere in BB

完成条件：

- missing upstream surface 被精确命名，而不是只写抽象“缺 contract”
- owner boundary 明确为 BB-side truth materialization，而不是 repo-local workaround
- `P12.S3` 的 resume gate 被写清楚：只有在 payload family 可被命名并通过 repo-visible evidence 观察到后才能恢复

### `P12.S3` — bounded-candidate-integration-behind-bb-owned-eval-truth

目标：

- 在 `pi-sdk` 既有 seams 内增加单一 component 的 bounded candidate integration
- 保持 projection/integration-only ownership
- 用 targeted TDD 验证 repo-local behavior
- 仅在 `P12.H1` 关闭后开始

### `P12.S4` — single-component-promote-hold-rollback-loop-or-stop-handoff

目标：

- 验证当前 candidate integration 依赖的 live BB eval / decision surface
- 若 live surface 不足，写 handoff 而不是本地造 truth
- 若 smoke 成功，留下最小证据

### `P12.S5` — closeout-and-scale-or-defer-decision

目标：

- 完成 control-plane closeout
- 汇总验证与 residual
- 把下一阶段收敛到 scale-or-defer decision

## Risks / Blockers

1. **workspace already dirty**
   - claims must remain tightly scoped and evidence-based
2. **component scope creep**
   - convenience may tempt mixing multiple learned components into one pack
3. **eval truth ownership drift**
   - replay/eval/promotion truth must remain BB-owned
4. **automation-shell scope creep**
   - minor friction must not widen into shell redesign under `P12`

## Exit Criteria

1. exactly one learned component is selected and bounded
2. BB-owned eval / promotion loop direction is frozen without local truth invention
3. any repo-local candidate integration stays thin-shell and is backed by tests
4. live BB dependency is either proven for the consumed single-component loop or cleanly handed off
5. closeout docs are synchronized and honest
