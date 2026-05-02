---
name: plan-creator
description: 用于为复杂任务创建、重构、收口可连续执行的 `plan/status/workset` 控制面，并在 repo 依赖 machine-parsed autopilot/local control-plane 时产出兼容 parser 的 README/PLAN/STATUS/WORKSET 结构。默认把 `docs/plan/*` 视为 repo-local machine truth；若仓库真实控制面与此不一致，先收敛 contract 或 replan，不要擅自发明第二套 mirror。用户说“先做计划包”、“重写 workset”、“把任务拆成更小执行模块”、“符合 autopilot 标准的 plan pack”或“plan before the next slice”时触发；若重点已经是按既有 slice 直接实现，统一交给 `execute-plan`。
compatibility: Best in pi with read, edit, write, and bash available. When this skill is routed by extension autopilot for `master_plan`, `wave_plan`, or `replan`, `autopilot_report` must also be available.
allowed-tools: read edit write bash
metadata:
  gene_schema: pi-skill-gene/v1
  gene_profile:
    summary: Create or repair executable plan packs while keeping repo-local `docs/plan/*` parser truth honest and resumable.
    signals:
      - create a plan pack
      - rewrite plan status workset for resumable execution
      - make a pack autopilot-compatible
      - split ambiguous work into smaller slices
      - repair a parser-owned `docs/plan/*` control plane after drift
    strategy:
      - read governing docs and active pack first
      - choose generic or single-root machine mode explicitly
      - design the smallest proof-carrying slices with explicit done_when and stop_boundary
      - align README PLAN STATUS WORKSET and repo-local `docs/plan/*` truth in the same turn
      - encode the autopilot transition FSM explicitly so execute/review/replan/closeout dispatch does not depend on hidden chat context
      - when routed by extension autopilot, finish with exactly one autopilot_report and a matching stepId when an active slice is present
      - hand off only when the next active slice is deterministic
    avoid:
      - generic prose-only packs in parser-owned repos
      - slices with multiple equally primary goals
      - drifting slice IDs or section names
      - duplicate parallel packs for the same workstream
      - inventing a second control-plane root without a verified repo contract
      - claiming extension-only autopilot guarantees outside a routed autopilot session
    validation:
      - active pack paths are explicit
      - active slice, validation shape, done_when, and stop_boundary are explicit
      - next handoff target is explicit
      - autopilot transition contract is explicit for execute -> review -> writeback/replan/next-slice flow
      - machine-compatible packs keep repo-local `docs/plan/*` parser truth aligned
      - routed autopilot sessions end with one compatible autopilot_report when that protocol is in scope
---

# Plan Creator

Use this skill to make the control plane executable before or between execution waves.

`execute-plan` is strongest when the next slice is already clear. `plan-creator` is for the moments when it is not.

## Routed Autopilot Contract

Apply this section only when the repo is running under the extension-driven autopilot runtime.
Do **not** imply that every repo or every manual planning session has these runtime surfaces.

- deterministic routed ownership here is `master_plan`, `wave_plan`, and `replan`
- `execute` routes to `execute-plan`
- `review` routes to `execution-reality-audit`
- `closeout` routes to the repo-local closeout prompt surface, not a separate global closeout skill
- skill-backed phases require `selectedTools` that still include `read` and `autopilot_report`
- end the phase with exactly one `autopilot_report`
- when the prompt provides an active slice, set `stepId` to that slice ID
- do not ask whether to continue unless there is a real external blocker or approval boundary
- encode continuation and stop law through explicit `done_when` / `stop_boundary`, not vague “ask to continue” prose

## Trigger Signals

Use this skill when the user wants to:

- create a new `plan/status/workset` pack before implementation starts
- repair a vague, stale, bloated, or hard-to-resume pack
- split ambiguous work into smaller execution slices
- produce an autopilot-compatible or machine-readable control plane
- rebuild the planner -> executor handoff after drift or ambiguity
- repair a repo whose parser-owned `docs/plan/*` control plane drifted from the current execution truth

## Core Strategy

