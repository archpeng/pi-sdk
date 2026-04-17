import test from "node:test";
import assert from "node:assert/strict";
import { runAutopilotWorkflow } from "../src/autopilot/engine.ts";
import type { AutopilotPhaseRequest, AutopilotReport } from "../src/autopilot/protocol.ts";

function makeReport(request: AutopilotPhaseRequest, status: AutopilotReport["status"], summary = request.phase): AutopilotReport {
  return {
    phase: request.phase,
    status,
    summary,
    waveId: `wave-${request.currentWave}`,
    stepId: `${request.phase}-${request.currentCycle}`,
    nextAction: summary,
    evidence: [],
    artifacts: [],
    risks: [],
    timestampMs: Date.now(),
  };
}

test("runAutopilotWorkflow completes a single-wave objective and closes out", async () => {
  const seen: string[] = [];

  const summary = await runAutopilotWorkflow({
    maxWaves: 1,
    maxExecutionCyclesPerWave: 2,
    runPhase: async (request) => {
      seen.push(`${request.phase}:${request.currentWave}:${request.currentCycle}`);
      switch (request.phase) {
        case "master_plan":
        case "wave_plan":
          return makeReport(request, "continue");
        case "execute":
          return makeReport(request, "completed");
        case "review":
          return makeReport(request, "completed");
        case "closeout":
          return makeReport(request, "done", "closeout complete");
        default:
          throw new Error(`unexpected phase: ${request.phase}`);
      }
    },
  });

  assert.deepEqual(seen, [
    "master_plan:1:1",
    "wave_plan:1:1",
    "execute:1:1",
    "review:1:1",
    "closeout:1:2",
  ]);
  assert.equal(summary.done, true);
  assert.equal(summary.wavesAttempted, 1);
  assert.equal(summary.reports.at(-1)?.phase, "closeout");
});

test("runAutopilotWorkflow replans and continues execution in the same wave", async () => {
  const seen: string[] = [];

  const summary = await runAutopilotWorkflow({
    maxWaves: 1,
    maxExecutionCyclesPerWave: 2,
    runPhase: async (request) => {
      seen.push(`${request.phase}:${request.currentWave}:${request.currentCycle}`);
      if (request.phase === "master_plan" || request.phase === "wave_plan") {
        return makeReport(request, "continue");
      }
      if (request.phase === "execute" && request.currentCycle === 1) {
        return makeReport(request, "continue", "first execution pass landed partial work");
      }
      if (request.phase === "review" && request.currentCycle === 1) {
        return makeReport(request, "needs_replan", "review requires a narrower follow-up slice");
      }
      if (request.phase === "replan" && request.currentCycle === 1) {
        return makeReport(request, "continue", "resume execution with corrected slice");
      }
      if (request.phase === "execute" && request.currentCycle === 2) {
        return makeReport(request, "completed", "second execution pass finished the wave");
      }
      if (request.phase === "review" && request.currentCycle === 2) {
        return makeReport(request, "done", "overall objective complete");
      }
      if (request.phase === "closeout") {
        return makeReport(request, "done", "closeout complete");
      }
      throw new Error(`unexpected phase: ${request.phase}/${request.currentCycle}`);
    },
  });

  assert.deepEqual(seen, [
    "master_plan:1:1",
    "wave_plan:1:1",
    "execute:1:1",
    "review:1:1",
    "replan:1:1",
    "execute:1:2",
    "review:1:2",
    "closeout:1:2",
  ]);
  assert.equal(summary.done, true);
  assert.equal(summary.reports.filter((report) => report.phase === "replan").length, 1);
});
