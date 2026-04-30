# PI SDK Autopilot Packaged Routed Skills Productization 2026-04-22 Plan

## Goal

把当前 `pi-sdk` 的 routed autopilot phase skills 从“宿主机全局隐式依赖”产品化为 `pi-sdk` package 自带的显式运行时能力：

> **让 `plan-creator` / `execute-plan` / `execution-reality-audit` 随 `pi-sdk` 一起发布、一起安装、一起验证，并让 runtime route resolution 以 package-owned skills 为主路径，`PI_CODING_AGENT_DIR` 只保留为兼容 fallback。**

完成后必须成立：

1. 安装 `pi-sdk` package 后，skill-backed autopilot phases 不再要求宿主机预先安装同名全局 skills 才能运行
2. routed phase contract 仍保持 deterministic、same-session、single-root `docs/plan/*`、以及 fail-fast stop-law
3. global skills 继续作为兼容/人工使用 surface 存在，但不再是 package runtime 的唯一依赖
4. packaged install / clean-room 验证能诚实证明“没有全局 skills 也能跑起来”

## Scope

### In scope

1. package-owned routed skill bundle
   - `skills/plan-creator/**`
   - `skills/execute-plan/**`
   - `skills/execution-reality-audit/**`
   - 需要把 `SKILL.md` 与其引用到的 `references/`、`assets/` 一起纳入 package
2. runtime route resolution
   - `src/autopilot/protocol.ts`
   - `src/extension/runtime-dispatch.ts`
   - 让 routed skill path 优先指向 package root 下的 `skills/*`
   - `PI_CODING_AGENT_DIR` 只保留为 compatibility fallback，不再是 primary truth
3. package manifest / doctor / smoke / proof
   - `package.json`
   - `src/substrate/manifest.ts`
   - packaged-install / autoload / command / bb-backed smoke
   - targeted tests for package-owned skill resolution and fallback behavior
