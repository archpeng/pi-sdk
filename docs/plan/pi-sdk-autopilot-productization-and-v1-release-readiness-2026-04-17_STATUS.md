# PI SDK Autopilot Productization and V1 Release Readiness 2026-04-17 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> CLOSEOUT`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `pi-sdk autopilot productization and v1 release readiness`
- control_plane_anchor: `/home/peng/dt-git/github/pi-sdk/docs/plan`
- predecessor_pack: `pi-sdk-bb-first-learned-component-eval-and-promotion-loop-2026-04-17` (closed out)
- roadmap_source: `docs/roadmap/pi-sdk-autopilot-endgame-roadmap-2026-04-17.md`
- execution_boundary: `single active control plane anchored only in pi-sdk/docs/plan`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `all planned P13 slices executed, reviewed, replanned, and closed out in this pack`
- why_done:
  1. v1 release-readiness boundary is now frozen as a bounded productization layer over the already-closed `P10` + `P11` + `P12` loop
  2. packaging/version/install-upgrade discipline landed as real code and package scripts rather than README-only prose
  3. operator install / upgrade / diagnostics / recovery truth is now anchored in a runbook plus CLI-readable manifest/doctor surfaces
  4. production-like acceptance is now a repeatable `npm run release:check` gate with evidence-backed execution
  5. future work should start from a fresh post-v1 successor/maintenance pack rather than reopening `P13`

## Completed Slices

- [x] `P13.S1` v1-release-readiness boundary freeze
- [x] `P13.S2` packaging/versioning/install-upgrade discipline
- [x] `P13.S3` operator runbook and recovery/diagnostics bundle
- [x] `P13.S4` production-like smoke/regression/acceptance gate
- [x] `P13.S5` v1 closeout and post-v1 roadmap handoff

## Closeout Summary

- [x] froze `P13` as bounded productization work only:
  - no reopen of BB owner-boundary decisions
  - no second truth path outside BB
  - no Pi core/runtime patch
- [x] landed packaging/version/install-upgrade code surfaces:
  - `src/sdk/cli.ts`
  - `src/substrate/manifest.ts`
  - `src/sdk/orchestrator.ts`
  - `src/substrate/index.ts`
  - `package.json`
  - `scripts/release-readiness-check.mjs`
- [x] added stable v1 readiness entrypoints:
  - `node dist/sdk/orchestrator.js --version`
  - `node dist/sdk/orchestrator.js --print-manifest`
  - `node dist/sdk/orchestrator.js --doctor`
  - `npm run release:check`
  - `npm pack --dry-run`
- [x] shipped operator-facing runbook and docs sync:
  - `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
  - `README.md`
  - `docs/plan/README.md`
- [x] added targeted TDD for release/readiness surfaces:
  - `test/entrypoint.test.ts`
  - `test/run-manifest.test.ts`
  - `test/build-hygiene.test.ts`
- [x] kept the productization layer honest:
  - manifest/doctor describe package/install/readiness truth only
  - no local benchmark / eval / promotion / advisory truth was introduced
  - acceptance remains scriptable and bounded
- [x] completed post-v1 handoff routing:
  - `P13` is closed out
  - future continuation should begin with a fresh post-v1 successor/maintenance pack, not by reopening `P13`

## Verification Evidence

- [x] `cd /home/peng/dt-git/github/pi-sdk && npx tsx --test test/entrypoint.test.ts test/run-manifest.test.ts test/build-hygiene.test.ts` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm test` PASS (`49` tests)
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run build` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --help` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --version` PASS (`0.1.0`)
- [x] `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --print-manifest` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --doctor` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run release:check` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm pack --dry-run` PASS (run inside `release:check`, with `prepack` rebuild and operator runbook included in the tarball)

## Latest Evidence

- active v1 readiness code surfaces:
  - `src/sdk/cli.ts`
  - `src/substrate/manifest.ts`
  - `src/sdk/orchestrator.ts`
  - `scripts/release-readiness-check.mjs`
- active docs/runbook surfaces:
  - `README.md`
  - `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
  - `docs/plan/pi-sdk-autopilot-productization-and-v1-release-readiness-2026-04-17_PLAN.md`
  - `docs/plan/pi-sdk-autopilot-productization-and-v1-release-readiness-2026-04-17_STATUS.md`
  - `docs/plan/pi-sdk-autopilot-productization-and-v1-release-readiness-2026-04-17_WORKSET.md`
- acceptance evidence:
  - `release:check` executed end-to-end and included tests/typecheck/build/help/version/manifest/doctor/pack dry-run

## Gate State

- p13_v1_boundary_frozen: `PASS`
- p13_packaging_version_install_upgrade_discipline_landed: `PASS`
- p13_operator_runbook_and_diagnostics_bundle_landed: `PASS`
- p13_scriptable_acceptance_gate_landed: `PASS`
- p13_v1_release_readiness_gate_executed: `PASS`
- p13_no_second_truth_path_invented: `PASS`
- p13_active_control_plane_single_root: `PASS`

## Residuals / Follow-up

- acceptance has been proven from the repo checkout plus package dry-run; this pack did **not** publish an npm release or verify an external clean-machine install
- workspace remains dirty, so future work should continue making bounded, evidence-backed claims only
- live BB truth surfaces were already closed in prior packs; `P13` validated package/readiness surfaces rather than re-running the full earlier cross-repo loop

## Next Step

- [x] complete the full `P13` pack honestly
- [x] leave the repo with a resumable closed pack and evidence-backed outcome
- future continuation, if desired, should start from a fresh post-v1 successor/maintenance pack rather than reopening `P13`
