# PI SDK Pi-Native Interactive Autopilot 2026-04-16 Plan

## Goal

把 `pi-sdk` 从当前的 **CLI-first external orchestrator + thin extension**，重构到一个 **Pi-first interactive autopilot package with a shared headless driver** 的可连续执行形态。

固定目标：

- **primary UX** = 当前 Pi session 内的 interactive autopilot
- **secondary UX** = CLI / headless / batch driver
- **truth / eval / learning** 继续以 `BB` substrate 为主
- **Pi core** 不做 patch
- **官方 Pi docs / official examples** 作为主实现参考，而不是临时自造 runtime glue

本计划是对 `docs/pi-native-interactive-autopilot-design-2026-04-16.md` 的执行控制面化：

- 不再把外部 CLI orchestrator 当作长期主产品面
- 不把 extension 做成隐藏第二个 `AgentSession` 的伪 in-Pi runner
- 先修 build/source truth，再抽 shared core，再落真正的 current-session scheduler

## Scope

本计划聚焦 **P7 — pi-native interactive autopilot refactor**，覆盖：

1. **source / dist truth freeze + build hygiene**
   - 消除 stale `dist/**` 残留对能力判断的干扰
   - 明确 `src/**` 才是开发真相，`dist/**` 只是 clean build 产物
2. **shared autopilot core extraction**
   - 从当前 CLI driver 中抽出可被 CLI 与 Pi interactive driver 共同使用的核心逻辑
3. **session-native interactive scheduler MVP**
   - 让当前 Pi session 成为执行现场
   - 通过 extension 驱动 phase dispatch，而不是再创建一个隐藏 session
4. **pause / resume / stop + reconstruction hardening**
   - 支持 reload / tree navigation / session restart 后的状态恢复
5. **package / docs / product-surface repositioning**
   - 把 `pi-sdk` 重新定位为 Pi-native autopilot package，CLI 退为 secondary driver

本计划是 **单 repo workstream**，控制面锚定在：

- `/home/peng/dt-git/github/pi-sdk/docs/plan`

外部依赖保持只读/验证角色：

- `BB` live endpoints 仅作为 substrate 兼容性验证，不在本计划内扩写 `boston-bot-vp` active pack

## Design Basis

本计划以以下设计文档为 SSOT：

- `/home/peng/dt-git/github/pi-sdk/docs/pi-native-interactive-autopilot-design-2026-04-16.md`

其关键设计原则必须在执行中保持不变：

1. **official docs / official examples first**
2. **no hidden second session as the primary interactive path**
3. **no Pi core patch**
4. **BB remains the truth / eval / learning substrate**
5. **CLI remains supported but becomes secondary**

## Non-Goals

1. 不在本计划内实现多 subagent fan-out runtime
2. 不把 extension 做成新的 host runtime
3. 不 patch Pi core / `ModelRegistry` / extension runtime
4. 不在 `pi-sdk` 内引入 benchmark / promotion / learning 的本地 registry
5. 不把 `BB` 变成在线 phase scheduler
6. 不在没有先修 source/dist truth 前，直接扩写 interactive feature surface
7. 不在没有 shared core 抽取前，把 interactive scheduler 逻辑硬塞进现有 `src/extension/index.ts`

## Deliverables

### D1 — Source / Dist Truth Freeze + Build Hygiene

1. `build` 形成 clean-build 边界，`dist/**` 不再残留旧能力面
2. 当前 extension / CLI command surface 的 source vs dist 差异被显式收口
3. 后续实现不再依赖 stale build artifacts 判断能力

### D2 — Shared Autopilot Core Extraction

1. phase protocol / prompt builder / transition logic / hydration orchestration 收敛到 shared core
2. CLI driver 退化为 thin headless wrapper
3. interactive driver 不必复制业务逻辑

### D3 — Session-Native Interactive Scheduler MVP

1. `/autopilot-run`
2. `/autopilot-resume`
3. `/autopilot-pause`
4. `/autopilot-stop`
5. `/autopilot-status`
6. 这些命令在当前 session 内驱动 autopilot，而不是偷偷再开第二个 session

### D4 — Scheduler State Reconstruction + UI Hardening

1. autopilot runtime mode / phase cursor 能跨 reload / tree / resume 重建
2. status/widget/overlay 可诚实展示当前 phase 与风险
3. pause / resume / stop 语义稳定

### D5 — Pi-First Package / Docs Repositioning

1. `README.md` 改为 Pi-first 叙述
2. `package.json` / package semantics 明确 extension-first install/use
3. CLI driver 说明保留，但定位为 secondary path
4. pack closeout 时能清楚说明 primary UX 已迁到 Pi 内

## Verification Ladder

### Baseline — Current repo truth to preserve

1. `cd /home/peng/dt-git/github/pi-sdk && npm test`
2. `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck`
3. `cd /home/peng/dt-git/github/pi-sdk && npm run clean && npm run build`
4. `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --help`

### Design alignment gates

1. `docs/pi-native-interactive-autopilot-design-2026-04-16.md` remains the current design SSOT
2. any new slice must cite the primary official Pi reference it reuses
3. no slice may introduce a custom runtime pattern before explaining why official examples are insufficient

### When P7.S1 lands

