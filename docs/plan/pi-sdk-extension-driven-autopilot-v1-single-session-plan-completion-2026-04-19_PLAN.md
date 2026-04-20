# PI SDK Extension-Driven Autopilot V1 Single-Session Plan Completion 2026-04-19 Plan

## Goal

把 `pi-sdk` 当前已经落地的 extension-native autopilot，从“可以在同一 session 内自动续跑 phase”的能力，推进到更严格也更产品化的目标：

> **只依赖 Pi extension runtime 本身，在 Pi 内的同一个 session 中，串行读取 repo-local active control plane，围绕 active slice 自动推进、自动校验、自动写回，并最终完成计划 closeout。**

固定目标：

- primary path 必须是 **extension-only / same-session / serial**
- 不依赖 CLI / headless driver 才能完成主路径
- 不引入 hidden second `AgentSession`
- 不引入 detached scheduler / daemon
- 不 patch Pi core
- repo-local `docs/plan/*` 必须成为 active control surface，而不是仅仅作为 prompt 背景材料
- control-plane truth 必须保持诚实：active slice、done_when、stop_boundary、验证证据都要可读、可写、可校验

## Scope

本计划只覆盖与上述目标直接相关的必要工作。

### In scope

1. `src/substrate`
   - repo-local `docs/plan` active pack resolution
   - control-plane snapshot parsing
   - local control-plane writeback
2. `src/autopilot`
   - active-slice-aware report contract
   - state transition 与 stop law
   - phase prompt 中的 active slice / done_when / verification contract
3. `src/extension`
   - same-session auto-progression
   - report validation
   - control-plane writeback orchestration
   - pause/resume/rebuild/compact 下的 truth-preserving continuation
4. repo safety / drift guard
   - dirty-repo guard
   - bounded retry / drift stop law
5. e2e-like proof
   - local mode
   - same session
   - no BB dependency required for core progression

### Explicit non-goals

1. 不增强 CLI / headless driver 成为主路径
2. 不做 multi-agent split
3. 不把 BB decision authority / learned advisory 集成当作 v1 硬前提
4. 不让 `docs/future/*` 直接成为 active scheduler input
5. 不把 generic arbitrary Markdown parsing 做成产品目标
6. 不在本计划内做 cloud orchestration / cross-session workflow

## Positioning

这份文档是一个 **fresh successor execution pack**。

它不是：

- 对已 closed pack 的 reopen
- 对 CLI/headless driver 的功能扩写
- 对 BB substrate 的 owner-boundary 扩写

它只处理一个当前明确且足够窄的问题：

> 让 extension 本身具备“读 active pack -> 推进 active slice -> 写回 control plane -> 继续下一 slice”的最小闭环能力。

## Design Basis

### Repo facts already true

1. extension 已经能：
   - 接收 `/autopilot-run`
   - 自动续跑 phase
   - 通过 `autopilot_report` 驱动 state transition
   - compact 后 rebuild + redispatch
2. shared autopilot core 已经有：
   - protocol
   - prompt builder
   - runtime state
   - workflow engine
3. 当前缺口不在 “能不能续跑 phase”，而在：
   - repo-local active plan 解析不够强
   - active slice 语义没有进入 runtime gate
   - control-plane writeback 不是 deterministic substrate responsibility
   - local substrate 对 `docs/plan` 仍接近 no-op

### Current technical gap

当前 extension 看到的 `docs/plan` 仍过于薄：

1. `plan_sync` 只提供 plan file summary，不提供 active pack semantics
2. extension 不知道：
   - 当前 active slice 是什么
   - 本轮 report 是否匹配 active slice
   - 当前 slice 的 `done_when` / `stop_boundary`
3. extension 当前不会 deterministic 地写回：
   - `STATUS`
   - `WORKSET`

因此当前系统虽然可以 phase-autopilot，但还不能诚实地说自己能：

> **extension-only 完成 repo-local 计划闭环。**

## Success Definition

本计划完成时，以下说法必须成立：

1. 在 **local substrate 模式** 下，extension 能从 repo-local `docs/plan/README.md` 解析当前 active pack。
2. extension 能读出当前 active slice 及其最小 machine-consumable metadata。
3. 每个 `autopilot_report` 都会被验证：
   - phase 匹配
   - active slice 匹配
   - status 合法
   - 需要的 evidence / artifacts / risks 最小字段完整
4. 当 slice 被判定完成时，extension 能 deterministic 地写回 control plane。
5. 写回后，同一 session 能继续推进到下一个 active slice，而不用借 CLI/headless。
6. 在 pause / resume / compact / rebuild 后，上述 truth 不丢失。
7. 出现 drift、重复 replan、dirty repo、报告错配时，extension 会 honest stop，而不是盲目继续。

