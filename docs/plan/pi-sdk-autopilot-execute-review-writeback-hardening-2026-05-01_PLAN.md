# PI SDK Autopilot Execute/Review Writeback Hardening 2026-05-01 Plan

## Goal

Make extension-driven local autopilot safe across execute -> review boundaries by first reconciling this `pi-sdk` plan/workset with the current dirty tree, then repairing the live `pos-lite-cashier` `docs/plan/*` control plane to an explicit review stage, and finally hardening `pi-sdk` so future execute slices do not prematurely write `PACK_COMPLETE` or advance Stage Order before review acceptance.

## Scope

1. Repair this hardening pack's README / PLAN / STATUS / WORKSET truth so it reflects the current dirty `pi-sdk` source/dependency changes and the chosen next route before cross-repo recovery starts.
2. Recover the current downstream `pos-lite-cashier` order-runtime roadmap pack from the execute-completed writeback drift by adding a parser-compatible explicit review stage.
3. Add `pi-sdk` regression coverage for the execute/completed -> review boundary and local control-plane writeback behavior.
4. Change `pi-sdk` writeback semantics so acceptance-owned Stage Order progression is gated by review, not by execute completion.
5. Add a terminal / `PACK_COMPLETE` guard so local writeback cannot silently remove `WORKSET ## Active Stage` when the next runtime phase still needs an active slice.
6. Strengthen validation/docs so `loadLocalControlPlaneSnapshot` is a hard proof surface after autopilot writeback, not an optional manual probe.

## Non-goals

1. Do not implement or review the `pos-lite-cashier` OR-3D member runtime facade, member source/store cutover, OR-4, OR-5, or user-visible checkout behavior.
2. Do not resume or close the paused Pi Coding Agent `0.70.2` upgrade pack in this plan.
3. Do not rewrite the entire autopilot scheduler, BB substrate, or routed skill matrix.
4. Do not create a second machine control-plane root outside `docs/plan/*`.
5. Do not hide the current runtime compatibility workaround: this pack intentionally uses explicit review stages until the hardening is implemented, tested, released, and loaded.

## Code Audit Confirmation

The current diagnosis was confirmed against `/home/peng/dt-git/github/pi-sdk` before creating this pack:

1. `src/extension/index.ts` handles every `autopilot_report` tool result by calling `writeAcceptedSliceCompletion(...)` before `advanceInteractiveRuntime(...)`.
2. `src/extension/runtime-dispatch.ts` currently lets `writeAcceptedSliceCompletion(...)` run for any local active-slice report whose derived status is `completed` or `done`; it does not gate by `report.phase === "review"`.
3. `src/autopilot/protocol.ts` derives `execute` report status to `completed` when all active-slice `done_when` items are listed in `doneWhenMet`.
4. `src/autopilot/state.ts` independently transitions `execute` reports to the `review` phase, so writeback can advance or terminalize the active slice before the review prompt is built.
5. `src/substrate/control-plane.ts` returns `null` from `resolveNextStageFromStageOrder(...)` when the completed slice is last, and `applyControlPlaneProgressWriteback(...)` renders that as `PACK_COMPLETE` plus `Active Stage: - none; pack complete`.
6. Existing tests currently encode the risky behavior: `test/extension-local-proof.test.ts` expects an `execute` report for `D2` to advance docs/plan to `D3` before dispatching `review`.
7. Targeted current tests still pass (`npx tsx --test test/extension.test.ts test/extension-local-proof.test.ts test/control-plane.test.ts`, 51 tests), which proves the regression is not covered by existing expectations.
8. The downstream failure mode was reproduced by running `loadLocalControlPlaneSnapshot('/home/peng/dt-git/frontend/pos-lite-cashier/docs/plan', ...)`, which now fails with `Missing active stage heading` after execute writeback made the pack partially `PACK_COMPLETE`.

## Workstreams

