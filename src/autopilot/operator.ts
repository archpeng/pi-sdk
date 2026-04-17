import { formatAutopilotReport, type AutopilotReport } from "./protocol.js";
import type { AutopilotRuntimeState } from "./state.js";

function latestReport(reports: AutopilotReport[]): AutopilotReport | undefined {
  return reports.at(-1);
}

function buildProjectionLines(runtime: AutopilotRuntimeState): string[] {
  const lines: string[] = [];
  if (runtime.objectiveKey) {
    lines.push(`objective-key: ${runtime.objectiveKey}`);
  }
  if (runtime.benchmarkProjection) {
    lines.push(`promotion-readiness: ${runtime.benchmarkProjection.summaryLine}`);
  }
  if (runtime.decisionProjection) {
    lines.push(`decision-authority: ${runtime.decisionProjection.summaryLine}`);
  }
  if (runtime.historyProjection) {
    lines.push(`history-summary: ${runtime.historyProjection.summaryLine}`);
  }
  if (runtime.artifactSummaryProjection) {
    lines.push(`artifact-summary-candidate: ${runtime.artifactSummaryProjection.summaryLine}`);
  }
  return lines;
}

export function summarizeWarnings(warnings: string[]): string | undefined {
  const latest = warnings.at(-1);
  if (!latest) return undefined;
  if (warnings.length === 1) return latest;
  return `${latest} (+${warnings.length - 1} more)`;
}

export function buildAutopilotStatusLines(
  runtime: AutopilotRuntimeState | null,
  reports: AutopilotReport[],
): string[] {
  const latest = latestReport(reports);
  const lines: string[] = [];

  if (runtime) {
    lines.push(`mode: ${runtime.mode}`);
    lines.push(`goal: ${runtime.goal}`);
    lines.push(`phase: ${runtime.phase}`);
    lines.push(`wave/cycle: ${runtime.currentWave}/${runtime.currentCycle}`);
    lines.push(`dispatch: ${runtime.dispatchState}`);
    lines.push(`substrate: ${runtime.substrateMode ?? "unknown"}`);
    lines.push(`degraded: ${runtime.warnings.length > 0 ? "yes" : "no"}`);
    lines.push(...buildProjectionLines(runtime));
    const warningSummary = summarizeWarnings(runtime.warnings);
    if (warningSummary) {
      lines.push(`warning-summary: ${warningSummary}`);
    }
  }

  if (latest) {
    if (lines.length > 0) lines.push("");
    lines.push(formatAutopilotReport(latest));
  }

  return lines;
}

export function buildAutopilotWidgetLines(
  runtime: AutopilotRuntimeState,
  reports: AutopilotReport[],
): string[] {
  const latest = latestReport(reports);
  const lines = [
    `Autopilot ${runtime.goal}`,
    `phase: ${runtime.phase}`,
    `mode: ${runtime.mode} · dispatch: ${runtime.dispatchState}`,
    `substrate: ${runtime.substrateMode ?? "unknown"} · degraded: ${runtime.warnings.length > 0 ? "yes" : "no"}`,
  ];

  if (runtime.objectiveKey) lines.push(`objective-key: ${runtime.objectiveKey}`);
  if (runtime.benchmarkProjection) lines.push(`benchmark: ${runtime.benchmarkProjection.summaryLine}`);
  if (runtime.decisionProjection) lines.push(`decision: ${runtime.decisionProjection.summaryLine}`);
  if (runtime.historyProjection) lines.push(`history: ${runtime.historyProjection.summaryLine}`);
  if (runtime.artifactSummaryProjection) lines.push(`artifact-summary: ${runtime.artifactSummaryProjection.summaryLine}`);
  if (latest) lines.push(`last: ${latest.summary}`);
  if (latest?.nextAction) lines.push(`next: ${latest.nextAction}`);
  const warningSummary = summarizeWarnings(runtime.warnings);
  if (warningSummary) lines.push(`warning: ${warningSummary}`);
  return lines;
}

export function buildAutopilotOverlayLines(
  runtime: AutopilotRuntimeState | null,
  reports: AutopilotReport[],
): string[] {
  const latest = latestReport(reports);
  const lines = ["Autopilot Inspector", ""];

  if (runtime) {
    lines.push(`goal: ${runtime.goal}`);
    lines.push(`mode: ${runtime.mode}`);
    lines.push(`phase: ${runtime.phase}`);
    lines.push(`wave/cycle: ${runtime.currentWave}/${runtime.currentCycle}`);
    lines.push(`dispatch: ${runtime.dispatchState}`);
    lines.push(`substrate: ${runtime.substrateMode ?? "unknown"}`);
    lines.push(`degraded: ${runtime.warnings.length > 0 ? "yes" : "no"}`);
    lines.push(...buildProjectionLines(runtime));
    if (runtime.benchmarkProjection) {
      lines.push(...runtime.benchmarkProjection.detailLines.slice(0, 2).map((line) => `autopilot-status: ${line}`));
    }
    if (runtime.decisionProjection) {
      lines.push(...runtime.decisionProjection.detailLines.slice(0, 3).map((line) => `autopilot-decision: ${line}`));
    }
    if (runtime.historyProjection) {
      lines.push(...runtime.historyProjection.detailLines.slice(0, 3).map((line) => `autopilot-history: ${line}`));
    }
    if (runtime.artifactSummaryProjection) {
      lines.push(`artifact-summary-candidate: ${runtime.artifactSummaryProjection.summaryLine}`);
      lines.push(
        ...runtime.artifactSummaryProjection.operatorLines
          .slice(0, 2)
          .map((line) => `artifact-summary: ${line}`),
      );
    }
    const warningSummary = summarizeWarnings(runtime.warnings);
    if (warningSummary) lines.push(`warning-summary: ${warningSummary}`);
  }

  if (latest) {
    if (lines.at(-1) !== "") lines.push("");
    lines.push(`last: ${latest.phase}/${latest.status}`);
    lines.push(`summary: ${latest.summary}`);
    if (latest.nextAction) lines.push(`next: ${latest.nextAction}`);
  }

  lines.push("");
  lines.push("Controls:");
  lines.push("- /autopilot-pause");
  lines.push("- /autopilot-resume [goal]");
  lines.push("- /autopilot-stop");
  lines.push("- /autopilot-status");

  return lines;
}
