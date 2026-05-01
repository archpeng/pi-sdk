# PI SDK Autopilot Execute/Review Writeback Hardening 2026-05-01 Workset

| field              | value                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| status             | `complete`                                                                                                         |
| active_slice       | `PACK_COMPLETE`                                                                                                   |
| verification_floor | parser-compatible PACK_COMPLETE snapshot + final evidence review of docs, validation, smokes, and reload residuals |
| active_root        | `docs/plan/`                                                                                                       |
| intended_handoff   | `autopilot-closeout`                                                                                              |

## Stage Order

- [x] `ERW0.plan-workset-reconcile` current hardening pack truth repair
- [x] `ERW1.pos-lite-review-stage-repair` downstream explicit review-stage repair
- [x] `ERW1.review` review downstream recovery
- [x] `ERW2.phase-gated-writeback` review-owned accepted-slice writeback
- [x] `ERW2.review` review phase gate
- [x] `ERW3.pack-complete-parser-guard` terminal writeback and parser guard
- [x] `ERW3.review` review terminal/parser guard
- [x] `ERW4.docs-smoke-closeout` docs, validation, smoke, reload guidance
- [x] `ERW4.review` final hardening review

## Active Stage

### `PACK_COMPLETE`

- Owner: `closeout`
- State: `DONE`
- Priority: `terminal`

目标：

- close the pack through the repo-local closeout prompt surface

必须交付：

1. final closeout summary and residual handoff

必须避免：

1. dispatching another execute/review phase from terminal parser truth
## Active / Pending Slice Queue

| item                                  | type              | owner                     | target output                                                                                          | verification                                                                       | status   | next activation rule                                  |
| ------------------------------------- | ----------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `ERW0.plan-workset-reconcile`         | `planning`        | `plan-creator`            | current hardening pack truth repaired; source/dependency/test state and prior dirty changes classified   | pi-sdk parser snapshot + plan_sync + control-plane test + diff checks              | `done`   | ERW1 selected as first executable wave                |
| `ERW1.pos-lite-review-stage-repair`   | `recovery`        | `execute-plan`            | downstream explicit OR-3D review stage, no runtime behavior changes                                    | downstream parser snapshot + plan_sync + trio/score + docs/diff checks             | `done`   | ERW1 review accepted the recovery                     |
| `ERW1.review`                         | `review`          | `execution-reality-audit` | accept/block downstream recovery before sdk code changes                                               | cold diff/readout review                                                           | `done`   | ERW2 selected after acceptance                        |
| `ERW2.phase-gated-writeback`          | `sdk-code`        | `execute-plan`            | execute/completed same-slice review dispatch; review/completed accepted-slice writeback                | extension/local-proof/control-plane/phase-prompt tests                             | `done`   | ERW2 review accepts before ERW3 activation            |
| `ERW2.review`                         | `review`          | `execution-reality-audit` | accept/block phase-gated writeback semantics                                                           | code inspection + targeted tests                                                   | `done`   | ERW3 selected after acceptance                        |
| `ERW3.pack-complete-parser-guard`     | `sdk-code`        | `execute-plan`            | terminal guard and post-writeback parser validation                                                    | last-stage regression tests + parser snapshot test                                 | `done`   | review before docs/smoke                              |
| `ERW3.review`                         | `review`          | `execution-reality-audit` | accept/block terminal guard and parser validation                                                       | cold review + targeted tests                                                       | `done`   | accepted; ERW4 active                                |
| `ERW4.docs-smoke-closeout`            | `docs-validation` | `execute-plan`            | docs/reference updates, full validation, reload/release residual                                       | typecheck + npm test + build + feasible smokes                                     | `done`   | executed; ERW4.review active                          |
| `ERW4.review`                         | `review`          | `execution-reality-audit` | final hardening acceptance and residual handoff                                                         | full evidence review                                                               | `done`   | accepted; PACK_COMPLETE terminal                      |

## Slice Cards

### `ERW0.plan-workset-reconcile`

