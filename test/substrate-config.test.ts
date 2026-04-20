import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createAutopilotSubstrate, resolveAutopilotSubstrateConfig } from "../src/substrate/index.ts";

test("resolveAutopilotSubstrateConfig defaults to local mode and standard BB endpoints", () => {
  const config = resolveAutopilotSubstrateConfig({
    cwd: "/repo",
    env: {},
  });

  assert.equal(config.mode, "local");
  assert.equal(config.cwd, "/repo");
  assert.equal(config.planDocsPath, "/repo/docs/plan");
  assert.equal(config.bb.memoryUrl, "http://127.0.0.1:3100/mcp");
  assert.equal(config.bb.governUrl, "http://127.0.0.1:3101/mcp");
  assert.equal(config.bb.toolsUrl, "http://127.0.0.1:3102/mcp");
});

test("resolveAutopilotSubstrateConfig honors explicit mode and URL overrides", () => {
  const config = resolveAutopilotSubstrateConfig({
    cwd: "/repo",
    mode: "bb",
    planDocsPath: "/repo/custom-plan",
    bbMemoryUrl: "http://memory.test/mcp",
    bbGovernUrl: "http://govern.test/mcp",
    bbToolsUrl: "http://tools.test/mcp",
    env: {
      PI_SDK_SUBSTRATE: "local",
      PI_SDK_BB_MEMORY_URL: "http://ignored-memory/mcp",
    },
  });

  assert.equal(config.mode, "bb");
  assert.equal(config.planDocsPath, "/repo/custom-plan");
  assert.equal(config.bb.memoryUrl, "http://memory.test/mcp");
  assert.equal(config.bb.governUrl, "http://govern.test/mcp");
  assert.equal(config.bb.toolsUrl, "http://tools.test/mcp");
});

test("local substrate keeps memory, governance, and workspace calls as safe no-ops", async () => {
  const substrate = createAutopilotSubstrate(
    resolveAutopilotSubstrateConfig({ cwd: "/repo", env: {} }),
  );

  const recall = await substrate.memory.recall({ query: "goal", limit: 3 });
  assert.equal(recall.ok, true);
  assert.equal(recall.data.items.length, 0);
  assert.match(recall.summary, /local memory/i);

  const govern = await substrate.govern.evaluate({
    toolName: "write",
    args: { path: "README.md", content: "x" },
    cwd: "/repo",
  });
  assert.equal(govern.ok, true);
  assert.equal(govern.data.decision, "allow");
  assert.match(govern.summary, /local govern/i);

  const scan = await substrate.workspace.scan({ workspaces: ["/repo"] });
  assert.equal(scan.ok, true);
  assert.deepEqual(scan.data, []);
  assert.match(scan.summary, /local workspace scan/i);

  const autopilotStatus = await substrate.autopilot.status({ objectiveKey: "objective:abc" });
  assert.equal(autopilotStatus.ok, true);
  assert.equal(autopilotStatus.data, null);
  assert.match(autopilotStatus.summary, /local autopilot/i);

  const autopilotHistory = await substrate.autopilot.history({ objectiveKey: "objective:abc", limit: 3 });
  assert.equal(autopilotHistory.ok, true);
  assert.equal(autopilotHistory.data, null);
  assert.match(autopilotHistory.summary, /local autopilot/i);

  const controlPlane = await substrate.controlPlane?.snapshot();
  assert.equal(controlPlane?.ok, true);
  assert.equal(controlPlane?.data, null);
  assert.match(controlPlane?.summary ?? "", /local control-plane/i);
});

