# PI SDK Autopilot Extension × Plan-Creator × Execute-Plan Gap Closing 2026-04-22 Workset

## Stage Order

- [ ] `G1` phase-skill-routing-contract-freeze
- [ ] `G2` extension-phase-router-and-skill-aware-dispatch
- [ ] `G3` skill-and-template-protocol-alignment
- [ ] `G4` dual-root-local-substrate-support
- [ ] `G5` done-when-stop-boundary-parser-prompt-runtime-gate
- [ ] `G6` skill-aware-end-to-end-proof
- [ ] `G7` docs-regression-and-closeout

## Active Stage

### `G1`

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- 冻结 deterministic 的 phase -> skill / prompt routing contract，以及 missing-skill / wrong-route / selected-tools fail-fast law

必须交付：

1. canonical routing matrix for all autopilot phases
2. chosen skill-bound dispatch encoding and review/closeout surface decision
3. explicit fail-fast law for missing skill, wrong route, missing `autopilot_report`, and wrong `stepId`

必须避免：

1. implicit “model may use the right skill” routing
2. undocumented review / closeout fallback surfaces
3. cross-root skill edits without explicit ownership and verification shape

## Slice Ownership

### `G1`

- `src/extension/runtime-dispatch.ts`
- `src/autopilot/phase-prompt.ts`
- `src/autopilot/protocol.ts`
- `test/extension.test.ts`
- `test/phase-prompt.test.ts`
- `docs/plan/README.md`

### `G2`

- `src/extension/index.ts`
- `src/extension/runtime-dispatch.ts`
- `src/autopilot/phase-prompt.ts`
- `src/autopilot/state.ts`
- `test/extension.test.ts`

### `G3`

- `/home/peng/.pi/agent/skills/plan-creator/SKILL.md`
- `/home/peng/.pi/agent/skills/plan-creator/references/autopilot-control-plane-pack.md`
- `/home/peng/.pi/agent/skills/plan-creator/assets/*.md`
- `/home/peng/.pi/agent/skills/execute-plan/SKILL.md`
- `/home/peng/.pi/agent/skills/execute-plan/references/autopilot-control-plane-execution.md`
- `/home/peng/.pi/agent/skills/execute-plan/assets/*.md`
- `/home/peng/.pi/agent/skills/execution-reality-audit/SKILL.md`

### `G4`

- `src/substrate/control-plane.ts`
- `src/substrate/local.ts`
- `src/substrate/types.ts`
- `src/substrate/hydration.ts`
- `test/control-plane.test.ts`
- `test/extension-local-proof.test.ts`

### `G5`

- `src/substrate/control-plane.ts`
- `src/substrate/types.ts`
- `src/autopilot/protocol.ts`
- `src/autopilot/phase-prompt.ts`
- `src/autopilot/state.ts`
- `src/extension/index.ts`
- `test/control-plane.test.ts`
- `test/phase-prompt.test.ts`
- `test/extension.test.ts`

### `G6`

- `test/extension.test.ts`
- `test/extension-local-proof.test.ts`
- `test/engine.test.ts`
- `test/phase-prompt.test.ts`
- `test/extension-rebuild.test.ts`
- `test/extension-skill-routing.test.ts` (if added)

### `G7`

- `README.md`
- `docs/architecture.md`
- `docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md`
- `docs/plan/README.md`
- this pack’s `PLAN / STATUS / WORKSET`

## Expected Verification

- baseline preserve gate:
  - `npm run typecheck`
  - `npm run build`
  - `npx tsx --test test/engine.test.ts test/phase-prompt.test.ts test/control-plane.test.ts test/extension-support.test.ts test/extension-rebuild.test.ts test/extension-local-proof.test.ts test/extension.test.ts test/pi-bb-backed-smoke.test.ts`
- `G1-G2` targeted routing / fail-fast tests
- `G3` skill/template alignment review + targeted validation where feasible
- `G4-G5` parser/writeback/prompt/runtime gate tests
- `G6` skill-aware e2e-like proof
- `G7` final regression ladder + docs/control-plane closeout proof
