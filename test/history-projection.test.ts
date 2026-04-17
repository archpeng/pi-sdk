import test from "node:test";
import assert from "node:assert/strict";
import { buildAutopilotHistoryProjection } from "../src/autopilot/history-projection.ts";

test("buildAutopilotHistoryProjection summarizes recent BB-owned history entries and appends artifact-summary candidate lines", () => {
  const projection = buildAutopilotHistoryProjection(
    {
      objectiveKey: "objective:abc123",
      entries: [
        {
          reportKind: "canary",
          reportId: "canary-1",
          objectiveKey: "objective:abc123",
          label: "promote",
          summaryLine: "promote Δ0.02 rollout=promote_current_candidate",
          publishedAtMs: 20,
        },
        {
          reportKind: "strategy_feedback",
          reportId: "strategy-1",
          objectiveKey: "objective:abc123",
          label: "tighten_review_and_budget",
          summaryLine: "tighten_review_and_budget replay=0.91 warnings=2",
          publishedAtMs: 10,
        },
      ],
    },
    {
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
      detailLines: [],
      closeoutLines: [],
      operatorLines: [],
      historyLines: ["history-summary: canary=1 strategy=1 latest=canary:promote"],
    },
  );

  assert.deepEqual(projection, {
    objectiveKey: "objective:abc123",
    source: "bb_autopilot_report_resources",
    summaryLine: "canary=1 · strategy=1 · latest=canary:promote · artifact_summary=shadow_only@0.74",
    detailLines: [
      "canary: promote Δ0.02 rollout=promote_current_candidate",
      "strategy_feedback: tighten_review_and_budget replay=0.91 warnings=2",
      "artifact-summary-candidate: history-summary: canary=1 strategy=1 latest=canary:promote",
    ],
  });
});

test("buildAutopilotHistoryProjection stays empty when no recent history exists", () => {
  assert.equal(
    buildAutopilotHistoryProjection({ objectiveKey: "objective:abc123", entries: [] }),
    undefined,
  );
});

test("buildAutopilotHistoryProjection can surface artifact-summary candidate detail lines even before report history exists", () => {
  const projection = buildAutopilotHistoryProjection(undefined, {
    objectiveKey: "objective:abc123",
    reportId: "learned-1",
    source: "bb_autopilot_learned_advisory",
    payloadKind: "artifact_summary",
    stage: "advisory_only",
    candidateOnly: true,
    confidence: 0.91,
    noRegressionGuard: true,
    governanceNoRegressionGuard: true,
    summaryLine: "stage=advisory_only · confidence=0.91 · replay-guard=pass · governance-guard=pass",
    detailLines: [],
    closeoutLines: [],
    operatorLines: [],
    historyLines: ["strategy_feedback: tighten_review_and_budget replay=0.91 warnings=1"],
  });

  assert.deepEqual(projection, {
    objectiveKey: "objective:abc123",
    source: "bb_autopilot_report_resources",
    summaryLine: "canary=0 · strategy=0 · latest=none:none · artifact_summary=advisory_only@0.91",
    detailLines: [
      "artifact-summary-candidate: strategy_feedback: tighten_review_and_budget replay=0.91 warnings=1",
    ],
  });
});
