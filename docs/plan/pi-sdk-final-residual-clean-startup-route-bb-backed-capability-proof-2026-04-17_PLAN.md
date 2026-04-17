# PI SDK Final Residual Clean Startup Route BB-Backed Capability Proof 2026-04-17 Plan

## Goal

关闭当前唯一剩余 residual：

> **在 clean startup canonical route 下，证明 auto-loaded `pi-sdk` 可以走到 BB-backed capability path，且该证明不依赖隐藏 auth/runtime 假设。**

这里的目标不是重开 roadmap，而是把上一包留下的最后一个 proof gap 收敛到可脚本化、可审计、可重复执行的证据面。

## Starting Truth

前一包 `pi-sdk-final-pi-startup-autoload-proof-and-project-completion-2026-04-17_*` 已经诚实 closeout，并明确留下单一 residual：

- clean startup route autoload 已证明
- auto-loaded command surface 已证明
- 尚未证明的唯一点是：
  - `clean-startup-route auto-loaded BB-backed capability proof`

上一包已明确：

- 不可依赖隐藏全局 auth/runtime 假设
- 不可通过 proof-only truth path 伪造 BB-backed completion
- 若继续，必须起一个 fresh residual pack，而不是 reopen 已 closeout pack

## Scope

本 pack 只做一件事：

1. 为 clean startup route 下的 BB-backed autopilot path 建立**deterministic、bounded** proof harness
2. 优先使用本地可控 stub/fake server 解决 provider auth/session nondeterminism
3. 证明 auto-loaded `pi-sdk` 在 `PI_SDK_SUBSTRATE=bb` 下能真实完成最小 autopilot run path
4. 若最终仍有不可消除的残差，精确写清楚并 closeout

## Non-Goals

1. 不 reopen `P10`–`P13` 或 post-v1 maintenance 的 owner-boundary 决策
2. 不把 `pi-sdk` 变成 BB truth owner
3. 不 patch Pi core / runtime
4. 不引入隐藏全局 provider login / local operator machine state 作为 proof 前提
5. 不做宽时间黑盒长跑；所有 process-level probe 都必须 bounded、可 timeout、可审计

## Constraints

- `pi-sdk` 必须保持 projection/control-only
- proof route 必须继续服从上一包冻结的 canonical startup law：
  - clean `PI_CODING_AGENT_DIR`
  - temp project
  - `.pi/settings.json` package autoload
  - started `pi` process
- 采用 **TDD-first**
- 采用 **短回路执行**：每个 wave 完成后先汇报，再决定是否进入下一 wave
- 新 wave 默认应是 proof-carrying 的最小 bounded slice

## Deliverables

### D1 — Deterministic BB-backed proof route freeze

明确哪条路用于去掉上一包留下的 auth/session nondeterminism：

- auto-loaded package path 保持不变
- provider path 改为本地 deterministic stub provider
- BB-backed path 改为本地 deterministic fake MCP endpoints（仅覆盖当前 proof 需要的最小 surface）

### D2 — Minimal BB-backed run harness

实现一个最小但真实的 harness，至少应：

- 在 clean startup route 下启动 `pi`
- auto-load `pi-sdk`
- 以 `PI_SDK_SUBSTRATE=bb` 运行 `/autopilot-run <goal>`
- 通过 deterministic provider tool-call 完成最小 autopilot path
- 记录 provider phase requests 与 fake BB MCP requests
- 对 process hanging 设置 hard timeout，避免黑盒长跑

### D3 — Scriptable proof surface

把该 harness 变成 repo 内可执行的 script/test surface，以便：

- targeted TDD
- repeated smoke
- future closeout evidence

### D4 — Final residual verdict

在 harness 落地后，二选一：

- 证明确已关闭该 residual，或
- 精确命名仍然剩下的 residual

## Stage Dependency Order

| Stage | Name | Depends on | Pass indicators |
|---|---|---|---|
| `R1` | deterministic-route-freeze-and-minimal-harness-seam | none | new residual pack active; R1 bounded; failing test lands first; implementation seam chosen; no long black-box probe required |
| `R2` | fake-provider-and-fake-bb-minimal-run-proof | `R1` | auto-loaded `pi` process completes bounded BB-backed minimal run using deterministic stubs; targeted smoke passes |
| `R3` | script-surface-regression-and-proof-hardening | `R2` | runnable script/package/docs surfaces synced; regressions pass; timeout/hard-stop behavior proven |
| `R4` | residual-verdict-and-closeout | `R3` | final residual closed or exact residual written; control-plane synced; pack closeout honest |

## Verification Ladder

### When `R1` lands

- new `PLAN / STATUS / WORKSET` pack exists
- `docs/plan/README.md` points at the new pack
- `R1` is the singular active slice
- failing targeted test exists and fails for the intended seam before implementation
- implementation seam is small enough that execution does not require a long black-box probe

### When `R2` lands

- deterministic stub provider is actually exercised by a started `pi` process
- fake BB MCP endpoints are actually exercised under `PI_SDK_SUBSTRATE=bb`
- minimal autopilot run path completes within an explicit timeout

### When `R3` lands

- proof surface is runnable outside the test file
- targeted tests pass
- broader regressions pass

### When `R4` lands

- final verdict is explicit
- if still blocked, exact residual is explicit
- closeout docs are synchronized

## Review -> Replan Rule

- 一次只细化一个 active stage
- 每个 wave 完成后先 review 当前证据，再决定是否 replan 进入下一 stage
- 若下一步需要扩大 touched surfaces 或 acceptance ladder，必须先更新 `STATUS / WORKSET`

## Pack-Level Stop Boundary

在以下情况下必须 stop，而不是猜：

1. 若 BB-backed proof 只能依赖隐藏全局 provider login 或不可审计 machine state
2. 若要完成 proof 必须 patch Pi core
3. 若 fake provider / fake MCP route 开始偏离真实 code path，变成 proof-only 假装成功
4. 若最小 slice 需要长时间黑盒跑而没有显式 timeout/kill 边界

## Exit Criteria

本 pack 只有在以下条件下才能 closeout：

1. clean startup route 下的 BB-backed capability proof 被 scriptably 证明，或
2. 仍然无法证明，但 exact residual 被进一步收窄并明确写清
3. proof surface、verification evidence、closeout handoff 三者一致
