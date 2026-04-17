import test from "node:test";
import assert from "node:assert/strict";
import { buildAutopilotBenchmarkProjection } from "../src/autopilot/benchmark-projection.ts";
import { deriveAutopilotObjectiveKey } from "../src/autopilot/protocol.ts";

test("deriveAutopilotObjectiveKey is stable for the same cwd and goal", () => {
  const first = deriveAutopilotObjectiveKey("land benchmark projection", "/repo");
  const second = deriveAutopilotObjectiveKey("land benchmark projection", "/repo");
  const changed = deriveAutopilotObjectiveKey("different goal", "/repo");

  assert.equal(first, second);
  assert.match(first, /^objective:[a-f0-9]{12}$/);
  assert.notEqual(first, changed);
});

test("buildAutopilotBenchmarkProjection summarizes BB-owned readiness truth without inventing local state", () => {
  const projection = buildAutopilotBenchmarkProjection({
    objectiveKey: "objective:abc123",
    queueLag: 0,
    queueDrainState: "idle",
    headFreshness: "fresh",
    replayHealth: "fresh",
    canaryVerdict: "promote",
    rolloutDecision: "promote_current_candidate",
    strategyFeedbackCandidate: true,
    summary: ["queue=idle lag=0", "replay=fresh", "canary=promote"],
    publishedAtMs: 1,
    heads: [
      {
        kind: "autopilot_run",
        scopeKey: "objective:abc123",
        found: true,
        freshness: "fresh",
      },
    ],
  });

  assert.deepEqual(projection, {
    objectiveKey: "objective:abc123",
    source: "bb_autopilot_status",
    summaryLine:
      "queue=idle lag=0 · heads=fresh · replay=fresh · canary=promote · strategy=candidate · rollout=promote_current_candidate",
    detailLines: ["queue=idle lag=0", "replay=fresh", "canary=promote"],
    publishedAtMs: 1,
  });
});