## Layer Ownership

### `src/substrate`

拥有：

- active pack resolution
- local plan/control snapshot parsing
- local plan/control writeback
- repo-local docs truth seam

不拥有：

- phase transition policy
- report semantic validation
- UI / command scheduling

### `src/autopilot`

拥有：

- report schema
- runtime state transition
- prompt contract
- stop law vocabulary

不拥有：

- filesystem read/write
- direct extension event handling

### `src/extension`

拥有：

- command entrypoints
- same-session dispatch
- report acceptance / rejection
- compact-aware continuation
- invoking control-plane read/write seams

不拥有：

- raw file parsing details
- generic external orchestration

## Deliverables

### D1 — Repo-Local Control Plane Adapter

1. local substrate 可读取：
   - active pack
   - active slice
   - minimal queue / blockers / done_when metadata
2. local substrate 可写回：
   - `STATUS`
   - `WORKSET`
3. read/write 都具备 deterministic tests

### D2 — Active-Slice-Aware Autopilot Protocol

1. `autopilot_report` 的消费方知道当前 active slice
2. runtime state / prompt context 带 active slice truth
3. report mismatch 会被拒绝推进

### D3 — Extension-Driven Serial Progression

1. `/autopilot-run` 后无需 CLI/headless
2. current session 内围绕 active slice 串行推进
3. slice 完成后自动写回并进入下一 slice

### D4 — Safety And Drift Guardrails

1. dirty repo guard
2. bounded retry / replan loop guard
3. report mismatch stop law
4. closeout discipline

### D5 — Same-Session Proof

1. local-only proof
2. compact / rebuild continuity proof
3. plan completion proof
4. final control-plane truth proof

## Verification Ladder

### Baseline truth to preserve

1. `cd /home/peng/dt-git/github/pi-sdk && npm test`
2. `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck`
3. `cd /home/peng/dt-git/github/pi-sdk && npm run build`

### When A-layer lands

1. targeted tests for local plan/control parsing
2. targeted tests for deterministic control-plane writeback
3. no BB dependency required for local active-pack resolution

### When B-layer lands

1. targeted tests for report mismatch rejection
2. targeted tests for active-slice-aware transition
3. prompt contract explicitly references active slice / done_when / stop_boundary

### When C-layer lands

1. targeted tests for `/autopilot-run` using local control plane
2. targeted tests for auto-advance after writeback
3. pause/resume/compact preserves control-plane truth

### Final acceptance

1. `npm test`
2. `npm run typecheck`
3. `npm run build`
4. targeted same-session local-mode e2e-like proof:
   - active pack resolved
   - active slice progressed
   - STATUS / WORKSET updated
   - next slice redispatched
5. final closeout proof:
   - control-plane reflects completion honestly

## Phase Decomposition

### A — `src/substrate` local control-plane foundation

#### `A1` — control-plane-contract-freeze

目标：

- 冻结 extension-driven v1 需要的最小 control-plane machine contract

交付物：

- 明确 active pack resolution rules
- 明确 active slice snapshot shape
- 明确 STATUS / WORKSET writeback contract
- targeted tests for parser fixtures

主要文件：

- `src/substrate/types.ts`
- new `src/substrate/control-plane.ts`
- `test/` 中新增 targeted parser tests

完成标准：

- local substrate 侧 machine-consumable contract 已冻结
- 后续 slices 不再靠自然语言猜 active slice

#### `A2` — local-active-pack-resolution

目标：

- local substrate 从 repo-local `docs/plan` 读取 active pack

交付物：

- `docs/plan/README.md` active pack parser
- active pack file resolver
- local control snapshot loader

主要文件：

- `src/substrate/local.ts`
- `src/substrate/control-plane.ts`
- `src/substrate/hydration.ts`

完成标准：

- local mode 下 `plan_sync` / equivalent control seam 不再是 no-op
- extension 可拿到 active slice truth

#### `A3` — deterministic-status-workset-writeback

目标：

- local substrate 提供 deterministic control-plane writeback

交付物：

- STATUS / WORKSET update helper
- writeback tests
- bounded file mutation rules

主要文件：

- `src/substrate/control-plane.ts`
- `src/substrate/local.ts`

完成标准：

- extension 不必依赖模型自己编辑 control-plane 才能推进 pack

### B — `src/autopilot` protocol and state hardening

#### `B1` — active-slice-aware-report-contract

目标：

- `autopilot_report` 对 active slice 有明确语义绑定

交付物：

- report schema 增强或消费约束增强
- phase / slice mismatch validator inputs

主要文件：

- `src/autopilot/protocol.ts`
- `src/autopilot/phase-prompt.ts`

