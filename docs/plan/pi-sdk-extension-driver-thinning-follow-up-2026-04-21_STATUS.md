# PI SDK Extension Driver Thinning Follow-Up 2026-04-21 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `extension driver thinning follow-up`
- predecessor_pack: `pi-sdk-autopilot-0-68-allowlist-indicator-and-session-transition-hardening-2026-04-21` (closed out)
- execution_boundary: `structure-only follow-up; no product-boundary change and no new autopilot feature surface`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `closeout_complete`
- why_done:
  1. `R1` extracted tool allowlist / missing-tool helpers into a dedicated seam while preserving the two-layer guard model
  2. `R2` extracted runtime UI / working-indicator rendering plus session replacement messaging so `index.ts` is closer to an assembly layer
  3. `R3` updated repo structure docs, recorded new verification evidence, and closed the pack out honestly

## Planned Stages

- [x] `R1` tool-guard-seam-extraction
- [x] `R2` runtime-ui-and-session-transition-extraction
- [x] `R3` docs-regression-and-closeout

## Completed Stages

### `R1 — tool-guard-seam-extraction`

已完成：

1. 新建 `src/extension/tool-guard.ts`，集中承载 required-tool detection、missing reason formatting、command-side preflight
2. `src/extension/index.ts` 不再内联 allowlist helper 细节，只保留 authoritative guard wiring
3. 新增 `test/extension-support.test.ts` 覆盖 extracted seam 的核心 contract

verification evidence:

1. `npx tsx --test test/extension-support.test.ts test/extension.test.ts test/extension-rebuild.test.ts test/control-plane.test.ts` → pass
2. `npm test` → pass (`96` tests)
3. `npm run typecheck` → pass
4. `npm run build` → pass

### `R2 — runtime-ui-and-session-transition-extraction`

已完成：

1. 新建 `src/extension/runtime-ui.ts`，承载 status/widget/working-indicator rendering 与 clear logic
2. 新建 `src/extension/session-transition.ts`，承载 reason-aware session replacement messaging helper
3. `src/extension/index.ts` 保留 runtime event wiring，不再内联 UI / session-message helper 实现
4. integration tests + extracted seam tests 证明 allowlist / indicator / session-shutdown behavior 未回退

verification evidence:

1. `npx tsx --test test/extension-support.test.ts test/extension.test.ts test/extension-rebuild.test.ts test/control-plane.test.ts` → pass
2. `npm test` → pass (`96` tests)
3. `npm run typecheck` → pass
4. `npm run build` → pass

### `R3 — docs-regression-and-closeout`

已完成：

1. README 结构树已更新为新的 extension helper seams
2. architecture module-boundary table 已放宽到 `src/extension/index.ts`, `src/extension/*.ts`
3. repo-level `docs/plan/README.md` 已切换到当前 closeout pack 并保持 machine-compatible truth

verification evidence:

1. `npm test` → pass (`96` tests)
2. `npm run typecheck` → pass
3. `npm run build` → pass

## Machine State

- active_step: `PACK_COMPLETE`
- intended_handoff: `no immediate successor pack required for this workstream`
- active_pack: `pi-sdk-extension-driver-thinning-follow-up-2026-04-21`
- last_completed_step: `R3`

## Final Result

This pack turned the review residual into a bounded structural cleanup without changing runtime behavior:

1. `src/extension/index.ts` is thinner and more clearly an assembly / event-wiring surface
2. recently added Pi 0.68 behavior seams now live in named helper modules instead of anonymous in-file blocks
3. the driver still preserves the same single-session, Pi-native product boundary and passes the existing regression ladder

## Final Verification Evidence

- `npx tsx --test test/extension-support.test.ts test/extension.test.ts test/extension-rebuild.test.ts test/control-plane.test.ts` → pass
- `npm test` → pass (`96` tests)
- `npm run typecheck` → pass
- `npm run build` → pass

## Residuals

1. `src/extension/index.ts` is thinner but still owns the main event wiring / assembly surface by design
2. if future packs add more interactive-driver helpers, another split may still be warranted
3. this pack intentionally did not widen scope into new features or new control-plane behavior

## Next Step

- no immediate successor pack required for this workstream
- intended_handoff: `human decision`
