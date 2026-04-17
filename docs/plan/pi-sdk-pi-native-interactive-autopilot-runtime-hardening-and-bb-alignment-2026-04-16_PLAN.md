# PI SDK Pi-Native Interactive Autopilot Runtime Hardening and BB Alignment 2026-04-16 Plan

## Goal

在已关闭的 `P7` Pi-first refactor 之上，把 `pi-sdk` 推进到一个 **更可运营、更诚实暴露 BB substrate 状态、且更易继续执行** 的下一阶段。

固定目标：

- 保持 `pi-sdk` 为 **Pi-native interactive workflow shell + shared headless driver**
- 不回退到 hidden second-session path
- 不把 truth / eval / learning 从 `BB` 拉回本地
- 把当前 residual 聚焦为：
  1. repo-local runtime/operator hardening
  2. degraded-mode / live-BB alignment truth
  3. optional operator visibility surfaces only when they stay within current repo-owned seams

## Scope

本计划聚焦 **P8 — runtime hardening and BB alignment after the Pi-first refactor**：

1. 冻结 post-P7 的 owner boundary
   - 什么属于 repo-local hardening
   - 什么属于 live environment / BB-side alignment
   - 什么必须 stop instead of local invention
2. harden repo-local degraded-mode truth
   - interactive / headless driver 在 BB tools 缺失或 endpoint 漂移时要更诚实
   - warnings / status / operator-facing evidence 要能被看见
3. add bounded operator visibility surfaces
   - 只在符合官方 Pi examples / TUI patterns 且不新增 host runtime 的前提下推进
   - optional overlay / richer runtime inspection 仅作为 bounded repo-local surface
4. align with live BB reality only through bounded probes / handoff-ready evidence
   - 如果需要 restart / redeploy / BB repo changes，则明确停在环境边界，不在 `pi-sdk` 本地发明补偿 truth
5. 形成可继续交给 `execute-plan` 的完整 slice ladder与 closeout 证据

本计划保持 **单 repo workstream**，控制面仍只锚定：

- `/home/peng/dt-git/github/pi-sdk/docs/plan`

## Design Basis

主要 SSOT：

- `/home/peng/dt-git/github/pi-sdk/docs/pi-native-interactive-autopilot-design-2026-04-16.md`
- `/home/peng/dt-git/github/pi-sdk/docs/architecture.md`
- `/home/peng/dt-git/github/pi-sdk/docs/pi-sdk-bb-integration-architecture.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-pi-native-interactive-autopilot-2026-04-16_STATUS.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-pi-native-interactive-autopilot-2026-04-16_WORKSET.md`

必须保持的设计规则：

1. **official Pi docs / official examples first**
2. **the current Pi session remains the primary interactive execution surface**
3. **no Pi core patch**
4. **BB remains truth / eval / learning substrate**
5. **repo-local hardening must not become local truth invention**

## Non-Goals

1. 不 reopen `P7` 的 Pi-first shape decision
2. 不把 extension 再变成 hidden second-session wrapper
3. 不在 `pi-sdk` 内创建 benchmark / promotion / learning local registry
4. 不把 live BB service restart / redeploy 本身伪装成 repo-local implementation 完成
5. 不在本计划内扩写 `boston-bot-vp` active control plane
6. 不在没有明确 owner boundary 前直接把 overlay/UI 与 BB runtime probes 混成一个大切片

## Deliverables

### D1 — Post-P7 Boundary Freeze

1. 清楚冻结 P8 里哪些项是 repo-local hardening
2. 清楚冻结哪些项是 environment / BB-side alignment
3. 清楚命名 stop boundary：什么时候必须停并交回 replan / human / ops

### D2 — Repo-Local Degraded-Mode Hardening

1. interactive / headless path 在 substrate warnings、missing BB tools、endpoint drift 时能更诚实输出状态
2. warning surfaces 不只存在于 stderr，而能进入 operator-facing status / summary / tests
3. targeted tests 覆盖 degraded-mode / warning propagation / status truth

### D3 — Operator Visibility Surface (Bounded)

1. optional overlay inspector / richer runtime panel only if it stays within official Pi patterns
2. 当前 goal / phase / warnings / next action / stop boundary 对操作者更直观
3. 不新建 TUI app，不引入新的 host runtime

### D4 — Live BB Alignment Evidence or Stop Handoff

1. bounded probes 明确 live endpoint 是否已具备 `memory_autopilot_status` / canary / strategy feedback tools
2. 若 local service 仍 stale，则留下 handoff-ready residual，而不是在本 repo 编造替代路径
3. 若环境已对齐，记录 live smoke evidence

### D5 — Closeout / Successor Handoff

1. `PLAN / STATUS / WORKSET` 与结果一致
2. pack closeout honest, or stop-handoff honest
3. 下一阶段若存在，已被清楚命名

## Verification Ladder

### Planning / boundary validation

