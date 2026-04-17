# PI SDK Final Residual Clean Startup Route BB-Backed Capability Proof 2026-04-17 Workset

## Stage Order

按依赖顺序推进；每个 wave 完成后先汇报，再决定是否继续下一 wave：

- [x] `R1` deterministic-route-freeze-and-minimal-harness-seam
- [x] `R2` fake-provider-and-fake-bb-minimal-run-proof
- [x] `R3` script-surface-regression-and-proof-hardening
- [x] `R4` residual-verdict-and-closeout

## Active Stage

### `PACK_COMPLETE`

- Owner: `closeout`
- State: `DONE`
- Priority: `closeout_complete`

## Completion Summary

### `R1 — deterministic-route-freeze-and-minimal-harness-seam`

- created the fresh residual control-plane pack
- landed the first deterministic BB-backed smoke seam
- proved the clean startup-route first BB-backed entry signal without hidden auth assumptions

### `R2 — fake-provider-and-fake-bb-minimal-run-proof`

- strengthened the proof target via TDD first
- proved that print-mode second-invocation status is not the truthful route
- replaced that wrong route with the correct bounded same-process RPC progression proof

### `R3 — script-surface-regression-and-proof-hardening`

- landed the repo script surface:
  - `scripts/pi-bb-backed-smoke.mjs`
  - `package.json` → `smoke:pi-bb-backed`
- landed script-facing formatter/output support in:
  - `src/substrate/pi-bb-backed-smoke.ts`
- synced package/manifest/docs/test surfaces:
  - `src/substrate/manifest.ts`
  - `test/build-hygiene.test.ts`
  - `test/run-manifest.test.ts`
  - `test/pi-bb-backed-smoke.test.ts`
  - `README.md`
  - `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`

### `R4 — residual-verdict-and-closeout`

- closed the residual explicitly
- wrote the overall project-complete verdict
- left no new successor pack requirement for this workstream

## Final Verification Evidence

- `cd /home/peng/dt-git/github/pi-sdk && npx tsx --test test/pi-bb-backed-smoke.test.ts test/build-hygiene.test.ts test/run-manifest.test.ts` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm test` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm run build` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm run smoke:pi-bb-backed` = PASS
- `cd /home/peng/dt-git/github/pi-sdk && npm run release:check` = PASS

## Final Result

1. the final residual is closed
2. the canonical BB-backed proof route is now explicit and scriptable:
   - print-mode first signal
   - same-process RPC progression proof
3. the overall project can now be honestly claimed complete under the strict final-goal law
4. this residual pack is closed out

## Next Candidate Slice

- none inside this pack
- no successor pack required for this workstream

## Handoff Target

- `human decision`
