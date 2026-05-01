# PI SDK Autopilot Execute/Review Writeback Hardening 2026-05-01 Workset

| field              | value                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| status             | `active`                                                                                                            |
| active_slice       | `ERW0.plan-workset-reconcile`                                                                                        |
| verification_floor | parser snapshot + targeted tests + typecheck/build as soon as sdk source changes; downstream recovery adds plan checks |
| active_root        | `docs/plan/`                                                                                                        |

## Stage Order

- [ ] `ERW0.plan-workset-reconcile` current hardening pack truth repair
- [ ] `ERW1.pos-lite-review-stage-repair` downstream explicit review-stage repair
- [ ] `ERW1.review` review downstream recovery
- [ ] `ERW2.phase-gated-writeback` review-owned accepted-slice writeback
- [ ] `ERW2.review` review phase gate
- [ ] `ERW3.pack-complete-parser-guard` terminal writeback and parser guard
- [ ] `ERW3.review` review terminal/parser guard
- [ ] `ERW4.docs-smoke-closeout` docs, validation, smoke, reload guidance
- [ ] `ERW4.review` final hardening review

## Active Stage

### `ERW0.plan-workset-reconcile`

- Owner: `plan-creator`
- State: `READY`
- Priority: `highest`

目标：

- Repair this hardening pack's README / PLAN / STATUS / WORKSET truth around the current dirty `pi-sdk` tree before executing downstream recovery or SDK source hardening.

必须交付：

1. Inspect current `pi-sdk` dirty files and classify whether each changed source/dependency/test file belongs to this hardening pack, the paused `0.70.x` upgrade pack, or an unrelated slice.
2. Update this pack so the active slice, stage order, machine state, workset queue, and latest evidence match the chosen current route.
3. Keep downstream `pos-lite-cashier` files read-only in this reconciliation slice.
4. Validate this pack with real `loadLocalControlPlaneSnapshot`, `plan_sync`, `npx tsx --test test/control-plane.test.ts`, and `git diff --check`.

done_when:

1. README, STATUS, and WORKSET agree on one active slice and intended handoff for this hardening pack.
2. Current dirty `pi-sdk` files are explicitly classified as in-scope, out-of-scope, or requiring a separate follow-up before ERW1/ERW2 execution starts.
3. `loadLocalControlPlaneSnapshot('docs/plan', process.cwd())` parses this hardening pack with no missing active stage or missing PLAN definitions.
4. `plan_sync /home/peng/dt-git/github/pi-sdk/docs/plan`, `npx tsx --test test/control-plane.test.ts`, and `git diff --check` pass.

stop_boundary:

1. Stop if current dirty `pi-sdk` source/dependency changes cannot be classified without code review beyond plan/workset repair.
2. Stop if this pack cannot stay single-root under `docs/plan/*`.
3. Stop if parser truth still points at downstream recovery while the actual active work is current-pack reconciliation.
4. Stop if repair would require editing downstream `pos-lite-cashier` files.

必须避免：

1. Starting downstream `pos-lite-cashier` recovery from ERW0.
2. Starting pi-sdk source hardening or dependency upgrade implementation from ERW0.
3. Marking the hardening plan complete from a plan/workset reconciliation pass.

## Active / Pending Slice Queue

| item                                  | type              | owner                     | target output                                                                                          | verification                                                                       | status   | next activation rule                                  |
| ------------------------------------- | ----------------- | ------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `ERW0.plan-workset-reconcile`         | `planning`        | `plan-creator`            | current hardening pack truth repaired; dirty pi-sdk changes classified                                  | pi-sdk parser snapshot + plan_sync + control-plane test + diff checks              | `active` | then activate `ERW1.pos-lite-review-stage-repair` or stop/replan |
| `ERW1.pos-lite-review-stage-repair`   | `recovery`        | `execute-plan`            | downstream explicit OR-3D review stage, no runtime behavior changes                                    | downstream parser snapshot + plan_sync + trio/score + docs/diff checks             | `queued` | current sdk writeback activates `ERW1.review`         |
| `ERW1.review`                         | `review`          | `execution-reality-audit` | accept/block downstream recovery before sdk code changes                                               | cold diff/readout review                                                           | `queued` | if accepted, proceed to `ERW2.phase-gated-writeback`  |
| `ERW2.phase-gated-writeback`          | `sdk-code`        | `execute-plan`            | execute/completed same-slice review dispatch; review/completed accepted-slice writeback                | extension/local-proof/control-plane/phase-prompt tests                             | `queued` | current runtime may still activate `ERW2.review`      |
| `ERW2.review`                         | `review`          | `execution-reality-audit` | accept/block phase-gated writeback semantics                                                           | code inspection + targeted tests                                                   | `queued` | if accepted, proceed to `ERW3.pack-complete-parser-guard` |
| `ERW3.pack-complete-parser-guard`     | `sdk-code`        | `execute-plan`            | terminal guard and post-writeback parser validation                                                    | last-stage regression tests + parser snapshot test                                 | `queued` | review before docs/smoke                              |
| `ERW3.review`                         | `review`          | `execution-reality-audit` | accept/block terminal guard and parser validation                                                       | cold review + targeted tests                                                       | `queued` | if accepted, proceed to `ERW4.docs-smoke-closeout`    |
| `ERW4.docs-smoke-closeout`            | `docs-validation` | `execute-plan`            | docs/reference updates, full validation, reload/release residual                                       | typecheck + npm test + build + feasible smokes                                     | `queued` | review closes or routes release/reload follow-up      |
| `ERW4.review`                         | `review`          | `execution-reality-audit` | final hardening acceptance and residual handoff                                                         | full evidence review                                                               | `queued` | closeout or follow-up plan                            |

