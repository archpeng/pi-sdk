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
- 让 `docs/plan/*` 继续作为当前 pack 的唯一 repo-local machine control plane，并停止要求 extension/runtime 去承诺未实现的 dual-root `docs/active/*` 真相
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
   - current single-root `docs/plan/*` local control-plane parsing and writeback
   - `done_when / stop_boundary` field propagation for the existing single-root pack shape
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
   - global skill / reference surfaces 仍然把 `docs/active/*` dual-root mirror 当成要求，但当前 runtime truth 其实只有 single-root `docs/plan/*`
   - `done_when / stop_boundary` 还没有进入 parser / prompt / runtime gate
   - 还没有 skill-aware e2e proof 证明 runtime 不是“碰巧用 skill”，而是 deterministic 地 route 到 skill

### Required gap-closing outcome

本 pack 完成时，以下说法必须成立：

1. extension 对每个 autopilot phase 都有 deterministic 的 skill / prompt surface routing，而不是 prose-level suggestion
2. `plan-creator` / `execute-plan` 的 skill contract 与 `autopilot_report`, `stepId`, no-ask continuation, `selectedTools`, `done_when`, `stop_boundary` 语义对齐
3. local substrate 继续诚实地只支持当前 single-root `docs/plan/*`，同时 global skills / plan docs 不再要求或暗示 dual-root `docs/active/* + docs/plan/*` mirroring
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

### D3 — Single-Root Control Plane Contract

1. `docs/plan/*` 继续作为当前 pack 的唯一 repo-local machine truth
2. global skills / references / pack docs 不再要求 `docs/active/* + docs/plan/*` dual-root mirroring
3. dual-root support 明确留在当前 pack scope 之外，而不是被写成隐含承诺

### D4 — Machine-Checked `done_when / stop_boundary`

1. parser snapshot 包含 `done_when / stop_boundary`
2. phase prompt 显式引用这些字段
3. runtime gate 用这些字段判断 completion / stop / replan，而不是只依赖模型自述

### D5 — Skill-Aware Proof

1. deterministic routing proof
2. truthful single-root writeback proof
3. `done_when / stop_boundary` proof on the current single-root pack shape
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
- `src/extension/tool-guard.ts`
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

#### `G4` — single-root-skill-control-plane-realignment

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 把当前 pack 从 dual-root 方向收回到已验证的 single-root `docs/plan/*` truth：extension / substrate 不做 dual 改造，反而要求 global skills 与 plan docs 明确保持 single-root contract

交付物：

1. active pack、`docs/plan/README.md`、以及当前 slice truth 明确写成 `docs/plan/*` 是唯一 repo-local machine control plane
2. `plan-creator` / `execute-plan` skill 与 reference surface 不再要求 `docs/active/* + docs/plan/*` mirroring
3. 后续 proof / closeout / residual 叙述不再把 dual-root support 当作本 pack 的验收项

必须避免：

1. 为了追 dual-root 而扩写 `src/substrate/*` 或 extension runtime
2. 让 skill truth 与 repo-local plan truth 继续同时存在 single-root / dual-root 两套互相冲突的说法
3. 把 scope 收缩伪装成 dual-root 已完成

主要文件 / surfaces：

- `/home/peng/.pi/agent/skills/plan-creator/SKILL.md`
- `/home/peng/.pi/agent/skills/plan-creator/references/autopilot-control-plane-pack.md`
- `/home/peng/.pi/agent/skills/execute-plan/SKILL.md`
- `/home/peng/.pi/agent/skills/execute-plan/references/autopilot-control-plane-execution.md`
- `docs/plan/README.md`
- this pack’s `PLAN / STATUS / WORKSET`

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

done_when:

1. current single-root control-plane snapshot exposes explicit `done_when / stop_boundary` arrays for the active stage and queued plan slices
2. execute/review prompts surface the active slice `done_when / stop_boundary` plus exact `doneWhenMet / stopBoundaryHit` reporting instructions
3. execute/review report acceptance derives honest progression from `doneWhenMet / stopBoundaryHit` and rejects unknown stop-law items

stop_boundary:

1. stop if compatibility requires old packs to add mandatory new headings before they can still parse
2. stop if control-plane writeback or next-stage hydration drops explicit stop-law fields
3. stop if runtime still trusts the raw requested status over structured stop-law data

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

