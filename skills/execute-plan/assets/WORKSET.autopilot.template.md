# <PLAN_ID> Workset

## Stage Order

- [ ] `<ACTIVE_SLICE_ID>` <active-slice-summary>
- [ ] `<NEXT_SLICE_ID>` <next-slice-summary>

## Active Stage

### `<ACTIVE_SLICE_ID>`

- Owner: `execute-plan`
- State: `READY`
- Priority: `highest`

目标：

- <bounded objective>

必须交付：

1. <primary proof>
2. <secondary proof>

done_when:

1. <what must be true before the active stage can honestly complete>

stop_boundary:

1. <when to stop and hand off instead of widening scope>

必须避免：

1. <drift>
2. <unsafe shortcut>

## Slice Ownership

### `<ACTIVE_SLICE_ID>`

- <file-or-surface-1>
- <file-or-surface-2>

## Expected Verification

- <targeted test or proof>

## Execution Notes

- under extension autopilot, the active stage ID is the `stepId` for active-slice reports
- skill-backed phases require `selectedTools` including `read` and `autopilot_report`
- do not make “ask whether to continue” the default stop rule; use the active stage `done_when` / `stop_boundary`
- review routes to `execution-reality-audit`; closeout uses the repo-local closeout prompt surface
