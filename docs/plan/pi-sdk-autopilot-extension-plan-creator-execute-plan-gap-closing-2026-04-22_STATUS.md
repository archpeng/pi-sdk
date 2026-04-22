# PI SDK Autopilot Extension × Plan-Creator × Execute-Plan Gap Closing 2026-04-22 Status

## Current State

- state: `READY_FOR_EXECUTION`
- owner: `execute-plan`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> CLOSEOUT`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `autopilot extension × plan-creator × execute-plan gap closing`
- predecessor_pack: `pi-sdk-extension-driver-thinning-follow-up-2026-04-21` (closed out)
- execution_boundary: `extension/runtime/skill/control-plane alignment only; no hidden second session and no Pi core patch`

## Current Step

- active_step: `G1`
- mode: `plan_created`
- why_now:
  1. `pi-sdk` extension 已经具备同 session 自动 phase progression，但 phase prompt 还没有 deterministic 地硬绑定到 skill surface
  2. global `plan-creator` / `execute-plan` 仍落后于当前 autopilot runtime protocol，尤其缺少 `autopilot_report`、`stepId`、no-ask continuation、`selectedTools`、`done_when / stop_boundary`
  3. `src/substrate/local.ts` 还只有 single-root `docs/plan/*` control-plane truth，而 skill docs 已经假设 dual-root `docs/active/* + docs/plan/*`
  4. 目前还没有 skill-aware e2e proof，证明 runtime 是 deterministic 地 route 到 skill 并写回 truth，而不是碰巧让模型用了 skill

## Planned Stages

- [ ] `G1` phase-skill-routing-contract-freeze
- [ ] `G2` extension-phase-router-and-skill-aware-dispatch
- [ ] `G3` skill-and-template-protocol-alignment
- [ ] `G4` dual-root-local-substrate-support
- [ ] `G5` done-when-stop-boundary-parser-prompt-runtime-gate
- [ ] `G6` skill-aware-end-to-end-proof
- [ ] `G7` docs-regression-and-closeout

## Immediate Focus

### `G1`

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- 冻结 deterministic phase -> skill / prompt routing contract，以及 missing-skill / wrong-route / selected-tools fail-fast law

必须交付：

1. canonical phase routing matrix
2. chosen dispatch encoding for skill-bound phases
3. explicit fail-fast / test-surface contract for missing skill, wrong route, missing `autopilot_report`, and wrong `stepId`

必须避免：

1. 继续依赖“模型可能自己会用 skill”的 implicit routing
2. 让 review / closeout surface 继续保持模糊
3. 在没有 ownership 说明的前提下直接扩写 global skills 和 dual-root truth

## Machine State

- active_step: `G1`
- intended_handoff: `execute-plan`
- active_pack: `pi-sdk-autopilot-extension-plan-creator-execute-plan-gap-closing-2026-04-22`
- next_planned_step: `G2`

## Recently Completed

- [x] static analysis completed for `pi-sdk` extension, global `plan-creator`, and global `execute-plan`
- [x] baseline regression ladder executed before new active-pack activation:
  - `npm run typecheck`
  - `npm run build`
  - `npx tsx --test test/engine.test.ts test/phase-prompt.test.ts test/control-plane.test.ts test/extension-support.test.ts test/extension-rebuild.test.ts test/extension-local-proof.test.ts test/extension.test.ts test/pi-bb-backed-smoke.test.ts`

## Next Step

- execute `G1` to freeze phase-skill injection strategy, review/closeout surface choice, and missing-skill / selected-tools stop law
- keep the next handoff singular: if `G1` lands cleanly, advance directly to `G2`

## Blockers

- no active blocker for plan creation itself
- execution risk: global skills live outside repo root, so `G1` must explicitly freeze ownership / writeback expectations for cross-root skill updates

## Gate State

- active_pack_created: `PASS`
- active_slice_singular: `PASS`
- hard_phase_skill_binding_landed: `PENDING`
- skill_protocol_alignment_landed: `PENDING`
- dual_root_local_substrate_landed: `PENDING`
- done_when_stop_boundary_gate_landed: `PENDING`
- skill_aware_e2e_proof_landed: `PENDING`

## Latest Evidence

- static analysis evidence:
  - global `plan-creator` / `execute-plan` skills currently do not encode `autopilot_report`, `stepId`, no-ask continuation, `selectedTools`, or compaction/runtime rules as first-class contract
  - `pi-sdk` extension already supports same-session phase continuation, compaction-aware resume, active-slice `stepId` validation, and single-root local writeback
  - local substrate currently does not implement `docs/active/*` dual-root parsing/writeback
  - `done_when / stop_boundary` appear in planning intent, but not as enforced runtime fields in source
- baseline verification evidence:
  - `npm run typecheck` → pass
  - `npm run build` → pass
  - `npx tsx --test test/engine.test.ts test/phase-prompt.test.ts test/control-plane.test.ts test/extension-support.test.ts test/extension-rebuild.test.ts test/extension-local-proof.test.ts test/extension.test.ts test/pi-bb-backed-smoke.test.ts` → pass (`48` tests)

## Notes

- this pack is the explicit successor for closing the runtime/skill/control-plane gap identified in the current autopilot implementation
- current repo remains single-root in production truth until `G4` lands dual-root support
