import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTOPILOT_RUNTIME_ENTRY_TYPE,
  advanceInteractiveRuntime,
  beginInteractiveRuntime,
  restoreInteractiveRuntime,
} from "../src/autopilot/state.ts";
import type {
  AutopilotArtifactSummaryProjection,
  AutopilotHistoryProjection,
  AutopilotReport,
} from "../src/autopilot/protocol.ts";

function historyProjection(overrides: Partial<AutopilotHistoryProjection> = {}): AutopilotHistoryProjection {
  return {
    objectiveKey: "objective:abc123",
    source: "bb_autopilot_report_resources",
    summaryLine: "canary=1 strategy=1 latest=canary:promote",
    detailLines: ["canary: promote Δ0.02 rollout=promote_current_candidate"],
    ...overrides,
  };
}

function artifactSummaryProjection(
  overrides: Partial<AutopilotArtifactSummaryProjection> = {},
): AutopilotArtifactSummaryProjection {
  return {
    objectiveKey: "objective:abc123",
    reportId: "learned-1",
    source: "bb_autopilot_learned_advisory",
    payloadKind: "artifact_summary",
    stage: "shadow_only",
    candidateOnly: true,
    confidence: 0.74,
    noRegressionGuard: true,
    governanceNoRegressionGuard: false,
    summaryLine: "stage=shadow_only · confidence=0.74 · replay-guard=pass · governance-guard=hold",
    detailLines: ["report=learned-1 lifecycle=candidate candidate_only=true"],
    closeoutLines: ["objective-key: objective:abc123"],
    operatorLines: ["objective-key: objective:abc123"],
    historyLines: ["history-summary: canary=1 strategy=1 latest=canary:promote"],
    ...overrides,
  };
}

function report(overrides: Partial<AutopilotReport>): AutopilotReport {
  return {
    phase: "execute",
    status: "continue",
    summary: "report",
    evidence: [],
    artifacts: [],
    risks: [],
    timestampMs: 1,
    ...overrides,
  };
}

test("beginInteractiveRuntime starts in running mode with master_plan ready", () => {
  const runtime = beginInteractiveRuntime({
    goal: "build the interactive autopilot",
    maxWaves: 5,
    maxExecutionCyclesPerWave: 3,
  });

  assert.equal(runtime.goal, "build the interactive autopilot");
  assert.equal(runtime.mode, "running");
  assert.equal(runtime.phase, "master_plan");
  assert.equal(runtime.currentWave, 1);
  assert.equal(runtime.currentCycle, 1);
  assert.equal(runtime.dispatchState, "ready");
});

test("advanceInteractiveRuntime queues the next wave after a completed review", () => {
  const started = beginInteractiveRuntime({
    goal: "build the interactive autopilot",
    maxWaves: 3,
    maxExecutionCyclesPerWave: 2,
  });

  const afterExecute = advanceInteractiveRuntime(
    { ...started, phase: "execute", dispatchState: "awaiting_report", currentWave: 1, currentCycle: 1 },
    report({ phase: "execute", status: "completed", summary: "execution finished" }),
  );
  assert.equal(afterExecute.phase, "review");
  assert.equal(afterExecute.dispatchState, "ready");

  const afterReview = advanceInteractiveRuntime(
    { ...afterExecute, phase: "review", dispatchState: "awaiting_report" },
    report({ phase: "review", status: "completed", summary: "review passed" }),
  );

  assert.equal(afterReview.phase, "replan");
  assert.equal(afterReview.currentWave, 2);
  assert.equal(afterReview.currentCycle, 1);
  assert.equal(afterReview.replanReason, "roadmap");
  assert.equal(afterReview.dispatchState, "ready");
});

test("advanceInteractiveRuntime respects paused mode and preserves the next ready phase", () => {
  const paused = {
    ...beginInteractiveRuntime({ goal: "goal", maxWaves: 2, maxExecutionCyclesPerWave: 2 }),
    mode: "paused" as const,
    phase: "execute" as const,
    dispatchState: "awaiting_report" as const,
  };

  const next = advanceInteractiveRuntime(paused, report({ phase: "execute", status: "continue", summary: "more work remains" }));

  assert.equal(next.mode, "paused");
  assert.equal(next.phase, "review");
  assert.equal(next.dispatchState, "ready");
});

test("restoreInteractiveRuntime rebuilds reports and the latest runtime entry from branch entries", () => {
  const restored = restoreInteractiveRuntime([
    {
      type: "message",
      message: {
        role: "toolResult",
        toolName: "autopilot_report",
        details: {
          report: report({ phase: "master_plan", status: "continue", summary: "master plan landed" }),
          historySize: 1,
        },
      },
    },
    {
      type: "custom",
      customType: AUTOPILOT_RUNTIME_ENTRY_TYPE,
      data: {
        goal: "goal",
        mode: "running",
        phase: "wave_plan",
        currentWave: 1,
        currentCycle: 1,
        maxWaves: 2,
        maxExecutionCyclesPerWave: 2,
        dispatchState: "ready",
        warnings: [],
        objectiveKey: "objective:abc123",
        benchmarkProjection: {
          objectiveKey: "objective:abc123",
          source: "bb_autopilot_status",
          summaryLine: "queue=idle lag=0 · heads=fresh · replay=fresh · canary=promote · strategy=candidate",
          detailLines: ["queue=idle lag=0", "replay=fresh"],
          publishedAtMs: 10,
        },
        historyProjection: historyProjection(),
        artifactSummaryProjection: artifactSummaryProjection(),
        updatedAtMs: 10,
      },
    },
  ]);

  assert.equal(restored.reports.length, 1);
  assert.equal(restored.reports[0]?.phase, "master_plan");
  assert.equal(restored.runtime?.phase, "wave_plan");
  assert.equal(restored.runtime?.goal, "goal");
  assert.equal(restored.runtime?.objectiveKey, "objective:abc123");
  assert.equal(restored.runtime?.benchmarkProjection?.source, "bb_autopilot_status");
  assert.equal(restored.runtime?.historyProjection?.source, "bb_autopilot_report_resources");
  assert.equal(restored.runtime?.artifactSummaryProjection?.source, "bb_autopilot_learned_advisory");
});
