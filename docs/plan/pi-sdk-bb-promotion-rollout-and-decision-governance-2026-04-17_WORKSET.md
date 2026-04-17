# PI SDK BB Promotion Rollout and Decision Governance 2026-04-17 Workset

## Active Slice Queue

- [x] `P11.S1` promotion-rollout-lifecycle-and-owner-boundary-freeze
- [x] `P11.S2` bb-owned-decision-ledger-resource-and-tool-contract-freeze
- [x] `P11.S3` bounded-operator-projection-and-control-surface-mvp
- [x] `P11.S4` live-promote-hold-rollback-smoke-or-stop-handoff
- [x] `P11.S5` closeout-and-p12-first-learned-component-handoff

## Active Slice

### `CLOSEOUT` — pack complete

- owner: `closeout`
- state: `DONE`
- priority: `none`
- outcome:
  1. governed rollout authority truth remains BB-owned and is no longer ambiguous at the `P11` boundary
  2. repo-local operator projection / control-only MVP plus live BB smoke both landed without widening into local decision ownership
  3. a named successor `P12` pack now exists so future work does not need to reopen `P11`

## Slice-by-Slice Outcome Record

### `P11.S1 — promotion-rollout-lifecycle-and-owner-boundary-freeze`

- [x] froze the cross-repo owner split between BB-owned promotion decision truth and `pi-sdk` repo-local operator projection/control direction
- [x] confirmed the active control plane remains singularly anchored in `pi-sdk/docs/plan`
- [x] kept the hard stop boundary explicit:
  - no local decision ledger / promotion registry / rollback store in `pi-sdk`
  - no second active root pack in `boston-bot-vp/docs/plan`
  - no broad shell redesign mixed into `P11`
  - no Pi-core / runtime patch hidden inside promotion-governance work

### `P11.S2 — bb-owned-decision-ledger-resource-and-tool-contract-freeze`

- [x] froze the minimum BB-owned decision vocabulary around authority / intent / reconcile semantics
- [x] recorded that canary / strategy-feedback remain supporting report truth rather than final decision authority
- [x] left the missing authority gap explicit until it was closed upstream rather than inventing client-local compensation
- [x] kept the slice contract-first and server-owned, not implementation-sprawl-first

### `P11.S3 — bounded-operator-projection-and-control-surface-mvp`

- [x] added failing targeted tests first for BB authority resource/tool parsing and repo-local projection wording
- [x] landed typed BB substrate support for current/detail authority resources plus decision-authority / intent / reconcile-plan tool payloads
- [x] landed bounded decision-authority projection in status / overlay / hydration / closeout / runtime summary seams only
- [x] kept local mode as explicit unavailable/no-op instead of inventing local authority truth
- [x] preserved Pi-first same-session architecture without adding a local apply path

### `P11.S4 — live-promote-hold-rollback-smoke-or-stop-handoff`

- [x] consumed `memory://autopilot/decision-authority/recent` from the live BB endpoint
- [x] built `dist/**` path successfully consumed:
  - current authority via `substrate.autopilot.authority(...)`
  - dry-run reconcile visibility via `substrate.autopilot.decisionReconcilePlan(...)`
  - execute-phase projection via `preparePhaseHydration(...)`
- [x] smoke remained truthful: it proved BB-owned authority / reconcile surfaces without creating any local truth path
- [x] no stop-handoff was needed because the consumed live surfaces were reachable

### `P11.S5 — closeout-and-p12-first-learned-component-handoff`

- [x] `STATUS / WORKSET / README` are synchronized with pack closeout truth
- [x] docs/contracts now reflect BB-owned decision authority plus bounded repo-local projection/control-only seams
- [x] future work is routed to a new successor pack (`P12`) rather than by reopening `P11`

## Verification Ledger

- [x] `npx tsx --test test/bb-substrate.test.ts test/operator.test.ts test/hydration.test.ts test/closeout.test.ts test/extension.test.ts`
- [x] `npm test`
- [x] `npm run typecheck`
- [x] `npm run build`
- [x] `node dist/sdk/orchestrator.js --help`
- [x] live BB authority smoke via built `substrate.autopilot.authority(...)` + `substrate.autopilot.decisionReconcilePlan(...)` + `preparePhaseHydration(...)`

## Done-When Boundary

1. [x] `P11` owner boundary is explicit and stable
2. [x] BB-owned decision contract direction is frozen without local truth invention
3. [x] repo-local operator projection/control stays thin-shell and is backed by tests
4. [x] live BB dependency is proven for the consumed authority / reconcile visibility surfaces
5. [x] closeout docs are synchronized and honest
6. [x] the next bounded `P12` handoff is named and materialized

## Closeout Boundary

- this pack is complete and should not be reopened implicitly
- any further work should start from the new successor pack
- broader future work should assume `P11` promotion governance and `P10` benchmark history inspection are already done

## Handoff Target

- immediate_next_target: `execute-plan`
- successor_pack: `docs/plan/pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17_{PLAN,STATUS,WORKSET}.md`
- reason: `P11` is fully closed; the next workstream should execute roadmap `P12` instead of reviving this pack
