# PI-Native Interactive Autopilot Design 2026-04-16

> type: design / architecture / migration note
> status: proposed
> scope: `pi-sdk` product surface, `src/extension/**`, `src/sdk/**`, `src/shared/**`, `src/substrate/**`, `package.json`, `docs/**`
> owner: `pi-sdk`
> related:
> - `README.md`
> - `docs/architecture.md`
> - `docs/pi-sdk-bb-integration-architecture.md`
> - `docs/plan/pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16_{PLAN,STATUS,WORKSET}.md`
> - Pi docs: `extensions.md`, `sdk.md`, `tui.md`, `packages.md`

---

## 1. Decision Summary

`pi-sdk` 的长期正确产品形态应从 **CLI-first external orchestrator** 收敛到：

> **Pi-native interactive autopilot package with a shared headless driver.**

固定表达：

- **primary UX** = 当前 Pi session 内的 interactive autopilot
- **secondary UX** = CLI / headless / batch driver
- **truth / eval / learning** 继续下沉到 `BB`
- **Pi core** 不做 patch

拒绝的形态：

> extension 只是从 Pi 内偷偷启动一个新的 `createAgentSession()` / `runAutopilot()` 隐藏 runner。

那种做法只是“把外部 orchestrator 包到 Pi 里”，不是把调度真正放回 Pi 内。

---

## 2. Why This Design Exists

当前外部 orchestrator 已证明：

1. `master_plan -> wave_plan -> execute -> review -> replan -> closeout` 协议可运行
2. `autopilot_report` 能提供 machine-consumable phase result
3. `BB` substrate 模式可提供 memory / govern / workspace truth
4. CLI/headless 模式适合 batch / bounded automation

但当前主产品面仍有明显问题：

1. **交互割裂**
   - 外部 `node dist/sdk/orchestrator.js ...` 运行时，当前 Pi 对话线程并不是执行现场
   - 用户很难自然插话、暂停、恢复、steer
2. **Pi UI 价值被浪费**
   - Pi 已经有 session、工具显示、widgets、overlay、slash commands、follow-up/steer message queue
   - 外部 orchestrator 没有直接复用这些现成能力
3. **产品心智错误**
   - 当前形态更像 “CLI orchestrator + optional extension”
   - 目标形态应是 “Pi-native autopilot extension package + optional headless driver”
4. **source / dist truth drift 风险**
   - 目前仓库曾出现 `src/extension/index.ts` 与 `dist/extension/index.js` 能力面不一致的迹象
   - 若继续沿用 CLI-first + dist-first 调试，容易放大误判

---

## 3. Current Truth

### 3.1 What `pi-sdk` already has

- `src/sdk/orchestrator.ts`
  - 外部 phase loop driver
  - 独立创建 `AgentSession`
  - phase prompt dispatch
  - report capture + outer-loop transitions
- `src/extension/index.ts`
  - `autopilot_report` tool
  - `/autopilot-status`
  - governance preflight hook
  - minimal widget/status surface
- `src/shared/prompts.ts`
  - shared phase prompt builder
- `src/shared/types.ts`
  - protocol vocabulary
- `src/shared/state-machine.ts`
  - phase transition logic
- `src/substrate/**`
  - `local` / `bb` substrate ports
  - hydration
  - raw evidence writeback

### 3.2 What Pi already provides natively

基于 Pi docs，extension/runtime 已原生提供：

- `registerCommand()`
- `on("input")`
- `before_agent_start` / `context`
- `pi.sendUserMessage()` / `pi.sendMessage()`
- `tool_result` / `turn_end` / `agent_end`
- `ctx.ui.setStatus()` / `setWidget()` / `ui.custom()` overlay
- `ctx.abort()` / `ctx.isIdle()` / `ctx.hasPendingMessages()`
- `pi.appendEntry()` state persistence
- project/global extension loading via `.pi/extensions/**` or package manifest

### 3.3 What Pi does **not** require for this design

这条路线不需要：

- patch Pi core
- 新写 host runtime
- 新写 TUI shell
- 把 `BB` 变成 online workflow runtime

---

## 4. Options Considered

## 4.1 Option A — hidden external orchestrator from inside extension

