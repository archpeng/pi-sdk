# PI SDK Extension-Native Autopilot Hardening and Compaction Optimization 2026-04-18 Plan

## Goal

在不引入隐藏第二 session、也不引入外部 scheduler 的前提下，把当前 `pi-sdk` 的 Pi-native autopilot 从“已有自动推进骨架”提升到你要求的正式能力层：

> **仅靠同一个活着的 Pi extension runtime，实现 goal-directed 自动推进、context-pressure compaction、compact 后自动恢复并继续推进，以及默认不向用户征求“是否继续”的 continuation contract。**

固定目标：

- 保持 `pi-sdk` 为 **Pi-first, session-native interactive workflow shell + shared headless driver**
- 不引入 hidden second `AgentSession`
- 不引入 detached background daemon / external scheduler
- 不 patch Pi core；只使用当前已暴露的 extension API surface
- 保持 control-plane truth 诚实：已实现、未实现、假设、验证边界必须分开写

## Positioning

这份文档是一个 **post-completion optimization/backlog plan**，不是对当前 `docs/plan/README.md` active pack 的重开。

原因：

1. 当前 repo control plane 已把此前最终 completion workstream closed out
2. 本文聚焦的是“更高标准的 extension-native autopilot hardening”
3. 因此它应作为新的优化路线文档存在，而不是伪装成之前 final pack 的未完成尾巴

## Design Basis

### Code surfaces already present

1. same-session phase dispatch loop
   - `src/extension/index.ts`
2. runtime persistence and rebuild
   - `src/autopilot/state.ts`
3. shared prompt / protocol / state machine
   - `src/autopilot/phase-prompt.ts`
   - `src/autopilot/protocol.ts`
   - `src/autopilot/engine.ts`
4. BB-backed hydration / projection surfaces
   - `src/substrate/hydration.ts`
   - `src/substrate/bb.ts`

### Installed Pi API evidence in current dependency tree

1. `before_agent_start`
   - `node_modules/@mariozechner/pi-coding-agent/docs/extensions.md`
2. `session_before_compact` / `session_compact`
   - `node_modules/@mariozechner/pi-coding-agent/docs/extensions.md`
3. `ctx.getContextUsage()`
   - `node_modules/@mariozechner/pi-coding-agent/docs/extensions.md`
4. `ctx.compact()`
   - `node_modules/@mariozechner/pi-coding-agent/docs/extensions.md`
5. example compaction trigger
   - `node_modules/@mariozechner/pi-coding-agent/examples/extensions/trigger-compact.ts`

### Current repo facts

1. extension already consumes `autopilot_report`, advances runtime, and auto-dispatches on `turn_end`
2. runtime already persists via custom entries and rebuilds on `session_start` / `session_tree`
3. no compaction-aware logic is wired today
4. no explicit no-ask continuation contract is wired today
5. no explicit goal-distance scorer / route ranker / decision gate is wired today

## Strict Feasibility Verdict

基于当前代码与当前已安装 Pi dependency docs，可以给出更严格的可实现性结论：

> **是的，基于 extension 路线本身，目标能力可以完全实现。**

但这句话有一个必须保留的技术边界：

- 这里的“完全实现”指的是：在 **当前 Pi extension API surface 保持与已安装文档一致** 的前提下，`pi-sdk` 不需要第二 session，也不需要外部 scheduler，就足以落地这套能力
- 这里的“完全实现”**不等于当前仓库已经实现完毕**

换句话说：

1. **架构可行性 verdict**：`PASS`
2. **当前实现完成度 verdict**：`NOT_YET`

## Four-Column Delivery Matrix

