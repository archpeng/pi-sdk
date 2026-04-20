# PI SDK Structure Clarity and Core Task Alignment Cleanup 2026-04-19 Closeout

## Outcome

This cleanup pack closed out honestly.

It resolved the three scoped issues identified in review:

1. next-stage metadata no longer relies on synthesized defaults
2. top-level docs now match the current local-substrate and dirty-repo behavior
3. the extension driver has been split into clearer seams without changing the product boundary

## Primary Evidence

- `npm test` → pass (`84` tests)
- `npm run typecheck` → pass
- `npm run build` → pass

## Key Cleanup Results

### Control-plane truth

- `src/substrate/control-plane.ts` now requires explicit owner/state/priority/avoid metadata from plan truth
- the cleanup pack itself was upgraded to carry explicit slice metadata

### Docs alignment

- `README.md` now states that local substrate includes repo-local control-plane read/write and local git workspace scanning
- `docs/architecture.md` now records the landed minimal dirty-repo guard instead of listing it as missing

### Extension structure

- `src/extension/runtime-dispatch.ts`
- `src/extension/runtime-guardrails.ts`
- `src/extension/command-handlers.ts`

These modules now carry logic that previously lived directly inside `src/extension/index.ts`.

## Residuals

1. the parser still depends on the current repo-local `docs/plan` machine contract
2. `src/extension/index.ts` is cleaner, but future small cleanup is still possible
3. this pack intentionally avoided any new feature work

## Follow-up Rule

Any further work on:

- richer control-plane adapters
- deeper extension decomposition
- new runtime behavior

must start from a fresh successor pack.
