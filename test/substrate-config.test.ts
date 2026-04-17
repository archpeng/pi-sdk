import test from "node:test";
import assert from "node:assert/strict";
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
  assert.match(scan.summary, /local workspace/i);

  const autopilotStatus = await substrate.autopilot.status({ objectiveKey: "objective:abc" });
  assert.equal(autopilotStatus.ok, true);
  assert.equal(autopilotStatus.data, null);
  assert.match(autopilotStatus.summary, /local autopilot/i);

  const autopilotHistory = await substrate.autopilot.history({ objectiveKey: "objective:abc", limit: 3 });
  assert.equal(autopilotHistory.ok, true);
  assert.equal(autopilotHistory.data, null);
  assert.match(autopilotHistory.summary, /local autopilot/i);
});