| Capability Area | 已实现 | 缺口 | 可由 extension 单独补齐 | 仍需验证的假设 |
|---|---|---|---|---|
| Same-session automatic continuation loop | `autopilot_report -> tool_result -> turn_end -> sendUserMessage()` 已落地；runtime state 已持久化并可 rebuild | 当前 loop 只覆盖 phase progression，不覆盖 compaction-aware continuation | 是。继续沿 `src/extension/index.ts` 增补事件与调度逻辑即可 | 需要用真实 compact lifecycle smoke 证明 compact 后 branch/runtime 恢复与 redispatch 时序稳定 |
| No hidden second session / no external scheduler | 当前 interactive driver 明确是同一 session 内调度；架构文档也坚持不隐藏第二 session | 无代码缺口；但需要后续实现继续遵守该边界 | 是。所有 planned work 都可留在现有 extension runtime 内 | 需要在后续实现中持续避免 convenience-driven second-session fallback |
| Continuation contract: default continue, not ask permission | 调度层已能自动继续；prompt 已要求调用 `autopilot_report` | 没有显式 no-ask rule；没有 per-turn system-level continuation injection | 是。可通过 `phase-prompt.ts` + `before_agent_start` 注入完成 | 需要验证 injected contract 在 compact 后仍稳定生效，且不会误伤真正需要外部输入/审批的情况 |
| Context-pressure detection | 当前代码无任何 context usage 调度 | 缺少 `ctx.getContextUsage()` 接线、阈值策略、high-water / cool-down policy | 是。Pi API 已提供对应能力 | 需要验证不同 provider/model 下 `getContextUsage()` 返回是否稳定、是否足够及时 |
| Proactive compaction | 当前没有主动 compact | 缺少 `ctx.compact()` 触发策略、正在 compact 时的 dispatch gate、失败处理 | 是。Pi API 已提供对应能力 | 需要验证 compact callback 与 extension event ordering 是否始终可靠；需要验证 compact 失败后的 retry/stop law |
| Compaction-aware resume | 当前只 rebuild `session_start/session_tree`；未处理 compact lifecycle | 缺少 `session_before_compact` / `session_compact` 事件处理与 compact 完成后的 rebuild + redispatch | 是。可由 extension 事件补齐 | 需要验证 compact 后 retained entries 是否足够让 `restoreInteractiveRuntime(...)` 恢复 truthful state |
| Goal-directed automatic decision making | 现有 phase prompt 会要求 plan/review/replan；默认 thinking level 为 high | 没有独立的“最接近最终目标” route selector、decision rubric、ranked candidate evaluation | 是，但不仅是 extension file；仍可在现有 shared core + extension 内完成，不需第二 session | 需要验证单-session deliberation 是否足以稳定做 route ranking；需要验证 rubric 不会把 prompt complexity 推到过高 |
| Deep-think before decisive routing | 现有 prompt 对 `execute/review/replan` 有思考要求 | 没有“何时必须进入深度抉择”的硬 gate；没有专门 decision snapshot / route evidence surface | 是。可通过 prompt contract、runtime flags、decision snapshot helper 补齐 | 需要验证该 gate 不会造成 excessive latency 或 stuck-loop |
| Auto-continue after decision | 当前 state machine 在 `continue/completed/needs_replan` 上都能继续推进 | 继续推进并非基于显式 ranked decision output；compact 后 continuation 会断 | 是。沿现有 runtime state machine 扩展即可 | 需要验证 decision output 与 runtime state transition 保持一致，不出现 route drift |
| Honest stop boundary | `paused/stopping/closed` 与 `blocked/failed/done` 等已有一部分 stop semantics | 当前 stop law 不是你要的 formal version；compact-failure / context-overflow / decision-uncertainty 没有新 stop law | 是。可在 extension/runtime state 里补 formal stop boundary | 需要验证新增 stop law 与现有 tests / smoke 不冲突 |

## Synthesis

从上表可收敛出一个更严格的结论：

1. **核心骨架已经存在**
   - 这不是从零设计新产品
   - 这是在现有 extension scheduler 上做 hardening
2. **关键缺口都还在 extension-native seam 内**
   - 没有一个缺口强迫我们引入第二 session
   - 没有一个缺口强迫我们引入外部 scheduler
3. **真正需要谨慎的不是架构，而是验证**
   - compaction lifecycle ordering
   - retained state sufficiency after compact
   - decision rubric stability