| workstream              | owner                         | purpose                                                                                              | verification                                                                 |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| plan/workset reconcile  | `plan-creator`                | repair this hardening pack's active truth and classify current dirty pi-sdk changes                  | pi-sdk parser snapshot + plan_sync + control-plane test + diff checks        |
| downstream recovery     | `execute-plan`                | restore the current `pos-lite-cashier` pack to a parser-compatible review stage                      | downstream parser snapshot + plan_sync + trio/score + docs/diff checks       |
| writeback semantics     | `execute-plan`                | gate accepted-slice writeback by review acceptance rather than execute completion                    | extension/control-plane regression tests + typecheck                         |
| terminal safety         | `execute-plan`                | prevent unsafe `PACK_COMPLETE` writeback while runtime still needs review/replan active-slice truth  | last-stage regression tests + parser snapshot after writeback                 |
| docs/smoke alignment    | `execute-plan`                | document the fixed contract and add post-writeback parser validation to the expected operator checks | README/skill/reference updates + smoke/test coverage                         |
| evidence review         | `execution-reality-audit`     | accept or block each recovery/hardening slice before the next implementation wave                    | cold review of code, docs, and test evidence                                  |

## Exit Criteria

1. This hardening pack's README / PLAN / STATUS / WORKSET is parser-compatible, names a single active slice, and records whether the current dirty pi-sdk source/dependency changes belong to this pack or must be split out.
2. The `pos-lite-cashier` active local control plane is parser-compatible again, with active slice `OR-3D.member-baseline-review` or an equivalently explicit review stage owned by `execution-reality-audit`.
3. `pi-sdk` tests prove `execute/completed` does not advance Stage Order or write `PACK_COMPLETE` before review.
4. `pi-sdk` tests prove `review/completed` is the accepted-slice progression point and safely activates the next stage when one exists.
5. `pi-sdk` tests prove last-stage `completed` cannot silently terminalize local docs/plan unless the runtime is actually entering closeout/done semantics.
6. `loadLocalControlPlaneSnapshot` is part of the documented and tested validation floor after local autopilot writeback.
7. `npm run typecheck`, targeted extension/control-plane tests, and `npm test` pass before closeout.

## Verification Ladder

1. Downstream recovery checks: `plan_sync /home/peng/dt-git/frontend/pos-lite-cashier/docs/plan`, downstream `loadLocalControlPlaneSnapshot`, downstream trio/score scripts, docs Prettier check, and `git diff --check`.
2. Focused SDK tests while implementing: `npx tsx --test test/extension.test.ts test/extension-local-proof.test.ts test/control-plane.test.ts test/phase-prompt.test.ts`.
3. SDK type/build checks: `npm run typecheck`, then `npm run build` if source changes require dist proof.
4. Full SDK regression: `npm test`.
5. Optional smoke after code hardening: `npm run smoke:pi-commands`; `npm run smoke:pi-bb-backed` / `npm run smoke:packaged-install` only if environment and time permit.

## Stop Conditions

1. Stop if downstream `pos-lite-cashier` cannot be made parser-compatible without touching app runtime/source behavior.
2. Stop if the proposed `pi-sdk` phase gate conflicts with an intentional documented requirement that execute should advance Stage Order before review.
3. Stop if terminal `PACK_COMPLETE` semantics require a broader closeout protocol redesign rather than a bounded guard.
4. Stop if local installed Pi extension behavior cannot be validated without an explicit reload/reinstall decision.
5. Stop if unrelated `0.70.2` upgrade work or package publishing becomes necessary to finish this hardening plan.

## Master Plan

This plan deliberately starts with a current-pack reconciliation slice because the working tree now contains pi-sdk source/dependency changes that are not yet reflected in this pack's active slice. It then uses an explicit review-stage workaround because the currently installed extension behavior can still advance Stage Order on execute completion. Once the SDK hardening is implemented and loaded, future packs can return to same-slice execute -> review semantics.

### Wave 0 — plan/workset reconcile

Repair this pack's machine truth, classify current dirty pi-sdk changes, and decide the next executable route without touching downstream repos.

### Wave 1 — downstream recovery

Repair the active `pos-lite-cashier` pack so the already-executed OR-3D member baseline slice has an explicit review stage and the extension parser can dispatch `execution-reality-audit` again.

### Wave 2 — phase-gated writeback

Add regression tests and code changes so local control-plane writeback does not mark/advance the active slice on `execute/completed`; review remains the acceptance boundary.

