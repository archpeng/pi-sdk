# PI SDK Autopilot 0.68 Allowlist Indicator and Session Transition Hardening 2026-04-21 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `autopilot 0.68 allowlist indicator and session transition hardening`
- predecessor_pack: `pi-sdk-local-dirty-policy-control-plane-aware-2026-04-20` (closed out)
- execution_boundary: `Pi 0.68 interactive-autopilot hardening only; no multi-session scheduler expansion`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `closeout_complete`
- why_done:
  1. `Q1` landed command-side plus authoritative `before_agent_start` fail-fast when `autopilot_report` is missing from the active tool allowlist
  2. `Q2` made the streaming working indicator phase-aware so runtime mode / phase truth surfaces during interactive execution
  3. `Q3` consumed `session_shutdown.reason` / `targetSessionFile` to clear runtime/UI state more cleanly and emit replacement handoff guidance
  4. `Q4` updated docs, active control-plane truth, and full regressions stayed green

## Planned Stages

- [x] `Q1` autopilot-report-tool-guard
- [x] `Q2` phase-aware-working-indicator
- [x] `Q3` session-transition-handoff-cleanup
- [x] `Q4` docs-regression-and-closeout

## Completed Stages

### `Q1 — autopilot-report-tool-guard`

已完成：

1. `/autopilot-run` / `/autopilot-resume` 现在先基于当前 system prompt 做 missing-tool preflight
2. `before_agent_start` 现在会基于 Pi 0.68 `systemPromptOptions.selectedTools` 做 authoritative guard
3. `autopilot_report` 缺失时，runtime 会 hard close 并给出明确 operator guidance，而不是继续走错误路径

verification evidence:

1. `npx tsx --test test/extension.test.ts` → pass
2. `npm test` → pass (`92` tests)
3. `npm run typecheck` → pass
4. `npm run build` → pass

### `Q2 — phase-aware-working-indicator`

已完成：

1. autopilot UI 现在会根据 `runtime.phase` / `runtime.mode` 选择 indicator frames
2. running / paused / stopping / closed 状态都会映射到不同 indicator truth
3. runtime clear / teardown 时会恢复 Pi default indicator，避免 sticky indicator drift

verification evidence:

1. `npx tsx --test test/extension.test.ts` → pass
2. `npm test` → pass (`92` tests)
3. `npm run typecheck` → pass
4. `npm run build` → pass

### `Q3 — session-transition-handoff-cleanup`

已完成：

1. `session_shutdown` 现在会读取 `reason` / `targetSessionFile`
2. reload / new / resume / fork replacement flows 会给出更准确的 handoff / rebuild hint
3. teardown 现在会统一清空 runtime state、pending dispatch、custom UI state 与 custom indicator

verification evidence:

1. `npx tsx --test test/extension.test.ts` → pass
2. `npm test` → pass (`92` tests)
3. `npm run typecheck` → pass
4. `npm run build` → pass

### `Q4 — docs-regression-and-closeout`

已完成：

1. README 当前能力清单已同步到 Pi 0.68 hardening behavior
2. repo-level `docs/plan/README.md` 与 active pack truth 已完成 closeout 同步
3. full regression + packaged smokes remained green

verification evidence:

1. `npm run smoke:pi-autoload` → pass
2. `npm run smoke:pi-commands` → pass
3. `npm run smoke:pi-bb-backed` → pass
4. `npm run smoke:packaged-install` → pass

## Machine State

- active_step: `PACK_COMPLETE`
- intended_handoff: `no immediate successor pack required for this workstream`
- active_pack: `pi-sdk-autopilot-0-68-allowlist-indicator-and-session-transition-hardening-2026-04-21`
- last_completed_step: `Q4`

## Final Result

This pack closed the most realistic Pi 0.68 regression seam for the primary single-session interactive autopilot path:

1. `autopilot_report` can no longer silently disappear behind tool allowlists without an explicit operator-facing failure
2. the interactive execution surface now reflects phase/mode truth through a dedicated working indicator instead of a generic spinner
3. session replacement flows now clear and hand off runtime state more honestly, reducing confusion during reload / resume / fork transitions

## Final Verification Evidence

- `npx tsx --test test/extension.test.ts` → pass
- `npm test` → pass (`92` tests)
- `npm run typecheck` → pass
- `npm run build` → pass
- `npm run smoke:pi-autoload` → pass
- `npm run smoke:pi-commands` → pass
- `npm run smoke:pi-bb-backed` → pass
- `npm run smoke:packaged-install` → pass

## Residuals

1. tool allowlist preflight is intentionally narrow and only hard-requires `autopilot_report`
2. this pack does not generalize into automatic cross-session clone/fork orchestration
3. richer per-phase operator UX beyond the working indicator remains future work

## Next Step

- no immediate successor pack required for this workstream
- intended_handoff: `human decision`