## Optimization Scope

本优化计划聚焦以下能力增量：

1. no-ask continuation contract
2. compaction-aware scheduling
3. proactive context-pressure compaction
4. goal-directed decision rubric and routing
5. targeted TDD + smoke evidence

## Non-Goals

1. 不重写现有 autopilot phase model
2. 不引入 detached async worker / daemon
3. 不把 BB projection/control work reopen 成新的 truth-owner workstream
4. 不借机引入 subagent architecture 或第二 controller session
5. 不 patch Pi core

## Delivery Phases

### O1 — Continuation Contract Hardening

目标：

1. 明确禁止 ask-for-permission 语言成为默认输出
2. 明确 autopilot mode running 时默认拥有 continuation pre-authorization
3. 仅在真正缺外部输入/审批/硬阻塞时允许发问

计划改动：

1. `src/autopilot/phase-prompt.ts`
   - 增加 no-ask rule
   - 明确 scheduler owns continuation
2. `src/extension/index.ts`
   - 接入 `before_agent_start`
   - 当 runtime 为 `running` 时注入 continuation contract

完成标准：

1. prompt-level contract 明确存在
2. before-agent injected contract 明确存在
3. targeted tests 覆盖 contract 注入条件与例外条件

### O2 — Compaction-Aware Resume

目标：

1. 让 compact 成为透明过渡点而不是停机点
2. compact 完成后自动 rebuild 并在允许时继续 dispatch

计划改动：

1. `src/extension/index.ts`
   - 监听 `session_before_compact`
   - 监听 `session_compact`
   - 记录 compact-in-flight state
   - compact 完成后 rebuild
   - 若 `runtime.mode === "running"` 且 `dispatchState === "ready"`，自动 redispatch
2. `src/autopilot/state.ts`
   - 如有必要，增加 compact-related runtime flags 的 schema / restore 支持

完成标准：

1. compact lifecycle event wiring landed
2. compact-complete -> rebuild -> redispatch path 被 targeted TDD 覆盖
3. same-session compact smoke 可重复通过

### O3 — Proactive Context-Pressure Compaction Policy

目标：

1. 不等 overflow 才被动处理
2. 在高水位时自动 compact，再继续下一 phase

计划改动：

1. `src/extension/index.ts`
   - `turn_end` 读取 `ctx.getContextUsage()`
   - 实装 threshold policy
   - 需要 compact 时调用 `ctx.compact()`
   - compact in-flight 时阻止重复 dispatch
   - `onComplete`/`onError` 明确处理
2. 可能新增一个轻量 helper
   - 例如 `src/autopilot/compaction-policy.ts`

完成标准：

1. context threshold policy 明确可测
2. compact request 与 next dispatch 不会竞态重复触发
3. compact failure 有 honest fallback

### O4 — Goal-Directed Decision Rubric

目标：

1. 在需要抉择时，明确进入深度思考模式
2. 以“最接近最终目标”为标准做 route selection
3. 决策结果被 runtime 可消费，而不是只停留在自由文本里

计划改动：

1. `src/autopilot/phase-prompt.ts`
   - 对 `review` / `replan` / high-uncertainty `execute` 增加 decision rubric
   - 要求模型输出更结构化的 route decision evidence
2. `src/autopilot/protocol.ts`
   - 评估是否扩充 `autopilot_report` 可选字段，如 `decisionMode`, `decisionBasis`, `candidateRoutes`
3. `src/extension/index.ts`
   - 在特定 phase / uncertainty 条件下提升 decision strictness
4. `src/autopilot/state.ts`
   - 确保 decision-driven transition 与 runtime state 一致

完成标准：

1. decisive-turn rubric landed
2. route selection evidence 可被测试检查
3. 不依赖人工“继续吗”确认

### O5 — Verification and Operator Proof

目标：

1. 把“理论上可行”转成“仓库里被证明可行”
2. 对 compaction 与 decision path 给出可重复 smoke evidence

