# PI SDK Autopilot Execute/Review Writeback Hardening 2026-05-01 Status

- status: `active`
- current_step: `ERW0.plan-workset-reconcile` — repair this hardening pack's active truth around the current dirty pi-sdk tree
- next_step: `ERW1.pos-lite-review-stage-repair` — downstream recovery only after current pack truth is reconciled
- blockers: `current dirty pi-sdk source/dependency/test files must be classified before downstream recovery or SDK hardening starts`
- gate_state: `pi-sdk code audit confirmed execute/completed writeback advances Stage Order before review; current pack now enters a plan/workset reconciliation slice before implementation`
- latest_evidence: Current working tree includes hardening pack docs plus dirty `package.json`, `package-lock.json`, `src/extension/index.ts`, `src/extension/runtime-ui.ts`, `test/extension-support.test.ts`, and `test/extension.test.ts`; this pack must classify those changes and keep parser truth aligned before executing ERW1/ERW2.

## Current State

- state: `ACTIVE`
- owner: `plan-creator`
- route: `ERW0 plan/workset reconcile -> ERW1 recovery -> ERW1 review -> ERW2 phase gate -> ERW2 review -> ERW3 terminal/parser guard -> ERW3 review -> ERW4 docs/smoke -> ERW4 review`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `autopilot-execute-review-writeback-hardening`
- downstream_recovery_repo: `/home/peng/dt-git/frontend/pos-lite-cashier`
- previous_active_pack: `pi-sdk-pi-coding-agent-0-70-2-compatibility-and-upgrade-2026-04-24` paused at `U3`; not closed by this plan

## Current Step

- active_step: `ERW0.plan-workset-reconcile`
- mode: `ready-for-plan-creator`
- active_root: `docs/plan/`

## Planned Stages

- [ ] `ERW0.plan-workset-reconcile` current hardening pack truth repair
- [ ] `ERW1.pos-lite-review-stage-repair` downstream explicit review-stage repair
- [ ] `ERW1.review` review downstream recovery
- [ ] `ERW2.phase-gated-writeback` review-owned accepted-slice writeback
- [ ] `ERW2.review` review phase gate
- [ ] `ERW3.pack-complete-parser-guard` terminal writeback and parser guard
- [ ] `ERW3.review` review terminal/parser guard
- [ ] `ERW4.docs-smoke-closeout` docs, validation, smoke, reload guidance
- [ ] `ERW4.review` final hardening review

## Immediate Focus

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

## Code Audit Findings

| finding                          | current evidence                                                                                                                                         | implication                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| acceptance writeback is too early | `src/extension/index.ts` calls `writeAcceptedSliceCompletion(...)` on every `autopilot_report` result before `advanceInteractiveRuntime(...)`              | execute reports can mutate control-plane truth before review                                      |
| phase gate is missing             | `src/extension/runtime-dispatch.ts` checks `completed/done` status but not `report.phase === review`                                                     | any phase with an active-slice completed report can advance Stage Order                           |
| terminal guard is missing         | `resolveNextStageFromStageOrder(...)` returns `null`; `applyControlPlaneProgressWriteback(...)` renders `PACK_COMPLETE` and `Active Stage: none`          | last execute slice can remove active-stage parser truth before review                             |
| tests encode old behavior         | `test/extension-local-proof.test.ts` expects `execute` report for `D2` to advance docs/plan to `D3` before review                                        | current green suite proves coverage gap rather than safety                                        |
| parser validation gap exists      | downstream `plan_sync` / trio / score-style checks can pass while real `loadLocalControlPlaneSnapshot` fails with `Missing active stage heading`          | post-writeback parser snapshot must be a hard validation surface                                  |

## ERW0 Dirty File Classification

| file / group                                                                                                       | ERW0 classification                          | handling before ERW1 / ERW2                                                                                 |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `docs/plan/README.md` and `pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_{PLAN,STATUS,WORKSET}.md` | in-scope for ERW0 plan/workset repair        | keep and validate as the active parser truth                                                                 |
| `package.json`, `package-lock.json`                                                                                 | out-of-scope for ERW0 and ERW1               | classify as dependency/upgrade work; do not treat as writeback-hardening evidence without explicit replan     |
| `src/extension/index.ts`, `src/extension/runtime-ui.ts`                                                              | out-of-scope for ERW0 and ERW1 as code edits | current diff appears to add thinking-level UI status behavior, not execute/review writeback hardening         |
| `test/extension-support.test.ts`, `test/extension.test.ts`                                                           | out-of-scope for ERW0 and ERW1 as tests      | current diff appears paired with thinking-level UI status behavior; keep separate from ERW2 unless replanned  |
| `/home/peng/dt-git/frontend/pos-lite-cashier/**`                                                                    | read-only for ERW0                            | ERW1 may edit downstream `docs/plan/*`; ERW0 must not                                                        |

