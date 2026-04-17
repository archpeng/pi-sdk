import test from "node:test";
import assert from "node:assert/strict";
import { buildAutopilotArtifactSummaryProjection } from "../src/autopilot/artifact-summary-projection.ts";

test("buildAutopilotArtifactSummaryProjection normalizes BB learned artifact summary payload", () => {
  const projection = buildAutopilotArtifactSummaryProjection({
    reportId: "learned-1",
    reportRef: "memory://autopilot/learned-advisory/reports/learned-1",
    objectiveKey: "objective:abc123",
    lifecycleState: "candidate",
    payloadKind: "artifact_summary",
    stage: "shadow_only",
    candidateOnly: true,
    confidence: 0.74,
    evidenceSummary: ["guard_source=strategy_feedback_learned_candidate", "history_entries=2"],
    noRegressionGuard: true,
    governanceNoRegressionGuard: false,
    sourceRefs: ["memory://autopilot/status/reports/status-1"],
    summaryProjection: {
      closeoutLines: ["objective-key: objective:abc123", "history-summary: canary=1 strategy=1 latest=canary:promote"],
      operatorLines: ["objective-key: objective:abc123", "decision-authority: ready_for_operator outcome=none"],
      historyLines: ["canary: hold Δ0 rollout=hold_for_more_evidence"],
    },
    publishedAtMs: 11,
  });

  assert.deepEqual(projection, {
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
    detailLines: [
      "report=learned-1 lifecycle=candidate candidate_only=true",
      "payload=artifact_summary stage=shadow_only confidence=0.74",
      "no_regression_guard=true governance_no_regression_guard=false",
      "evidence: guard_source=strategy_feedback_learned_candidate",
      "evidence: history_entries=2",
    ],
    closeoutLines: [
      "objective-key: objective:abc123",
      "history-summary: canary=1 strategy=1 latest=canary:promote",
    ],
    operatorLines: [
      "objective-key: objective:abc123",
      "decision-authority: ready_for_operator outcome=none",
    ],
    historyLines: ["canary: hold Δ0 rollout=hold_for_more_evidence"],
    publishedAtMs: 11,
  });
});
