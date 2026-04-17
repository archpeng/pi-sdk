# PI SDK Autopilot Productization and V1 Release Readiness 2026-04-17 Plan

## Goal

在已关闭的 `P12` first-learned-component pack 之上，进入路线图中的最终交付阶段：

> **完成 `pi-sdk` 的 productization / packaging / operator runbook / acceptance gate，并形成 evidence-backed 的 v1 release-readiness closeout。**

固定目标：

- 保持 `pi-sdk` 为 **Pi-first, session-native interactive workflow shell + shared headless driver**
- 保持 `BB` 为 truth / benchmark / promotion / eval / learning owner
- 不为了 productization 重新打开核心架构边界
- 不在 `pi-sdk` 外另造第二套 truth path
- 保持 control plane **单根锚定** 于 `/home/peng/dt-git/github/pi-sdk/docs/plan`

## Scope

本计划聚焦 **P13 — autopilot productization and v1 release readiness**：

1. 冻结 v1 release-readiness 边界与 stop law
2. 落地 packaging / versioning / install-upgrade discipline
3. 形成 operator runbook 与 recovery / diagnostics bundle
4. 落地 production-like smoke / regression / acceptance gate
5. 完成 v1 closeout 与 post-v1 handoff

## Design Basis

主要 SSOT：

- `/home/peng/dt-git/github/pi-sdk/docs/roadmap/pi-sdk-autopilot-endgame-roadmap-2026-04-17.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17_STATUS.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17_WORKSET.md`
- `/home/peng/dt-git/github/pi-sdk/README.md`
- `/home/peng/dt-git/github/pi-sdk/docs/architecture.md`
- `/home/peng/dt-git/github/pi-sdk/docs/pi-sdk-bb-integration-architecture.md`
- `/home/peng/.local/lib/node-v24.14.1-linux-arm64/lib/node_modules/@mariozechner/pi-coding-agent/docs/packages.md`
- `/home/peng/.local/lib/node-v24.14.1-linux-arm64/lib/node_modules/@mariozechner/pi-coding-agent/docs/extensions.md`

## Non-Goals

1. 不重新打开 `P10` / `P11` / `P12` 的 owner-boundary 决策
2. 不把 BB-owned truth / authority / advisory / eval 拉回本地 durable state
3. 不 patch Pi core / extension runtime
4. 不在 `P13` 混入新的 learned-component widening
5. 不把 acceptance 变成 undocumented ad hoc shell ritual

## Deliverables

### D1 — V1 Release-Readiness Boundary Freeze

`P13.S1` 需要冻结：

1. v1 的交付对象：
   - Pi package install shape
   - CLI/headless secondary driver
   - BB-aware substrate modes
   - operator-facing diagnostics/readiness evidence
2. v1 的最小 acceptance ladder：
   - targeted tests
   - repo typecheck/build
   - CLI help/version/readiness diagnostics
   - dry-run packaging evidence
3. explicit stop law：
   - 若 release-readiness 需要重开核心架构边界，则 stop
   - 若 acceptance 只能靠 undocumented manual tribal steps，则 stop

### D2 — Packaging / Versioning / Install-Upgrade Discipline

`P13.S2` 需要提供：

1. 稳定的 package identity / entrypoint / version visibility
2. 可复用的 install / upgrade / package-manifest truth
3. repo-local TDD covering the release/readiness manifest or equivalent entrypoint behavior
4. scriptable release-check surface，而不是仅靠 README prose

### D3 — Operator Runbook and Recovery / Diagnostics Bundle

`P13.S3` 需要提供：

1. operator-facing install / upgrade / recovery / diagnostics runbook
2. diagnostics bundle or equivalent bounded runtime/readiness surface
3. repo-local docs 与 code-level diagnostics surface 一致

### D4 — Production-Like Smoke / Regression / Acceptance Gate

`P13.S4` 需要提供：

1. 一个可重复执行的 acceptance gate
2. gate 覆盖：
   - tests
   - typecheck
   - build
   - CLI help / version / diagnostics
   - packaging dry-run
3. 证据必须可复跑，不能只写“理论上可行”

### D5 — V1 Closeout and Post-V1 Roadmap Handoff

`P13.S5` 需要提供：

1. `PLAN / STATUS / WORKSET` 与结果同步
2. v1 closeout verdict 明确
3. residual / post-v1 handoff 明确

## Verification Ladder

### Planning / control-plane validation

1. 新 pack 存在：`_PLAN.md / _STATUS.md / _WORKSET.md`
2. `docs/plan/README.md` 指向该 active pack
3. active slice singular、stop boundary explicit、validation shape explicit
4. 明确说明：这是 roadmap 中 `P13` 的 materialized active pack
5. 明确说明：`P12` 已 closed，当前工作不得 reopen `P12`

### When `P13.S2` lands

1. release/readiness manifest or equivalent code surface 存在
2. targeted TDD 覆盖 packaging/version/install-upgrade 行为
3. package scripts/readiness entrypoints 已同步

### When `P13.S3` lands

1. operator runbook 存在
2. diagnostics/readiness surface 可被 runbook 消费
3. README/docs 与 code-level readiness surface 同步

### When `P13.S4` lands

1. acceptance gate 可重复执行
2. `npm test`
3. `npm run typecheck`
4. `npm run build`
5. `node dist/sdk/orchestrator.js --help`
6. `node dist/sdk/orchestrator.js --version`
7. `node dist/sdk/orchestrator.js --doctor`
8. `npm pack --dry-run`

### When `P13.S5` lands

1. closeout docs synchronized
2. residuals explicitly named
3. post-v1 handoff clear and bounded

## Execution Outline

### `P13.S1` — v1-release-readiness boundary freeze

目标：

- 冻结 v1 交付范围、verification ladder 与 stop law
- 明确 productization 不能靠 reopen architecture 来“假装完整”

### `P13.S2` — packaging/versioning/install-upgrade discipline

目标：

- 落地稳定的 package/release/readiness manifest or equivalent code surface
- 提供 CLI 或 scriptable version/readiness visibility
- 用 targeted TDD 固定行为

### `P13.S3` — operator runbook and recovery/diagnostics bundle

目标：

- 将 install / upgrade / diagnostics / recovery 收敛成 operator runbook
- 保证 runbook 指向真实可运行 surface，而不是抽象 prose

### `P13.S4` — production-like smoke/regression/acceptance gate

目标：

- 把 acceptance gate 变成可复跑脚本/命令面
- 留下 release-readiness 证据

### `P13.S5` — v1 closeout and post-v1 roadmap handoff

目标：

- 完成 control-plane closeout
- 写清楚 v1 verdict、residual 与 post-v1 route

## Pack-Level Stop Boundary

在以下情况必须 stop / handoff，而不是扩写本地补偿逻辑：

1. release-readiness 需要重开核心 architecture/owner-boundary 决策
2. packaging/install-upgrade truth 需要发明第二套 package/runtime truth path
3. acceptance 只能通过 ad hoc undocumented steps 才能证明
4. 需要 patch Pi core 才能完成 operator/release surface

## Exit Criteria

满足以下条件时，`P13` 可以 honest closeout：

1. v1 release/readiness 边界已冻结并与实际代码一致
2. packaging/version/install-upgrade discipline 真实落地并有 TDD
3. operator runbook 与 diagnostics bundle 已同步
4. acceptance gate 已真实执行并留下证据
5. closeout 与 post-v1 handoff 已同步回 control plane