| field                | value                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source_anchor        | user instruction to focus on this plan/workset repair plus the prior pi-sdk source/dependency/test changes that must not be confused with writeback-hardening work              |
| target_owner         | `docs/plan/README.md` and this hardening pack's PLAN / STATUS / WORKSET                                                                                                      |
| expected_deliverable | parser-compatible active truth for ERW0 plus explicit classification of current non-control-plane state and prior dirty pi-sdk files                                            |
| verification_shape   | `loadLocalControlPlaneSnapshot('docs/plan', process.cwd())`, `plan_sync`, `npx tsx --test test/control-plane.test.ts`, `git diff --check`                                     |
| residual_seed        | ERW1 downstream recovery and ERW2/ERW3 source hardening remain queued until this reconciliation accepts or replans the current dirty tree                                      |

### `ERW1.pos-lite-review-stage-repair`

| field                | value                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source_anchor        | downstream parser failure `Missing active stage heading` after execute/completed writeback; code audit confirmed current sdk can write `PACK_COMPLETE` before review          |
| target_owner         | downstream `docs/plan/README.md` and active order-runtime-roadmap-execution PLAN / STATUS / WORKSET                                                                           |
| expected_deliverable | explicit downstream `OR-3D.member-baseline-review` active stage owned by `execution-reality-audit`                                                                            |
| verification_shape   | downstream `loadLocalControlPlaneSnapshot`, `plan_sync`, trio/score scripts, docs formatting check, `git diff --check`                                                        |
| residual_seed        | downstream OR-3D review still must accept/block the member baseline tests; sdk code remains unfixed until ERW2/ERW3                                                           |

### `ERW2.phase-gated-writeback`

| field                | value                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source_anchor        | `writeAcceptedSliceCompletion` status-only gate and existing tests expecting execute-time advancement                                                         |
| target_owner         | `src/extension/index.ts`, `src/extension/runtime-dispatch.ts`, `src/autopilot/state.ts` only if needed, plus extension/local-proof tests                       |
| expected_deliverable | execute-completed leaves active slice unchanged for review; review-completed advances accepted slice when next stage exists                                   |
| verification_shape   | targeted `npx tsx --test test/extension.test.ts test/extension-local-proof.test.ts test/control-plane.test.ts test/phase-prompt.test.ts`                      |
| residual_seed        | terminal/last-stage guard may remain for ERW3                                                                                                                  |

### `ERW3.pack-complete-parser-guard`

| field                | value                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source_anchor        | `resolveNextStageFromStageOrder` null -> `PACK_COMPLETE` plus downstream active-stage parser loss                                                             |
| target_owner         | `src/substrate/control-plane.ts`, `src/extension/runtime-dispatch.ts`, control-plane/extension tests                                                           |
| expected_deliverable | fail-fast non-terminal no-next-stage path, explicit terminal closeout path, and parser snapshot validation after writeback                                    |
| verification_shape   | `npm run typecheck`; extension/control-plane/local-proof/phase-prompt tests; `loadLocalControlPlaneSnapshot` post-writeback proof                              |
| residual_seed        | review acceptance plus release/reload semantics and docs alignment remain for ERW4                                                                              |

### `ERW4.docs-smoke-closeout`

| field                | value                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source_anchor        | ERW2/ERW3 reviewed fixes plus stale broad writeback wording in `README.md`, `docs/architecture.md`, and `docs/plan/README.md`                                   |
| target_owner         | `README.md`, `docs/architecture.md`, active pack README / PLAN / STATUS / WORKSET                                                                               |
| expected_deliverable | documented review-owned writeback contract, full validation, feasible smoke results, clear install/reload residual                                              |
| verification_shape   | passed: `npm run typecheck`, `npm test`, `npm run build`, `npm run smoke:pi-commands`, `npm run smoke:pi-bb-backed`, `npm run smoke:packaged-install` on retry |
| residual_seed        | final review decides whether current-session reload/install remains closeout guidance or needs a follow-up release/install slice                                |

### `ERW4.review`

