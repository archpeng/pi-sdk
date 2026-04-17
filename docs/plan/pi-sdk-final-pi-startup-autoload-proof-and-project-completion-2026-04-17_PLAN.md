# PI SDK Final Pi Startup Autoload Proof and Project Completion 2026-04-17 Plan

## Goal

在已关闭的 `P13` 与 post-v1 packaged-install maintenance pack 之后，建立一条**直通最终目标**的完整执行路线：

> **启动 `pi` 后，无需 `-e` 临时注入，`pi-sdk` 能以 package 形态自动加载并提供其既定能力面；随后给出项目是否可被 honest 宣称“完成”的最终 verdict。**

固定目标：

- 保持 `pi-sdk` 为 **Pi-first, session-native interactive workflow shell + shared headless driver**
- 保持 `BB` 为 truth / benchmark / promotion / eval / learning owner
- 不为“最终证明”而 reopen `P10` / `P11` / `P12` / `P13` 或 post-v1 maintenance 的 owner-boundary 决策
- 不发明第二套 truth path、repo-local benchmark/eval/promotion state、或 Pi core patch
- control plane 继续**单根锚定**于 `/home/peng/dt-git/github/pi-sdk/docs/plan`

## Final Target

把“最终完成”明确成一个可证明的目标，而不是模糊印象：

1. **autoload truth**：启动 `pi` 后，已安装/已配置的 `pi-sdk` package 会被自动加载，而不是依赖 `pi -e ...`
2. **interactive truth**：同一 Pi session 内可以直接看到并调用 `pi-sdk` 的 interactive autopilot commands
3. **capability truth**：local-mode 最小 same-session autopilot smoke 成立；若进行 BB-backed smoke，也必须是 bounded、诚实、无本地补偿 truth
4. **completion truth**：到达可宣布“项目完成”的证据边界；若仍有残差，必须精确命名，而不是模糊说“差不多”

## Starting Truth

本 pack 启动前，以下已被前置 pack 真实关闭：

- `P7` Pi-native interactive autopilot
- `P8` runtime hardening + BB alignment
- `P9` BB-backed benchmark / promotion-readiness projection
- `P10` benchmark history + operator inspection
- `P11` BB-owned promotion governance / decision authority
- `P12` first learned component loop
- `P13` v1 productization / release readiness
- post-v1 maintenance residual: packaged tarball clean-install smoke + installed-package diagnostics alignment

当前最强剩余问题已经从“包能否安装”收敛为：

- **真正启动 `pi` 后，package 是否会自动加载并直接暴露 `pi-sdk` 全部既定能力面？**
- **在此证据基础上，项目能否 honest 宣称完成？**

## Scope

本计划聚焦一个 post-roadmap final-completion workstream：

1. 冻结“最终目标”的 canonical proof route 与 acceptance law
2. 证明 `pi` startup autoload 路径，而不是仅证明 tarball install
3. 证明 auto-loaded same-session interactive capability surface
4. 在需要时做 bounded BB-backed capability smoke，或记录 exact degraded residual
5. 给出项目最终完成 verdict / exact residual / closeout handoff

## Non-Goals

1. 不做新的 benchmark / promotion / learned-component widening
2. 不做 npm publish / registry automation / release channel engineering
3. 不做 Pi core patch / runtime hack / undocumented loader trick
4. 不把这个 pack 扩写成大规模 CI/platform overhaul
5. 不在这一轮就把所有未来 maintenance backlog 都细化到底

## Deliverables

### D1 — Final Goal Boundary and Canonical Startup Route Freeze

需要明确：

1. canonical autoload proof route 是什么：
   - global/project package install
   - project settings auto-install on startup
   - 哪个是本 pack 的 primary proof route，哪个只是 secondary follow-up
2. “全部能力”在本 pack 中的最小诚实定义是什么：
   - commands visible
   - bounded local command smoke in a started `pi` process
   - bounded BB-backed smoke or exact residual
3. 最终 completion verdict 的标准是什么

`F1` 执行冻结结果：

- **primary canonical proof route** = `clean PI_CODING_AGENT_DIR + temp project + .pi/settings.json packages -> start pi -> print-mode slash-command proof`
  - rationale:
    1. this uses documented **project settings package auto-install on startup** from Pi package docs
    2. it avoids mutating global user settings as the primary proof path
    3. it proves startup autoload without relying on `-e`
    4. it stays scriptable and deterministic enough for automated evidence capture
- **secondary/operator follow-up route** = `pi install -l /path/to/package` or global `pi install ...`
  - acceptable as operator ergonomics proof later, but not the canonical acceptance route for this pack
- **minimal honest definition of “全部能力” for this pack** is frozen to:
  1. startup autoload via package settings rather than `-e`
  2. auto-loaded `pi-sdk` slash-command surface is reachable in a started `pi` process
  3. bounded local smoke means command-path proof first; not a full benchmark/promotion/learning re-open
  4. bounded BB-backed proof stays a later stage and may close as exact residual if environment truth is insufficient