### Shape

```text
/autopilot-run
-> extension command
-> runAutopilot()
-> createAgentSession()
-> hidden second session executes
```

### Pros

- 复用现有 `src/sdk/orchestrator.ts` 最快
- 最少改动即可保留 CLI 与 extension command surface

### Cons

- 当前 Pi 对话线程不是执行现场
- 交互仍割裂
- 用户插话/steer/pause 体验差
- session continuity 仍然弱
- 更像后台 runner，而不是 Pi-native autopilot

### Verdict

**Reject as primary product shape.**

可作为短期过渡证明，但不应是目标架构。

---

## 4.2 Option B — session-native scheduler extension

### Shape

```text
/autopilot-run
-> current Pi session enters autopilot mode
-> extension dispatches current phase prompt into same session
-> assistant works in-place
-> assistant emits autopilot_report
-> extension computes next phase
-> extension queues next prompt via sendUserMessage()/sendMessage()
```

### Pros

- 当前 session 就是执行现场
- 保留 Pi 原生交互、工具流、消息流、editor、widgets、overlay
- 用户可自然 pause / resume / steer / stop
- 与 `pi-first / natural-language-first / no core patch` 方向一致

### Cons

- 需要把 CLI driver 的共享逻辑抽出
- 需要补 scheduler runtime state / restore discipline
- 需要更认真处理 session lifecycle / reload / tree navigation

### Verdict

**Choose as target architecture.**

---

## 5. Chosen Architecture

## 5.1 Product statement

`pi-sdk` 应重构为：

> **shared autopilot core + Pi interactive driver + CLI/headless driver**

### Frontends

| frontend | role | primary use |
|---|---|---|
| Pi interactive driver | primary | interactive autopilot in the current session |
| CLI/headless driver | secondary | batch, CI, daemon-like or external automation |

### Shared core

| concern | ownership |
|---|---|
| phase prompt builder | shared core |
| hydration assembly | shared core |
| report validation | shared core |
| state transition logic | shared core |
| closeout / guardrail / resume helpers | shared core |
| UI widgets / slash commands | Pi interactive driver |
| argv parsing / stdout logging | CLI driver |

---

## 5.2 Architectural formula

```text
Pi session
-> extension-native autopilot scheduler
-> shared autopilot engine
-> substrate read/write (local|bb)
-> BB remembers / judges / learns
-> scheduler injects next phase into same session
```

固定职责边界：

- **Pi session**: execution surface
- **extension scheduler**: phase dispatch + interactive control
- **shared core**: protocol / transitions / hydration / closeout rules
- **CLI driver**: batch wrapper over the same core
- **BB**: canonical truth / eval / replay / learning substrate

---

## 5.3 Official Pi Example Reuse Map + Reference Priority

这次重构的默认方法论必须明确为：

> **先匹配官方 Pi docs / examples 已证明的交互与运行模式；只有当官方模式不足以覆盖需求时，才增加 `pi-sdk` 自定义 glue。**

换句话说，`pi-sdk` 的 Pi-first interactive autopilot 不应从空白页重新设计，而应：

- 以 **official docs + official examples** 为主参考
- 以当前 `pi-sdk` 已落地协议面为待重构对象
- 以社区 extension / workflow 项目为补充参考或反例
- 最后才引入新的 repo-local pattern

### Reference Priority

| priority | source class | role | rule |
|---|---|---|---|
| P0 | official Pi docs (`extensions.md`, `sdk.md`, `tui.md`, `packages.md`) | API / lifecycle / UI / packaging truth | 若设计与文档冲突，以官方 docs 为准 |
| P1 | official Pi examples | implementation baseline | 先复用已证明 pattern，不先自造 scheduler/runtime pattern |
| P2 | current `pi-sdk` code | migration source | 只复用已验证协议与 substrate seam，不复用 CLI-first product bias |
| P3 | focused community extensions | narrow precedent | 仅借鉴局部做法，不作为主设计基线 |
| P4 | adjacent Pi-SDK workflow projects | contrast / anti-example / partial inspiration | 可用来理解 workflow shell 形态，但不能替代 session-native extension 设计 |
| P5 | new custom `pi-sdk` pattern | last resort | 必须在前四层不足时才引入，并写清楚为何官方 pattern 不够 |

