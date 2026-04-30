# Autopilot-Compatible Execution Control Plane

Use this reference when the repo depends on a machine-parsed local control plane
and execution must preserve repo-local truth rather than only human-readable notes.

## Core idea

A generic plan pack is enough for humans.
A machine-compatible autopilot pack must also stay parsable after execution.

That means execution is not finished when code changes land. It is finished only
when the repo-local control plane also reflects the new truth.

## Deterministic routed-phase overlay (extension-driven sessions only)

Apply this overlay only when the repo is running under the extension autopilot runtime.
Do **not** claim that every repo or every manual execution session has these routed surfaces.

Canonical routed ownership:

- `master_plan` -> `plan-creator`
- `wave_plan` -> `plan-creator`
- `execute` -> `execute-plan`
- `review` -> `execution-reality-audit`
- `replan` -> `plan-creator`
- `closeout` -> repo-local closeout prompt surface (`autopilot-closeout`)

Execution implications:

1. this reference governs execute-phase truth, not planning/review/closeout ownership
2. skill-backed phases require `selectedTools` that still include `read` and `autopilot_report`
3. routed phases end with exactly one `autopilot_report`
4. when an active slice exists, `autopilot_report.stepId` must match that slice ID
5. default continuation is automatic; do not encode “ask whether to continue” as the normal stop law
6. instead, drive continuation and stopping through explicit `done_when` / `stop_boundary`
7. keep review truthful as `execution-reality-audit` and keep closeout truthful as the repo-local prompt surface, not a separate global closeout skill

## Before executing a slice

Confirm all of the following:

1. repo-level anchor exists, typically `docs/plan/README.md`
2. active pack paths are explicit
3. current active slice ID is explicit
4. current active slice has matching metadata in `PLAN`
5. current active slice has explicit `done_when` / `stop_boundary`
6. `WORKSET` stage order and active stage agree on the active slice
7. `STATUS` still looks compatible with the repo writeback shape

If any of these are unclear, repair the pack first or return to `plan-creator`.

## Machine sections to preserve

### README anchor

Keep exact sections:

- `## Active Pack`
- `## Current Active Slice`
- `## Intended Handoff`

### PLAN slice definitions

Keep exact `#### \`SLICE_ID\`` blocks with metadata fields the repo parser expects.
For autopilot-compatible packs, keep `done_when` / `stop_boundary` concrete enough for future prompt/runtime gating.

### WORKSET execution queue

Keep exact sections:

- `## Stage Order`
- `## Active Stage`

### STATUS writeback surface

If the repo/runtime writes back into `STATUS`, prefer sections like:

- `## Current Step`
- `## Planned Stages`
- `## Immediate Focus`
- `## Machine State`

## Single-root execution: keep `docs/plan/*` authoritative

Execute machine-compatible repos from the repo-local `docs/plan/*` control plane.

Treat these repos as **single-root machine-compatible** execution:

- `docs/plan/*` is the active execution truth
- execution is not complete until `README` / `PLAN` / `STATUS` / `WORKSET` agree in the same turn

Before editing a machine-compatible repo, confirm:

1. the active `docs/plan/*` pack is explicit
2. `docs/plan/README.md` points at that active pack
3. active slice and intended handoff match across the repo-local control-plane files

## What to update after a slice closes

At minimum, update the repo-local truth for:

1. completed slice evidence
2. current / next active slice
3. stage checklist state
4. immediate focus
5. intended handoff if it changed
6. whether the slice met `done_when` or stopped at `stop_boundary`

If the repo convention uses a terminal slice like `PACK_COMPLETE`, only switch to
that when the pack is actually closed out.

Keep the repo-local `docs/plan/*` pack current in the same execution turn.

## Alignment checklist after execution

Verify:

1. README current active slice matches WORKSET active stage ID
2. next slice in `Stage Order` has a matching PLAN definition
3. completed slice evidence is written in STATUS or equivalent
4. active or queued slices still carry concrete `done_when` / `stop_boundary`
5. no parser-owned heading was renamed into prose-only wording
6. the pack can resume without relying on hidden conversation context
7. if the repo uses routed autopilot, the active slice ID still matches the `stepId` the next report should use
8. `docs/plan/README.md`, the active pack, and the current active slice / intended handoff agree
9. review and closeout ownership remain truthful: review -> `execution-reality-audit`, closeout -> repo-local prompt surface

## Stop instead of guessing

Return to `plan-creator` or stop when:

- multiple next slices are equally plausible
- current active slice no longer reflects reality cleanly
- machine section names are unclear
- slice IDs drift across files
- the repo needs a shadow machine pack rather than a prose-only pack
- the pack still encodes continuation only through vague prose instead of explicit `done_when` / `stop_boundary`
- the repo appears to need a second control-plane root that the current pack has not verified
- routed review/closeout ownership is being claimed incorrectly