完成标准：

- 当前 active slice 成为 report contract 的显式上下文

#### `B2` — prompt-contract-for-slice-completion

目标：

- prompt 明确约束模型围绕 active slice、done_when、verification 行动

交付物：

- buildPhasePrompt 注入 active slice truth
- 明确何时 `continue` / `completed` / `needs_replan` / `done`

主要文件：

- `src/autopilot/phase-prompt.ts`

完成标准：

- prompt 不再只说“继续当前 phase”，而是说清“完成当前 active slice 需要什么”

#### `B3` — runtime-stop-law-alignment

目标：

- state transition 与 extension-driven single-session plan completion 对齐

交付物：

- drift / mismatch / repeated replan stop law
- active-slice completion -> next active slice transition seam

主要文件：

- `src/autopilot/state.ts`

完成标准：

- 错误报告、错 slice 推进、无效 closeout 都会 honest stop

### C — `src/extension` same-session serial scheduler

#### `C1` — local-control-aware-run-and-resume

目标：

- `/autopilot-run` / `/autopilot-resume` 从 local control-plane 开始，而不是只靠 goal 文本

交付物：

- run/resume 时加载 active pack snapshot
- runtime state 与 control-plane snapshot 同步

主要文件：

- `src/extension/index.ts`

完成标准：

- extension 在 local mode 下能知道当前 active slice

#### `C2` — report-validation-and-writeback

目标：

- 接收 `autopilot_report` 后先校验，再写回，再决定是否 auto-advance

交付物：

- report validator
- accepted / rejected path
- writeback orchestration
- next-slice redispatch rules

主要文件：

- `src/extension/index.ts`

完成标准：

- 未通过 validator 的 report 不会推进 control plane
- 通过 validator 的 report 会更新 STATUS / WORKSET

#### `C3` — pause-resume-compact-with-control-truth

目标：

- compact / rebuild / pause / resume 后 control-plane truth 不丢

交付物：

- runtime rebuild 与 local control snapshot resync
- pause/resume semantics 与 active slice truth 对齐

主要文件：

- `src/extension/index.ts`
- `src/autopilot/state.ts`

完成标准：

- compact 后 redispatch 的 phase/slice 与 control plane 一致

### D — safety and proof

#### `D1` — dirty-repo-and-drift-guard

目标：

- 在自动推进前后增加最小 repo safety

交付物：

- dirty repo guard
- repeated replan / repeated mismatch loop guard
- bounded retry policy

主要文件：

- `src/extension/index.ts`
- `src/autopilot/state.ts`
- `src/substrate/control-plane.ts`

完成标准：

- extension 不会在明显失真状态下盲跑

#### `D2` — same-session-local-e2e-proof

目标：

- 用 local mode 证明真正的 extension-driven plan completion

交付物：

- targeted e2e-like tests
- 至少一条从 active slice 到下一 slice 的 same-session proof

主要文件：

- `test/extension*.test.ts`
- 可能新增 `test/local-control-plane.test.ts`
- 可能新增 `test/extension-plan-driven.test.ts`

完成标准：

- 证明无需 CLI/headless 也能完成 repo-local plan progression

#### `D3` — closeout-and-handoff

目标：

- 用 evidence-backed control-plane closeout 收尾

交付物：

- updated `PLAN / STATUS / WORKSET`
- closeout summary

完成标准：

- pack 可以 honest closeout

## Recommended Execution Order

1. `A1`
2. `A2`
3. `A3`
4. `B1`
5. `B2`
6. `B3`
7. `C1`
8. `C2`
9. `C3`
10. `D1`
11. `D2`
12. `D3`

## Pack-Level Stop Boundary

在以下情况必须 stop / handoff，而不是继续扩写：

1. 若发现 extension runtime 无法稳定访问 repo-local `docs/plan`，且必须依赖 CLI/headless 才能推进
2. 若 deterministic STATUS / WORKSET writeback 无法在 extension-owned seam 内成立
3. 若 active slice 语义无法压缩成 machine-consumable minimum contract，只能靠自由文本理解
4. 若必须引入 hidden second session 才能完成 same-session serial progression
5. 若 repo safety 证明 extension-driven auto-progression 风险不可控

## Exit Criteria

满足以下条件时，本 pack 可以 honest closeout：

1. extension-only local mode 能解析 active pack / active slice
2. report validation 与 STATUS / WORKSET writeback 已落地
3. same-session serial auto-progression 不依赖 CLI/headless
4. compact / rebuild / pause / resume 与 control-plane truth 对齐
5. dirty repo / drift / mismatch guard 已落地
6. e2e-like proof 证明 extension 能完成至少一个 repo-local active slice progression
7. final control-plane closeout 诚实同步