### Official Pi Example Reuse Map

| `pi-sdk` target capability | primary official reference | reuse target | what to avoid inventing |
|---|---|---|---|
| autopilot mode / progress widget / lightweight execution mode | `examples/extensions/plan-mode/index.ts`, `extensions.md` widgets/status API | autopilot mode flag, footer status, progress widget, minimal mode transitions | 自建第二套 mode UI framework |
| current-session phase dispatch | `examples/extensions/send-user-message.ts`, `sdk.md` prompt queueing semantics | `sendUserMessage()` + `steer` / `followUp` 驱动同一 session 内 phase continuation | hidden second session or background runner disguised as extension |
| session-focused handoff / branch continuation | `examples/extensions/handoff.ts`, `extensions.md` session command APIs | pause/resume/handoff 设计、session/tree-aware continuation | bespoke session transport / external handoff runtime |
| tool interception / governance wrapping | `examples/extensions/tool-override.ts`, `extensions.md` `tool_call` / `tool_result` hooks | risky tool preflight, result shaping, built-in tool wrapping | 本地 ad hoc shell wrapper stack |
| overlay / inspector UI | `tui.md`, official overlay patterns referenced from `extensions.md` | autopilot inspector overlay, status panel, review details panel | 单独再造一个 TUI app |
| package/install shape | `packages.md` | `pi` package manifest, extension-first install / share model | 自定义 installer / plugin loader |
| session/runtime boundaries | `sdk.md`, `extensions.md` | keep current Pi session as execution surface; keep headless driver separate | 把 extension 命令实现成 `createAgentSession()` launcher |

### Community Reference Policy

当前扫描到的社区项目只应作为补充：

| source | allowed use | not allowed as |
|---|---|---|
| `lsj5031/pi-notification-extension` | 证明共享 extension / package ergonomics 可行 | autopilot scheduler blueprint |
| `bnenu/pi-evaluate` | 借鉴 post-execute evaluation / discriminator framing | interactive runtime architecture baseline |
| `EcoKG/vela-pi` | 对照 workflow shell / slash command / FSM artifact 形态 | current-session interactive scheduler baseline |

### Design Review Rule

任何新的 interactive autopilot 设计或实现切片，在进入编码前都应先回答：

1. 这个能力的 **primary official reference** 是什么？
2. 我们是在复用哪个官方 pattern：
   - event hook
   - message queueing
   - widget / overlay
   - session lifecycle
   - package layout
3. 如果没有官方 pattern，对应缺口是什么？
4. 为什么不能用现有官方 pattern 组合解决，而必须新增 `pi-sdk` 自定义 glue？

若以上问题答不清，则默认应继续回到 **official examples first** 的设计优化路径，而不是继续发明新 runtime 结构。

---

## 6. Explicit Non-Goals

1. 不在这次重构里做多 subagent fan-out runtime
2. 不把 extension 做成新的 host runtime
3. 不 patch Pi core
4. 不在 `pi-sdk` 内引入新的 benchmark / promotion / learning local registry
5. 不把 `BB` 变成在线 phase scheduler
6. 不放弃 CLI/headless mode；它仍保留为 secondary driver

---

## 7. Shared Core Refactor

## 7.1 Extraction target

当前 `src/sdk/orchestrator.ts` 混合了：

1. CLI parsing
2. session creation
3. phase loop / report capture / transition logic
4. substrate hydration / evidence persistence

重构后应拆成：

```text
src/autopilot/
  protocol.ts
  state.ts
  phase-prompt.ts
  hydration.ts
  engine.ts
  closeout.ts
```

## 7.2 File mapping

| current file | future role |
|---|---|
| `src/shared/types.ts` | move/merge into `src/autopilot/protocol.ts` |
| `src/shared/prompts.ts` | move/merge into `src/autopilot/phase-prompt.ts` |
| `src/shared/state-machine.ts` | move/merge into `src/autopilot/engine.ts` |
| `src/substrate/hydration.ts` | split: shared hydration helpers remain shared; driver-specific wiring leaves caller |
| `src/sdk/orchestrator.ts` | thin CLI/headless driver |
| `src/extension/index.ts` | thin interactive driver shell calling shared core |