## Slice Cards

### `ERW0.plan-workset-reconcile`

| field                | value                                                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source_anchor        | user instruction to focus on this plan/workset repair plus current dirty pi-sdk source/dependency/test files that are not yet classified in the active pack                    |
| target_owner         | `docs/plan/README.md` and this hardening pack's PLAN / STATUS / WORKSET                                                                                                      |
| expected_deliverable | parser-compatible active truth for ERW0 plus explicit classification of current dirty pi-sdk files                                                                            |
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
| expected_deliverable | fail-fast or explicit terminal path when no next stage exists; parser snapshot validation after writeback                                                      |
| verification_shape   | last-stage regression tests + `loadLocalControlPlaneSnapshot` post-writeback proof                                                                             |
| residual_seed        | release/reload semantics and docs alignment remain for ERW4                                                                                                    |

### `ERW4.docs-smoke-closeout`

| field                | value                                                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| source_anchor        | code fixes from ERW2/ERW3 and current README/skill references that still imply execute/writeback behavior                                                     |
| target_owner         | README, `skills/*/references/*`, relevant tests/smoke scripts if validation command is added                                                                   |
| expected_deliverable | documented review-owned writeback contract, full validation, clear install/reload residual                                                                    |
| verification_shape   | `npm run typecheck`, `npm test`, `npm run build`, feasible smokes                                                                                              |
| residual_seed        | possible follow-up release/install slice if current Pi session must load rebuilt extension                                                                     |

## ERW0 Dirty File Classification

| file / group                                                                                                       | classification                               | handling                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `docs/plan/README.md` and current hardening pack PLAN / STATUS / WORKSET                                           | in-scope for ERW0                            | active parser truth repair                                                                                   |
| `package.json`, `package-lock.json`                                                                                 | out-of-scope for ERW0 / ERW1                 | dependency/upgrade work; requires separate replan or paused-pack continuation                                |
| `src/extension/index.ts`, `src/extension/runtime-ui.ts`                                                              | out-of-scope for ERW0 / ERW1 as source edits | appears to be thinking-level UI status behavior, not writeback phase gating                                  |
| `test/extension-support.test.ts`, `test/extension.test.ts`                                                           | out-of-scope for ERW0 / ERW1 as test edits   | paired with thinking-level UI status behavior; not ERW2 evidence unless replanned                            |
| downstream `pos-lite-cashier/**`                                                                                    | read-only for ERW0                           | only ERW1 may edit downstream `docs/plan/*`                                                                  |

## Cross-Repo Recovery Contract

ERW0 is intentionally local to this `pi-sdk` pack and must not edit downstream files. ERW1 is intentionally cross-repo because the downstream `pos-lite-cashier` pack is the concrete failing specimen and must be repaired before automatic review can resume. ERW1 may edit only downstream `docs/plan/*` control-plane files. If any downstream source/runtime/test code needs edits, ERW1 must stop and replan.

## Runtime Compatibility Note

Until ERW2/ERW3 are implemented and the fixed extension is loaded, the current runtime may still advance Stage Order on `execute/completed`. Therefore this pack uses explicit `*.review` stages as a compatibility bridge. After the fixed extension is active, future packs should prefer same-slice execute -> review unless there is a separate product reason to model review as its own stage.

## Machine Queue

- active_step: `ERW0.plan-workset-reconcile`
- latest_completed_step: `none`
- intended_handoff: `plan-creator`
- latest_closeout_summary: Hardening pack active truth repaired to focus first on this plan/workset and classify current dirty pi-sdk changes before downstream recovery.
- latest_verification:
  - `Read skills/plan-creator/SKILL.md and references/autopilot-control-plane-pack.md.`
  - `Code audit read src/extension/index.ts, src/extension/runtime-dispatch.ts, src/substrate/control-plane.ts, src/autopilot/state.ts, and targeted tests.`
  - `npx tsx --test test/extension.test.ts test/extension-local-proof.test.ts test/control-plane.test.ts passed 51 tests.`
  - `Downstream loadLocalControlPlaneSnapshot currently fails with Missing active stage heading, matching the unsafe PACK_COMPLETE diagnosis.`