1. `docs/plan/*` 新 pack 存在且 `README.md` 指向该 active pack
2. `PLAN / STATUS / WORKSET` 对 active slice、目标、验证、stop boundary 的描述一致
3. 当前 active slice 不需要执行者临场猜 owner split

### When `P8.S1` lands

1. repo-local hardening vs environment / BB alignment split 被明确写死
2. 下一 slice 的 touched surfaces 与验证方式已命名
3. stop boundary 明确写出：需要 BB restart/redeploy 或 BB repo code changes 时不在 `pi-sdk` 本地补偿发明

### When `P8.S2` lands

1. targeted tests cover warning / degraded-mode propagation
2. `npm test`
3. `npm run typecheck`
4. `npm run build`
5. CLI / extension status surfaces stay consistent with the degraded-mode contract

### When `P8.S3` lands

1. operator visibility surface follows official Pi UI/TUI patterns
2. no hidden second runtime/UI is introduced
3. targeted extension/UI tests prove overlay or richer status is reconstructible and honest

### When `P8.S4` lands

1. live BB alignment proof exists, or
2. an explicit stop-handoff artifact exists stating the exact missing environment step
3. no local truth path or fallback registry was invented to fake success

### When `P8.S5` lands

1. pack closeout docs are synchronized
2. residuals are explicitly named
3. next successor target, if any, is clear and bounded

## Execution Outline

### `P8.S1` — post-p7-runtime-hardening-and-live-bb-boundary-freeze

目标：

- 把 P7 closeout residual 聚成一个可执行的下一阶段
- 冻结 repo-local hardening vs live-BB alignment 的 owner boundary
- 让 `execute-plan` 在下一刀开始前不用猜 scope

### `P8.S2` — degraded-mode-and-operator-warning-hardening

目标：

- 加强 repo-local warning propagation / operator truth
- 让 interactive / headless path 对 missing BB tools、endpoint drift、fail-open 状态更诚实可见
- 用 targeted TDD 覆盖 warning/status/closeout truth

### `P8.S3` — bounded-operator-visibility-surface-mvp

目标：

- 只在 current repo-owned seams 内落 bounded operator visibility surface
- 优先用 status/widget/overlay 的官方 Pi patterns
- 不扩成新的 UI runtime

### `P8.S4` — live-bb-alignment-smoke-or-stop-handoff

目标：

- 在 repo-local code hardening完成后，做 bounded live BB alignment proof
- 若环境仍 stale，则留下明确 stop-handoff
- 若环境已 ready，则记录 live smoke evidence

### `P8.S5` — closeout-and-next-phase-handoff

目标：

- 完成 control-plane closeout
- 汇总验证与 residual
- 把下一阶段收敛到新的 successor theme，而不是 reopen 本 pack

## Likely Files / Surfaces

### Control plane

1. `docs/plan/pi-sdk-pi-native-interactive-autopilot-runtime-hardening-and-bb-alignment-2026-04-16_PLAN.md`
2. `docs/plan/pi-sdk-pi-native-interactive-autopilot-runtime-hardening-and-bb-alignment-2026-04-16_STATUS.md`
3. `docs/plan/pi-sdk-pi-native-interactive-autopilot-runtime-hardening-and-bb-alignment-2026-04-16_WORKSET.md`
4. `docs/plan/README.md`

### Primary repo-local code surfaces likely in later execution

5. `src/extension/index.ts`
6. `src/autopilot/state.ts`
7. `src/autopilot/closeout.ts`
8. `src/sdk/orchestrator.ts`
9. `src/substrate/hydration.ts`
10. `src/substrate/index.ts`
11. `src/substrate/runtime.ts`
12. `README.md`
13. `docs/architecture.md`
14. `docs/pi-sdk-bb-integration-architecture.md`

### Primary test surfaces likely in later execution

15. `test/extension.test.ts`
16. `test/extension-rebuild.test.ts`
17. `test/state.test.ts`
18. new targeted tests for degraded-mode / warning propagation / operator status truth

### External/read-only anchors

19. official Pi docs / examples under installed package tree
20. live local BB endpoints only as runtime probe targets, not as repo-local truth surfaces

## Risks / Blockers

1. **workspace already dirty**
   - claims must remain tightly scoped and evidence-based
2. **live BB endpoint drift**
   - local running `bb-memory-mcp` may still be behind the landed source surface
3. **boundary creep**
   - operator visibility work may sprawl into BB restart/redeploy or BB repo implementation
4. **local fallback temptation**
   - missing live BB tools may tempt local fake state/registry paths
5. **official-pattern bypass risk**
   - overlay/UI work may drift away from official Pi patterns and become bespoke glue

## Exit Criteria

1. P8 owner boundary is explicit and stable
2. repo-local degraded-mode/operator truth is hardened with tests
3. optional operator visibility surface, if landed, stays bounded and Pi-native
4. live BB alignment is either proven or cleanly stopped with handoff evidence
5. closeout docs are synchronized and honest
