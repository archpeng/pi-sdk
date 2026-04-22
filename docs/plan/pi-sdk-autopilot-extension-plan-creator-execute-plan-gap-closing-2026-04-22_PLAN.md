# PI SDK Autopilot Extension × Plan-Creator × Execute-Plan Gap Closing 2026-04-22 Plan

## Goal

把当前 `pi-sdk` 已经存在的 extension-native autopilot runtime，推进到一个与全局 planning / execution skills 真正对齐的版本：

> **让 autopilot extension 不只是“自动续跑 phase”，而是能围绕 deterministic 的 phase -> skill routing、repo-local control-plane truth、以及 machine-checkable `done_when / stop_boundary` 规则，完成同一 session 内的自动规划、执行、review、replan 与 closeout。**

固定目标：

- primary path 仍然必须是 **extension-only / same-session / serial**
- 不引入 hidden second `AgentSession`
- 不引入 detached scheduler / daemon
- 不 patch Pi core
- 让 extension、global skills、repo-local control plane 三者共享同一套 phase contract
- 让 `docs/plan/*` 与未来 dual-root `docs/active/* + docs/plan/*` 真相，都能成为 runtime 可读、可写、可校验的控制面
- 让 `done_when / stop_boundary` 从“文档习惯”升级为 parser / prompt / runtime gate 真相

## Current Core Task

当前 repo 的核心任务保持不变：

> 让 `pi-sdk` 作为 **Pi-native interactive autopilot package with a shared headless driver**，在当前 Pi session 内围绕 active control plane 自动推进工作，而不是退回 CLI-first 或自由文本驱动的 orchestration。

本 pack 不是新的产品方向切换；它只处理一个明确 residual：

> **extension 与 global skills 还没有形成真正的自动交接闭环。**

## Scope

### In scope

1. `src/extension`
   - deterministic phase -> skill binding
   - missing-skill / selected-tools fail-fast law
   - skill-aware dispatch wiring
2. `src/autopilot`
   - phase routing contract
   - prompt contract alignment
   - `done_when / stop_boundary` prompt/runtime semantics
3. `src/substrate`
   - dual-root local control-plane parsing and writeback
   - single-root / dual-root compatibility rules
4. global skills under `~/.pi/agent/skills`
   - `plan-creator`
   - `execute-plan`
   - review / closeout surface alignment where phase binding depends on them
5. tests / proof
   - targeted routing tests
   - control-plane parser/writeback tests
   - skill-aware e2e-like proof
6. repo-local machine control plane
   - `docs/plan/README.md`
   - this pack’s `PLAN / STATUS / WORKSET`

### Explicit non-goals

1. 不改 `pi-sdk` 的 Pi-first product positioning
2. 不扩写 CLI/headless driver 成为主路径
3. 不做 multi-agent split 或 second-session orchestration
4. 不把 BB-owned benchmark / decision / learned surfaces 重新拉回本地 truth ownership
5. 不把 generic arbitrary markdown parsing 做成产品目标
6. 不在本 pack 内实现 cloud orchestration 或 cross-session workflow

## Design Basis

### Current repo facts already true

1. extension 已能通过 `autopilot_report -> tool_result -> turn_end -> sendUserMessage()` 在同一 session 内自动推进 phase
2. extension 已具备：
   - `before_agent_start` continuation contract
   - `selectedTools`-aware `autopilot_report` fail-fast
   - `session_compact` rebuild + redispatch
   - active-slice `stepId` 匹配检查
   - local `docs/plan/*` deterministic writeback
3. 当前 gap 不在“有没有 autopilot loop”，而在：
   - phase prompt 还没有 deterministic 地绑定到具体 skill surface
   - global `plan-creator` / `execute-plan` 文本与 runtime protocol 不一致
   - local substrate 还没有真正实现 dual-root `docs/active/*` support
   - `done_when / stop_boundary` 还没有进入 parser / prompt / runtime gate
   - 还没有 skill-aware e2e proof 证明 runtime 不是“碰巧用 skill”，而是 deterministic 地 route 到 skill

### Required gap-closing outcome

本 pack 完成时，以下说法必须成立：

