import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  applyControlPlaneProgressWriteback,
  buildControlPlaneProgressTransition,
  loadLocalControlPlaneSnapshot,
  resolveNextStageFromStageOrder,
  parsePlanControlPlaneReadme,
  parseWorksetActiveStage,
} from "../src/substrate/control-plane.ts";

const REPO_ROOT = "/home/peng/dt-git/github/pi-sdk";

test("parsePlanControlPlaneReadme extracts the active pack, active slice, and intended handoff", () => {
  const snapshot = parsePlanControlPlaneReadme(`
# pi-sdk Plan Control Plane

## Active Pack

- \`docs/plan/active_PLAN.md\`
- \`docs/plan/active_STATUS.md\`
- \`docs/plan/active_WORKSET.md\`

## Current Active Slice

- \`A1\`

## Intended Handoff

- \`execute-plan\`
`);

  assert.deepEqual(snapshot.activePack, {
    planPath: "docs/plan/active_PLAN.md",
    statusPath: "docs/plan/active_STATUS.md",
    worksetPath: "docs/plan/active_WORKSET.md",
  });
  assert.equal(snapshot.activeSlice, "A1");
  assert.equal(snapshot.intendedHandoff, "execute-plan");
});

test("parsePlanControlPlaneReadme rejects an incomplete active pack surface", () => {
  assert.throws(
    () =>
      parsePlanControlPlaneReadme(`
# pi-sdk Plan Control Plane

## Active Pack

- \`docs/plan/active_PLAN.md\`
- \`docs/plan/active_STATUS.md\`
`),
    /exactly three active pack paths/i,
  );
});

test("parseWorksetActiveStage extracts the current active stage contract", () => {
  const snapshot = parseWorksetActiveStage(`
# Example Workset

## Active Stage

### \`A1\`

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- 冻结最小 machine-consumable control-plane contract

必须交付：

1. active pack resolution rules
2. active slice snapshot shape
3. deterministic writeback contract for \`STATUS / WORKSET\`

必须避免：

1. 直接开始写 extension scheduler 细节
2. 任何 CLI/headless-first workaround
`);

  assert.equal(snapshot.stageId, "A1");
  assert.equal(snapshot.owner, "execute-plan");
  assert.equal(snapshot.state, "READY");
  assert.equal(snapshot.priority, "highest");
  assert.deepEqual(snapshot.objectives, [
    "冻结最小 machine-consumable control-plane contract",
  ]);
  assert.deepEqual(snapshot.requiredDeliverables, [
    "active pack resolution rules",
    "active slice snapshot shape",
    "deterministic writeback contract for `STATUS / WORKSET`",
  ]);
  assert.deepEqual(snapshot.avoid, [
    "直接开始写 extension scheduler 细节",
    "任何 CLI/headless-first workaround",
  ]);
});

test("current active plan pack matches the frozen machine-readable contract", () => {
  const readme = readFileSync(path.join(REPO_ROOT, "docs/plan/README.md"), "utf8");
  const controlPlane = parsePlanControlPlaneReadme(readme);
  const workset = readFileSync(path.join(REPO_ROOT, controlPlane.activePack.worksetPath), "utf8");
  const activeStage = parseWorksetActiveStage(workset);

  assert.equal(controlPlane.activeSlice, "PACK_COMPLETE");
  assert.equal(controlPlane.intendedHandoff, "no immediate successor pack required for this workstream");
  assert.equal(activeStage.stageId, "PACK_COMPLETE");
  assert.equal(activeStage.owner, "closeout");
  assert.equal(activeStage.state, "DONE");
});

test("buildControlPlaneProgressTransition freezes the deterministic status/workset progression contract", () => {
  const transition = buildControlPlaneProgressTransition({
    completedSlice: "A1",
    nextActiveSlice: "A2",
    intendedHandoff: "execute-plan",
    closeoutSummary: "A1 froze the minimal control-plane parser and transition contract",
    verificationEvidence: [
      "npx tsx --test test/control-plane.test.ts",
      "npm test",
    ],
  });

  assert.deepEqual(transition, {
    completedSlice: "A1",
    nextActiveSlice: "A2",
    intendedHandoff: "execute-plan",
    closeoutSummary: "A1 froze the minimal control-plane parser and transition contract",
    verificationEvidence: [
      "npx tsx --test test/control-plane.test.ts",
      "npm test",
    ],
    terminal: false,
  });
});

