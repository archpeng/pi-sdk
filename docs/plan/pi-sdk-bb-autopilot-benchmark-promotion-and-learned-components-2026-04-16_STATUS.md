# PI SDK BB Autopilot Benchmark Promotion and Learned Components 2026-04-16 Status

## Current State

- state: `SUPERSEDED_BY_SUCCESSOR_PACK`
- owner: `superseded`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> SUPERSEDED`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `pi-sdk × BB autopilot benchmark / promotion / learned-components boundary freeze`
- superseded_by: `docs/plan/pi-sdk-pi-native-autopilot-benchmark-projection-and-promotion-readiness-2026-04-17_{PLAN,STATUS,WORKSET}.md`

## Current Step

- active_step: `SUPERSEDED_BY_P9`
- mode: `this pack is retained as predecessor context only; active execution moved to the post-P8 successor pack`
- why_now:
  1. `P6.S1` remains valid boundary evidence, but the remaining queue was planned before the later `P7` Pi-first refactor and `P8` runtime hardening/alignment work
  2. a new successor pack now carries the benchmark/promotion continuation in a post-P8 Pi-first context
  3. future execution should not choose between two benchmark-oriented active packs

## Recently Completed

- [x] executed and reviewed `P6.S1-benchmark-promotion-and-learned-surface-boundary-freeze`
- [x] confirmed the boundary freeze is consistent with the thin-shell / BB-substrate direction
- [x] promoted `P6.S2-benchmark-doc-sync-or-stop-handoff` to the active slice in `WORKSET` and `docs/plan/README.md`
- [x] replanned the wave so `P6.S2` has a bounded doc-first scope, explicit surfaces, and an unchanged hard stop boundary

## Next Step

- do not continue execution from this pack
- next target:
  1. use `docs/plan/pi-sdk-pi-native-autopilot-benchmark-projection-and-promotion-readiness-2026-04-17_{PLAN,STATUS,WORKSET}.md` as the active control plane
  2. carry forward `P6.S1` boundary truth only as predecessor evidence
  3. execute the new successor pack’s `P9.S1` instead of reviving `P6.S2`

## Latest Evidence

- carry-forward boundary evidence:
  - `docs/pi-sdk-bb-integration-architecture.md` §12.5 freezes benchmark families, promotion / rollback evidence shape, learned-surface ownership, and the stop boundary
  - `docs/architecture.md` §11.1 freezes the repo-local execution boundary and limits continuation to existing seams
- supersession evidence:
  - `docs/plan/README.md` now points to the `P9` successor pack as the active control plane
  - `docs/plan/pi-sdk-pi-native-autopilot-benchmark-projection-and-promotion-readiness-2026-04-17_STATUS.md` records this `P6` pack as superseded predecessor context
  - `docs/plan/pi-sdk-pi-native-autopilot-benchmark-projection-and-promotion-readiness-2026-04-17_WORKSET.md` promotes `P9.S1` as the singular next executable slice
- boundary proof still holds:
  - no new truth path was required by `P6.S1`
  - no local registry was introduced or required
  - no Pi core / `ModelRegistry` / extension runtime patch was required

## Gate State

- p6s1_reviewed_done: `PASS`
- p6s2_active_slice_selected: `PASS`
- p6s2_scope_bounded: `PASS`
- p6s2_doc_surfaces_named: `PASS`
- p6s2_validation_shape_defined: `PASS`
- new_truth_path_required: `NO`
- local_registry_required: `NO`
- pi_core_patch_required: `NO`
- successor_pack_created: `PASS`
- ready_for_execute_plan_handoff: `NO — use P9 instead`

## Blockers

- no blocker is currently triggered inside the replanned `P6.S2` scope
- execution must stop if `P6.S2` uncovers a need to:
  1. invent a new server-owned truth path from inside this repo
  2. add a local benchmark / promotion registry
  3. patch Pi core / `ModelRegistry` / extension runtime outside current repo-owned seams

## Stop Conditions

1. stop and hand off if doc sync cannot proceed without a server-owned benchmark / promotion truth path that does not already exist
2. stop and hand off if a local benchmark or promotion registry becomes necessary
3. stop and hand off if further progress requires Pi core rather than repo-local doc / seam work
4. do not revive this pack as the active queue; continue from `P9` instead