1. extension 对每个 autopilot phase 都有 deterministic 的 skill / prompt surface routing，而不是 prose-level suggestion
2. `plan-creator` / `execute-plan` 的 skill contract 与 `autopilot_report`, `stepId`, no-ask continuation, `selectedTools`, `done_when`, `stop_boundary` 语义对齐
3. local substrate 既能继续支持当前 single-root `docs/plan/*`，也能诚实处理 dual-root `docs/active/* + docs/plan/*`
4. control-plane parser、phase prompt、runtime acceptance gate 都能感知并 enforce `done_when / stop_boundary`
5. 至少有一条 skill-aware e2e proof，证明 extension 会 deterministic 地走 skill-bound route、写回真相，并继续下一 slice

## Deliverables

### D1 — Phase-to-Skill Routing Contract

1. 明确 `master_plan / wave_plan / replan -> plan-creator`
2. 明确 `execute -> execute-plan`
3. 明确 `review -> execution-reality-audit`
4. 明确 `closeout -> closeout skill or dedicated closeout prompt`
5. 缺 skill / 缺 required tool / 错 route 时的 honest fail-fast law 明确

### D2 — Skill Protocol Alignment

1. `plan-creator` / `execute-plan` skill 文本显式承认 `autopilot_report`、`stepId`、no-ask continuation、`selectedTools` rule
2. autopilot-compatible skill templates / references 能产出 `done_when / stop_boundary` 所需结构
3. review / closeout surface 的 protocol 与 runtime routing 不冲突

### D3 — Dual-Root Local Control Plane

1. local substrate 能识别 single-root 与 dual-root mode
2. `docs/active/*` primary truth 与 `docs/plan/*` mirror 可一起 snapshot / writeback
3. dual-root drift 会被 honest stop，而不是 silently degrade

### D4 — Machine-Checked `done_when / stop_boundary`

1. parser snapshot 包含 `done_when / stop_boundary`
2. phase prompt 显式引用这些字段
3. runtime gate 用这些字段判断 completion / stop / replan，而不是只依赖模型自述

### D5 — Skill-Aware Proof

1. deterministic routing proof
2. truthful writeback proof
3. dual-root + `done_when / stop_boundary` proof
4. final docs/control-plane closeout truth

## Slice Decomposition

#### `G1` — phase-skill-routing-contract-freeze

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- 冻结 deterministic 的 phase -> skill / prompt routing contract，以及 missing-skill / wrong-route / selected-tools fail-fast law

交付物：

1. canonical routing matrix，覆盖 `master_plan / wave_plan / execute / review / replan / closeout`
2. chosen dispatch encoding，明确 runtime 是通过 `/skill:name` command、等价 deterministic expansion path、还是 dedicated closeout prompt surface 驱动 phase
3. missing-skill / missing-`autopilot_report` / wrong-phase / wrong-stepId 的 stop law 和 targeted test surface 清单

必须避免：

1. 继续依赖“模型可能会自己想起用 skill”的非确定性 routing
2. 把 review / closeout 留成未定的模糊 surface
3. 把 global skill discovery 问题偷渡成 hidden second scheduler

主要文件 / surfaces：

- `src/extension/runtime-dispatch.ts`
- `src/autopilot/phase-prompt.ts`
- `src/autopilot/protocol.ts`
- `docs/plan/README.md`
- `test/extension.test.ts`
- `test/phase-prompt.test.ts`

#### `G2` — extension-phase-router-and-skill-aware-dispatch

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 在 extension 内真正落地 phase -> skill hard binding，并把 skill-aware dispatch 变成 runtime 行为，而不是文档约定

交付物：

1. explicit phase-router helper / wiring seam
2. skill-aware dispatch path，能在 phase prompt / injected user message 中 deterministic 地落到目标 skill / prompt surface
3. fail-fast behavior：skill 缺失、mapping 缺失、selected-tools contract 不满足时，不再 silently fallback

必须避免：

1. 只在自由文本里提一句“使用某 skill”
2. skill route 缺失时静默退回 generic phase prompt
3. 把 review / closeout 继续留在 undocumented fallback path

