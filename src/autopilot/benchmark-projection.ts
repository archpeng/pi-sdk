import type { AutopilotBenchmarkProjection } from "./protocol.js";
import type { AutopilotStatusPayload } from "../substrate/types.js";

function strategyLabel(value: boolean | undefined): string {
  return value ? "candidate" : "none";
}

export function buildAutopilotBenchmarkProjection(
  status: AutopilotStatusPayload | null | undefined,
): AutopilotBenchmarkProjection | undefined {
  if (!status) return undefined;

  const summaryLine = [
    `queue=${status.queueDrainState ?? "unknown"} lag=${status.queueLag ?? "?"}`,
    `heads=${status.headFreshness ?? "missing"}`,
    `replay=${status.replayHealth ?? "missing"}`,
    `canary=${status.canaryVerdict ?? "missing"}`,
    `strategy=${strategyLabel(status.strategyFeedbackCandidate)}`,
    ...(status.rolloutDecision ? [`rollout=${status.rolloutDecision}`] : []),
  ].join(" · ");

  return {
    objectiveKey: status.objectiveKey,
    source: "bb_autopilot_status",
    summaryLine,
    detailLines: status.summary.length > 0 ? [...status.summary] : [summaryLine],
    ...(typeof status.publishedAtMs === "number" ? { publishedAtMs: status.publishedAtMs } : {}),
  };
}
