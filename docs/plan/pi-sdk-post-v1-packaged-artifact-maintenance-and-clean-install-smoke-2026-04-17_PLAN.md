# PI SDK Post-V1 Packaged Artifact Maintenance and Clean Install Smoke 2026-04-17 Plan

## Goal

在已关闭的 `P13` v1 productization pack 之后，进入一个 bounded 的 post-v1 maintenance successor：

> **把当前 v1 package/readiness residual 收敛成“可打包、可安装、可在 clean-room 安装后做 bounded diagnostics”的真实 maintenance guard。**

固定目标：

- 保持 `pi-sdk` 为 **Pi-first, session-native interactive workflow shell + shared headless driver**
- 保持 `BB` 为 truth / benchmark / promotion / eval / learning owner
- 不为了 maintenance reopen `P10` / `P11` / `P12` / `P13` 的 owner-boundary 决策
- 不发明第二套 truth path 或本地 benchmark/eval/promotion state
- 保持 control plane **单根锚定** 于 `/home/peng/dt-git/github/pi-sdk/docs/plan`

## Scope

本计划聚焦一个明确的 post-v1 maintenance residual：

1. 冻结 clean-room packaged-install smoke 的 bounded scope 与 stop law
2. 落地真实的 packaged artifact install smoke harness
3. 修正/稳定 v1 diagnostics，使其对 repo checkout 与 installed package 都诚实
4. 把 packaged-install smoke 纳入 scriptable maintenance acceptance gate
5. 完成 closeout 并把后续工作收敛到新的 maintenance/backlog handoff

## Design Basis

主要 SSOT：

- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-autopilot-productization-and-v1-release-readiness-2026-04-17_STATUS.md`
- `/home/peng/dt-git/github/pi-sdk/docs/plan/pi-sdk-autopilot-productization-and-v1-release-readiness-2026-04-17_WORKSET.md`
- `/home/peng/dt-git/github/pi-sdk/README.md`
- `/home/peng/dt-git/github/pi-sdk/package.json`
- `/home/peng/dt-git/github/pi-sdk/src/sdk/orchestrator.ts`
- `/home/peng/dt-git/github/pi-sdk/src/substrate/manifest.ts`
- `/home/peng/dt-git/github/pi-sdk/scripts/release-readiness-check.mjs`
- `/home/peng/dt-git/github/pi-sdk/docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
- `/home/peng/.local/lib/node-v24.14.1-linux-arm64/lib/node_modules/@mariozechner/pi-coding-agent/docs/packages.md`

## Non-Goals

1. 不做 npm publish / registry release automation
2. 不 reopen BB owner-boundary 或 v1 product stance
3. 不新增 learned-component / benchmark / promotion features
4. 不 patch Pi core / extension runtime
5. 不把 maintenance pack 扩写成泛化 CI/platform overhaul

## Deliverables

### D1 — Maintenance Boundary Freeze

`M1.S1` 需要冻结：

1. active residual = clean-room packaged-install smoke still unproven in the installed-package shape
2. maintenance proof target = tarball -> temp project install -> bounded CLI/doctor validation
3. explicit stop law：
   - stop if smoke requires real publish/registry side effects
   - stop if installed-package diagnostics require inventing repo-only truth assumptions

### D2 — Packaged Artifact Install Smoke Harness

`M1.S2` 需要提供：

1. scriptable smoke harness that packs the current repo and installs it into a clean temp project
2. bounded verification inside the installed package:
   - CLI version/readiness surface
   - doctor/readiness diagnostics
   - packaged runbook presence
3. targeted TDD for the harness and/or helper logic

### D3 — Installed-Package Diagnostics Truth Alignment

`M1.S3` 需要提供：

1. repo checkout diagnostics and installed-package diagnostics 都诚实
2. doctor/readiness checks 不再假设所有 repo-only dev docs 必须存在于 installed tarball
3. runbook / manifest / README 与 maintenance smoke surface 同步

### D4 — Maintenance Acceptance Gate

`M1.S4` 需要提供：

1. scriptable gate 包含 packaged-install smoke
2. gate 可重复执行、结果可记录
3. 继续保留已有 tests/typecheck/build/help/version/manifest/doctor/dry-run checks

### D5 — Closeout and Maintenance Handoff

`M1.S5` 需要提供：

1. `PLAN / STATUS / WORKSET` 与结果一致
2. closeout verdict 与 residual 清楚
3. 后续 work routed to a fresh maintenance/backlog pack instead of reopening this pack

## Verification Ladder

### Planning / control-plane validation

1. 新 pack 存在：`_PLAN.md / _STATUS.md / _WORKSET.md`
2. `docs/plan/README.md` 指向该 active pack
3. active slice singular、stop boundary explicit、validation shape explicit
4. 明确说明：这是 post-v1 maintenance successor，而不是 reopen `P13`

### When `M1.S2` lands

1. packaged-install smoke harness code/script 存在
2. targeted TDD 覆盖 helper/contract
3. bounded clean-room install smoke 可运行

### When `M1.S3` lands

1. doctor/readiness checks no longer falsely require repo-only artifacts inside installed tarball
2. README/runbook/manifest 与 smoke surface 同步

### When `M1.S4` lands

1. `npm test`
2. `npm run typecheck`
3. `npm run build`
4. `node dist/sdk/orchestrator.js --help`
5. `node dist/sdk/orchestrator.js --version`
6. `node dist/sdk/orchestrator.js --print-manifest`
7. `node dist/sdk/orchestrator.js --doctor`
8. `npm pack --dry-run`
9. `npm run smoke:packaged-install`
10. `npm run release:check`

### When `M1.S5` lands

1. closeout docs synchronized
2. residuals explicitly named
3. next maintenance handoff clear and bounded

## Execution Outline

### `M1.S1` — maintenance-boundary-freeze

目标：

- 把 post-v1 residual 收敛到 packaged-install smoke
- 冻结 stop law，避免 maintenance pack 漫游

### `M1.S2` — packaged-artifact-install-smoke-harness

目标：

- 用 TDD 落地 clean-room tarball install smoke harness
- 证明 installed package 可运行 bounded diagnostics

### `M1.S3` — installed-package-diagnostics-truth-alignment

目标：

- 对齐 repo doctor 与 installed-package doctor 的 honest boundary
- 同步 manifest / README / runbook

### `M1.S4` — maintenance-acceptance-gate

目标：

- 把 packaged-install smoke 纳入 scriptable acceptance/maintenance gate
- 留下可复跑证据

### `M1.S5` — closeout-and-next-maintenance-handoff

目标：

- 完成 control-plane closeout
- 写清楚后续 maintenance/backlog route

## Pack-Level Stop Boundary

在以下情况必须 stop / handoff，而不是扩写补偿逻辑：

1. clean-room smoke 需要真实 publish/registry side effects
2. installed-package diagnostics 只能通过 repo-only hidden context 才能通过
3. maintenance work开始重开 architecture / truth ownership boundary
4. proof 只能通过 ad hoc undocumented steps 才能成立

## Exit Criteria

满足以下条件时，本 post-v1 maintenance pack 可以 honest closeout：

1. clean-room packaged-install smoke 已有真实脚本与证据
2. installed-package diagnostics boundary 已对齐且诚实
3. acceptance gate 已纳入 packaged-install smoke 并通过
4. closeout 与后续 handoff 已同步回 control plane