| field                | value                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source_anchor        | completed ERW0-ERW4 evidence, full validation/smoke output, downstream parser recovery evidence, and reload residual                                           |
| target_owner         | `execution-reality-audit` final review of active pack docs, source/test diffs, validation logs, and residual handoff                                           |
| expected_deliverable | accept/block complete hardening pack and identify whether a separate release/install/reload slice is required                                                 |
| verification_shape   | cold review of docs/source/test diffs plus current parser snapshot, plan_sync, validation/smoke evidence, and downstream recovery boundary                     |
| residual_seed        | closeout or bounded release/install follow-up; paused `0.70.2` pack remains separate                                                                          |

## ERW0 Dirty File Classification

| file / group                                                                                                       | classification                               | handling                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| current non-control-plane dirty state                                                                                | no current dirty `pi-sdk` source/dependency/test files | ERW0 only edits active pack docs; no source/dependency dirty split is required                                |
| `docs/plan/README.md` and current hardening pack PLAN / STATUS / WORKSET                                           | in-scope for ERW0                            | committed in `2d2e61c`; active parser truth repair                                                           |
| `package.json`, `package-lock.json`                                                                                 | out-of-scope for ERW0 / ERW1                 | committed Pi `0.71.x` dependency upgrade; requires separate replan or paused-pack continuation if revisited  |
| `src/extension/index.ts`, `src/extension/runtime-ui.ts`                                                              | out-of-scope for ERW0 / ERW1 as source edits | committed thinking-level UI status behavior, not writeback phase gating                                      |
| `test/extension-support.test.ts`, `test/extension.test.ts`                                                           | out-of-scope for ERW0 / ERW1 as test edits   | paired with thinking-level UI status behavior; not ERW2 evidence unless replanned                            |
| downstream `pos-lite-cashier/**`                                                                                    | read-only for ERW0                           | only ERW1 may edit downstream `docs/plan/*`                                                                  |

## Cross-Repo Recovery Contract

ERW0 is intentionally local to this `pi-sdk` pack and must not edit downstream files. ERW1 is intentionally cross-repo because the downstream `pos-lite-cashier` pack is the concrete failing specimen and must be repaired before automatic review can resume. ERW1 may edit only downstream `docs/plan/*` control-plane files. If any downstream source/runtime/test code needs edits, ERW1 must stop and replan.

## Runtime Compatibility Note

ERW3/ERW4 source and docs are implemented and locally validated, but the current running Pi UI session may still carry older writeback behavior until rebuilt/reloaded. This pack does not claim live-session deployment; applying the fix to an installed/current session requires operator-approved reload/reinstall/restart or a follow-up release/install slice if review decides it is needed.

## Machine Queue

- active_step: `PACK_COMPLETE`
- latest_completed_step: `ERW4.review`
- intended_handoff: `autopilot-closeout`
- latest_closeout_summary: ERW4 final review accepts the hardening pack.
- latest_verification:
  - `SDK parser truth: activeSlice/activeStage=PACK_COMPLETE, owner=closeout, state=DONE, intendedHandoff=autopilot-closeout, stageCount=9, missing=[].`
  - `Downstream parser truth is not broken: pos-lite-cashier activeSlice/activeStage=OR-3D.member-shadow-facade, owner=execute-plan, stageCount=22, missing=[]; workspace_scan reports downstream clean.`
  - `Docs now state ordinary execute/completed does not advance Stage Order; review/completed or objective-terminal done owns accepted-slice writeback with repo-local parser readback.`
  - `Code/tests prove the contract: execute keeps same active slice; review advances next stage; non-terminal no-next-stage halts before PACK_COMPLETE; objective-terminal done writes parser-compatible PACK_COMPLETE/closeout.`
  - `Validation passed in review: npm run typecheck && npm test && npm run build (119 tests); after the review wording fix, npx tsx --test test/control-plane.test.ts passed 11 tests and git diff --check passed.`
  - `Review fixed one stale STATUS implication line so terminal guard evidence says it has ERW3 review coverage and final ERW4 validation.`
  - `README.md; docs/architecture.md; docs/plan/README.md`
  - `src/extension/runtime-dispatch.ts; src/substrate/control-plane.ts`
  - `test/extension.test.ts; test/extension-local-proof.test.ts; test/control-plane.test.ts`
  - `docs/plan/pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_{PLAN,STATUS,WORKSET}.md`
- terminal: `true`