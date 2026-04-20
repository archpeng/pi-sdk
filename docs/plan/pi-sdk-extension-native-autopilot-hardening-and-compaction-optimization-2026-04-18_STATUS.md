# PI SDK Extension-Native Autopilot Hardening and Compaction Optimization 2026-04-18 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- route: `PLAN -> O1 -> REVIEW -> REPLAN -> O2 -> REVIEW -> REPLAN -> O3 -> REVIEW -> REPLAN -> O4 -> REVIEW -> REPLAN -> O5 -> CLOSEOUT`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `pi-sdk extension-native autopilot hardening and compaction optimization`
- control_plane_anchor: `/home/peng/dt-git/github/pi-sdk/docs/plan`
- predecessor_pack: `pi-sdk-final-residual-clean-startup-route-bb-backed-capability-proof-2026-04-17` (closed out)
- execution_boundary: `single active control plane anchored only in pi-sdk/docs/plan`
- pack_kind: `fresh post-completion optimization pack`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `O1 -> O5 executed with TDD-first slices, stage review, full regressions, and closeout`
- why_done:
  1. `O1` landed a prompt-level and runtime-level continuation contract so autopilot no longer defaults to ask-for-permission language while running
  2. `O2` landed `session_compact` rebuild + auto-redispatch so compaction no longer acts as an automatic stop point
  3. `O3` landed proactive context-pressure compaction gating in `turn_end`
  4. `O4` landed a goal-directed decision rubric plus optional structured route-decision report fields
  5. `O5` proved the compaction continuation chain with an e2e-like targeted test and cleared final full regressions

## Completed Stages

- [x] `O1` continuation-contract hardening
- [x] `O2` compaction-aware resume
- [x] `O3` proactive context-pressure compaction
- [x] `O4` goal-directed decision rubric
- [x] `O5` verification and operator proof

## Closeout Summary

### `O1`

- added explicit no-ask continuation rules to `src/autopilot/phase-prompt.ts`
- added `before_agent_start` continuation contract injection in `src/extension/index.ts`
- locked the behavior with targeted tests in:
  - `test/phase-prompt.test.ts`
  - `test/extension.test.ts`

### `O2`

- wired `session_compact` in `src/extension/index.ts`
- compact completion now rebuilds runtime truth and auto-redispatches when the restored runtime remains runnable
- added targeted tests covering:
  - running + ready redispatch
  - paused rebuild without redispatch

### `O3`

- added proactive context-pressure gating in `turn_end`
- high token pressure now triggers `ctx.compact(...)` instead of immediately dispatching the next phase
- added targeted test proving compact preempts direct redispatch under high context pressure

### `O4`

- added goal-directed route-selection guidance to the shared prompt protocol
- expanded `AutopilotReport` / `autopilot_report` with optional decision metadata:
  - `decisionMode`
  - `decisionBasis`
  - `candidateRoutes`
- kept the work inside existing shared-core + extension seams without adding a second session

### `O5`

- added an e2e-like targeted test for:
  - high-context `turn_end`
  - proactive `ctx.compact()`
  - subsequent `session_compact`
  - rebuild
  - auto-redispatch continuation
- used the widened test suite plus full regressions as the final acceptance gate

### Post-closeout extension

- continued the same pack with two bounded post-closeout follow-up slices requested by the user:
  1. stronger goal-directed decision-state consumption and operator visibility
  2. stronger live-smoke evidence beyond bounded text-only runtime output
- landed decision-state visibility in:
  - status lines
  - widget/overlay surfaces
  - closeout summaries
- widened the live BB-backed smoke evidence so the rpc route now also proves session artifact truth:
  - rpc session file count
  - rpc session entry types
  - `autopilot-runtime-state` presence

## Verification Evidence

- [x] targeted `O1` verification:
  - `npx tsx --test test/phase-prompt.test.ts`
  - `npx tsx --test test/extension.test.ts`
  - `npx tsx --test test/extension-rebuild.test.ts`
- [x] targeted `O2` verification:
  - `npx tsx --test test/extension.test.ts`
  - `npx tsx --test test/extension-rebuild.test.ts`
- [x] targeted `O3` verification:
  - `npx tsx --test test/extension.test.ts`
- [x] targeted `O4` verification:
  - `npx tsx --test test/phase-prompt.test.ts`
  - `npx tsx --test test/extension.test.ts`
  - `npx tsx --test test/state.test.ts`
- [x] targeted `O5` verification:
  - `npx tsx --test test/extension.test.ts`
  - includes `high-context compaction flow preserves autopilot continuation end-to-end`
- [x] post-closeout targeted verification:
  - `npx tsx --test test/extension.test.ts test/closeout.test.ts`
  - `npx tsx --test test/pi-bb-backed-smoke.test.ts`
- [x] final full regressions:
  - `npm test` PASS (`61` tests)
  - `npm run typecheck` PASS
  - `npm run build` PASS

## Gate State

- active_pack_materialized: `PASS`
- active_step_singular: `PASS`
- tdd_required_for_each_stage: `PASS`
- full_regression_required_after_each_stage: `PASS`
- e2e_smoke_required_for_compaction_flow: `PASS`
- architecture_feasibility_extension_only_confirmed: `PASS`
- o1_continuation_contract_landed: `PASS`
- o2_compaction_resume_landed: `PASS`
- o3_proactive_compaction_landed: `PASS`
- o4_goal_directed_decision_rubric_landed: `PASS`
- o5_targeted_e2e_like_compaction_flow_landed: `PASS`
- post_closeout_decision_state_operator_visibility_landed: `PASS`
- post_closeout_live_smoke_session_artifact_evidence_landed: `PASS`
- final_full_regressions_green: `PASS`
- pack_honestly_closed: `PASS`

## Residuals / Follow-up

- this pack proves the extension-native route is real and landed in code; it does not prove every model/provider will produce equally strong decision quality without additional prompt tuning
- current e2e coverage is a bounded extension/runtime simulation inside tests; if future work needs heavier live interactive proof, that should start as a fresh maintenance pack instead of reopening this one

## Next Step

- [x] complete the full optimization pack honestly
- [x] leave the repo with a closed active pack and evidence-backed outcome
- no immediate successor pack is required for this workstream
