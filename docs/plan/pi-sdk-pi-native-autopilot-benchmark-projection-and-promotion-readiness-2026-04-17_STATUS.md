# PI SDK Pi-Native Autopilot Benchmark Projection and Promotion Readiness 2026-04-17 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> CLOSEOUT`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `pi-sdk post-P8 benchmark projection and promotion readiness`
- control_plane_anchor: `/home/peng/dt-git/github/pi-sdk/docs/plan`
- predecessor_pack: `pi-sdk-pi-native-interactive-autopilot-runtime-hardening-and-bb-alignment-2026-04-16` (closed out)
- superseded_context_pack: `pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16` (retained as predecessor context only)

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `all planned P9 slices executed, reviewed, and closed out in this pack`
- why_done:
  1. post-P8 benchmark / promotion-readiness continuation is now frozen as **thin-shell BB-truth consumption / projection**, not local truth ownership
  2. dormant `P6` no longer competes with the active control plane; it is explicitly superseded as predecessor-only context
  3. repo-local benchmark projection landed in bounded seams only: status/widget/overlay, hydration context, and closeout summary
  4. live BB-backed smoke passed for the exact server-owned aggregate consumed by the new projection path: `memory_autopilot_status`

## Completed Slices

- [x] `P9.S1-post-p8-benchmark-projection-and-promotion-readiness-boundary-freeze`
- [x] `P9.S2-benchmark-doc-sync-and-p6-supersession-proof`
- [x] `P9.S3-bounded-bb-benchmark-projection-mvp`
- [x] `P9.S4-live-bb-promotion-readiness-smoke-or-stop-handoff`
- [x] `P9.S5-closeout-and-next-phase-handoff`

## Closeout Summary

- [x] froze the post-P8 owner split so benchmark / promotion continuation is constrained to BB-owned truth plus repo-local projection only
- [x] made dormant `P6` explicit predecessor context instead of a second apparently-active benchmark queue
- [x] landed stable objective-key derivation in `src/autopilot/protocol.ts` for querying server-owned status without claiming local truth ownership
- [x] landed bounded benchmark projection helper in `src/autopilot/benchmark-projection.ts`
- [x] extended interactive runtime persistence in `src/autopilot/state.ts` to carry:
  - objective key
  - latest server-backed benchmark projection summary
- [x] extended operator surfaces in `src/autopilot/operator.ts` and `src/extension/index.ts` so BB-backed promotion-readiness truth can appear in:
  - `/autopilot-status`
  - widget/footer-adjacent runtime output
  - `/autopilot-status overlay`
- [x] extended headless closeout truth in `src/autopilot/closeout.ts` and `src/sdk/orchestrator.ts` so final summaries can include:
  - objective key
  - promotion-readiness summary sourced from server-owned status
- [x] extended substrate surfaces in `src/substrate/types.ts`, `src/substrate/local.ts`, `src/substrate/bb.ts`, and `src/substrate/hydration.ts` so the repo now consumes `memory_autopilot_status` as a bounded aggregate instead of inventing a local benchmark ledger
- [x] kept local mode honest by returning explicit no-op unavailability for benchmark projection rather than fake local truth
- [x] synced docs with post-P8 reality:
  - `README.md`
  - `docs/architecture.md`
  - `docs/pi-sdk-bb-integration-architecture.md`
  - `docs/plan/README.md`

## Verification Evidence

- [x] `cd /home/peng/dt-git/github/pi-sdk && npm test` PASS (`34` tests)
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run build` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --help` PASS
- [x] new targeted TDD now covers:
  - stable objective-key derivation
  - benchmark projection summarization from server-owned status
  - BB substrate parsing for `memory_autopilot_status`
  - local substrate no-op projection behavior
  - runtime restoration with persisted benchmark projection
  - operator status / overlay projection output
  - closeout summary projection output
  - extension `/autopilot-status` surfacing BB-backed benchmark projection
  - hydration prompt sections carrying autopilot status / promotion-readiness lines
- [x] live BB-backed smoke passed through the built repo-local consumption path:
  - used `dist/substrate/index.js` + `dist/autopilot/protocol.js`
  - derived objective key from `cwd + goal`
  - `substrate.autopilot.status({ objectiveKey })` returned `ok: true`
  - payload truthfully reported `queue=idle lag=0`, missing heads/replay/canary/strategy state for the smoke objective instead of inventing readiness

## Latest Evidence

- code surfaces:
  - `src/autopilot/protocol.ts`
  - `src/autopilot/benchmark-projection.ts`
  - `src/autopilot/state.ts`
  - `src/autopilot/operator.ts`
  - `src/autopilot/closeout.ts`
  - `src/extension/index.ts`
  - `src/sdk/orchestrator.ts`
  - `src/substrate/types.ts`
  - `src/substrate/local.ts`
  - `src/substrate/bb.ts`
  - `src/substrate/hydration.ts`
- test surfaces:
  - `test/benchmark-projection.test.ts`
  - `test/bb-substrate.test.ts`
  - `test/operator.test.ts`
  - `test/closeout.test.ts`
  - `test/extension.test.ts`
  - `test/hydration.test.ts`
  - `test/state.test.ts`
  - `test/substrate-config.test.ts`
- doc surfaces:
  - `README.md`
  - `docs/architecture.md`
  - `docs/pi-sdk-bb-integration-architecture.md`
  - `docs/plan/README.md`

## Gate State

- p9_owner_boundary_frozen: `PASS`
- dormant_p6_explicitly_superseded: `PASS`
- doc_sync_matches_post_p8_reality: `PASS`
- bounded_bb_benchmark_projection_landed: `PASS`
- projection_stays_thin_shell_only: `PASS`
- live_bb_status_surface_reachable: `PASS`
- no_local_truth_invention: `PASS`

## Residuals / Follow-up

- learned-components experimentation remains explicitly deferred; this pack does not reopen retrieval/routing/review model work
- `memory_autopilot_status` aggregate is sufficient for current bounded projection, but richer historical benchmark/promotion inspection would need a new successor pack and must remain BB-owned
- workspace remains dirty, so future packs should continue making bounded, evidence-backed claims only

## Next Step

- [x] complete the full P9 pack honestly
- [x] leave the repo with a resumable closed pack and evidence-backed outcome
- future continuation, if desired, should start from a new successor pack rather than reopening `P9`