- 证明 extension phase loop 会 deterministic 地使用目标 skill / prompt surface，并把 accepted slice truth 写回当前 single-root 控制面，而不是依赖偶然的模型行为

交付物：

1. skill-aware e2e-like test：phase route、skill binding、writeback、next-slice redispatch 全部可见
2. single-root control-plane proof：`docs/plan/*` 仍是唯一 machine truth，且不会被 skill 文本误导到 dual-root 叙述
3. `done_when / stop_boundary` proof：错误 completion / wrong stop path 会被 runtime honest reject

done_when:

1. proof shows deterministic routed dispatch plus single-root writeback on the current pack shape
2. proof shows `done_when / stop_boundary` affecting completion vs replan behavior rather than only appearing in prompt prose

stop_boundary:

1. stop if the proof only checks prompt text and not runtime route / writeback behavior
2. stop if the proof still needs manual explanation to justify completion or replan outcomes

必须避免：

1. 只测试 prompt 文本里出现 skill 名称，而不测试 deterministic route behavior
2. 只做 happy path，却放过 single-root contract drift / guardrail path
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

1. `README.md`：补齐 deterministic routed-skill / closeout prompt surface、single-root `docs/plan/*` writeback、`doneWhenMet / stopBoundaryHit` contract
2. `docs/architecture.md` 与 `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`：补齐 same-session routed dispatch、fail-fast law、single-root control-plane、operator verification / recovery guidance
3. active pack closeout truth：`docs/plan/README.md` 与本 pack `STATUS / WORKSET` 诚实写回 residual、handoff、final evidence，并保持 parser-friendly formatting
4. final regression ladder recorded in `STATUS`: `npm test`, `npm run typecheck`, `npm run build`, `plan_sync`, `workspace_scan`

done_when:

1. closeout docs and pack truth describe the landed routed-skill + single-root + stop-law contract without drift
2. `STATUS` records final regression evidence and residuals in parser-friendly machine-state sections
3. residuals and follow-up scopes are explicit enough for a future resume without hidden conversation context

stop_boundary:

1. stop if any closeout doc still describes pre-G5 stop-law behavior or dual-root support as landed
2. stop if pack closeout would hide unproved runtime or proof gaps behind prose-only claims
3. stop if final closeout validation shows runtime/control-plane behavior drifting from the documented routed contract

必须避免：

1. code 已变化但 docs 仍描述旧的 phase prompt / skill semantics
2. closeout 时留下 stale active-pack pointer
3. 把尚未验证的 single-root contract correction 或 done_when law 写成已完成

主要文件 / surfaces：

- `README.md`
- `docs/architecture.md`
- `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
- `docs/plan/README.md`
- this pack’s `PLAN / STATUS / WORKSET`

执行顺序：

1. `README.md` contract pass：补齐 deterministic routed-skill binding、repo-local closeout prompt surface、single-root `docs/plan/*` writeback、`doneWhenMet / stopBoundaryHit` semantics
2. architecture + runbook pass：补齐 same-session routed dispatch、missing-skill / wrong-route / wrong-phase / wrong-stepId fail-fast law、operator verification / recovery path
3. pack closeout + regression pass：清理 `docs/plan/README.md` 与本 pack `STATUS / WORKSET`，再运行 `npm test`、`npm run typecheck`、`npm run build`、`plan_sync`、`workspace_scan`，把 final evidence / residual 写回

wave_exit_criteria:

1. `README.md` / `docs/architecture.md` / runbook 都明确描述 landed routed-skill + single-root + stop-law contract
2. active pack closeout truth 与 final evidence 已写回，且不再留下 stale active-pack pointer 或 dual-root drift
3. final regression ladder 通过，或失败被诚实记录为 closeout residual / blocker 而不是被 prose 掩盖

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

1. targeted readback / diff checks proving the active pack and global skills now agree on a single-root `docs/plan/*` contract
2. targeted prompt/runtime tests for `done_when / stop_boundary` enforcement on the current single-root pack shape
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
3. 如果保持 skill truth 诚实仍然要求 extension/runtime 去承诺未实现的 dual-root 行为，应停止并维持 single-root `docs/plan/*` contract
4. 如果 `done_when / stop_boundary` 无法压缩成 machine-consumable minimum contract，而只能依赖自由文本解释，应停止并重新定义 control-plane contract
5. 如果 skill-aware e2e proof 无法证明 deterministic routing，只能证明“模型有时会用 skill”，则本 pack 不能 close out
