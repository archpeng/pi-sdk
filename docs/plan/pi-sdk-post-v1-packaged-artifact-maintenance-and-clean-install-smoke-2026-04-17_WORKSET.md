# PI SDK Post-V1 Packaged Artifact Maintenance and Clean Install Smoke 2026-04-17 Workset

## Active Slice Queue

- [x] `M1.S1` maintenance-boundary-freeze
- [x] `M1.S2` packaged-artifact-install-smoke-harness
- [x] `M1.S3` installed-package-diagnostics-truth-alignment
- [x] `M1.S4` maintenance-acceptance-gate
- [x] `M1.S5` closeout-and-next-maintenance-handoff

## Active Slice

### `PACK_COMPLETE`

- Owner: `closeout`
- State: `DONE`
- Priority: `closeout_complete`

## Completion Summary

### `M1.S1 — maintenance-boundary-freeze`

- froze the post-v1 maintenance residual to packaged-install smoke only
- kept explicit stop law against publish/registry side effects and boundary drift
- switched the active control plane from the closed `P13` pack to this maintenance pack

### `M1.S2 — packaged-artifact-install-smoke-harness`

- landed `src/substrate/package-smoke.ts`
- landed `scripts/packaged-install-smoke.mjs`
- landed package script `npm run smoke:packaged-install`
- proved the helper with targeted TDD and a fixture tarball install smoke

### `M1.S3 — installed-package-diagnostics-truth-alignment`

- aligned `runAutopilotDoctorChecks(...)` so installed-package diagnostics remain honest without repo-only plan-control files
- extended manifest diagnostics with `packagedInstall`
- synced README and operator runbook to the new maintenance truth

### `M1.S4 — maintenance-acceptance-gate`

- widened `scripts/release-readiness-check.mjs` so `npm run release:check` includes packaged-install smoke
- executed:
  - `npm test`
  - `npm run typecheck`
  - `npm run build`
  - `node dist/sdk/orchestrator.js --help|--version|--print-manifest|--doctor`
  - `npm pack --dry-run`
  - `npm run smoke:packaged-install`
  - `npm run release:check`
- final gate passed

### `M1.S5 — closeout-and-next-maintenance-handoff`

- closed the maintenance pack with evidence-backed outcome
- routed future work to a fresh maintenance/backlog pack
- explicitly did not reopen `P13` or earlier packs

## Final Verification Evidence

- `cd /home/peng/dt-git/github/pi-sdk && npx tsx --test test/build-hygiene.test.ts test/run-manifest.test.ts test/package-smoke.test.ts` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm test` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm run build` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --doctor` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm run smoke:packaged-install` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm run release:check` = PASS

## Closeout Result

1. `pi-sdk` now has a real clean-room packaged-install smoke harness
2. installed-package diagnostics are aligned with shipped package reality
3. maintenance acceptance now covers tarball install smoke instead of leaving it as a residual
4. this post-v1 maintenance pack is honestly closed out

## Next Candidate Slice

- none inside this maintenance pack
- future continuation should materialize a fresh maintenance/backlog successor pack

## Handoff Target

- `human decision`
