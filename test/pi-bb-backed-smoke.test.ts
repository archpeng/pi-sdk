import test from "node:test";
import assert from "node:assert/strict";
import { formatPiBbBackedSmokeResult, runPiBbBackedSmoke } from "../src/substrate/pi-bb-backed-smoke.ts";

test("runPiBbBackedSmoke proves deterministic BB-backed entry and same-process progression via bounded RPC, while print mode stays non-persistent", async () => {
  const result = await runPiBbBackedSmoke({
    packageRoot: "/home/peng/dt-git/github/pi-sdk",
    goal: "prove bb-backed residual",
    timeoutMs: 8_000,
  });

  assert.equal(result.ok, true);
  assert.equal(result.run.timedOut, false);
  assert.equal(result.run.exitCode, 0);
  assert.equal(result.status.timedOut, false);
  assert.equal(result.status.exitCode, 0);
  assert.equal(result.providerPhases.length >= 2, true);
  assert.equal(result.providerPhases.every((phase) => phase === "master_plan"), true);
  assert.match(result.status.output, /No autopilot state recorded yet\./);
  assert.deepEqual(result.sessionFiles, []);
  assert.deepEqual(result.sessionEntryTypes, []);
  assert.equal(result.rpcStatus.timedOut, false);
  assert.match(result.rpcStatus.output, /mode: running/);
  assert.match(result.rpcStatus.output, /phase: closeout/);
  assert.match(result.rpcStatus.output, /substrate: bb/);
  assert.equal(result.rpcSessionFiles.length >= 1, true);
  assert.equal(result.rpcSessionEntryTypes.includes("autopilot-runtime-state"), true);
  assert.equal(result.mcpToolCalls.includes("memory_recall"), true);
  assert.equal(result.mcpToolCalls.includes("memory_autopilot_status"), true);
  assert.equal(result.mcpToolCalls.includes("workspace_scan"), true);
  assert.equal(result.mcpToolCalls.includes("plan_sync"), true);
});

test("formatPiBbBackedSmokeResult renders the bounded print-mode and rpc-mode proof summary", () => {
  const lines = formatPiBbBackedSmokeResult({
    ok: true,
    packageRoot: "/repo/pi-sdk",
    goal: "prove bb-backed residual",
    run: { exitCode: 0, signal: null, output: "", timedOut: false },
    status: { exitCode: 0, signal: null, output: "No autopilot state recorded yet.", timedOut: false },
    rpcStatus: { exitCode: 0, signal: null, output: "mode: running\nphase: closeout\nsubstrate: bb", timedOut: false },
    sessionFiles: [],
    sessionEntryTypes: [],
    rpcSessionFiles: ["/tmp/session.jsonl"],
    rpcSessionEntryTypes: ["message", "autopilot-runtime-state"],
    providerPhases: ["master_plan", "master_plan"],
    mcpToolCalls: ["memory_recall", "memory_autopilot_status", "workspace_scan", "plan_sync"],
    mcpResourceReads: ["memory://autopilot/decision-authority/current/objective:stub"],
  });

  assert.match(lines.join("\n"), /pi-bb-backed-smoke: PASS/);
  assert.match(lines.join("\n"), /print-status: No autopilot state recorded yet\./);
  assert.match(lines.join("\n"), /rpc-status: mode: running/);
  assert.match(lines.join("\n"), /rpc-session-files: 1/);
  assert.match(lines.join("\n"), /rpc-session-entry-types: message, autopilot-runtime-state/);
  assert.match(lines.join("\n"), /bb-tool-calls: memory_recall, memory_autopilot_status, workspace_scan, plan_sync/);
});
