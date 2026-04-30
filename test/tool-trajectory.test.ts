import test from "node:test";
import assert from "node:assert/strict";
import { createToolTrajectoryRecorder, TOOL_USE_TRAJECTORY_CLAIM_KIND } from "../src/extension/tool-trajectory.ts";
import type { AutopilotRuntimeState } from "../src/autopilot/state.ts";
import type { AutopilotSubstrate, MemoryStoreInput } from "../src/substrate/types.ts";

function createRuntime(): AutopilotRuntimeState {
  return {
    goal: "tool-use-behavior-path-library-continuation-2026-04-29",
    mode: "running",
    phase: "execute",
    currentWave: 1,
    currentCycle: 1,
    maxWaves: 5,
    maxExecutionCyclesPerWave: 3,
    dispatchState: "awaiting_report",
    warnings: [],
    activeSlice: {
      stepId: "S1.pi-real-auto-trajectory-writeback-smoke",
      owner: "execute-plan",
      state: "READY",
      objectives: ["Prove a real Pi producer turn automatically writes one valid ToolUseTrajectoryV1"],
      requiredDeliverables: ["pi.tool_trajectory memory row"],
      doneWhen: ["real Pi turn auto-writes trajectory"],
      stopBoundary: ["new trajectory route required"],
      avoid: ["raw dialogue storage"],
    },
    substrateMode: "bb",
    objectiveKey: "tool-use-behavior-path-library-continuation-2026-04-29",
    updatedAtMs: 1,
  };
}

function createSubstrate(stored: MemoryStoreInput[]): AutopilotSubstrate {
  return {
    mode: "bb",
    config: {
      mode: "bb",
      cwd: "/home/peng/dt-git/github/boston-bot-vp",
      planDocsPath: "/home/peng/dt-git/github/boston-bot-vp/docs/plan",
      bb: {
        memoryUrl: "http://memory.test/mcp",
        governUrl: "http://govern.test/mcp",
        toolsUrl: "http://tools.test/mcp",
        timeoutMs: 5_000,
      },
    },
    memory: {
      async recall() {
        return { ok: true, summary: "recall", data: { items: [], count: 0 }, rawText: "" };
      },
      async store(input) {
        stored.push(input);
        return { ok: true, summary: "stored", data: { stored: true, response: { id: "memory-1" } }, rawText: "" };
      },
    },
    govern: {
      async policy() {
        return { ok: true, summary: "policy", data: { policy: null }, rawText: "" };
      },
      async evaluate() {
        return { ok: true, summary: "allow", data: { decision: "allow" }, rawText: "" };
      },
    },
    workspace: {
      async scan() {
        return { ok: true, summary: "scan", data: [], rawText: "" };
      },
      async planSync() {
        return { ok: true, summary: "plan", data: [], rawText: "" };
      },
    },
    controlPlane: {
      async snapshot() {
        return { ok: false, summary: "not needed", data: null, rawText: "", error: "not needed" };
      },
    },
  };
}

test("tool trajectory recorder stores compact ToolUseTrajectoryV1 over bb memory_store", async () => {
  const stored: MemoryStoreInput[] = [];
  let currentMs = 100;
  const recorder = createToolTrajectoryRecorder({
    getRuntime: createRuntime,
    getSubstrate: () => createSubstrate(stored),
    now: () => currentMs,
  });

  recorder.startTurn();
  recorder.recordToolCall({ toolName: "read" });
  recorder.recordToolResult({ toolName: "read", isError: false });
  recorder.recordToolCall({ toolName: "bash" });
  recorder.recordToolResult({ toolName: "bash", isError: true });
  recorder.recordToolCall({ toolName: "bash" });
  recorder.recordToolResult({ toolName: "bash", isError: false });
  recorder.recordGovernanceDecision("bash", "allow");
  currentMs = 250;

  const input = await recorder.flush({
    cwd: "/home/peng/dt-git/github/boston-bot-vp",
    sessionManager: {
      getSessionFile: () => "/home/peng/.pi/agent/sessions/demo.jsonl",
    },
  });

  assert.equal(stored.length, 1);
  assert.equal(input, stored[0]);
  assert.equal(stored[0]?.toolName, "pi.tool_trajectory");
  assert.equal(stored[0]?.memoryClass, "tool_episodic");
  assert.equal(stored[0]?.metadata?.claim_kind, TOOL_USE_TRAJECTORY_CLAIM_KIND);
  assert.equal(stored[0]?.metadata?.producer_session_id, "/home/peng/.pi/agent/sessions/demo.jsonl");

  const trajectory = JSON.parse(stored[0]?.content ?? "{}") as Record<string, unknown>;
  assert.equal(trajectory.claim_kind, TOOL_USE_TRAJECTORY_CLAIM_KIND);
  assert.equal(trajectory.producer_kind, "pi");
  assert.equal(trajectory.task_family, "S1.pi-real-auto-trajectory-writeback-smoke");
  assert.deepEqual(trajectory.tool_sequence, ["read", "bash", "bash"]);
  assert.deepEqual(trajectory.tool_failure_names, ["bash"]);
  assert.deepEqual(trajectory.repair_actions, ["bash:retry_succeeded"]);
  assert.deepEqual(trajectory.validation_checks, ["tool:bash"]);
  assert.deepEqual(trajectory.governance_decisions, ["bash:allow"]);
  assert.equal(trajectory.final_status, "partial");
  assert.equal(trajectory.mutated, true);
  assert.equal(JSON.stringify(trajectory).includes("raw_transcript"), false);
  assert.equal(JSON.stringify(trajectory).includes("raw_tool_output"), false);
});

test("tool trajectory recorder does not write without a bb substrate", async () => {
  const recorder = createToolTrajectoryRecorder({
    getRuntime: () => null,
    getSubstrate: () => undefined,
    now: () => 1,
  });

  recorder.startTurn();
  recorder.recordToolCall({ toolName: "read" });
  recorder.recordToolResult({ toolName: "read", isError: false });

  const input = await recorder.flush({ cwd: "/repo" });
  assert.equal(input, null);
});
