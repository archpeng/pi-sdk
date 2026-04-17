import type { AutopilotDecisionProjection } from "./protocol.js";
import type {
  AutopilotDecisionAuthorityPayload,
  AutopilotDecisionReconcilePlanPayload,
} from "../substrate/types.js";

export function buildAutopilotDecisionProjection(
  authority: AutopilotDecisionAuthorityPayload | null | undefined,
  reconcilePlan?: AutopilotDecisionReconcilePlanPayload | null | undefined,
): AutopilotDecisionProjection | undefined {
  if (!authority) return undefined;

  const detailLines = [
    `authority=${authority.authorityId} reasons=${authority.reasonCodes.join(",") || "none"}`,
    ...(reconcilePlan?.payloadTemplate
      ? [
          `dry_run ${reconcilePlan.payloadTemplate.toolName}/${reconcilePlan.payloadTemplate.metadata.scope_write_source ?? "unknown"} outcome=${reconcilePlan.payloadTemplate.metadata.autopilot_decision_outcome ?? authority.finalOutcome ?? "none"}`,
        ]
      : authority.requiresManualReconcile
        ? [`manual_reconcile=${authority.reconcileState}`]
        : []),
    ...(authority.intentNote ? [`intent-note=${authority.intentNote}`] : []),
  ];

  return {
    objectiveKey: authority.objectiveKey,
    authorityId: authority.authorityId,
    source: "bb_autopilot_decision_authority",
    summaryLine: `state=${authority.decisionState} outcome=${authority.finalOutcome ?? "none"} · intent=${authority.intentState} · reconcile=${authority.reconcileState}`,
    detailLines,
    decidedAtMs: authority.decidedAtMs,
    ...(authority.finalOutcome ? { finalOutcome: authority.finalOutcome } : {}),
    intentState: authority.intentState,
    reconcileState: authority.reconcileState,
  };
}