test("buildControlPlaneProgressTransition rejects writeback transitions without verification evidence", () => {
  assert.throws(
    () =>
      buildControlPlaneProgressTransition({
        completedSlice: "A1",
        nextActiveSlice: null,
        intendedHandoff: "closeout",
        closeoutSummary: "done",
        verificationEvidence: [],
      }),
    /verificationEvidence must contain at least one item/i,
  );
});

test("loadLocalControlPlaneSnapshot resolves the active pack and active stage from repo-local docs/plan", () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-control-plane-"));
  const docsPlan = path.join(repoRoot, "docs", "plan");
  mkdirSync(docsPlan, { recursive: true });

  writeFileSync(
    path.join(docsPlan, "README.md"),
    `# pi-sdk Plan Control Plane

## Active Pack

- \`docs/plan/active_PLAN.md\`
- \`docs/plan/active_STATUS.md\`
- \`docs/plan/active_WORKSET.md\`

## Current Active Slice

- \`A2\`

## Intended Handoff

- \`execute-plan\`
`,
    "utf8",
  );

  writeFileSync(
    path.join(docsPlan, "active_WORKSET.md"),
    `# Example Workset

## Stage Order

- [x] \`A1\` control-plane-contract-freeze
- [ ] \`A2\` local-active-pack-resolution

## Active Stage

### \`A2\`

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- local substrate resolves the active pack

必须交付：

1. active pack file loading

必须避免：

1. BB dependency
`,
    "utf8",
  );
  writeFileSync(
    path.join(docsPlan, "active_PLAN.md"),
    `# Example Plan

#### \`A2\` — local-active-pack-resolution

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- local substrate resolves the active pack

交付物：

1. active pack file loading

必须避免：

1. BB dependency

#### \`A3\` — deterministic-status-workset-writeback

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- write STATUS / WORKSET

交付物：

1. deterministic writeback contract

必须避免：

1. model-owned control-plane edits
`,
    "utf8",
  );

  const snapshot = loadLocalControlPlaneSnapshot(docsPlan);

  assert.equal(snapshot.readme.activeSlice, "A2");
  assert.equal(snapshot.readme.intendedHandoff, "execute-plan");
  assert.equal(snapshot.activeStage.stageId, "A2");
  assert.equal(snapshot.activeStage.owner, "execute-plan");
  assert.equal(snapshot.activeStage.state, "READY");
});