计划改动：

1. targeted tests
   - `test/extension.test.ts`
   - `test/extension-rebuild.test.ts`
   - `test/state.test.ts`
   - 可能新增 `test/extension-compaction.test.ts`
   - 可能新增 `test/decision-contract.test.ts`
2. bounded smoke harness
   - 若现有 smoke harness 足够，则扩展
   - 否则新增 extension-native compact/continue smoke

完成标准：

1. targeted TDD 覆盖新增行为
2. `npm test`
3. `npm run typecheck`
4. `npm run build`
5. 至少一条 compaction-aware smoke 证据成立

## Recommended Execution Order

推荐最小落地顺序：

1. `O1` continuation contract
2. `O2` compaction-aware resume
3. `O3` proactive compaction
4. `O4` goal-directed decision rubric
5. `O5` widened verification / smoke

原因：

1. `O1` 风险最低，先解决“会问要不要继续”
2. `O2` 先把 compact 从停机点变回透明过渡点
3. `O3` 在 `O2` 后才安全，否则会主动触发更多停机
4. `O4` 需要前面 continuation/compaction 底盘稳定后再加
5. `O5` 贯穿全程，但最终验收要压轴统一做

## Verification Ladder

### Planning / control-plane validation

1. 新优化 plan 文档存在
2. 四栏矩阵与代码证据一致
3. “架构可行”与“当前未实现完”被清楚区分

### When `O1` lands

1. autopilot running turns receive no-ask continuation contract
2. missing-input / approval-needed exceptions remain allowed
3. natural-language output不再默认征求继续许可

### When `O2` lands

1. compact lifecycle events are wired
2. compact complete rebuilds runtime truthfully
3. auto redispatch happens only when runtime is still runnable

### When `O3` lands

1. context usage thresholds trigger compact deterministically
2. no double-dispatch or compact-dispatch race
3. compact failure enters honest fallback path

### When `O4` lands

1. decision-turn rubric is explicit
2. route selection evidence is structured enough to test
3. autopilot can continue after decision without human continue-confirmation

### When `O5` lands

1. targeted tests pass
2. build/typecheck pass
3. compaction-aware continuation smoke passes
4. decision-path smoke or equivalent targeted proof passes

## Risks / Blockers

1. **Pi compaction event ordering may differ from expectation**
   - this is the highest-priority runtime assumption to verify
2. **retained session entries after compact may be insufficient**
   - if compaction prunes too aggressively, `restoreInteractiveRuntime(...)` may need explicit support
3. **decision rubric may increase prompt complexity**
   - must avoid turning autonomy-hardening into prompt bloat
4. **provider/model differences in context usage reporting**
   - threshold policy should degrade honestly if usage signal is absent

## Stop Boundary

如果出现以下任一情况，应停止把问题继续描述为“纯 extension hardening”，并明确升级判断：

1. 当前 Pi runtime 实际上不保证 compact callbacks / events 的可用顺序
2. compact 后无法保留足够 state，且 extension 无法通过现有 persistence seam 补救
3. goal-directed route selection 若需要 second-session deliberation 才能稳定成立
4. 必须 patch Pi core 才能让 compact-resume truthful

## Likely Files / Surfaces

1. `docs/plan/pi-sdk-extension-native-autopilot-hardening-and-compaction-optimization-2026-04-18_PLAN.md`
2. `src/extension/index.ts`
3. `src/autopilot/phase-prompt.ts`
4. `src/autopilot/state.ts`
5. `src/autopilot/protocol.ts`
6. `src/autopilot/engine.ts`
7. `test/extension.test.ts`
8. `test/extension-rebuild.test.ts`
9. `test/state.test.ts`
10. optional new targeted compaction / decision tests

## Final Statement

这份计划的最终立场是：

1. **基于 extension，这条路线是完全可以实现的**
2. **当前代码还没有实现完**
3. **下一步不需要改架构方向，需要的是按顺序完成 hardening、验证、再宣称达成**