### Wave 3 — terminal and parser guard

Prevent unsafe `PACK_COMPLETE` writeback and add parser snapshot validation after writeback so parser drift cannot pass through prose-only score/readout checks.

### Wave 4 — docs, smoke, and closeout

Update the runtime contract documentation, run the full validation ladder, and close or replan any residual release/reload work.

## Slice Definitions

#### `ERW0.plan-workset-reconcile` — current-pack-truth-repair

- Owner: `plan-creator`
- State: `READY`
- Priority: `highest`

目标：

- Repair this hardening pack's README / PLAN / STATUS / WORKSET truth around the current dirty `pi-sdk` tree before executing downstream recovery or SDK source hardening.

交付物：

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

#### `ERW1.pos-lite-review-stage-repair` — downstream-explicit-review-stage

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- Repair the current `pos-lite-cashier` `docs/plan/*` control plane from partial `PACK_COMPLETE` drift to a parser-compatible explicit review stage for `OR-3D.member-baseline-tests`.

交付物：

1. Update `/home/peng/dt-git/frontend/pos-lite-cashier/docs/plan/README.md` so `Current Active Slice` is an explicit review slice, expected `OR-3D.member-baseline-review`, and `Intended Handoff` is `execution-reality-audit`.
2. Update the downstream PLAN / STATUS / WORKSET so `OR-3D.member-baseline-tests` remains execution-complete evidence and a new review stage is active with `Owner: execution-reality-audit`.
3. Keep downstream app/runtime/test source unchanged during the recovery; preserve the already-executed OR-3D baseline test evidence.
4. Validate the downstream parser snapshot with the real `loadLocalControlPlaneSnapshot` API in addition to existing plan/readout checks.

 done_when:

1. Downstream `loadLocalControlPlaneSnapshot('/home/peng/dt-git/frontend/pos-lite-cashier/docs/plan', ...)` reports active stage `OR-3D.member-baseline-review` with owner `execution-reality-audit` and no `Missing active stage heading` error.
2. Downstream `README`, `STATUS`, and `WORKSET` agree that `OR-3D.member-baseline-tests` execution evidence exists and review is the next active step.
3. Downstream `WORKSET ## Active Stage` contains `### \`OR-3D.member-baseline-review\`` plus concrete `done_when`, `stop_boundary`, and `必须避免：` sections.
4. Downstream plan validation passes: `plan_sync`, `trio_readout.py`, `score_plan_pack.py`, docs formatting check, and `git diff --check`.

stop_boundary:

1. Stop if recovery requires changing downstream app runtime/source behavior or member transfer implementation.
2. Stop if the downstream active stage remains `PACK_COMPLETE` or `- none; pack complete` after repair.
3. Stop if the downstream `OR-3D.member-baseline-tests` execution evidence is missing or contradicted by current diffs.
4. Stop if a second downstream control-plane root appears necessary.

必须避免：

1. Treating the downstream review repair as acceptance of the OR-3D member baseline tests.
2. Starting downstream member facade/source cutover, reset/search closeout, OR-4, or OR-5 work.
3. Editing pi-sdk runtime code in this recovery slice.

#### `ERW1.review` — downstream-recovery-review

- Owner: `execution-reality-audit`
- State: `QUEUED`
- Priority: `highest`

目标：

- Cold-review the downstream explicit review-stage repair before any pi-sdk mechanism changes start.

交付物：

1. Confirm downstream `docs/plan/*` is parser-compatible and points to the explicit review stage.
2. Confirm no downstream app/runtime/source behavior changed during recovery.
3. Decide whether the next SDK hardening slice can proceed.

 done_when:

1. Downstream parser snapshot and plan validation evidence are present and current.
2. Downstream changed-file inventory is limited to parser/control-plane recovery files unless explicitly justified.
3. Review verdict accepts the recovery or blocks with exact residuals.

stop_boundary:

1. Stop if downstream parser truth still fails.
2. Stop if downstream source/runtime behavior changed outside the recovery contract.
3. Stop if OR-3D test evidence needs another execute pass before review can proceed.

必须避免：

