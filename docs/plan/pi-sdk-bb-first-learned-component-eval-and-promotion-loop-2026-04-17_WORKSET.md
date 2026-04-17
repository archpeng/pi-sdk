# PI SDK BB First Learned Component Eval and Promotion Loop 2026-04-17 Workset

## Active Slice Queue

- [x] `P12.S1` first-learned-component-selection-and-benchmark-freeze
- [x] `P12.S2` eval-input-output-contract-and-replay-boundary-freeze
- [x] `P12.H1` upstream-artifact-summary-payload-contract-handoff
- [x] `P12.S3` bounded-candidate-integration-behind-bb-owned-eval-truth
- [x] `P12.S4` single-component-promote-hold-rollback-loop-or-stop-handoff
- [x] `P12.S5` closeout-and-scale-or-defer-decision

## Active Slice

### `PACK_COMPLETE`

- Owner: `closeout`
- State: `DONE`
- Priority: `closeout_complete`
- Selected component: `artifact summarizer`

## Completion Summary

### `P12.S1 — first-learned-component-selection-and-benchmark-freeze`

- selected component remained `artifact summarizer`
- benchmark tuple remained bounded to existing summary seams
- deferred alternatives stayed explicit and out of scope

### `P12.S2 — eval-input-output-contract-and-replay-boundary-freeze`

- repo-local inputs / baseline outputs / BB-owned evidence path remained frozen
- no local durable eval or candidate truth was introduced

### `P12.H1 — upstream-artifact-summary-payload-contract-handoff`

- upstream blocker was sharpened and then cleared
- BB-side landed the shared learned-advisory artifact-summary surfaces:
  - `memory_autopilot_learned_advisory_report`
  - `memory://autopilot/learned-advisory/reports/recent`
  - `memory://autopilot/learned-advisory/current/{objective_key}/{payload_kind}`
  - `memory://autopilot/learned-advisory/reports/{report_id}`
- frozen minimal fields are now materially visible through those surfaces

### `P12.S3 — bounded-candidate-integration-behind-bb-owned-eval-truth`

- landed BB artifact-summary advisory consumption in the existing seams only
- landed bounded repo-local projection support for:
  - closeout
  - operator status / overlay
  - history projection
- kept the integration thin-shell and truth-non-sovereign
- validation passed:
  - `npm test`
  - `npm run typecheck`
  - `npm run build`
  - `node dist/sdk/orchestrator.js --help`

### `P12.S4 — single-component-promote-hold-rollback-loop-or-stop-handoff`

- proved live BB dependency through the built repo-local path using real BB objectives
- objective `objective:bb-p11-smoke:1776402689455` proved a governed promote-ready direction:
  - authority summary = `state=finalized outcome=promote · intent=recorded · reconcile=ready`
  - artifact-summary advisory was consumable through built `pi-sdk`
- objective `objective:bb-p11-live-smoke:1776402878214` proved a blocked/hold-style direction:
  - authority summary = `state=blocked outcome=none · intent=recorded · reconcile=blocked`
  - artifact-summary advisory was consumable through built `pi-sdk`
  - history projection remained BB-owned and candidate-only
- no new blocker requiring local truth invention was found

### `P12.S5 — closeout-and-scale-or-defer-decision`

- chose `scale`
- route after this pack is to materialize the post-`P12` successor pack rather than reopen `P12`
- kept the final closeout wording explicit:
  - BB owns truth / advisory / authority / promotion semantics
  - `pi-sdk` remains projection-only in the existing seams

## Final Verification Evidence

- `cd /home/peng/dt-git/github/pi-sdk && npx tsx --test test/artifact-summary-projection.test.ts test/history-projection.test.ts test/bb-substrate.test.ts test/operator.test.ts test/closeout.test.ts test/state.test.ts` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm test` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm run build` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --help` = PASS
- live BB smoke proved the built repo-local path can consume:
  - current BB learned-advisory artifact-summary payloads
  - BB-owned decision-authority truth
  - BB-owned history resources
  - without creating a new local truth path

## Closeout Result

1. `pi-sdk` now has a bounded first learned-component projection path for `artifact summarizer`
2. the upstream artifact-summary payload blocker is closed
3. the built repo-local path can consume real BB learned-advisory + authority surfaces honestly
4. `P12` is closed out without widening beyond the selected component or inventing local truth

## Next Candidate Slice

- none inside `P12`
- future continuation should materialize the successor pack after `P12`

## Handoff Target

- `human decision`