## 7.3 Shared core responsibilities

### `protocol.ts`

Own:
- `AutopilotPhase`
- `AutopilotStatus`
- `AutopilotReport`
- validation / formatting helpers
- phase / status vocabulary

### `phase-prompt.ts`

Own:
- `buildPhasePrompt(...)`
- protocol instructions per phase
- shared prompt contract for `autopilot_report`

### `state.ts`

Own:
- scheduler runtime state model
- phase cursor model
- pause/stop markers
- session reconstruction shape

### `engine.ts`

Own:
- report -> next phase decision
- closeout decision
- review / replan semantics
- stop boundary enforcement helpers

### `closeout.ts`

Own:
- shared closeout summary preparation
- final state / warnings packaging

---

## 8. Pi Interactive Driver Design

## 8.1 Driver rule

**The current Pi session is the execution surface.**

The extension must not create a hidden new `AgentSession` for the main interactive path.

## 8.2 Commands

Required:

- `/autopilot-run <goal>`
- `/autopilot-resume <goal>`
- `/autopilot-pause`
- `/autopilot-stop`
- `/autopilot-status`

Optional:

- `/autopilot-head <goal>`
- `/autopilot-debug`

## 8.3 Triggering model

### Start

```text
/autopilot-run <goal>
-> extension initializes scheduler state
-> inject first phase prompt into current session
```

### Continue

```text
autopilot_report(tool_result)
-> extension reads report
-> shared engine decides next step
-> extension queues next phase via sendUserMessage()/sendMessage()
```

### Pause

- set runtime mode to `paused`
- do not queue next phase after current turn settles
- do not force-kill current tool executions unless user explicitly stops

### Stop

- set runtime mode to `stopping`
- optionally `ctx.abort()` if the user wants immediate stop
- do not queue any next phase

### Resume

- rebuild scheduler state from session branch + persisted runtime entry
- compute next phase from latest report / checkpoint
- queue the next phase prompt into the same session

---

## 8.4 Event model

| event | use |
|---|---|
| `session_start` | rebuild scheduler state |
| `session_tree` | rebuild scheduler state after tree navigation |
| `session_shutdown` | clear UI / persist final runtime marker |
| `input` | optional natural-language `autopilot:` trigger |
| `before_agent_start` | inject current phase / stop boundary / pack summary |
| `context` | prune or shape autopilot context before LLM call |
| `tool_result` | capture `autopilot_report` and update scheduler state |
| `turn_end` | after a report-bearing turn, dispatch next phase if allowed |

## 8.5 Why `tool_result` + `turn_end` split matters

- `tool_result` is the earliest reliable place to capture `autopilot_report`
- `turn_end` is a safer place to schedule the next phase, because the current assistant turn is fully settled

Recommended rule:

- `tool_result` -> store/validate phase report
- `turn_end` -> decide queueing / pause / stop / resume continuation

---

## 8.6 Message injection rule

Preferred mechanism:

- `pi.sendUserMessage(nextPrompt)` when idle
- `pi.sendUserMessage(nextPrompt, { deliverAs: "steer" | "followUp" })` when not idle

Do **not** create a hidden second session for the main interactive path.

---

## 9. Interactive State Model

## 9.1 Runtime mode

| mode | meaning |
|---|---|
| `idle` | no autopilot active in current session |
| `running` | extension may dispatch next phases automatically |
| `paused` | current state preserved; next phase not auto-queued |
| `stopping` | no further phase should be queued |
| `closed` | closeout reached; autopilot run no longer active |

## 9.2 Persisted state

至少需要持久化：

- active objective / goal
- objective key (if already derivable)
- latest phase report id or timestamp
- current mode (`running|paused|stopping|closed`)
- current wave / cycle cursor
- warnings count / last warning summary

## 9.3 Persistence rule

Use two surfaces together:

1. **authoritative phase proof**
   - `autopilot_report` tool result `details`
2. **runtime scheduler reconstruction aid**
   - `pi.appendEntry("autopilot-runtime-state", ...)` or equivalent extension custom entry

Why both:

- `autopilot_report` is branch-aware proof of what the model claimed
- runtime state captures pause/resume/queue mode that does not naturally belong inside one report

## 9.4 Reconstruction sources

On `session_start` / `session_tree`, rebuild from:

1. branch `autopilot_report` history
2. latest `autopilot-runtime-state` custom entry
3. current active pack / substrate summary if needed

---

## 10. UI Design

## 10.1 Minimal always-on UI

Use existing Pi UI primitives:

- `ctx.ui.setStatus("autopilot", ...)`
- `ctx.ui.setWidget("autopilot", ...)`

Recommended footer status:

```text
🤖 running | paused | stopping | closed
phase · wave/cycle
```

Recommended widget lines:

- current goal
- current phase / status
- last report summary
- next action
- warnings / stop boundary

## 10.2 Optional overlay inspector

Use `ctx.ui.custom(..., { overlay: true })` for an inspector panel with:

- current phase cursor
- recent report list
- current pack / active slice summary
- substrate warning list
- pause/resume/stop help text

This is optional MVP+, not required for the first interactive slice.

## 10.3 Manual intervention model

The user should be able to:

- type normal instructions while autopilot is running
- use `/autopilot-pause`
- use `/autopilot-stop`
- use `/autopilot-status`
- inspect artifacts without leaving the session

This is the core reason to choose the Pi-native path.

---

## 11. CLI / Headless Driver After Refactor

## 11.1 Role

`src/sdk/orchestrator.ts` remains, but becomes a **thin headless driver** over the shared core.

It should own only:

- argv parsing
- stdout/stderr logging
- session bootstrap
- batch execution loop
- exit code / summary output

It should stop owning the business logic that the interactive driver also needs.

## 11.2 Why keep it

CLI/headless still matters for:

- CI
- cron / daemon / automation
- non-interactive bounded runs
- reproducible debugging outside the Pi TUI

But it is no longer the primary product face.

---

## 12. Build / Packaging Changes

## 12.1 Source-of-truth rule

`src/**` must be the only development truth.

`dist/**` must never carry behavior that no longer exists in `src/**`.

## 12.2 Required build hygiene

Current risk: `package.json` has separate scripts:

- `build = tsc -p tsconfig.json`
- `clean = rm -rf dist`

This allows stale `dist/**` files to survive.

Required change:

```json
{
  "scripts": {
    "build": "npm run clean && tsc -p tsconfig.json"
  }
}
```

Or equivalent safe build boundary.

## 12.3 Packaging direction

`pi-sdk` should be positioned as a Pi package:

- `package.json#pi.extensions`
- optional future `pi.skills` / prompt templates if needed
- installable via `pi install /path/to/pi-sdk`

Recommended product statement:

> `pi-sdk` is a Pi-native autopilot package with a shared headless driver.

Not:

> CLI orchestrator with an optional extension.

---

## 13. Verification Plan

## 13.1 Build truth

1. `npm run clean && npm run build`
2. verify `dist/extension/index.js` matches `src/extension/index.ts` feature surface
3. verify no orphaned old extension commands remain in `dist/**`

## 13.2 Shared core extraction

1. protocol tests still pass
2. prompt builder tests still pass
3. state-machine / transition tests still pass
4. CLI driver behavior remains equivalent on a bounded smoke objective

## 13.3 Interactive driver MVP

1. inside Pi, `/autopilot-run <goal>` starts interactive autopilot in the current session
2. the assistant emits `autopilot_report`
3. extension captures report and schedules next phase without creating a hidden second session
4. `/autopilot-pause` stops automatic next-phase scheduling
5. `/autopilot-resume <goal>` continues from current session state
6. `/autopilot-stop` prevents further auto-queued phases
7. widget / status stay consistent across session reload and tree navigation

## 13.4 Substrate alignment

1. `bb` mode uses the same substrate ports as CLI driver
2. missing BB tools degrade honestly, not silently
3. `memory_autopilot_status` / canary / strategy tools are verified against live endpoint after service restart

---

## 14. GitHub / Ecosystem Scan (2026-04-16)

## 14.1 Search intent

问题不是“Pi 有没有 extension”，而是：