- **final completion verdict law** is frozen to:
  - project may be called complete only if the canonical autoload route plus the frozen capability proof route are both evidenced, or
  - otherwise the final stage must write the exact blocking residual instead of using approximate “almost done” language

### D2 — Pi Startup Autoload Proof

需要证明：

1. 启动 `pi` 后 package 自动加载
2. 不依赖 `pi -e` 临时注入
3. auto-loaded package surface 与 package/install truth 一致

### D3 — Same-Session Interactive Capability Proof

需要证明：

1. auto-loaded session 中 commands 可见
2. 最小 local same-session autopilot smoke 成立
3. runtime state / pause-resume / status 至少达到 bounded smoke truth

### D4 — Bounded BB-Backed Capability Proof or Exact Residual

需要证明二选一：

1. auto-loaded session 中的 bounded BB-backed capability smoke 成立，或
2. 若环境/依赖不足，则写下 exact residual，而不是本地补偿 truth

### D5 — Final Completion Verdict and Closeout

需要给出：

1. 项目是否可被 honest 宣称“完成”
2. 若不能，最后剩余 gap 是什么
3. 后续 handoff 应进入哪类 maintenance/backlog pack

## Stage Dependency Order

本 pack 采用**阶段依赖顺序**推进。当前这一轮只细化第一阶段；后续阶段在各自 stage closeout 后通过 review -> replan 再继续细化。

| Stage | Name | Depends on | Stage pass indicators |
|---|---|---|---|
| `F1` | final-goal-boundary-and-canonical-startup-route-freeze | none | canonical startup proof route frozen; “全部能力”最小定义 frozen; final completion verdict law frozen; `F2` 无需再猜 proof target |
| `F2` | pi-startup-autoload-proof | `F1` | fresh `pi` startup can auto-load `pi-sdk` package without `-e`; proof route reproducible; no undocumented loader hack |
| `F3` | same-session-interactive-capability-smoke | `F2` | auto-loaded session exposes target commands; bounded local-mode same-session autopilot smoke passes; state/status surface evidence captured |
| `F4` | bounded-bb-backed-capability-proof-or-exact-residual | `F3` | BB-backed bounded smoke passes in auto-loaded session, or exact environment/stack residual is named without local truth invention |
| `F5` | final-completion-verdict-and-closeout | `F4` | project-complete verdict or exact final residual written; control-plane synchronized; next handoff bounded |

## Verification Ladder

### Planning / control-plane validation

1. 新 pack 存在：`_PLAN.md / _STATUS.md / _WORKSET.md`
2. `docs/plan/README.md` 指向该 active pack
3. 当前 active stage singular、stop boundary explicit、validation shape explicit
4. workset 仅按**依赖关系**排列未来阶段，并为每个阶段给出 pass indicators
5. 第一阶段足够细，使 `execute-plan` 能直接开始

### When `F2` lands

1. chosen autoload route has a reproducible proof path
2. evidence shows startup auto-load instead of ad hoc `-e`
3. no hidden second extension-loading path was invented

### When `F3` lands

1. commands visible in an auto-loaded Pi session
2. bounded local same-session smoke passes
3. session evidence is captured in an honest form

### When `F4` lands

1. BB-backed bounded smoke passes, or
2. exact degraded/env residual is written with no local truth compensation

### When `F5` lands

1. final completion verdict is explicit
2. residuals are explicit if verdict is not full completion
3. closeout docs synchronized

## Review -> Replan Rule

本 pack 明确采用阶段化细化策略：

1. 当前只细化 `F1`
2. `F1` 执行后，先 review 当前 truth
3. 仅在 review 完成后，再把 `F2` 细化到可执行粒度
4. 后续阶段同理，逐阶段递进

换句话说：

- 这一轮 **不** 把 `F2`–`F5` 预先拆成过细 slice
- 这一轮 **只** 冻结顺序与通过指标，避免过早假设实现细节

## Pack-Level Stop Boundary

在以下情况下必须 stop / handoff，而不是猜：

1. canonical startup proof route 无法在不 patch Pi core 的前提下成立
2. “全部能力”定义若开始要求 reopen 早已关闭的 benchmark/promotion/learning owner-boundary
3. auto-loaded proof 若只能通过 undocumented loader trick 才成立
4. final completion verdict 若必须建立在未验证的外部假设之上

## Exit Criteria

满足以下条件时，本 pack 可以 honest closeout：

1. final target 的 canonical proof route 被真实验证或被 honest 阻断
2. auto-loaded session capability truth 被真实验证或精确阻断
3. final completion verdict 被写清楚
4. control plane 对未来 continuation 的 handoff 清楚且 bounded
