import type { AutopilotArtifactSummaryProjection, AutopilotHistoryProjection } from "./protocol.js";
import type { AutopilotHistoryPayload } from "../substrate/types.js";

function formatConfidence(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "?";
}

export function buildAutopilotHistoryProjection(
  history: AutopilotHistoryPayload | null | undefined,
  artifactSummary?: AutopilotArtifactSummaryProjection | undefined,
): AutopilotHistoryProjection | undefined {
  const entries = history?.entries ?? [];
  if (entries.length === 0 && !artifactSummary) return undefined;

  const canaryCount = entries.filter((entry) => entry.reportKind === "canary").length;
  const strategyCount = entries.filter((entry) => entry.reportKind === "strategy_feedback").length;
  const latest = entries[0];
  const summaryParts = [
    `canary=${canaryCount}`,
    `strategy=${strategyCount}`,
    `latest=${latest?.reportKind ?? "none"}:${latest?.label ?? "none"}`,
  ];

  if (artifactSummary) {
    summaryParts.push(`artifact_summary=${artifactSummary.stage}@${formatConfidence(artifactSummary.confidence)}`);
  }

  return {
    objectiveKey: history?.objectiveKey ?? artifactSummary?.objectiveKey ?? "unknown",
    source: "bb_autopilot_report_resources",
    summaryLine: summaryParts.join(" · "),
    detailLines: [
      ...entries.map((entry) => `${entry.reportKind}: ${entry.summaryLine}`),
      ...(artifactSummary?.historyLines.map((line) => `artifact-summary-candidate: ${line}`) ?? []),
    ],
  };
}
