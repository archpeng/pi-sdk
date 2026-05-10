# <PLAN_ID> Plan

## Goal

## Scope

## Non-Goals

## Deliverables

## Constraints

- if this pack runs under extension autopilot, each phase ends with exactly one `autopilot_report`
- active-slice phases use `stepId` equal to the active slice ID
- skill-backed phases require `selectedTools` that include at least `read` and `autopilot_report`
- default continuation is automatic; use `done_when` / `stop_boundary` instead of “ask whether to continue” as the normal stop law

## Verification

## Blockers / Risks

## Slice Definitions

#### `<ACTIVE_SLICE_ID>` — <active-slice-summary>

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- <bounded objective>

交付物：

1. <primary proof>
2. <secondary proof>

done_when:

1. <what must be true before this slice can honestly report completed/done>
2. <minimum evidence or verification that must exist>

stop_boundary:

1. <when to stop and hand off instead of expanding scope>
2. <when to replan, block, or escalate instead of improvising>

必须避免：

1. <drift>
2. <unsafe shortcut>

#### `<NEXT_SLICE_ID>` — <next-slice-summary>

- Owner: `execute-plan`
- State: `queued`
- Priority: `high`

目标：

- <next bounded objective>

交付物：

1. <next proof>

done_when:

1. <what must be true before this next slice can honestly complete>

stop_boundary:

1. <when this next slice should stop or hand off>

必须避免：

1. <next drift>

## Parser Alignment Gate

Before handoff, verify README/PLAN/STATUS/WORKSET alignment:

1. README current slice/status slice, PLAN `ACTIVE_SLICE`, STATUS `active_step`/`Immediate Focus`, and WORKSET `Active Stage` are identical full IDs.
2. WORKSET `Active Stage` is the first pending `Stage Order` row.
3. Every `Stage Order` row has an exact full-ID PLAN block: `#### \`<stage id>\``.
4. README `Intended Handoff` matches active WORKSET `Owner` / `State`.
5. Do not use `PACK_COMPLETE` until all previous non-deferred stages are complete.

## Exit Criteria

- active and queued slices carry concrete `done_when` / `stop_boundary`
- review handoff remains explicit
- if the workstream reaches terminal completion, closeout uses the repo-local closeout prompt surface
