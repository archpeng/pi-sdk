---
name: execute-plan
description: 用于继续 repo-local execution lane：当任务是按当前 active slice、`STATUS/WORKSET`、或 repo-local handoff 继续执行时触发，并在 repo 依赖 autopilot/local machine control-plane 时围绕 parser-compatible README/PLAN/STATUS/WORKSET 持续推进实现、更新状态与验证证据。默认把 `docs/plan/*` 视为 repo-local machine truth；若仓库现实与此不一致，先 replan control-plane contract，不要擅自引入第二套 mirror。适用于“继续当前计划”、“继续当前 family”、“resume from STATUS/WORKSET”、“写回当前状态”、“按 active slice / next slice 往下做”或 checkpoint / progress tracking；若 pack 仍不清晰或需要重拆，优先 `plan-creator`。
compatibility: Best in pi with read, edit, write, and bash available. When this skill is routed by extension autopilot for `execute`, `autopilot_report` must also be available.
allowed-tools: read edit write bash
metadata:
  gene_schema: pi-skill-gene/v1
  gene_profile:
    summary: Execute one bounded slice at a time while keeping repo-local `docs/plan/*` truth honest.
    signals:
      - continue the current plan
      - continue the current execution lane
      - resume from status or workset
      - update the active slice or current pack with checkpoints
      - execute an autopilot-compatible pack while keeping repo-local `docs/plan/*` truth aligned
    strategy:
      - read governing pack and code first
      - decide generic or single-root machine execution mode
      - anchor one bounded active slice with explicit done_when and stop_boundary
      - implement minimum meaningful changes and run matching verification
      - write evidence and active truth back before claiming done in repo-local `docs/plan/*`
      - when routed by extension autopilot, finish with exactly one autopilot_report and matching stepId before exiting the phase
    avoid:
      - executing against an ambiguous active slice
      - unbounded workset drift
      - claiming done from code changes alone
      - leaving parser-owned truth stale in machine-compatible repos
      - inventing a second control-plane root instead of maintaining repo-local truth
      - claiming routed closeout ownership from this skill
    validation:
      - pack action is reported
      - active slice, verification, done_when, and stop_boundary are explicit
      - evidence is written back to repo-local truth
      - next handoff remains deterministic
      - routed autopilot sessions end with one compatible autopilot_report when that protocol is in scope
---

# Execute Plan

当任务需要小而明确的控制面，而且目标是继续当前 execution lane，而不是重写 pack 时，使用这个 skill。

machine-compatible repo 中，这个 skill 不仅要“按计划做事”，还要在执行过程中维持 **parser-compatible truth**。

## Routed Autopilot Contract

Apply this section only when the repo is running under the extension-driven autopilot runtime.
Do **not** imply that every repo or every manual execution turn has these runtime surfaces.

- deterministic routed ownership here is `execute`
- `master_plan`, `wave_plan`, and `replan` route to `plan-creator`
- `review` routes to `execution-reality-audit`
- `closeout` routes to the repo-local closeout prompt surface, not a separate global closeout skill
- skill-backed phases require `selectedTools` that still include `read` and `autopilot_report`
- end the phase with exactly one `autopilot_report`
- when the prompt provides an active slice, set `stepId` to that slice ID
- do not ask whether to continue unless there is a real external blocker or approval boundary
- use the active slice `done_when` / `stop_boundary` as the stop law instead of vague “ask to continue” prose
- choose `autopilot_report.status` honestly based on whether the slice met `done_when`, hit `stop_boundary`, or needs replan/blocking handling

## Trigger Signals

Use this skill when the user wants to:

- continue an existing `plan/status/workset`
- continue the currently mounted family or execution lane
- resume from repo-level `STATUS` or `WORKSET`
- update progress checkpoints from a repo-level plan pack or machine-compatible control plane
- execute the current active slice / next slice in a generic or machine-compatible pack
- repair execution truth when the repo-local `docs/plan/*` control plane drifted from the current slice

## Core Strategy

1. **Read the governing truth first.** Read `AGENTS.md`, the repo-level plan anchor if present, the active `PLAN/STATUS/WORKSET`, the relevant code/tests/scripts, and `references/autopilot-control-plane-execution.md` when machine parsing matters. If the repo appears to rely on another execution root, confirm that contract explicitly before editing; otherwise keep `docs/plan/*` as the only machine truth.
2. **Choose the execution mode explicitly.** Treat the pack as generic only when no runtime or parser depends on exact markdown truth. Treat it as machine-compatible when markdown is parsed deterministically, exact headings are expected, or the user asks for autopilot/local-mode compatibility. For machine-compatible repos, execute against a **single-root** machine pack where `docs/plan/*` is the active truth
3. **Anchor one bounded active slice.** Confirm the current active slice is singular, bounded, named by files/surfaces, and has explicit validation, `done_when`, and `stop_boundary`. If not, repair the pack or return to `plan-creator` instead of improvising.
4. **Implement the minimum meaningful change.** Work on the current slice only. Avoid broad unbounded edits or parallel execution tracks.
5. **Run the smallest matching verification.** Use docs checks for docs-only work, targeted tests for local code changes, lint/typecheck/build for integration-sensitive work, or a clear manual checklist when no automation exists.
6. **Write evidence back before claiming done.** Update `STATUS`, `WORKSET`, and any repo-level anchor with the latest evidence, current state, and current or next active slice truth. In machine-compatible repos, keep README/PLAN/STATUS/WORKSET section names and slice IDs aligned under `docs/plan/*`. If another root seems required, stop and replan instead of inventing a mirror.
7. **Respect the routed handoff boundary.** When autopilot compatibility matters, keep review truth aligned with `execution-reality-audit` and keep closeout truth aligned with the repo-local closeout prompt surface. Do not invent a new closeout skill contract from this execution lane.
8. **Keep the next handoff deterministic.** If multiple next slices compete, validation changed, or machine truth drifted, stop execution and bounce back to `plan-creator`.

## AVOID

- AVOID executing when the active slice is ambiguous.
- AVOID broad, changelog-style progress updates with no bounded slice.
- AVOID claiming completion from code changes alone.
- AVOID creating parallel packs for the same workstream.
- AVOID leaving parser-owned truth stale in machine-compatible repos.
- AVOID continuing coding after active slice IDs or exact headings have drifted apart.
- AVOID inventing a second control-plane root when the repo has not explicitly verified that contract.
- AVOID claiming that closeout is a global skill-owned phase when the routed runtime binds it to a repo-local prompt surface.

## Validation / Output Contract

When you finish, report:

- whether the pack was created, repaired, advanced, or closed out
- active plan pack paths
- active slice ID and short summary
- actual verification performed
- whether the active slice met `done_when`, hit `stop_boundary`, or needs successor work
- next handoff target (`execute-plan`, `plan-creator`, repo-local closeout prompt surface, or human decision)
- whether the machine-compatible pack remains autopilot-compatible
- if routed by extension autopilot, whether the phase ended with one compatible `autopilot_report` and the active-slice `stepId` stayed aligned

## References

Read when needed:

- `references/autopilot-control-plane-execution.md` — rules for maintaining autopilot/local machine control-plane truth during execution, including deterministic routed-phase notes and single-root `docs/plan/*` handling
- `assets/README.autopilot.template.md` — repo-level machine anchor template
- `assets/PLAN.autopilot.template.md` — machine-readable plan template
- `assets/STATUS.autopilot.template.md` — writeback-friendly status template
- `assets/WORKSET.autopilot.template.md` — machine-readable workset template