test("local substrate workspace scan reports branch and dirty files for a local git repo", async () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-workspace-scan-"));
  execFileSync("git", ["init", "-b", "main", repoRoot], { stdio: "ignore" });
  writeFileSync(path.join(repoRoot, "tracked.txt"), "hello\n", "utf8");
  execFileSync("git", ["-C", repoRoot, "add", "tracked.txt"], { stdio: "ignore" });
  execFileSync("git", ["-C", repoRoot, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "init"], { stdio: "ignore" });
  writeFileSync(path.join(repoRoot, "tracked.txt"), "changed\n", "utf8");

  const substrate = createAutopilotSubstrate(
    resolveAutopilotSubstrateConfig({ cwd: repoRoot, env: {} }),
  );

  const scan = await substrate.workspace.scan({ workspaces: [repoRoot] });

  assert.equal(scan.ok, true);
  assert.equal(scan.data.length, 1);
  assert.equal(scan.data[0]?.branch, "main");
  assert.equal(scan.data[0]?.dirty_files, 1);
  assert.match(scan.data[0]?.status_summary ?? "", /dirty/);
  assert.deepEqual(scan.data[0]?.dirty_paths, ["tracked.txt"]);
  assert.deepEqual(scan.data[0]?.dirty_details, [
    {
      path: "tracked.txt",
      index_status: " ",
      worktree_status: "M",
    },
  ]);
});

test("local substrate controlPlane.advance applies deterministic README/STATUS/WORKSET writeback", async () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-local-advance-"));
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

- \`A3\`

## Intended Handoff

- \`execute-plan\`
`,
    "utf8",
  );
  writeFileSync(path.join(docsPlan, "active_PLAN.md"), "# active plan\n", "utf8");
  writeFileSync(
    path.join(docsPlan, "active_STATUS.md"),
    `# Example Status

## Current Step

- active_step: \`A3\`

## Planned Stages

- [x] \`A1\` control-plane-contract-freeze
- [x] \`A2\` local-active-pack-resolution
- [ ] \`A3\` deterministic-status-workset-writeback
- [ ] \`B1\` active-slice-aware-report-contract

## Immediate Focus

### \`A3\`

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- write STATUS / WORKSET
`,
    "utf8",
  );
  writeFileSync(
    path.join(docsPlan, "active_WORKSET.md"),
    `# Example Workset

## Stage Order

- [x] \`A1\` control-plane-contract-freeze
- [x] \`A2\` local-active-pack-resolution
- [ ] \`A3\` deterministic-status-workset-writeback
- [ ] \`B1\` active-slice-aware-report-contract

## Active Stage

### \`A3\`

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- write STATUS / WORKSET
`,
    "utf8",
  );

  const substrate = createAutopilotSubstrate(
    resolveAutopilotSubstrateConfig({ cwd: repoRoot, env: {} }),
  );

  const result = await substrate.controlPlane?.advance({
    completedSlice: "A3",
    nextActiveSlice: "B1",
    intendedHandoff: "execute-plan",
    closeoutSummary: "A3 landed deterministic local control-plane writeback",
    verificationEvidence: ["npm test"],
    nextStage: {
      stageId: "B1",
      owner: "execute-plan",
      state: "READY",
      priority: "highest",
      objectives: ["make reports active-slice-aware"],
      requiredDeliverables: ["report contract validation"],
      avoid: ["extension-side file mutations"],
    },
  });

  assert.equal(result?.ok, true);
  assert.equal(result?.data.nextActiveSlice, "B1");
  assert.deepEqual(result?.data.updatedFiles, [
    "docs/plan/README.md",
    "docs/plan/active_STATUS.md",
    "docs/plan/active_WORKSET.md",
  ]);

  assert.match(readFileSync(path.join(docsPlan, "README.md"), "utf8"), /## Current Active Slice[\s\S]*- `B1`/);
  assert.match(readFileSync(path.join(docsPlan, "active_STATUS.md"), "utf8"), /## Machine State[\s\S]*latest_completed_step: `A3`/);
  assert.match(readFileSync(path.join(docsPlan, "active_WORKSET.md"), "utf8"), /## Machine Queue[\s\S]*latest_completed_step: `A3`/);
});
