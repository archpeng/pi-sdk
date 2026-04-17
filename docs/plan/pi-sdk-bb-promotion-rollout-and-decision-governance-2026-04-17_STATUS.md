# PI SDK BB Promotion Rollout and Decision Governance 2026-04-17 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> CLOSEOUT`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `pi-sdk × BB promotion rollout and decision governance`
- control_plane_anchor: `/home/peng/dt-git/github/pi-sdk/docs/plan`
- predecessor_pack: `pi-sdk-bb-benchmark-history-and-operator-inspection-2026-04-17` (closed out)
- roadmap_source: `docs/roadmap/pi-sdk-autopilot-endgame-roadmap-2026-04-17.md`
- execution_boundary: `cross-repo workstream, single active control plane anchored only in pi-sdk/docs/plan`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `all planned P11 slices executed, reviewed, and closed out in this pack`
- why_done:
  1. BB-owned promotion decision authority truth is now explicitly frozen as server-owned truth, while `pi-sdk` remains projection / bounded control direction only
  2. repo-local authority parsing / projection landed in existing seams without inventing a local decision ledger, rollback registry, reconcile truth cache, or direct apply path
  3. live BB smoke passed through the built repo-local substrate path for decision authority + dry-run reconcile visibility
  4. next work is now clearly routed to a new successor `P12` pack rather than by reopening `P11`

## Completed Slices

- [x] `P11.S1-promotion-rollout-lifecycle-and-owner-boundary-freeze`
- [x] `P11.S2-bb-owned-decision-ledger-resource-and-tool-contract-freeze`
- [x] `P11.S3-bounded-operator-projection-and-control-surface-mvp`
- [x] `P11.S4-live-promote-hold-rollback-smoke-or-stop-handoff`
- [x] `P11.S5-closeout-and-p12-first-learned-component-handoff`

## Closeout Summary

- [x] froze the cross-repo owner split so governed `promote | hold | rollback` decision truth remains BB-owned, while `pi-sdk` only projects / inspects / aligns it
- [x] landed repo-local authority projection/control-only seams in `pi-sdk`:
  - `src/substrate/types.ts`
  - `src/substrate/bb.ts`
  - `src/substrate/local.ts`
  - `src/substrate/hydration.ts`
  - `src/autopilot/decision-projection.ts`
  - `src/autopilot/protocol.ts`
  - `src/autopilot/state.ts`
  - `src/autopilot/operator.ts`
  - `src/autopilot/closeout.ts`
  - `src/extension/index.ts`
  - `src/sdk/orchestrator.ts`
- [x] kept projection/control honest:
  - no local decision ledger / promotion registry / rollback store
  - no local reconcile truth cache
  - no direct apply shortcut; reconcile visibility remains `dry_run` over canonical `manual_reconcile`
  - no Pi core / runtime patch
- [x] landed targeted TDD for authority parsing / projection surfaces:
  - `test/bb-substrate.test.ts`
  - `test/operator.test.ts`
  - `test/hydration.test.ts`
  - `test/closeout.test.ts`
  - `test/extension.test.ts`
- [x] synced repo-local docs with `P11` reality:
  - `README.md`
  - `docs/architecture.md`
  - `docs/pi-sdk-bb-integration-architecture.md`
- [x] live BB smoke passed through the built repo-local path:
  - read `memory://autopilot/decision-authority/recent`
  - parsed live authority truth via built `substrate.autopilot.authority(...)`
  - parsed live dry-run reconcile payload via built `substrate.autopilot.decisionReconcilePlan(...)`
  - projected authority summary + dry-run reconcile visibility via built `preparePhaseHydration(...)`
- [x] materialized a named successor pack for `P12`:
  - `docs/plan/pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17_PLAN.md`
  - `docs/plan/pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17_STATUS.md`
  - `docs/plan/pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17_WORKSET.md`

## Verification Evidence

- [x] `cd /home/peng/dt-git/github/pi-sdk && npx tsx --test test/bb-substrate.test.ts test/operator.test.ts test/hydration.test.ts test/closeout.test.ts test/extension.test.ts` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm test` PASS (`38` tests)
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run build` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --help` PASS
- [x] live BB authority smoke passed through built repo-local consumption path:
  1. read live `memory://autopilot/decision-authority/recent`
  2. selected smoke authority objective `objective:bb-p11-smoke:1776402689455`
  3. consumed current authority via built `substrate.autopilot.authority({ objectiveKey, authorityId })`
  4. consumed dry-run reconcile via built `substrate.autopilot.decisionReconcilePlan({ objectiveKey, authorityId })`
  5. observed truthful server-owned output: `decision_state=finalized`, `intent_state=recorded`, `reconcile_state=ready`, `final_outcome=promote`, `scope_write_source=manual_reconcile`

## Latest Evidence

- BB-owned authority contract anchors:
  - `/home/peng/dt-git/github/boston-bot-vp/packages/memory-contracts/src/autopilotAuthority.ts`
  - `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotDecisionAuthority.ts`
  - `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotDecisionTools.ts`
  - `/home/peng/dt-git/github/boston-bot-vp/apps/mcp-servers/bb-memory-mcp/src/autopilotDecisionResources.ts`
- pi-sdk code surfaces:
  - `src/substrate/types.ts`
  - `src/substrate/bb.ts`
  - `src/substrate/local.ts`
  - `src/substrate/hydration.ts`
  - `src/autopilot/decision-projection.ts`
  - `src/autopilot/protocol.ts`
  - `src/autopilot/state.ts`
  - `src/autopilot/operator.ts`
  - `src/autopilot/closeout.ts`
  - `src/extension/index.ts`
  - `src/sdk/orchestrator.ts`
- docs/control plane:
  - `docs/plan/pi-sdk-bb-promotion-rollout-and-decision-governance-2026-04-17_PLAN.md`
  - `docs/plan/pi-sdk-bb-promotion-rollout-and-decision-governance-2026-04-17_STATUS.md`
  - `docs/plan/pi-sdk-bb-promotion-rollout-and-decision-governance-2026-04-17_WORKSET.md`
  - `docs/plan/README.md`

## Gate State

- p11_owner_boundary_frozen: `PASS`
- bb_owned_decision_contract_frozen: `PASS`
- bounded_operator_projection_control_landed: `PASS`
- live_decision_authority_surface_reachable: `PASS`
- no_local_decision_store_invented: `PASS`
- no_direct_apply_path_invented: `PASS`
- no_second_active_control_plane_root: `PASS`
- p12_successor_pack_materialized: `PASS`

## Residuals / Follow-up

- live smoke proved a real BB smoke objective rather than the current `pi-sdk` pack objective key; this is sufficient for consumed-surface proof but should not be overstated as same-objective rollout evidence
- repo-local control remains substrate-level / projection-first; `P11` did not add a local apply UX, and that is intentional under the owner-boundary law
- first learned component selection, benchmark freeze, and eval-loop implementation remain future `P12` work
- workspace remains dirty, so downstream packs should continue making bounded, evidence-backed claims only

## Next Step

- [x] complete the full `P11` pack honestly
- [x] leave the repo with a resumable closed pack and evidence-backed outcome
- future continuation, if desired, should start from the new successor pack (`P12`) rather than reopening `P11`