4. docs and operator truth
   - `README.md`
   - `docs/architecture.md`
   - `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
   - this pack’s `PLAN / STATUS / WORKSET`
5. global skill compatibility audit
   - `/home/peng/.pi/agent/skills/plan-creator`
   - `/home/peng/.pi/agent/skills/execute-plan`
   - `/home/peng/.pi/agent/skills/execution-reality-audit`
   - 保证它们与 package-owned routed contract 不发生关键语义漂移

### Explicit non-goals

1. 不改当前 phase matrix：`master_plan / wave_plan / replan -> plan-creator`、`execute -> execute-plan`、`review -> execution-reality-audit`、`closeout -> repo-local prompt surface`
2. 不改 single-root `docs/plan/*` control-plane contract
3. 不把 `.pi/skills` generic project-local discovery 直接宣称成当前 runtime contract，除非代码真的支持
4. 不 patch Pi core
5. 不发明新的 global closeout skill
6. 不把 global skills 从宿主机上移除；这里只消除它们作为 package 运行时唯一依赖的地位

## Deliverables

### D1 — Package-owned routed skill bundle

1. repo 内存在 package-owned routed skill directories，且包含完整 `SKILL.md` + referenced `references/` + `assets/`
2. `package.json.files` / tarball 会把这些 skill directories 一起发布
3. 文档明确 package-owned routed skills 才是 autopilot runtime 的 primary shipped surface

### D2 — Runtime route resolution productization

1. routed skill path 优先解析到 package root 下的 `skills/*`
2. `PI_CODING_AGENT_DIR` fallback 仍然保留，但只作为兼容路径
3. missing packaged skill / missing fallback skill / blank skill file 的 fail-fast law 仍然成立

### D3 — Clean-room proof without host global skills

1. targeted tests 证明 package-owned routed paths 可解析
2. clean-room packaged install smoke 证明在隔离/空 agent-dir 情况下，skill-backed phases 仍然可运行
3. release/readiness surface 会诚实暴露 packaged skills 是否存在并被发布

### D4 — Docs and global-skill compatibility truth

1. README / architecture / runbook 明确说明 package-owned skill precedence 与 fallback 语义
2. active pack closeout truth 诚实记录“已去掉 global-only runtime dependency”还是仍有 residual
3. global skills 被重新审计，若和新 contract 有 drift，则修复或显式写成 residual

## Constraints

- if this pack runs under extension autopilot, each phase ends with exactly one `autopilot_report`
- active-slice phases use `stepId` equal to the active slice ID
- skill-backed phases require `selectedTools` that include at least `read` and `autopilot_report`
- default continuation is automatic; use `done_when` / `stop_boundary` instead of “ask whether to continue” as the normal stop law
- closeout remains the repo-local closeout prompt surface
- route resolution must work honestly in both repo checkout form and installed-package form
- packaged skill directories must ship enough files that `SKILL.md` references still resolve after install

## Verification

1. targeted tests for routed package skill resolution / fallback / missing-skill fail-fast
   - `test/phase-prompt.test.ts`
   - `test/extension.test.ts`
   - `test/run-manifest.test.ts`
   - `test/package-smoke.test.ts`
   - additional focused test file(s) if needed
2. `npm test`
3. `npm run typecheck`
4. `npm run build`
5. `npm run release:check`
6. `npm run smoke:packaged-install`
7. `npm run smoke:pi-autoload`
8. `npm run smoke:pi-commands`
9. `npm run smoke:pi-bb-backed`
10. targeted readback / `rg` proving docs and package manifest truth stay aligned

## Blockers / Risks

1. package-owned skills and global skills may drift if there is no bounded sync / audit rule
2. route resolution must be stable from both source checkout and installed tarball paths
3. smoke proofs may accidentally pass by touching host global skills unless isolation is explicit
4. packaging only `SKILL.md` without its referenced assets would create a broken “self-contained” claim
5. docs may overclaim `.pi/skills` support if runtime still only knows package-root + agent-dir paths

## Current Gaps / Constraints

1. `package.json` currently ships `dist`, `src`, `README.md`, and `docs/runbooks`, but not a routed `skills/*` bundle.
2. `src/autopilot/protocol.ts` currently builds skill routes under `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/.../SKILL.md`, so agent-dir skills are still the primary runtime source.
3. `src/extension/runtime-dispatch.ts` hard-stops on missing or blank routed `SKILL.md`, so productization must preserve fail-fast behavior while changing the primary source path.
4. `src/substrate/manifest.ts` doctor/readiness checks do not yet validate that routed skills are shipped inside the package.
5. `src/substrate/package-smoke.ts` currently proves clean-room install for CLI `--version` / `--doctor` / runbook presence, but not a skill-backed routed phase in an installed package.
6. current smoke scripts (`pi-autoload`, `pi-commands`, `pi-bb-backed`) prove the host environment and command surface, but not yet a fully isolated “no global skills available” routed execution path.
7. this pack must not reopen already verified contracts: deterministic phase matrix, same-session dispatch, single-root `docs/plan/*`, repo-local closeout prompt surface, or stop-law fail-fast.

## Master Waves

### Wave 1 — Freeze the package-owned skill bundle contract

- scope: finish `P1`
- objective: lock the shipped routed skill root, fallback order, drift-control rule, and exact file/test/doc surfaces before touching runtime logic
- why first: package layout, precedence, and audit policy are prerequisites for all later route-resolution and proof work
- validation: active-pack readback, targeted `rg`, `plan_sync`, and `test/control-plane.test.ts`

### Wave 2 — Land package-first routed skill resolution

- scope: execute `P2`
- objective: make runtime routing resolve package-owned `skills/*` first, demote `${PI_CODING_AGENT_DIR}` to compatibility fallback, and keep missing/blank skill fail-fast intact
- validation: focused route/dispatch tests, then `npm test`, `npm run typecheck`, `npm run build`

### Wave 3 — Prove clean-room packaged execution

- scope: execute `P3`
- objective: harden doctor and smoke surfaces so at least one installed-package proof runs skill-backed phases without host global skills
- validation: `npm run smoke:packaged-install`, `npm run smoke:pi-autoload`, `npm run smoke:pi-commands`, `npm run smoke:pi-bb-backed`, then `npm run release:check`

### Wave 4 — Align docs and compatibility surfaces, then close out

- scope: execute `P4`
- objective: restore parser-safe active-pack truth first, then rewrite operator docs to describe package-owned primary / global fallback truth, audit global skills for drift, and close out the pack honestly
- validation: targeted readback / `rg`, `plan_sync`, `workspace_scan`, and final regression evidence recorded in the pack

## Best First Wave To Execute Now

`Wave 1` is the best next wave because it freezes the highest-leverage product contract with the lowest risk: it decides the shipped skill root, fallback precedence, and drift-control rule before any code or smoke proof starts depending on the wrong bundle shape.

## Wave 1 Frozen Contract

### Routed skill root and fallback order

1. canonical package-owned routed skill root: `<packageRoot>/skills/{plan-creator,execute-plan,execution-reality-audit}/SKILL.md`
2. packaged skill directories must ship `SKILL.md` plus any referenced `references/**` and `assets/**`
3. runtime candidate order for skill-backed phases:
   - first: `${resolveAutopilotPackageRoot()}/skills/<skillName>/SKILL.md`
   - second: `${resolveAutopilotAgentDir()}/skills/<skillName>/SKILL.md`
4. dispatch uses the first resolvable candidate and still fails fast if the selected file is missing or blank
5. no generic project-local `.pi/skills` discovery is implied by this pack unless code later adds it explicitly

### Canonical ownership / drift-control rule

1. package-owned `skills/*` becomes the semantic source of truth for routed autopilot phases
2. agent-dir global skills remain compatibility and operator-facing mirrors only
3. any routed-skill semantic change must land in package-owned `skills/*` first; global mirrors are updated/audited against that package-owned source in `P4`, or the drift is recorded as residual truth

### Exact change surfaces frozen before implementation

1. package shipping: `package.json`, new `skills/plan-creator/**`, `skills/execute-plan/**`, `skills/execution-reality-audit/**`
2. runtime resolution: `src/autopilot/protocol.ts`, `src/extension/runtime-dispatch.ts`
3. doctor / manifest truth: `src/substrate/manifest.ts`, `test/run-manifest.test.ts`
4. route/dispatch tests: `test/phase-prompt.test.ts`, `test/extension.test.ts`, `test/extension-local-proof.test.ts`
5. clean-room proof surfaces: `src/substrate/package-smoke.ts`, `scripts/packaged-install-smoke.mjs`, `test/package-smoke.test.ts`, plus `pi-autoload` / `pi-commands` / `pi-bb-backed` smoke surfaces if isolation reinforcement is needed
6. docs and compatibility audit: `README.md`, `docs/architecture.md`, `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`, `/home/peng/.pi/agent/skills/{plan-creator,execute-plan,execution-reality-audit}/**`

### Wave 1 proof shape

1. planning/control-plane proof now: targeted readback, `rg`, `plan_sync`, `npx tsx --test test/control-plane.test.ts`
2. implementation proof next: routed-skill resolution and fail-fast tests plus `npm test`, `npm run typecheck`, `npm run build`
3. clean-room acceptance later: `npm run smoke:packaged-install` must prove at least one skill-backed routed phase works with an isolated or empty `PI_CODING_AGENT_DIR`, so success cannot come only from host global skills

## Slice Definitions

#### `P1` — package-owned routed skill bundle and contract freeze

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- 冻结 package-owned routed skills 的文件布局、发布边界、以及 route-resolution precedence contract

交付物：

1. 明确 package-owned routed skill root（计划采用 repo/package root 下的 `skills/*`）
2. `plan-creator` / `execute-plan` / `execution-reality-audit` 的 package-owned directories 与引用资源纳入本 repo 规划
3. `package.json` / doctor / manifest 需要验证的 packaged-skill surface 清单

done_when:

1. active design 明确 package-owned `skills/*` 是 runtime primary source，而 `PI_CODING_AGENT_DIR` 只是 compatibility fallback
2. plan 已明确哪些 skill files and referenced assets 必须一起发布，避免出现“只打包 SKILL.md”这种假自包含
3. 当前 active slice 的文件范围、验证梯子、以及 drift-control 风险都已明确到可直接执行

stop_boundary:

1. stop if the proposed design still leaves routed phases hard-pinned to global-only `PI_CODING_AGENT_DIR`
2. stop if the pack cannot name a bounded drift-control rule for package-owned skills vs global skills
3. stop if the chosen skill root cannot be resolved honestly from both repo checkout and installed-package form

必须避免：

1. 继续把 global skills 当成 invisible runtime dependency
2. 只打包 bare `SKILL.md` 而遗漏其引用到的 `references/` / `assets/`
3. 把 generic `.pi/skills` discovery 误写成已经 landed 的 runtime behavior

#### `P2` — runtime route resolution and dispatch fallback wiring

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 修改 runtime route resolution，让 package-owned routed skills 成为 deterministic primary path，并保留 agent-dir compatibility fallback

交付物：

1. `src/autopilot/protocol.ts` route matrix 能优先解析 package-owned skill paths
2. `src/extension/runtime-dispatch.ts` 在 package-owned / fallback / missing cases 上保持 honest fail-fast
3. focused tests 覆盖 repo checkout、installed package、fallback、blank skill、missing skill

done_when:

1. routed skill path resolution no longer assumes only `${PI_CODING_AGENT_DIR}/skills/.../SKILL.md`
2. dispatch still fails fast on missing or blank skill files, but now against the new primary/fallback contract
3. tests prove closeout prompt surface and same-session behavior were not widened or regressed

stop_boundary:

1. stop if runtime wiring requires Pi core changes instead of package-local code changes
2. stop if the new route logic weakens the existing fail-fast law into silent fallback
3. stop if the change blurs closeout routing or single-root control-plane ownership

必须避免：

1. 把 package-owned route 加成 another soft suggestion，而不是 primary deterministic path
2. 让 fallback 顺序变得隐式不可诊断
3. 为了 productization 重写无关的 phase semantics

#### `P3` — clean-room packaged proof without host global skills

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 用 clean-room proof 证明 package 自带 routed skills 后，已不再依赖宿主机全局 skills 才能跑通核心 autopilot surfaces

交付物：

1. packaged-install smoke or additional smoke path 在 empty/isolated agent-dir 下仍然通过
2. `smoke:pi-autoload` / `smoke:pi-commands` / `smoke:pi-bb-backed` 的至少一条路径显式避免 host global skills 假通过
3. release/readiness validation 不再把 host global skills 的存在当成默认前提

done_when:

1. acceptance proof can pass with routed skills coming from the installed `pi-sdk` package rather than the host global skill tree
2. at least one clean-room proof explicitly demonstrates that an empty/isolated `PI_CODING_AGENT_DIR` does not break skill-backed phases
3. validation output stays honest about what is proven in print-mode, RPC-mode, and packaged-install mode

stop_boundary:

1. stop if the proof still passes only because the test harness secretly seeds global skills outside the installed package
2. stop if clean-room packaging proof cannot distinguish package-owned skill success from host-environment leakage
3. stop if acceptance would need an unbounded integration environment outside repo-controlled verification

必须避免：

1. 用宿主机现有 global skills 掩盖 package 没带 skills 的问题
2. 只在 unit test 里证明 path string，没在 install/smoke surface 上证明可运行
3. 把 BB-backed smoke 的 bounded contract 扩写成 unrelated infra work

#### `P4` — docs, global-skill audit, and closeout truth

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- 更新 operator-facing docs，并重新审计系统全局 skills，让“package-owned primary / global fallback”这条 truth 写清楚且可恢复

交付物：

1. `README.md` / `docs/architecture.md` / runbook 写清 package-owned routed skill precedence、fallback、以及 recovery path
2. active pack closeout truth 诚实记录 packaged skill productization 的 landed scope、evidence、residuals
3. global skills compatibility audit 结果写回；若关键 routed contract drift，修复或显式转 residual

done_when:

1. docs no longer imply that host global skills are the only shipped runtime path
2. docs still describe `PI_CODING_AGENT_DIR` fallback honestly, without pretending project-local `.pi/skills` is already supported if code does not do that
3. global skills have been rechecked against the new routed contract and any remaining drift is explicit enough for future resume

stop_boundary:

1. stop if docs claim self-contained packaging without a clean-room proof
2. stop if closeout would hide package-vs-global skill drift behind prose-only claims
3. stop if docs imply a broader skill-discovery redesign than the code actually landed

必须避免：

1. 把 fallback 写成 primary source of truth
2. 在 docs 里再次制造 package-owned truth 与 global-skill truth 的双重叙事漂移
3. 省略 recovery guidance，导致换机/新环境时仍然靠隐式经验排障

执行顺序（replan after cold review）：

1. 先修复 active `WORKSET` 的 parser-safe `done_when` / `stop_boundary`，并保持 `README / STATUS / WORKSET` 对齐
2. 再更新 `README.md` / `docs/architecture.md` / runbook，让 package-owned primary、agent-dir fallback、clean-room proof、以及 recovery path 说法一致
3. 最后写回 routed global-skill audit 结果与 residuals，并重跑 control-plane / pack readback 验证

## Current Wave Execution Plan — `P4`

### Selected slice

- `P4` remains the highest-leverage bounded slice because runtime/package proof is already landed; the remaining risk is operator truth and honest closeout, not route resolution or proof mechanics.

### Likely file touches

1. `README.md`
2. `docs/architecture.md`
3. `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
4. `docs/plan/pi-sdk-autopilot-packaged-routed-skills-productization-2026-04-22_STATUS.md`
5. `docs/plan/pi-sdk-autopilot-packaged-routed-skills-productization-2026-04-22_WORKSET.md`
6. `docs/plan/README.md` only if needed to keep active-pack truth aligned after writeback

### Linear execution steps

1. read back current wording in `README.md`, `docs/architecture.md`, and the runbook; patch stale agent-dir-only or pre-`P3` smoke claims without changing runtime semantics
2. write the routed global-skill audit result into pack truth: record that `plan-creator`, `execute-plan`, and `execution-reality-audit` match between repo `skills/*` and `/home/peng/.pi/agent/skills/*`, and note that extra non-routed host-global skills remain outside this package-owned routed-skill scope
3. refresh pack `STATUS / WORKSET` evidence and closeout-ready residuals while keeping `P4` active until docs and audit truth are both landed
4. run the bounded validation ladder and only then hand off to execute/review for closeout readiness

### Validation ladder

1. targeted readback / `rg` over `README.md`, `docs/architecture.md`, `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`, and pack docs for `<packageRoot>/skills/*`, `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/*`, `smoke:packaged-install`, `smoke:pi-bb-backed`, and recovery wording
2. `npx tsx --test test/control-plane.test.ts`
3. `plan_sync`
4. reuse the already-passing routed-skill audit / clean-room proof evidence instead of reopening unrelated code surfaces

### Wave exit criteria

- operator docs consistently state package-owned routed skills are primary and `PI_CODING_AGENT_DIR` is explicit compatibility fallback
- clean-room proof scope is described honestly for packaged-install and BB-backed surfaces
- routed global-skill audit result and any residual recovery guidance are written into active pack truth
- `npx tsx --test test/control-plane.test.ts` and `plan_sync` both pass after writeback

## Exit Criteria

- active and queued slices carry concrete `done_when` / `stop_boundary`
- package-owned `skills/*` is the declared runtime primary path for routed phases
- runtime route resolution keeps deterministic fail-fast behavior while demoting agent-dir skills to compatibility fallback
- clean-room acceptance proves the package no longer requires host global routed skills to run skill-backed phases
- docs and global-skill audit remain explicit and truthful
- review handoff remains explicit
- if the workstream reaches terminal completion, closeout uses the repo-local closeout prompt surface
