# PI SDK BB First Learned Component Eval and Promotion Loop 2026-04-17 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> CLOSEOUT`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `pi-sdk × BB first learned component eval and promotion loop`
- control_plane_anchor: `/home/peng/dt-git/github/pi-sdk/docs/plan`
- predecessor_pack: `pi-sdk-bb-promotion-rollout-and-decision-governance-2026-04-17` (closed out)
- roadmap_source: `docs/roadmap/pi-sdk-autopilot-endgame-roadmap-2026-04-17.md`
- execution_boundary: `cross-repo workstream, single active control plane anchored only in pi-sdk/docs/plan`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `all planned P12 slices executed, reviewed, and closed out in this pack`
- why_done:
  1. `artifact summarizer` remained the exactly-one first learned component throughout the pack
  2. the upstream BB artifact-summary payload blocker recorded in `P12.H1` is now closed by the shared `learned_advisory` / `artifact_summary` surfaces
  3. repo-local candidate integration landed inside the existing closeout / operator / history seams without inventing local candidate, eval, promotion, or advisory truth
  4. live BB smoke proved that the built `pi-sdk` substrate/projection path can consume the landed artifact-summary learned-advisory surface together with BB-owned decision-authority truth
  5. next work is now clearly routed to post-`P12` scale/productization planning rather than by reopening `P12`

## Completed Slices

- [x] `P12.S1-first-learned-component-selection-and-benchmark-freeze`
- [x] `P12.S2-eval-input-output-contract-and-replay-boundary-freeze`
- [x] `P12.H1-upstream-artifact-summary-payload-contract-handoff`
- [x] `P12.S3-bounded-candidate-integration-behind-bb-owned-eval-truth`
- [x] `P12.S4-single-component-promote-hold-rollback-loop-or-stop-handoff`
- [x] `P12.S5-closeout-and-scale-or-defer-decision`

## Closeout Summary

- [x] kept the selected learned component singular and bounded:
  - `artifact summarizer`
  - no re-open of `review verdict classifier`
  - no mixing in `next-step route classifier`, `repair strategy ranker`, or `retrieval reranker`
- [x] preserved the owner split:
  - `BB` owns eval / advisory / authority / promotion truth
  - `pi-sdk` remains projection-only in the existing summary seams
- [x] closed the upstream blocker with BB-owned learned-advisory surfaces:
  - tool: `memory_autopilot_learned_advisory_report`
  - resources:
    - `memory://autopilot/learned-advisory/reports/recent`
    - `memory://autopilot/learned-advisory/current/{objective_key}/{payload_kind}`
    - `memory://autopilot/learned-advisory/reports/{report_id}`
- [x] landed repo-local candidate projection support in `pi-sdk`:
  - `src/substrate/types.ts`
  - `src/substrate/bb.ts`
  - `src/substrate/local.ts`
  - `src/substrate/hydration.ts`
  - `src/autopilot/protocol.ts`
  - `src/autopilot/state.ts`
  - `src/autopilot/history-projection.ts`
  - `src/autopilot/closeout.ts`
  - `src/autopilot/operator.ts`
  - `src/autopilot/artifact-summary-projection.ts`
  - `src/extension/index.ts`
  - `src/sdk/orchestrator.ts`
- [x] kept the candidate integration honest:
  - no local candidate truth
  - no local eval truth
  - no local promotion truth
  - no local advisory cache sovereignty
  - no Pi core / runtime patch
- [x] landed targeted TDD for the artifact-summary projection path:
  - `test/artifact-summary-projection.test.ts`
  - `test/bb-substrate.test.ts`
  - `test/history-projection.test.ts`
  - `test/operator.test.ts`
  - `test/closeout.test.ts`
  - `test/state.test.ts`
  - `test/extension.test.ts`
- [x] proved the live BB dependency through the built repo-local path:
  - materialized live `artifact_summary` learned-advisory reports for smoke objectives
  - consumed them through built `substrate.autopilot.learnedArtifactSummary(...)`
  - projected them through built closeout/operator/history helpers without inventing a new local truth path