主要文件 / surfaces：

- `src/extension/index.ts`
- `src/extension/runtime-dispatch.ts`
- `src/autopilot/phase-prompt.ts`
- `src/autopilot/state.ts`
- `test/extension.test.ts`

#### `G3` — skill-and-template-protocol-alignment

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 让全局 `plan-creator` / `execute-plan` 与新的 phase-routing/runtime contract 对齐，并补齐 review / closeout 需要的 skill or prompt guidance

交付物：

1. `plan-creator` skill 文本、reference、autopilot template 对齐 `autopilot_report / stepId / no-ask / selectedTools / done_when / stop_boundary`
2. `execute-plan` skill 文本、reference、autopilot template 对齐同一协议
3. review / closeout 对应 surface 的 skill or dedicated prompt contract 明确，且不与 extension routing 矛盾

必须避免：

1. skill 文档继续宣称 extension-only features 但不说明边界
2. skill template 仍然生成缺少 `done_when / stop_boundary` 的 pack
3. 让 global skill truth 与 repo-local runtime truth 再次分叉

主要文件 / surfaces：

- `/home/peng/.pi/agent/skills/plan-creator/SKILL.md`
- `/home/peng/.pi/agent/skills/plan-creator/references/autopilot-control-plane-pack.md`
- `/home/peng/.pi/agent/skills/plan-creator/assets/*.md`
- `/home/peng/.pi/agent/skills/execute-plan/SKILL.md`
- `/home/peng/.pi/agent/skills/execute-plan/references/autopilot-control-plane-execution.md`
- `/home/peng/.pi/agent/skills/execute-plan/assets/*.md`
- `/home/peng/.pi/agent/skills/execution-reality-audit/SKILL.md`

#### `G4` — dual-root-local-substrate-support

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 让 `src/substrate/local.ts` 和 control-plane parser/writeback 从 single-root `docs/plan/*` 扩展到 dual-root `docs/active/* + docs/plan/*` 真相

交付物：

1. snapshot layer 能显式区分 single-root 与 dual-root pack
2. dual-root repo 可同时解析：active family、active slice、intended handoff、source-root/source-family truth
3. writeback path 能在同一 turn 内保持 `docs/active/*` primary truth 与 `docs/plan/*` mirror 对齐

必须避免：

1. 把 `docs/active/*` 支持实现成另一个独立 roadmap
2. dual-root writeback 只更新一边导致 drift
3. 破坏当前 single-root repo 的 parser compatibility

主要文件 / surfaces：

- `src/substrate/control-plane.ts`
- `src/substrate/local.ts`
- `src/substrate/types.ts`
- `src/substrate/hydration.ts`
- `test/control-plane.test.ts`
- `test/extension-local-proof.test.ts`

#### `G5` — done-when-stop-boundary-parser-prompt-runtime-gate

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 把 `done_when / stop_boundary` 从 pack prose 提升为 machine-consumable parser field、prompt field、runtime acceptance gate

交付物：

1. control-plane snapshot / types 显式携带 `done_when / stop_boundary`
2. phase prompt 会显式引用 active slice 的 `done_when / stop_boundary`
3. runtime 在 accepting `autopilot_report` 和 deciding progression 时，会依据这些字段决定 continue / replan / stop / closeout

必须避免：

1. 仅靠模型“诚实”自述完成条件
2. 把 stop law 写成 loose suggestion 而不是 gate
3. 在 migration 期间让旧 pack 完全无法解析而无兼容策略

主要文件 / surfaces：

- `src/substrate/control-plane.ts`
- `src/substrate/types.ts`
- `src/autopilot/protocol.ts`
- `src/autopilot/phase-prompt.ts`
- `src/autopilot/state.ts`
- `src/extension/index.ts`
- `test/control-plane.test.ts`
- `test/phase-prompt.test.ts`
- `test/extension.test.ts`

#### `G6` — skill-aware-end-to-end-proof

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 证明 extension phase loop 会 deterministic 地使用目标 skill / prompt surface，并把 accepted slice truth 写回控制面，而不是依赖偶然的模型行为

交付物：

