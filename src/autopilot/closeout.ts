import type { AutopilotReport, AutopilotRunSummary } from "./protocol.js";
import { summarizeWarnings } from "./operator.js";

function latestReport(reports: AutopilotReport[]): AutopilotReport | undefined {
  return reports.at(-1);
}

export function buildCloseoutSummaryLines(summary: AutopilotRunSummary): string[] {
  const lines = [`Run finished. done=${summary.done} wavesAttempted=${summary.wavesAttempted}`];
  if (summary.sessionFile) {
    lines.push(`session: ${summary.sessionFile}`);
  }
  if (summary.objectiveKey) {
    lines.push(`objective-key: ${summary.objectiveKey}`);
  }

  const latest = latestReport(summary.reports);
  if (latest) {
    lines.push(`latest: ${latest.phase}/${latest.status} :: ${latest.summary}`);
    if (latest.decisionMode) {
      lines.push(`decision-mode: ${latest.decisionMode}`);
    }
    if (latest.decisionBasis && latest.decisionBasis.length > 0) {
      lines.push(`decision-basis: ${latest.decisionBasis.join(" | ")}`);
    }
    if (latest.candidateRoutes && latest.candidateRoutes.length > 0) {
      lines.push(`candidate-routes: ${latest.candidateRoutes.join(" | ")}`);
    }
  }

  if (summary.benchmarkProjection) {
    lines.push(`promotion-readiness: ${summary.benchmarkProjection.summaryLine}`);
  }
  if (summary.decisionProjection) {
    lines.push(`decision-authority: ${summary.decisionProjection.summaryLine}`);
  }
  if (summary.historyProjection) {
    lines.push(`history-summary: ${summary.historyProjection.summaryLine}`);
  }
  if (summary.artifactSummaryProjection) {
    lines.push(`artifact-summary-candidate: ${summary.artifactSummaryProjection.summaryLine}`);
    lines.push(
      ...summary.artifactSummaryProjection.closeoutLines
        .slice(0, 3)
        .map((line) => `artifact-summary-closeout: ${line}`),
    );
  }

  if (summary.warnings.length > 0) {
    lines.push(`warnings: ${summary.warnings.length}`);
    const warningSummary = summarizeWarnings(summary.warnings);
    if (warningSummary) {
      lines.push(`warning-summary: ${warningSummary}`);
    }
  }

  return lines;
}