1. Accepting OR-3D baseline behavior without reading the actual downstream diffs/evidence.
2. Starting pi-sdk source changes from the review slice.

#### `ERW2.phase-gated-writeback` — review-owned-accepted-slice-writeback

- Owner: `execute-plan`
- State: `QUEUED`
- Priority: `high`

目标：

- Change pi-sdk local autopilot writeback so execute completion records phase progress but does not mark/advance Stage Order; review completion is the accepted-slice progression boundary.

交付物：

1. Add regression tests proving `execute/completed` with all `doneWhenMet` dispatches `review` with the same active slice and does not call local control-plane advance.
2. Update existing tests that currently expect execute-time Stage Order advancement so they assert review-owned advancement instead.
3. Rename or refactor `writeAcceptedSliceCompletion` to make its acceptance boundary truthful, or add an explicit phase gate that only performs accepted-slice writeback for `review/completed` and objective-terminal `done` paths.
4. Preserve stop-law validation and routed skill dispatch behavior.

 done_when:

1. Targeted tests prove execute-completed same-slice review dispatch and review-completed next-stage activation.
2. `src/extension/index.ts` / `src/extension/runtime-dispatch.ts` no longer perform accepted-slice Stage Order advancement for ordinary `execute/completed` reports.
3. Existing wrong expectation in `test/extension-local-proof.test.ts` is replaced with the new contract.
4. `npx tsx --test test/extension.test.ts test/extension-local-proof.test.ts test/control-plane.test.ts test/phase-prompt.test.ts` passes.

stop_boundary:

1. Stop if any active tests or docs prove execute-time Stage Order advancement is an intentional required contract.
2. Stop if gating writeback by review breaks `/autopilot-resume` active-slice resync.
3. Stop if BB substrate behavior requires separate semantics that cannot be isolated from local mode.

必须避免：

1. Weakening `autopilot_report.phase`, `stepId`, `doneWhenMet`, or `stopBoundaryHit` validation.
2. Replacing deterministic routed phase order with model-chosen next actions.
3. Broad scheduler rewrites unrelated to local writeback gating.

#### `ERW2.review` — phase-gate-review

- Owner: `execution-reality-audit`
- State: `QUEUED`
- Priority: `high`

目标：

- Review the phase-gated writeback code and tests before terminal guard work.

交付物：

1. Confirm execute-completed no longer mutates docs/plan to a different active slice.
2. Confirm review-completed still advances the accepted slice when a next stage exists.
3. Confirm no routed skill/tool validation weakened.

 done_when:

1. Code inspection and targeted tests support the new execute/review boundary.
2. Review identifies whether terminal `PACK_COMPLETE` guard remains needed as a separate slice.
3. No unplanned public API or package boundary changes were introduced.

stop_boundary:

1. Stop if the code only changes tests without changing the faulty writeback path.
2. Stop if review-completed cannot advance a valid next stage.
3. Stop if local mode and BB mode semantics become conflated.

必须避免：

1. Treating passing tests as enough without inspecting the actual phase gate.
2. Combining terminal guard implementation into review.

#### `ERW3.pack-complete-parser-guard` — terminal-writeback-safety

- Owner: `execute-plan`
- State: `QUEUED`
- Priority: `high`

目标：

- Add a fail-fast guard and parser validation so local writeback cannot silently produce `PACK_COMPLETE` / `Active Stage: none` while the runtime still needs another active-slice phase.

交付物：

1. Add regression coverage for a last-stage active slice: `execute/completed` must not write `PACK_COMPLETE`; non-terminal `review/completed` without a next stage must stop or route closeout explicitly instead of silently breaking parser truth.
2. Add or expose a post-writeback parser-snapshot check so writeback verifies the resulting `docs/plan` still parses when a next active slice is expected.
3. Ensure terminal `PACK_COMPLETE` remains possible only through explicit objective-terminal semantics (`done` / closeout-compatible path) with tests.
4. Keep writeback confined to `README / STATUS / WORKSET` under the active `docs/plan/*` root.

 done_when:

1. Tests fail on the old unsafe `PACK_COMPLETE` behavior and pass with the new guard.
2. `loadLocalControlPlaneSnapshot` is exercised after writeback in at least one regression path.
3. Terminal writeback behavior is documented and tested separately from ordinary execute/review continuation.
4. Targeted extension/control-plane tests pass.

stop_boundary:

1. Stop if terminal semantics require changing the high-level phase state machine beyond local writeback guardrails.
2. Stop if post-writeback parser validation cannot distinguish terminal closeout from broken active-slice truth.
3. Stop if writeback would need to mutate PLAN definitions unexpectedly.

必须避免：

1. Allowing `Active Stage: - none; pack complete` for non-terminal continuation.
2. Treating `plan_sync` / prose score success as equivalent to extension parser success.
3. Hiding parser failures as warnings while continuing autopilot dispatch.

#### `ERW3.review` — terminal-guard-review

- Owner: `execution-reality-audit`
- State: `QUEUED`
- Priority: `high`

目标：

- Review terminal guard and parser-validation hardening before documentation and full smoke.

交付物：

1. Confirm last-stage continuation cannot silently corrupt `docs/plan` parser truth.
2. Confirm explicit terminal closeout remains possible and tested.
3. Confirm parser validation is stronger than `plan_sync` / `score_plan_pack` style prose checks.

 done_when:

1. Review accepts the guard with code/test evidence or blocks with exact missing proof.
2. The next docs/smoke slice has a deterministic validation list.
3. No downstream recovery assumptions remain unverified.

stop_boundary:

1. Stop if terminal behavior is ambiguous after code inspection.
2. Stop if tests do not cover both unsafe continuation and valid terminal paths.
3. Stop if documentation would misstate unloaded/local extension behavior as already deployed.

必须避免：

1. Publishing or packaging from review.
2. Skipping parser-readback proof.

#### `ERW4.docs-smoke-closeout` — contract-docs-and-release-readiness

- Owner: `execute-plan`
- State: `QUEUED`
- Priority: `medium`

目标：

- Align docs, routed skill references, and smoke validation with the hardened execute/review writeback contract.

交付物：

1. Update README / skill references / templates as needed so they state review-owned accepted-slice progression and post-writeback parser validation.
2. Run `npm run typecheck`, `npm test`, and `npm run build` after code changes.
3. Run the feasible Pi command/package smoke checks or record explicit environment reasons for any skipped smoke.
4. Record release/reload guidance if the installed Pi extension must be reloaded before the fix affects the current UI session.

 done_when:

1. Documentation no longer implies ordinary execute completion advances Stage Order before review acceptance.
2. Full SDK validation passes: `npm run typecheck`, `npm test`, and `npm run build`.
3. Feasible smoke checks pass or have explicit bounded skip reasons.
4. Closeout/reload residuals are recorded in STATUS / WORKSET.

stop_boundary:

1. Stop if docs changes reveal a conflict with the shipped deterministic routed phase contract.
2. Stop if package build fails after source tests pass.
3. Stop if applying the fix to the installed extension requires operator approval.

必须避免：

1. Claiming the fix is active in the currently running Pi session before reload/reinstall evidence exists.
2. Mixing the paused `0.70.2` upgrade objective into this hardening closeout.

#### `ERW4.review` — final-hardening-review

- Owner: `execution-reality-audit`
- State: `QUEUED`
- Priority: `medium`

目标：

- Final review of downstream recovery, pi-sdk writeback hardening, validation, and residual reload/release state.

交付物：

1. Accept or block the complete hardening pack.
2. Identify whether a follow-up release/install slice is required.
3. Restore or explicitly preserve any previously paused active plan state if appropriate.

 done_when:

1. Downstream recovery and pi-sdk hardening evidence are both reviewed.
2. Full validation evidence is current.
3. Residual release/reload and paused-plan handoff are explicit.

stop_boundary:

1. Stop if current-session extension behavior cannot reflect the local code changes without a separate install/reload slice.
2. Stop if downstream `pos-lite-cashier` docs remain broken.
3. Stop if any pi-sdk regression test still encodes the old execute-time advancement behavior.

必须避免：

1. Marking the paused Pi `0.70.2` upgrade pack complete.
2. Marking the hardening as deployed without installation/reload proof.