1. build path enforces clean `dist/**` before compile
2. no stale dist-only autopilot command surface survives a clean build without matching source truth
3. source/dist truth for extension/autopilot surfaces is explicit enough that `P7.S2` can continue safely

### When P7.S2 lands

1. shared autopilot core modules exist with clear ownership
2. CLI driver becomes thinner without losing current bounded behavior
3. targeted tests prove protocol / transition / prompt behavior is preserved

### When P7.S3 lands

1. `/autopilot-run|resume|pause|stop|status` exist in source, not only in stale build outputs
2. current-session phase dispatch works through extension message queueing
3. no hidden second `AgentSession` is used as the primary interactive path

### When P7.S4 lands

1. pause/resume/stop semantics are reconstructible across reload/tree/session restart
2. widget / status / optional overlay remain consistent with current scheduler state
3. targeted proofs show runtime state can be rebuilt from session truth surfaces

### When P7.S5 lands

1. README/package/docs now present `pi-sdk` as Pi-first interactive autopilot package
2. CLI/headless path remains available as a secondary driver
3. closeout is honest about what remains out of scope

## Execution Outline

### `P7.S1` — source-dist-truth-freeze-and-build-hygiene

目标：

- 先修掉 source / dist truth drift 风险
- 冻结 `src/**` 为唯一开发真相
- 建立 clean-build discipline，避免 stale dist command surface 误导后续 interactive 重构

### `P7.S2` — shared-autopilot-core-extraction

目标：

- 从 `src/sdk/orchestrator.ts` 抽出 shared autopilot core
- 明确 protocol / prompt / transition / hydration / closeout 的共享边界
- 让 CLI driver 与 Pi interactive driver 可以共用核心，而不是复制逻辑

### `P7.S3` — in-session-interactive-scheduler-mvp

目标：

- 让当前 Pi session 成为 autopilot 执行现场
- 落地 `/autopilot-run`、`/autopilot-resume`、`/autopilot-pause`、`/autopilot-stop`、`/autopilot-status`
- extension 通过 `sendUserMessage()` / queueing 驱动 phase continuation，而不是启动隐藏 session

### `P7.S4` — pause-resume-reconstruction-and-ui-hardening

目标：

- 把 interactive scheduler 做到可恢复、可暂停、可停止
- 补 runtime state persistence / reconstruction
- 补 widget / footer / overlay inspection hardening

### `P7.S5` — package-repositioning-closeout-and-headless-parity

目标：

- 把 `pi-sdk` 重新定位成 Pi-first package
- 文档、package surface、closeout truth 与 CLI secondary path 对齐
- 为下一阶段 interactive hardening / BB-fed evaluation continuation 提供干净 handoff

## Likely Files / Surfaces

### Primary docs / control plane

1. `docs/pi-native-interactive-autopilot-design-2026-04-16.md`
2. `docs/architecture.md`
3. `docs/pi-sdk-bb-integration-architecture.md`
4. `README.md`
5. `docs/plan/pi-sdk-pi-native-interactive-autopilot-2026-04-16_PLAN.md`
6. `docs/plan/pi-sdk-pi-native-interactive-autopilot-2026-04-16_STATUS.md`
7. `docs/plan/pi-sdk-pi-native-interactive-autopilot-2026-04-16_WORKSET.md`
8. `docs/plan/README.md`

### Primary code surfaces

9. `package.json`
10. `src/sdk/orchestrator.ts`
11. `src/extension/index.ts`
12. `src/shared/prompts.ts`
13. `src/shared/types.ts`
14. `src/shared/state-machine.ts`
15. `src/substrate/hydration.ts`
16. `src/substrate/index.ts`

### Likely new code surfaces

17. `src/autopilot/**`
18. targeted `test/*.test.ts` additions for shared core / extension driver parity

### Verification-only surfaces

19. `dist/**` — output truth only; not primary edit target
20. official Pi docs / official examples under the installed Pi package tree — read/reference only

## Risks / Blockers

1. **source / dist drift risk**
   - stale build outputs can pretend that interactive features exist when source does not actually implement them
2. **hidden-second-session regression**
   - the team may accidentally ship extension-triggered `runAutopilot()` and call it in-Pi
3. **extension state drift**
   - if pause/resume state lives only in memory, reload/tree navigation will corrupt scheduler behavior
4. **Pi-core temptation**
   - interactive scheduler pressure may tempt runtime/core changes too early
5. **local sovereign brain regression**
   - interactive convenience must not move truth/eval/learning back from `BB` into `pi-sdk`
6. **official-example bypass risk**
   - the implementation may skip official Pi patterns and invent repo-local glue too early
7. **live BB endpoint drift risk**
   - current local `bb-memory-mcp` endpoint may lag source and miss newer tools like `memory_autopilot_status`; interactive slices must treat this as environment drift, not as a license to redesign substrate truth locally

## Exit Criteria

1. build/source truth is honest and reproducible
2. shared autopilot core exists and is reusable by both drivers
3. primary interactive path runs inside the current Pi session
4. no hidden second session remains in the primary path
5. pause/resume/stop + reconstruction work honestly enough for interactive use
6. README/package/docs present `pi-sdk` as Pi-first interactive autopilot package with CLI secondary
7. `BB` remains the truth/eval/learning substrate; `pi-sdk` remains the workflow shell