1. **Read the governing truth first.** Read `AGENTS.md`, the active `PLAN/STATUS/WORKSET`, user-named specs, and the code/tests that define the gate ladder. When machine parsing may matter, also read the repo-level plan anchor, parser/tests/examples, `references/autopilot-control-plane-pack.md`, and the autopilot templates. If the repo appears to rely on another planning root, confirm that contract explicitly before editing; otherwise keep `docs/plan/*` as the only machine truth.
2. **Choose generic vs machine-compatible explicitly.** Use a generic pack only when the repo has no parser-owned control-plane contract. Use a machine-compatible pack when markdown is parsed deterministically, exact headings are required, or the user asks for autopilot/local-mode compatibility. For machine-compatible repos, treat the pack as a **single-root** pack where `docs/plan/*` is both the human and parser truth.
3. **Design the smallest proof-carrying slices.** Each slice should have one primary goal, one dominant owner boundary, one targeted verification path, a concrete `done_when`, a concrete `stop_boundary`, and one obvious next handoff.
4. **Build or repair the pack.** Keep `PLAN` stable around goal, scope, non-goals, deliverables, and verification. Keep `STATUS` as current truth. Keep `WORKSET` as the executable queue. If machine parsing matters, also maintain repo-level `README.md` anchors and exact section names like `Active Pack`, `Current Active Slice`, `Stage Order`, and `Active Stage`. Keep `docs/plan/*` as the sole parser-owned control plane; if another root seems required, stop and replan instead of inventing a mirror.
5. **Satisfy the AutoPi local-mode parser, not just human readability.** For extension-driven local autopilot, `docs/plan/README.md` must point to exactly three active pack files; `WORKSET` must contain exact `## Stage Order` and `## Active Stage` sections; `Active Stage` must use `### \`<ID>\`` plus `Owner`, `State`, `Priority`, `目标：`, `必须交付：`, `done_when:`, `stop_boundary:`, and `必须避免：`; every active/queued stage in `Stage Order` must have a `PLAN` definition headed `#### \`<ID>\`` with `Owner`, `State`, `Priority`, `目标：`, `交付物：`, `done_when:`, `stop_boundary:`, and `必须避免：`. If these are missing, the extension can halt with `repo-local active control-plane required ... (docs/plan)` even when prose docs exist.
6. **Enforce ID and section alignment.** For machine-compatible packs, keep slice IDs, parser-owned headings, active slice, and intended handoff aligned across `docs/plan/README.md` and the active `PLAN/STATUS/WORKSET`.
7. **Encode the runtime-facing stop law.** When autopilot compatibility matters, make `done_when` / `stop_boundary` concrete enough that later prompt/runtime gates can use them without hidden conversation context. Keep review routing truthful and keep closeout guidance aligned with the repo-local closeout prompt surface.
8. **Encode the transition FSM, not only prose nextAction.** Machine-compatible packs should contain an `Autopilot Transition Contract` that states: `execute/completed` dispatches same-slice `review`; `review/completed` is the accepted-slice writeback point; accepted review advances README/STATUS/WORKSET to the next stage before later `wave_plan`/`execute`; `review/continue` keeps the same active slice for another execute cycle; `needs_replan` routes to `replan`; `done` is reserved for objective/closeout completion. This prevents `completed` from being misread as terminal.
9. **Hand off only when execution is deterministic.** Pass to `execute-plan` only when the active slice is singular, bounded, named by files/surfaces, validation is explicit, stop condition is explicit, transition contract is explicit, and machine truth is parseable when required.
10. **Stay in planning when ambiguity remains.** If multiple next slices compete, validation changes, owner boundary changes, or parser truth drifts, keep refining instead of pretending the pack is ready.

## AVOID

- AVOID generic prose-only packs in repos that depend on machine-parsed control planes.
- AVOID slices with multiple equally primary goals or unrelated gates.
- AVOID duplicate parallel packs for the same workstream.
- AVOID drifting slice IDs, parser-owned section names, or repo-level anchors.
- AVOID handing work to `execute-plan` before the next slice is truly deterministic.
- AVOID relying on `nextAction` prose alone when a machine-compatible pack needs execute/review/writeback continuation.
- AVOID treating `execute/completed` as terminal; it must route to same-slice review unless `done`/hard-stop is reported.
- AVOID inventing a second control-plane root when the repo has not explicitly verified that contract.
- AVOID implying that a global closeout skill exists when the routed runtime actually uses a repo-local closeout prompt surface.

## Validation / Output Contract

When you finish, report:

- whether a pack was created, repaired, or superseded
- active plan pack paths
- active slice ID and short summary
- exact validation shape for the active slice
- explicit `done_when` / `stop_boundary` for the active slice when autopilot compatibility matters
- explicit transition FSM for the current phase boundary and accepted-review writeback path
- next handoff target (`execute-plan`, `plan-creator`, repo-local closeout prompt surface, or human decision)
- whether the result is generic-only or single-root autopilot-compatible
- if machine-compatible, which README anchor path now carries parser truth under `docs/plan/*`
- if routed by extension autopilot, whether the phase ended with one compatible `autopilot_report` and the active-slice `stepId` stayed aligned

## References

Read when machine compatibility matters:

- `references/autopilot-control-plane-pack.md` — exact autopilot/local pack contract, including deterministic routed-phase notes and single-root `docs/plan/*` parser truth
- `assets/README.autopilot.template.md` — repo-level machine anchor template
- `assets/PLAN.autopilot.template.md` — machine-readable plan template
- `assets/STATUS.autopilot.template.md` — writeback-friendly status template
- `assets/WORKSET.autopilot.template.md` — machine-readable workset template