- 是否已经存在一个 **开源的、共享的、社区好评较高的** extension / package
- 能直接覆盖或大幅借用 **interactive autopilot / session scheduler / workflow shell** 这类需求

## 14.2 What was searched

Representative GitHub queries:

1. `"@mariozechner/pi-coding-agent" extension language:TypeScript`
2. `"@mariozechner/pi-coding-agent" (extension OR pi-package) language:TypeScript`
3. `"@mariozechner/pi-coding-agent" autopilot language:TypeScript`

## 14.3 Findings

| source | type | signal | relevance | limitation |
|---|---|---:|---|---|
| upstream official examples in Pi docs / repo | official examples | highest trust | show the exact primitives needed: `plan-mode`, `send-user-message`, `handoff`, `tool-override`, `settings`, TUI overlays | examples, not a ready-made autopilot package |
| `https://github.com/lsj5031/pi-notification-extension` | extension | ~7 stars | good proof that shared/open-source Pi extensions exist and package ergonomics are straightforward | notification only; no scheduler / phase loop |
| `https://github.com/bnenu/pi-evaluate` | skill/package | ~1 star | useful precedent for adversarial post-execute evaluation and structured verdict thinking | skill-oriented, not extension-native scheduler |
| `https://github.com/EcoKG/vela-pi` | standalone Pi-based workflow engine | ~0 stars | closest public precedent for “workflow shell on top of Pi SDK” thinking; shows slash commands + FSM + artifacts | CLI/runtime-first; not clearly a current-session interactive scheduler extension |

## 14.4 Honest conclusion from the scan

At scan time:

1. **No high-signal, community-popular, session-native autopilot extension** was found that can be adopted as-is.
2. The Pi ecosystem appears **early but real**:
   - there are shared extensions/packages
   - there are workflow-oriented experiments
   - but not a clearly dominant, well-starred interactive scheduler package
3. The most trustworthy reusable references are still:
   - **official upstream extension examples**
   - small focused community extensions
   - adjacent Pi-SDK workflow projects used as architectural contrast, not drop-in dependencies

### Design implication

`pi-sdk` should treat the ecosystem scan as:

- **reuse official patterns aggressively**
- **do not wait for a ready-made community autopilot package**
- **do not assume an existing open-source package will solve the session-native scheduler shape**

---

## 15. Risks

1. **hidden-second-session regression**
   - the team may accidentally ship Option A while believing it shipped Option B
2. **source/dist drift**
   - stale build outputs can create false confidence about extension capability
3. **extension state drift**
   - if pause/resume state lives only in memory, reload/tree navigation will corrupt scheduler behavior
4. **scope creep into Pi core**
   - interactive scheduler pressure may tempt runtime/core changes too early
5. **local-sovereign-brain regression**
   - interactive convenience must not become a reason to move truth/eval/learning back from `BB` into `pi-sdk`

---

## 16. Recommended Successor Pack

This design should not be mixed into the current benchmark/promotion doc-sync pack.

Recommended future pack theme:

> **P7 — Pi-native interactive autopilot mode**

Recommended first slice:

> **P7.S1 — source/dist truth freeze + shared-core extraction boundary**

Why this first:

- current source/dist drift risk must be removed before any UI/runtime refactor claim is trustworthy
- shared-core extraction is the prerequisite for both drivers to stay aligned

Suggested slice ladder:

1. `P7.S1` source/dist truth freeze + build hygiene
2. `P7.S2` shared autopilot core extraction
3. `P7.S3` interactive scheduler MVP inside current session
4. `P7.S4` pause/resume/stop + reconstruction across reload/tree
5. `P7.S5` README/package repositioning to Pi-first

---

## 17. Final Verdict

### What should happen

`pi-sdk` should be refactored toward:

> **Pi-native interactive autopilot as the primary surface, with the current CLI retained as a secondary headless driver.**

### What should not happen

- do not keep treating the external CLI orchestrator as the primary product surface
- do not hide a second session behind an extension command and call it “in-Pi”
- do not move truth/eval/learning back into `pi-sdk`

### One-line decision

> **Own the workflow shell inside Pi’s existing interaction model; do not re-build a second UI/runtime when Pi extensions already provide the necessary control surface.**
