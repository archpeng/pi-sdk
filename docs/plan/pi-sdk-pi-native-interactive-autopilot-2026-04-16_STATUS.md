# PI SDK Pi-Native Interactive Autopilot 2026-04-16 Status

## Current State

- state: `CLOSED_OUT`
- owner: `closeout`
- route: `PLAN -> EXEC -> REVIEW -> REPLAN -> CLOSEOUT`
- repo: `/home/peng/dt-git/github/pi-sdk`
- workstream: `pi-sdk pi-native interactive autopilot refactor`
- control_plane_anchor: `/home/peng/dt-git/github/pi-sdk/docs/plan`
- predecessor_pack: `pi-sdk-bb-autopilot-benchmark-promotion-and-learned-components-2026-04-16`

## Current Step

- active_step: `PACK_COMPLETE`
- mode: `all planned P7 slices executed, reviewed, and closed out in this pack`
- why_done:
  1. source/dist truth is now clean-build enforced and no longer depends on stale `dist/**` leftovers
  2. shared autopilot core now exists under `src/autopilot/**` and is consumed by both the CLI/headless path and the Pi interactive driver
  3. the Pi extension now drives same-session autopilot commands with pause/resume/stop/reconstruction semantics instead of hiding a second `AgentSession`
  4. package/docs positioning now presents `pi-sdk` as a Pi-first interactive autopilot package with CLI/headless as the secondary path

## Completed Slices

- [x] `P7.S1-source-dist-truth-freeze-and-build-hygiene`
- [x] `P7.S2-shared-autopilot-core-extraction`
- [x] `P7.S3-in-session-interactive-scheduler-mvp`
- [x] `P7.S4-pause-resume-reconstruction-and-ui-hardening`
- [x] `P7.S5-package-repositioning-closeout-and-headless-parity`

## Closeout Summary

- [x] landed clean-build truth enforcement in `package.json` so `build` now runs `clean` before `tsc`
- [x] verified clean build removes stale `dist/extension/entrypoint.js` orphan surface
- [x] extracted shared core into:
  - `src/autopilot/protocol.ts`
  - `src/autopilot/phase-prompt.ts`
  - `src/autopilot/engine.ts`
  - `src/autopilot/state.ts`
  - `src/autopilot/closeout.ts`
  - `src/autopilot/index.ts`
- [x] reduced `src/shared/*.ts` to compatibility re-exports into the shared core
- [x] refactored `src/sdk/orchestrator.ts` to consume `runAutopilotWorkflow(...)` and shared closeout summary lines
- [x] landed Pi-native extension commands in `src/extension/index.ts`:
  - `/autopilot-run`
  - `/autopilot-resume`
  - `/autopilot-pause`
  - `/autopilot-stop`
  - `/autopilot-status`
- [x] kept `autopilot_report` as the shared machine-consumable protocol between drivers
- [x] landed runtime-state persistence / reconstruction through `autopilot-runtime-state` custom entries plus `session_start` / `session_tree` rebuild
- [x] repositioned public docs/package surface to Pi-first:
  - `README.md`
  - `docs/architecture.md`
  - `docs/pi-sdk-bb-integration-architecture.md`
  - `package.json#description`

## Verification Evidence

- [x] `cd /home/peng/dt-git/github/pi-sdk && npm test` PASS (`26` tests)
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run typecheck` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && npm run build` PASS
- [x] `cd /home/peng/dt-git/github/pi-sdk && node dist/sdk/orchestrator.js --help` PASS
- [x] clean-build parity proof: `dist/extension/entrypoint.js` is gone after build
- [x] interactive extension proofs now exist for:
  - command registration
  - same-session first-phase dispatch
  - `tool_result -> turn_end` automatic continuation
  - pause preventing auto-queueing
  - resume re-queueing the next phase
  - `session_start` rebuild restoring persisted runtime state

## Latest Evidence

- code surfaces:
  - `src/autopilot/**`
  - `src/extension/index.ts`
  - `src/sdk/orchestrator.ts`
  - `src/shared/prompts.ts`
  - `src/shared/state-machine.ts`
  - `src/shared/types.ts`
- test surfaces:
  - `test/build-hygiene.test.ts`
  - `test/closeout.test.ts`
  - `test/engine.test.ts`
  - `test/extension-rebuild.test.ts`
  - `test/extension.test.ts`
  - `test/phase-prompt.test.ts`
  - `test/state.test.ts`
- doc/package surfaces:
  - `README.md`
  - `docs/architecture.md`
  - `docs/pi-sdk-bb-integration-architecture.md`
  - `package.json`

## Gate State

- build_truth_clean_before_compile: `PASS`
- stale_dist_orphan_removed: `PASS`
- shared_core_extracted: `PASS`
- interactive_same_session_commands_landed: `PASS`
- pause_resume_reconstruction_landed: `PASS`
- docs_package_repositioned_pi_first: `PASS`
- bb_remains_truth_eval_learning_substrate: `PASS`

## Residuals / Follow-up

- live local `bb-memory-mcp` endpoint drift is still an environment issue outside this repo pack; restarting/redeploying the local server remains a separate operational follow-up
- optional overlay inspector / richer interactive UI are still MVP+ surfaces, not required to close this pack honestly
- a successor pack can now focus on post-refactor hardening or deeper live BB integration rather than reopening the Pi-first shape decision

## Next Step

- [x] close out the full P7 pack honestly
- [x] leave the repo with a resumable closed pack and evidence-backed outcome
- future continuation, if desired, should start from a new successor pack instead of reopening this one implicitly
