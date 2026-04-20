# PI SDK Extension-Native Autopilot Hardening and Compaction Optimization 2026-04-18 Workset

## Stage Order

按依赖顺序推进；每个 wave 完成后必须先 review，再 replan，再进入下一 wave：

- [x] `O1` continuation-contract hardening
- [x] `O2` compaction-aware resume
- [x] `O3` proactive context-pressure compaction
- [x] `O4` goal-directed decision rubric
- [x] `O5` verification and operator proof

## Active Stage

### `PACK_COMPLETE`

- Owner: `closeout`
- State: `DONE`
- Priority: `closeout_complete`

## Completion Summary

### `O1 — continuation-contract hardening`

- landed no-ask continuation rules in the shared prompt protocol
- landed runtime-level `before_agent_start` continuation injection
- validated by targeted tests plus full regressions

### `O2 — compaction-aware resume`

- wired `session_compact` rebuild and runnable auto-redispatch
- proved running vs paused post-compact behavior in targeted tests

### `O3 — proactive context-pressure compaction`

- landed token-threshold-based compaction gating in `turn_end`
- prevented immediate next-phase dispatch when context pressure is high

### `O4 — goal-directed decision rubric`

- added explicit route-selection rules based on closest progress to the overall objective
- extended the structured report shape with optional decision evidence fields

### `O5 — verification and operator proof`

- added a bounded e2e-like compaction continuation test
- cleared final full regressions after all waves landed

### Post-closeout follow-up

- landed stronger decision-state operator visibility:
  - `test/extension.test.ts`
  - `test/closeout.test.ts`
- landed stronger live smoke evidence:
  - `test/pi-bb-backed-smoke.test.ts`
  - `src/substrate/pi-bb-backed-smoke.ts`

## Final Verification Evidence

- `npx tsx --test test/phase-prompt.test.ts` = PASS
- `npx tsx --test test/extension.test.ts` = PASS
- `npx tsx --test test/extension-rebuild.test.ts` = PASS
- `npx tsx --test test/state.test.ts` = PASS
- `npx tsx --test test/closeout.test.ts` = PASS
- `npx tsx --test test/pi-bb-backed-smoke.test.ts` = PASS
- `npm test` = PASS (`60` tests)
- `npm test` = PASS (`61` tests) after post-closeout follow-up
- `npm run typecheck` = PASS
- `npm run build` = PASS

## Final Result

1. the extension-native route is now materially hardened in code, not just in design prose
2. autopilot now has:
   - continuation contract injection
   - compaction-aware resume
   - proactive context-pressure compaction
   - goal-directed decision rubric
3. the compaction continuation chain is covered by a bounded e2e-like test
4. this optimization pack is closed out honestly

## Next Candidate Slice

- none inside this pack
- future work, if any, should start from a fresh maintenance pack

## Handoff Target

- `human decision`