test("applyControlPlaneProgressWriteback updates README, STATUS, and WORKSET for the next active slice", () => {
  const transition = buildControlPlaneProgressTransition({
    completedSlice: "A2",
    nextActiveSlice: "A3",
    intendedHandoff: "execute-plan",
    closeoutSummary: "A2 landed local active-pack resolution and hydration truth",
    verificationEvidence: [
      "npx tsx --test test/control-plane.test.ts test/hydration.test.ts test/substrate-config.test.ts",
      "npm test",
    ],
  });

  const nextStage = {
    stageId: "A3",
    owner: "execute-plan",
    state: "READY",
    priority: "highest",
    objectives: ["let local substrate deterministic-write STATUS / WORKSET"],
    requiredDeliverables: ["status/workset mutation helper", "bounded file update rules"],
    avoid: ["extension-owned file mutation"],
  };

  const updated = applyControlPlaneProgressWriteback({
    readmeMarkdown: `# pi-sdk Plan Control Plane

## Active Pack

- \`docs/plan/active_PLAN.md\`
- \`docs/plan/active_STATUS.md\`
- \`docs/plan/active_WORKSET.md\`

## Current Active Slice

- \`A2\`

## Intended Handoff

- \`execute-plan\`
`,
    statusMarkdown: `# Example Status

## Current Step

- active_step: \`A2\`

## Planned Stages

- [x] \`A1\` control-plane-contract-freeze
- [x] \`A2\` local-active-pack-resolution
- [ ] \`A3\` deterministic-status-workset-writeback

## Immediate Focus

### \`A2\`

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- let local substrate resolve the active pack

必须交付：

1. active pack file loading
`,
    worksetMarkdown: `# Example Workset

## Stage Order

- [x] \`A1\` control-plane-contract-freeze
- [x] \`A2\` local-active-pack-resolution
- [ ] \`A3\` deterministic-status-workset-writeback

## Active Stage

### \`A2\`

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- let local substrate resolve the active pack

必须交付：

1. active pack file loading
`,
    transition,
    nextStage,
  });

  assert.match(updated.readmeMarkdown, /## Current Active Slice[\s\S]*- `A3`/);
  assert.match(updated.statusMarkdown, /- active_step: `A3`/);
  assert.match(updated.statusMarkdown, /- \[x\] `A2` local-active-pack-resolution/);
  assert.match(updated.statusMarkdown, /## Machine State[\s\S]*latest_completed_step: `A2`/);
  assert.match(updated.statusMarkdown, /### `A3`/);
  assert.match(updated.worksetMarkdown, /- \[x\] `A2` local-active-pack-resolution/);
  assert.match(updated.worksetMarkdown, /### `A3`/);
  assert.match(updated.worksetMarkdown, /status\/workset mutation helper/);
});

test("resolveNextStageFromStageOrder returns the next stage metadata from ordered stage ids", () => {
  const nextStage = resolveNextStageFromStageOrder(
    ["C1", "C2", "C3", "D1"],
    {
      C2: {
        stageId: "C2",
        owner: "execute-plan",
        state: "READY",
        priority: "highest",
        objectives: ["write accepted reports back to control plane"],
        requiredDeliverables: ["deterministic writeback orchestration"],
        avoid: ["model-picked next slice"],
      },
      C3: {
        stageId: "C3",
        owner: "execute-plan",
        state: "READY",
        priority: "highest",
        objectives: ["keep control truth across compact/resume"],
        requiredDeliverables: ["resync after compact"],
        avoid: ["control-plane drift"],
      },
      D1: {
        stageId: "D1",
        owner: "execute-plan",
        state: "READY",
        priority: "highest",
        objectives: ["land repo safety guards"],
        requiredDeliverables: ["dirty-repo guard"],
        avoid: ["unsafe auto-run"],
      },
    },
    "C1",
  );

  assert.deepEqual(nextStage, {
    stageId: "C2",
    owner: "execute-plan",
    state: "READY",
    priority: "highest",
    objectives: ["write accepted reports back to control plane"],
    requiredDeliverables: ["deterministic writeback orchestration"],
    avoid: ["model-picked next slice"],
  });
});

test("loadLocalControlPlaneSnapshot preserves explicit next-stage metadata from the plan file", () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-control-plane-metadata-"));
  const docsPlan = path.join(repoRoot, "docs", "plan");
  mkdirSync(docsPlan, { recursive: true });

  writeFileSync(
    path.join(docsPlan, "README.md"),
    `# pi-sdk Plan Control Plane

## Active Pack

- \`docs/plan/active_PLAN.md\`
- \`docs/plan/active_STATUS.md\`
- \`docs/plan/active_WORKSET.md\`

## Current Active Slice

- \`R1\`

## Intended Handoff

- \`execute-plan\`
`,
    "utf8",
  );

  writeFileSync(
    path.join(docsPlan, "active_PLAN.md"),
    `# Example Plan

#### \`R1\` — control-plane-truth-normalization

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- normalize control-plane truth

交付物：

1. parser reads explicit metadata

必须避免：

1. synthesized next-stage defaults

#### \`R2\` — docs-alignment

- Owner: \`review-plan\`
- State: \`queued\`
- Priority: \`medium\`

目标：

- align README and architecture

交付物：

1. README matches local substrate behavior

必须避免：

1. doc drift
`,
    "utf8",
  );

  writeFileSync(path.join(docsPlan, "active_STATUS.md"), "# active status\n", "utf8");
  writeFileSync(
    path.join(docsPlan, "active_WORKSET.md"),
    `# Example Workset

## Stage Order

- [ ] \`R1\` control-plane-truth-normalization
- [ ] \`R2\` docs-alignment

## Active Stage

### \`R1\`

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- normalize control-plane truth
`,
    "utf8",
  );

  const snapshot = loadLocalControlPlaneSnapshot(docsPlan);
  const nextStage = resolveNextStageFromStageOrder(snapshot.stageOrder, snapshot.sliceDefinitions, "R1");

  assert.deepEqual(nextStage, {
    stageId: "R2",
    owner: "review-plan",
    state: "queued",
    priority: "medium",
    objectives: ["align README and architecture"],
    requiredDeliverables: ["README matches local substrate behavior"],
    avoid: ["doc drift"],
  });
});