ERW0 route decision: keep this hardening pack active, but do not let the current dependency/thinking-level diffs count as completion of ERW2/ERW3. After ERW0 validation, either execute ERW1 downstream recovery or explicitly replan if those out-of-scope diffs must be handled first.

## Latest Verification

- `workspace_scan` plus `git status --short` confirmed `/home/peng/dt-git/github/pi-sdk` is on branch `feat/packaged-routed-skills-productization` with existing dirty plan/runtime/test files; downstream `pos-lite-cashier` has 6 changed files from the OR-3D execute attempt. ERW0 classifies current pi-sdk dirty files before any downstream recovery or SDK source hardening.
- `plan_sync /home/peng/dt-git/github/pi-sdk/docs/plan` showed previous active U3 pack pending (`7 items / 5 done / 2 pending` in STATUS; `4 items / 2 done / 2 pending` in WORKSET).
- `npx tsx -e "loadLocalControlPlaneSnapshot('docs/plan', process.cwd())"` parsed the current hardening pack with active stage `ERW1.pos-lite-review-stage-repair`, owner `execute-plan`, intended handoff `execute-plan`, 8 stage-order entries, and no missing PLAN definitions.
- `npx tsx --test test/extension.test.ts test/extension-local-proof.test.ts test/control-plane.test.ts` passed (`51` tests), confirming existing tests do not catch the downstream failure mode.
- Downstream parser probe against `pos-lite-cashier/docs/plan` failed with `Missing active stage heading`, confirming ERW1 is required before autopilot can resume review there.

## Current Wave Plan

Selected bounded slice: `ERW0.plan-workset-reconcile`.

Linear execution steps:

1. Re-read this pack's README / PLAN / STATUS / WORKSET and current `git diff --name-only`.
2. Classify existing dirty files: hardening pack docs, `package.json` / `package-lock.json`, `src/extension/index.ts`, `src/extension/runtime-ui.ts`, `test/extension-support.test.ts`, and `test/extension.test.ts`.
3. Update this pack so active truth names ERW0 as the current plan/workset repair slice and records downstream recovery as a later slice.
4. Validate pi-sdk parser truth with `loadLocalControlPlaneSnapshot`, `plan_sync`, `test/control-plane.test.ts`, and `git diff --check`.
5. End ERW0 with either handoff to ERW1 downstream recovery or stop/replan if dirty source/dependency changes must be split first.

Likely changed files for ERW0:

- `docs/plan/README.md`
- `docs/plan/pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_PLAN.md`
- `docs/plan/pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_STATUS.md`
- `docs/plan/pi-sdk-autopilot-execute-review-writeback-hardening-2026-05-01_WORKSET.md`

Read-only surfaces for ERW0:

- `/home/peng/dt-git/frontend/pos-lite-cashier/**`
- `src/extension/**`, `test/**`, `package.json`, and `package-lock.json` except for classification evidence in docs.

## Blockers

- ERW1 downstream recovery cannot start until ERW0 classifies current dirty pi-sdk source/dependency changes and repairs this pack's active truth.
- SDK source hardening should not start until ERW1.review accepts the downstream recovery route, unless ERW0 explicitly replans that order.
- Current installed extension may still use old execute-time writeback behavior until a later reload/install decision; the plan uses explicit review stages as a compatibility workaround.

## Machine State

- active_step: `ERW0.plan-workset-reconcile`
- latest_completed_step: `none`
- intended_handoff: `plan-creator`
- latest_closeout_summary: Hardening pack active truth repaired to focus first on this plan/workset and classify current dirty pi-sdk changes before downstream recovery.
- latest_verification:
  - `Read skills/plan-creator/SKILL.md and references/autopilot-control-plane-pack.md.`
  - `Code audit read src/extension/index.ts, src/extension/runtime-dispatch.ts, src/substrate/control-plane.ts, src/autopilot/state.ts, and targeted tests.`
  - `npx tsx --test test/extension.test.ts test/extension-local-proof.test.ts test/control-plane.test.ts passed 51 tests.`
  - `Downstream loadLocalControlPlaneSnapshot currently fails with Missing active stage heading, matching the unsafe PACK_COMPLETE diagnosis.`
