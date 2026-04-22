# pi-sdk Autopilot V1 Operator Runbook

## Product Surface

`pi-sdk` v1 is a **Pi-native interactive autopilot package with a shared headless driver**.

- primary UX: current Pi session interactive autopilot
- secondary UX: CLI/headless driver
- truth / benchmark / promotion / eval / learning: BB-owned
- `pi-sdk`: workflow shell / projection / operator UX only

## Install

### Local package install into Pi

```bash
pi install /absolute/path/to/package
```

### Ephemeral test without installing globally

```bash
pi -e /absolute/path/to/package
```

### Repo-local developer setup

```bash
cd /home/peng/dt-git/github/pi-sdk
npm install
npm run build
```

## Upgrade

### Refresh local checkout

```bash
cd /home/peng/dt-git/github/pi-sdk
npm install
npm run build
```

### Refresh installed Pi packages

```bash
pi update
```

## Primary Interactive Commands

- `/autopilot-run <goal>`
- `/autopilot-resume [goal]`
- `/autopilot-pause`
- `/autopilot-stop`
- `/autopilot-status`
- `/autopilot-status overlay`

## Secondary Headless Driver

```bash
node dist/sdk/orchestrator.js --goal "Ship the bounded slice" --cwd /path/to/repo
```

## Interactive Runtime Contract

Current interactive autopilot behavior is deterministic, not best-effort:

- `master_plan` / `wave_plan` / `replan` -> skill `plan-creator`
- `execute` -> skill `execute-plan`
- `review` -> skill `execution-reality-audit`
- `closeout` -> built-in repo-local closeout prompt surface

Operator-visible consequences:

- the extension dispatches a same-session `[AUTOPILOT ROUTED DISPATCH]` message instead of a generic phase prompt
- skill-bound phases must be able to resolve a non-empty routed `SKILL.md`
- selected tools must include `autopilot_report`; skill-bound phases must also include `read`
- local control-plane truth is single-root at `docs/plan/*`; do not maintain a second `docs/active/*` mirror
- execute / review progression is derived from active-slice `done_when / stop_boundary` through `doneWhenMet / stopBoundaryHit`

## Readiness / Diagnostics

### Version

```bash
node dist/sdk/orchestrator.js --version
```

### Release/readiness manifest

```bash
node dist/sdk/orchestrator.js --print-manifest
```

### Packaging/readiness doctor

```bash
node dist/sdk/orchestrator.js --doctor
```

Expected doctor shape:

- package manifest is readable
- `pi.extensions` points at `./src/extension/index.ts`
- CLI bin points at `./dist/sdk/orchestrator.js`
- built `dist` entrypoints exist
- README / runbook files exist
- doctor is honest in both repo checkout and installed-package form; it no longer assumes repo-only plan docs must ship inside the tarball

## Acceptance Gate

Canonical v1 acceptance gate:

```bash
npm run release:check
```

This gate executes:

1. `npm test`
2. `npm run typecheck`
3. `npm run build`
4. `node dist/sdk/orchestrator.js --help`
5. `node dist/sdk/orchestrator.js --version`
6. `node dist/sdk/orchestrator.js --print-manifest`
7. `node dist/sdk/orchestrator.js --doctor`
8. `npm pack --dry-run`
9. `npm run smoke:packaged-install`

## Packaging Dry Run

```bash
npm pack --dry-run
```

Use this to verify the tarball includes the bounded v1 surfaces before publishing or sharing.

## Clean-Room Packaged Install Smoke

```bash
npm run smoke:packaged-install
```

This maintenance smoke packs the current repo, installs the tarball into a temp project, and validates bounded installed-package surfaces:

- CLI `--version`
- CLI `--doctor`
- packaged runbook presence

## Pi Startup Autoload Smoke

```bash
npm run smoke:pi-autoload
```

This proof uses the final-completion canonical route:

1. clean `PI_CODING_AGENT_DIR`
2. temp project `.pi/settings.json` with the local `pi-sdk` package path
3. started `pi` process in print mode
4. slash-command proof via `/autopilot-status`
5. control run without project package settings to show model fallback instead of autoload

## Pi Command-Surface Smoke

```bash
npm run smoke:pi-commands
```

This smoke keeps the same canonical route, then exercises multiple auto-loaded slash commands without requiring model execution:

- `/autopilot-status`
- `/autopilot-run`
- `/autopilot-resume`
- `/autopilot-pause`
- `/autopilot-stop`

## Pi BB-Backed Residual Smoke

```bash
npm run smoke:pi-bb-backed
```

This bounded smoke keeps the clean startup autoload route, then proves the BB-backed residual with deterministic local control:

1. print-mode `/autopilot-run <goal>` establishes the first BB-backed entry signal
2. print-mode `/autopilot-status` is expected to remain non-persistent in this harness and is reported honestly
3. a bounded same-process RPC route then proves progression/status truth in the same started `pi` process
4. the smoke uses a deterministic stub provider plus fake BB MCP endpoints, with explicit timeout/kill boundaries

## Recovery / Triage

### If build artifacts are stale or missing

```bash
npm run build
```

### If CLI diagnostics fail

1. rerun `npm run build`
2. rerun `node dist/sdk/orchestrator.js --doctor`
3. confirm `package.json` still declares:
   - `bin.pi-sdk-autopilot = ./dist/sdk/orchestrator.js`
   - `pi.extensions` includes `./src/extension/index.ts`
4. confirm runbook and plan-control docs still exist

### If routed interactive dispatch halts before repo work starts

1. confirm the runtime phase still has a deterministic route in `src/autopilot/protocol.ts`
2. confirm `${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/.../SKILL.md` exists and is non-empty for the current skill-bound phase
3. confirm selected tools still include `autopilot_report`, and include `read` for skill-bound phases
4. if local mode is active, confirm `docs/plan/README.md` and the active pack still parse as the single repo-local control plane

### If `autopilot_report` validation fails

1. compare the reported `phase` with the current runtime phase
2. compare `stepId` with the active slice in `docs/plan/README.md` and the active pack `STATUS / WORKSET`
3. compare `doneWhenMet / stopBoundaryHit` with the exact `done_when / stop_boundary` items in the active slice
4. rerun bounded control-plane checks before retrying:
   - `plan_sync`
   - `workspace_scan`
5. do **not** bypass the failure by downgrading to prose-only completion claims

### If BB substrate behavior is degraded

1. run `node dist/sdk/orchestrator.js --doctor` first to verify local package/build shape
2. then use existing repo validations and bounded live smoke from the active pack context
3. do **not** invent local truth to compensate for missing BB-owned surfaces
4. keep repo-local `docs/plan/*` truthful, but do not promote it into BB-owned canonical truth

## Notes

- `src/**` remains source-of-truth; `dist/**` is build output only
- productization must not reopen BB owner-boundary decisions
- acceptance must remain scriptable and repeatable, not tribal/manual
