# PI SDK BB Autopilot Benchmark Promotion and Learned Components 2026-04-16 Workset

## Active Slice Queue

- [x] `P6.S1` benchmark-promotion-and-learned-surface-boundary-freeze
- [x] `P6.S2` benchmark-doc-sync-or-stop-handoff — superseded by `P9`
- [x] `P6.S3` scoped-implementation-spike-only-if-boundary-stays-local — superseded by `P9`

## Active Slice

### `SUPERSEDED` — successor pack owns continuation

- owner: `superseded`
- state: `SUPERSEDED`
- priority: `none`
- outcome:
  1. `P6.S1` remains useful predecessor boundary evidence
  2. active execution moved to `P9` after the later `P7` and `P8` packs changed the current continuation context
  3. this pack should not be resumed directly

## Linear Execution Steps

1. re-read `README.md`, `docs/architecture.md`, `docs/pi-sdk-bb-integration-architecture.md`, and `docs/plan/README.md`
2. identify only wording drift or missing cross-reference caused by the `P6.S1` boundary freeze
3. land the minimum doc-only edits needed to restore consistency across those surfaces
4. if consistency would require a new truth path, local registry, or Pi-core / runtime change, stop and write residual / handoff evidence to `STATUS / WORKSET` instead of forcing a local solution
5. run targeted verification by re-reading the changed docs and checking the stop-boundary language still matches the frozen boundary

## Files / Surfaces Expected In This Slice

### Likely docs to touch

1. `README.md`
2. `docs/architecture.md`
3. `docs/pi-sdk-bb-integration-architecture.md`
4. `docs/plan/README.md`

### Control-plane files to update with evidence

1. `docs/plan/pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16_STATUS.md`
2. `docs/plan/pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16_WORKSET.md`

### Repo-owned seams that remain read-only anchors unless stop boundary is crossed

1. `src/sdk/orchestrator.ts`
2. `src/substrate/types.ts`
3. `src/substrate/hydration.ts`
4. `src/extension/index.ts`

## Carry-Forward Evidence

1. `P6.S1` passed review and is closed for this pack
2. `docs/pi-sdk-bb-integration-architecture.md` §12.5 freezes benchmark objective families, promotion / rollback evidence shape, learned-surface ownership, and the local stop boundary
3. `docs/architecture.md` §11.1 records the repo-local execution boundary and the requirement to stop on new truth path / registry / Pi-core work
4. no new truth path, local registry, or Pi-core patch was needed to land `P6.S1`

## Expected Verification

1. changed docs remain consistent with `P6.S1` boundary freeze and the thin-shell / BB-substrate direction
2. any edits stay doc-only unless the worker explicitly stops on the hard boundary
3. `STATUS / WORKSET` capture concrete evidence for either:
   - successful doc sync, or
   - explicit residual / handoff stop
4. if no additional doc edit is needed, the worker must still record evidence that the surfaces were checked and already aligned

## Done-When Boundary

1. any wording drift across `README.md`, `docs/architecture.md`, `docs/pi-sdk-bb-integration-architecture.md`, and `docs/plan/README.md` is either corrected or explicitly shown not to exist
2. the current boundary is still clearly expressed as:
   - BB owns benchmark / promotion truth
   - `pi-sdk` stays a thin orchestration shell
   - new truth path / local registry / Pi-core work triggers stop rather than local invention
3. `STATUS / WORKSET` record concrete evidence for the result of `P6.S2`
4. the next handoff is unambiguous: either proceed to `P6.S3` if the boundary still stays local, or stop with residual handoff evidence

## Stop Boundary

1. stop if benchmark/promotion truth needs a new server-owned truth path that the repo cannot define locally
2. stop if a new local benchmark/promotion registry is required
3. stop if Pi core / `ModelRegistry` / extension runtime changes are required outside current repo-owned seams
4. stop if the only available path would turn `pi-sdk` into a benchmark registry or replay/eval runtime

## Next Slices (Locked Order)

| Slice | State | Owner | Primary outcome | Expected verification |
|---|---|---|---|---|
| `P6.S1-benchmark-promotion-and-learned-surface-boundary-freeze` | REVIEWED_DONE | `review` | freeze benchmark/promotion/learned boundaries and confirm stop-boundary correctness | PASS |
| `P6.S2-benchmark-doc-sync-or-stop-handoff` | SUPERSEDED | `superseded` | carried forward into the post-P8 `P9` successor pack instead of direct execution here | use `P9` control plane |
| `P6.S3-scoped-implementation-spike-only-if-boundary-stays-local` | SUPERSEDED | `superseded` | deferred until/if the post-P8 `P9` successor pack proves a safe local continuation path | use `P9` control plane |

## Handoff Target

- immediate_next_target: `execute-plan`
- reason: execute the successor pack `pi-sdk-pi-native-autopilot-benchmark-projection-and-promotion-readiness-2026-04-17` from `P9.S1`; this `P6` pack is predecessor context only
