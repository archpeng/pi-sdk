import type { GovernDecision, GovernEvaluatePayload } from "./types.js";

const DANGEROUS_BASH_PATTERNS = [
  /\brm\s+(-rf?|-fr|--recursive)\b/i,
  /\bsudo\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bgit\s+clean\b[^\n]*\b-f\b/i,
  /\bchmod\b[^\n]*\b777\b/i,
  /\bchown\b[^\n]*\b777\b/i,
  /\bmkfs\b/i,
  /\bdd\b[^\n]*\bof=\/dev\//i,
];

export function shouldPreflightToolCall(toolName: string, args: Record<string, unknown>): boolean {
  if (toolName === "write" || toolName === "edit") return true;
  if (toolName !== "bash") return false;

  const command = typeof args.command === "string" ? args.command : "";
  return DANGEROUS_BASH_PATTERNS.some((pattern) => pattern.test(command));
}

export function normalizeGovernDecision(value: string | undefined): GovernDecision {
  if (value === "allow") return "allow";
  if (value === "deny") return "deny";
  if (value === "require_approval" || value === "approval_required") return "require_approval";
  return "unknown";
}

export function shouldBlockToolCall(decision: GovernDecision): boolean {
  return decision === "deny" || decision === "require_approval";
}

export function formatGovernanceBlockReason(payload: GovernEvaluatePayload): string {
  const reason = payload.reason?.trim();
  const ruleId = payload.ruleId?.trim();
  const details = [reason, ruleId ? `rule=${ruleId}` : undefined].filter(Boolean).join("; ");

  if (payload.decision === "require_approval") {
    return details ? `Blocked pending approval: ${details}` : "Blocked pending approval.";
  }
  if (payload.decision === "deny") {
    return details ? `Blocked by governance policy: ${details}` : "Blocked by governance policy.";
  }
  return details || "Governance check returned a non-allow decision.";
}
