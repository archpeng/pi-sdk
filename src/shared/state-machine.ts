import type { AutopilotStatus } from "./types.js";

export type ReviewDecision = "next_wave" | "continue_execution" | "replan" | "closeout" | "stop";

export function decidePostReviewAction(status: AutopilotStatus): ReviewDecision {
  switch (status) {
    case "completed":
      return "next_wave";
    case "continue":
      return "continue_execution";
    case "needs_replan":
      return "replan";
    case "done":
      return "closeout";
    case "blocked":
    case "failed":
      return "stop";
  }
}

export function isTerminalStatus(status: AutopilotStatus): boolean {
  return status === "done" || status === "blocked" || status === "failed";
}