- [x] completed the scale-or-defer decision for this pack:
  - `scale` the product toward `P13` productization / release readiness
  - do **not** reopen `P12`

## Verification Evidence

- [x] `cd /home/peng/dt-git/github/pi-sdk && npx tsx --test test/artifact-summary-projection.test.ts test/history-projection.test.ts test/bb-substrate.test.ts test/operator.test.ts test/closeout.test.ts test/state.test.ts` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm test` PASS (`41` tests)
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run build` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --help` PASS
- [x] live BB smoke passed through the built repo-local path:
  1. consumed BB-owned promotion-ready authority truth for `objective:bb-p11-smoke:1776402689455`
  2. materialized and read current `artifact_summary` learned-advisory report for that objective
  3. observed truthful server-owned output through built `pi-sdk` projections:
     - `decisionSummary = state=finalized outcome=promote · intent=recorded · reconcile=ready`
     - `artifactSummary = stage=shadow_only · confidence=0.50 · replay-guard=hold · governance-guard=hold`
  4. consumed BB-owned blocked/hold-style authority truth for `objective:bb-p11-live-smoke:1776402878214`
  5. materialized and read current `artifact_summary` learned-advisory report for that objective
  6. observed truthful server-owned output through built `pi-sdk` projections:
     - `decisionSummary = state=blocked outcome=none · intent=recorded · reconcile=blocked`
     - `artifactSummary = stage=shadow_only · confidence=0.84 · replay-guard=pass · governance-guard=pass`
     - `historySummary = canary=1 · strategy=1 · latest=strategy_feedback:promote_current_candidate · artifact_summary=shadow_only@0.84`

## Latest Evidence

- BB-owned learned-advisory contract anchors:
  - `/home/peng/dt-git/github/boston-bot-vp/packages/memory-contracts/src/autopilotLearning.ts`
  - `/home/peng/dt-git/github/boston-bot-vp/packages/memory-contracts/src/autopilotReports.ts`
  - `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotLearnedAdvisoryReport.ts`
  - `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotLearnedAdvisoryReportResources.ts`
- `pi-sdk` code surfaces now carrying the bounded artifact-summary projection:
  - `src/substrate/bb.ts`
  - `src/substrate/hydration.ts`
  - `src/autopilot/artifact-summary-projection.ts`
  - `src/autopilot/history-projection.ts`
  - `src/autopilot/operator.ts`
  - `src/autopilot/closeout.ts`
  - `src/extension/index.ts`
  - `src/sdk/orchestrator.ts`
- docs/control plane:
  - `docs/plan/pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17_PLAN.md`
  - `docs/plan/pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17_STATUS.md`
  - `docs/plan/pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17_WORKSET.md`
  - `docs/plan/README.md`

## Gate State

- p12_selected_component_bounded: `PASS`
- p12_upstream_artifact_summary_payload_gap_closed: `PASS`
- p12_repo_local_candidate_projection_landed: `PASS`
- p12_local_truth_compensation_avoided: `PASS`
- p12_live_bb_dependency_proven_for_consumed_loop: `PASS`
- p12_no_second_active_control_plane_root: `PASS`
- p12_scale_decision_written: `PASS`

## Residuals / Follow-up

- current live artifact-summary evidence is still `candidate_only` and `shadow_only`; `pi-sdk` intentionally does not treat it as runtime-local activation truth
- current live smoke proved `promote` and `blocked/hold-style` decision directions via real BB authority records; a distinct live rollback sample was not separately materialized in this pack, but rollback truth remains in the same BB-owned decision-authority family rather than requiring a new `pi-sdk` truth path
- workspace remains dirty, so future packs should continue making bounded, evidence-backed claims only
- if future work wants broader learned payload kinds or stronger advisory exposure semantics, that belongs in a fresh successor pack rather than reopening `P12`

## Next Step

- [x] complete the full `P12` pack honestly
- [x] leave the repo with a resumable closed pack and evidence-backed outcome
- future continuation, if desired, should start by materializing the post-`P12` successor pack rather than reopening `P12`
