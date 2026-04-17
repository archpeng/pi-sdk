# PI SDK Post-V1 Packaged Artifact Maintenance and Clean Install Smoke 2026-04-17 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> CLOSEOUT`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `pi-sdk post-v1 packaged artifact maintenance and clean install smoke`
- control_plane_anchor: `/home/peng/dt-git/github/pi-sdk/docs/plan`
- predecessor_pack: `pi-sdk-autopilot-productization-and-v1-release-readiness-2026-04-17` (closed out)
- execution_boundary: `single active control plane anchored only in pi-sdk/docs/plan`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `all planned maintenance slices executed, reviewed, replanned, and closed out in this pack`
- why_done:
  1. the strongest post-v1 residual from `P13` — clean-room packaged-install smoke — now has a real scriptable harness and evidence
  2. installed-package diagnostics are now honest and no longer require repo-only plan-control docs inside the shipped tarball
  3. packaged-install smoke is now part of the repeatable maintenance/release gate rather than a manual residual
  4. future continuation should start from a fresh maintenance/backlog pack instead of reopening this successor pack

## Completed Slices

- [x] `M1.S1` maintenance-boundary-freeze
- [x] `M1.S2` packaged-artifact-install-smoke-harness
- [x] `M1.S3` installed-package-diagnostics-truth-alignment
- [x] `M1.S4` maintenance-acceptance-gate
- [x] `M1.S5` closeout-and-next-maintenance-handoff

## Closeout Summary

- [x] kept the maintenance pack bounded to packaged-artifact/install smoke only:
  - no reopen of `P10` / `P11` / `P12` / `P13`
  - no BB truth-boundary drift
  - no npm publish / registry automation side effects
- [x] landed real packaged-install smoke code surfaces:
  - `src/substrate/package-smoke.ts`
  - `scripts/packaged-install-smoke.mjs`
  - `src/substrate/manifest.ts`
  - `src/substrate/index.ts`
  - `scripts/release-readiness-check.mjs`
  - `package.json`
- [x] aligned installed-package diagnostics truth:
  - `--doctor` remains PASS in repo checkout form
  - `--doctor` now also remains PASS in installed-package form without assuming repo-only `docs/plan/README.md` ships in the tarball
- [x] synced operator/docs surfaces:
  - `README.md`
  - `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
  - `docs/plan/README.md`
- [x] landed targeted TDD for maintenance surfaces:
  - `test/package-smoke.test.ts`
  - `test/run-manifest.test.ts`
  - `test/build-hygiene.test.ts`
- [x] widened the scriptable acceptance gate honestly:
  - `npm run smoke:packaged-install`
  - `npm run release:check` now includes packaged-install smoke after dry-run packaging

## Verification Evidence

- [x] `cd /home/peng/dt-git/github/pi-sdk && npx tsx --test test/build-hygiene.test.ts test/run-manifest.test.ts test/package-smoke.test.ts` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm test` PASS (`51` tests)
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run build` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --doctor` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run smoke:packaged-install` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run release:check` PASS

## Latest Evidence

- clean-room maintenance smoke now proves this bounded flow:
  1. `npm pack --pack-destination <tmp>`
  2. temp project `npm install --prefer-offline --no-audit --fund false <tarball>`
  3. installed CLI `--version`
  4. installed CLI `--doctor`
  5. packaged runbook presence
- printed installed-package evidence observed in this pack:
  - `packaged-install-smoke: PASS`
  - `version: 0.1.0`
  - installed `doctor: PASS`
  - `runbook: present`

## Gate State

- post_v1_boundary_frozen: `PASS`
- packaged_artifact_install_smoke_harness_landed: `PASS`
- installed_package_doctor_truth_aligned: `PASS`
- maintenance_acceptance_gate_includes_packaged_smoke: `PASS`
- maintenance_gate_executed: `PASS`
- active_control_plane_single_root: `PASS`

## Residuals / Follow-up

- this pack proves local tarball -> temp project install smoke using the current environment and npm cache; it does **not** perform registry publish or third-party clean-machine install validation
- workspace remains dirty, so downstream claims should remain bounded and evidence-based
- any future publish automation, CI wiring, or broader release-channel work should start from a fresh maintenance/backlog pack rather than reopening this one

## Next Step

- [x] complete the full post-v1 maintenance pack honestly
- [x] leave the repo with a resumable closed pack and evidence-backed outcome
- future continuation, if desired, should start from a fresh maintenance/backlog pack rather than reopening this pack
