# PI SDK Local Dirty Policy Control-Plane Aware 2026-04-20 Closeout

## Outcome

This pack closed out honestly.

It removed the specific local-mode workflow blocker where creating or updating repo-local control-plane files before the first run would trigger a false dirty-repo stop.

## Primary Evidence

- `npx tsx --test test/substrate-config.test.ts test/extension.test.ts test/docs-alignment.test.ts` → pass
- `npm test` → pass (`87` tests)
- `npm run typecheck` → pass
- `npm run build` → pass

## Key Results

1. local workspace scan now exposes dirty path truth
2. local initial-run dirty policy now allows control-plane-only dirty and still blocks foreign dirty
3. runtime now carries a narrow best-effort owned-path journal for explicit local `edit` / `write` calls and deterministic control-plane writeback
4. README / architecture / tests now match the landed behavior

## Residuals

1. generic `bash` mutation provenance is still not solved
2. the owned-path journal is intentionally best-effort, not a complete causal log
3. broader repo safety systems remain future work

## Follow-up Rule

Any further work on:

- generic mutation provenance
- BB-wide dirty-path schema guarantees
- git checkpoint / rollback automation
- broader repo adapters

must start from a fresh successor pack.
