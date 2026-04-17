import type { AutopilotArtifactSummaryProjection } from "./protocol.js";
import type { AutopilotLearnedArtifactSummaryPayload } from "../substrate/types.js";

function formatConfidence(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "?";
}

export function buildAutopilotArtifactSummaryProjection(
  payload: AutopilotLearnedArtifactSummaryPayload | null | undefined,
): AutopilotArtifactSummaryProjection | undefined {
  if (!payload) return undefined;

  const summaryLine = [
    `stage=${payload.stage}`,
    `confidence=${formatConfidence(payload.confidence)}`,
    `replay-guard=${payload.noRegressionGuard ? "pass" : "hold"}`,
    `governance-guard=${payload.governanceNoRegressionGuard ? "pass" : "hold"}`,
  ].join(" · ");

  return {
    objectiveKey: payload.objectiveKey,
    reportId: payload.reportId,
    source: "bb_autopilot_learned_advisory",
    payloadKind: "artifact_summary",
    stage: payload.stage,
    candidateOnly: true,
    confidence: payload.confidence,
    noRegressionGuard: payload.noRegressionGuard,
    governanceNoRegressionGuard: payload.governanceNoRegressionGuard,
    summaryLine,
    detailLines: [
      `report=${payload.reportId} lifecycle=${payload.lifecycleState} candidate_only=true`,
      `payload=artifact_summary stage=${payload.stage} confidence=${formatConfidence(payload.confidence)}`,
      `no_regression_guard=${payload.noRegressionGuard} governance_no_regression_guard=${payload.governanceNoRegressionGuard}`,
      ...payload.evidenceSummary.map((line) => `evidence: ${line}`),
    ],
    closeoutLines: [...payload.summaryProjection.closeoutLines],
    operatorLines: [...payload.summaryProjection.operatorLines],
    historyLines: [...payload.summaryProjection.historyLines],
    ...(typeof payload.publishedAtMs === "number" ? { publishedAtMs: payload.publishedAtMs } : {}),
  };
}