1. skill-aware e2e-like test：phase route、skill binding、writeback、next-slice redispatch 全部可见
2. dual-root proof：当 repo 使用 `docs/active/* + docs/plan/*` 时，truth 不漂移
3. `done_when / stop_boundary` proof：错误 completion / wrong stop path 会被 runtime honest reject

必须避免：

1. 只测试 prompt 文本里出现 skill 名称，而不测试 deterministic route behavior
2. 只做 single-root happy path，忽略 dual-root / guardrail path
3. 把 e2e 证明做成需要人工口头解释才能成立

主要文件 / surfaces：

- `test/extension.test.ts`
- `test/extension-local-proof.test.ts`
- `test/engine.test.ts`
- `test/phase-prompt.test.ts`
- `test/extension-rebuild.test.ts`
- 可能新增 `test/extension-skill-routing.test.ts`

#### `G7` — docs-regression-and-closeout

- Owner: `closeout`
- State: `queued`
- Priority: `medium`

目标：

- 用 docs、control-plane、verification evidence 为本 pack 收尾，并确保新的 skill/runtime/control-plane contract 可单次阅读

交付物：

1. `README.md` / `docs/architecture.md` / runbook / pack docs 与 landed code shape 对齐
2. active pack closeout truth、residual、后续 handoff 都诚实写回
3. final regression ladder 与 skill-aware proof evidence recorded in `STATUS`

必须避免：

1. code 已变化但 docs 仍描述旧的 phase prompt / skill semantics
2. closeout 时留下 stale active-pack pointer
3. 把尚未验证的 dual-root 或 done_when law 写成已完成

主要文件 / surfaces：

- `README.md`
- `docs/architecture.md`
- `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
- `docs/plan/README.md`
- this pack’s `PLAN / STATUS / WORKSET`

## Execution Order

1. `G1`
2. `G2`
3. `G3`
4. `G4`
5. `G5`
6. `G6`
7. `G7`

## Verification Ladder

### Baseline truth to preserve before widening scope

1. `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck`
2. `cd /home/peng/dt-git/github/pi-sdk && npm run build`
3. `cd /home/peng/dt-git/github/pi-sdk && npx tsx --test test/engine.test.ts test/phase-prompt.test.ts test/control-plane.test.ts test/extension-support.test.ts test/extension-rebuild.test.ts test/extension-local-proof.test.ts test/extension.test.ts test/pi-bb-backed-smoke.test.ts`

### After `G1-G2`

1. targeted routing tests proving deterministic phase -> skill dispatch
2. targeted fail-fast tests for missing skill / wrong route / missing `autopilot_report`
3. prompt contract still preserves same-session scheduler behavior

### After `G3`

1. skill text / reference / template diff reviewed against runtime protocol
2. targeted skill/template validation where feasible
3. evidence that generated packs can carry `done_when / stop_boundary`

### After `G4-G5`

1. targeted parser / writeback tests for single-root + dual-root
2. targeted prompt/runtime tests for `done_when / stop_boundary` enforcement
3. compact/resume and writeback behavior remain truthful

### Final acceptance

1. `npm test`
2. `npm run typecheck`
3. `npm run build`
4. targeted skill-aware e2e-like proof:
   - deterministic phase route
   - target skill / prompt surface used
   - accepted slice writeback happened
   - next slice redispatched truthfully
5. final docs/control-plane closeout proof

## Stop Boundary

以下情况必须 stop / replan / handoff，而不是继续扩 scope：

1. 如果 deterministic skill routing 需要 Pi core 新 API，而不能用当前 extension / input / skill expansion surface 落地
2. 如果 global skill writeback 无法在现有安装形态中保持可验证 ownership，需要先冻结 packaged-skill or repo-local-skill strategy
3. 如果 dual-root support 需要引入第二套 local roadmap，而不是 primary truth + mirror model，应停止并重构设计
4. 如果 `done_when / stop_boundary` 无法压缩成 machine-consumable minimum contract，而只能依赖自由文本解释，应停止并重新定义 control-plane contract
5. 如果 skill-aware e2e proof 无法证明 deterministic routing，只能证明“模型有时会用 skill”，则本 pack 不能 close out
