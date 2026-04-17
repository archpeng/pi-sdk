import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAutopilotOverlayLines,
  buildAutopilotStatusLines,
  summarizeWarnings,
} from "../src/autopilot/operator.ts";
import type {
  AutopilotArtifactSummaryProjection,
  AutopilotBenchmarkProjection,
  AutopilotDecisionProjection,
  AutopilotHistoryProjection,
  AutopilotReport,
} from "../src/autopilot/protocol.ts";
import type { AutopilotRuntimeState } from "../src/autopilot/state.ts";

function projection(overrides: Partial<AutopilotBenchmarkProjection> = {}): AutopilotBenchmarkProjection {
  return {
    objectiveKey: "objective:abc123",
    source: "bb_autopilot_status",
    summaryLine:
      "queue=idle lag=0 · heads=fresh · replay=fresh · canary=promote · strategy=candidate · rollout=promote_current_candidate",
    detailLines: ["queue=idle lag=0", "replay=fresh", "canary=promote", "strategy_feedback=candidate"],
    publishedAtMs: 1,
    ...overrides,
  };
}

function decisionProjection(overrides: Partial<AutopilotDecisionProjection> = {}): AutopilotDecisionProjection {
  return {
    objectiveKey: "objective:abc123",
    authorityId: "authority-2",
    source: "bb_autopilot_decision_authority",
    summaryLine: "state=finalized outcome=promote · intent=recorded · reconcile=ready",
    detailLines: [
      "authority=authority-2 reasons=canary_promote,operator_intent_recorded",
      "dry_run memory_store/manual_reconcile outcome=promote",
    ],
    decidedAtMs: 21,
    finalOutcome: "promote",
    intentState: "recorded",
    reconcileState: "ready",
    ...overrides,
  };
}

function historyProjection(overrides: Partial<AutopilotHistoryProjection> = {}): AutopilotHistoryProjection {
  return {
    objectiveKey: "objective:abc123",
    source: "bb_autopilot_report_resources",
    summaryLine: "canary=1 strategy=1 latest=canary:promote",
    detailLines: [
      "canary: promote Δ0.02 rollout=promote_current_candidate",
      "strategy_feedback: tighten_review_and_budget replay=0.91 warnings=2",
    ],
    ...overrides,
  };
}

function artifactSummaryProjection(
  overrides: Partial<AutopilotArtifactSummaryProjection> = {},
): AutopilotArtifactSummaryProjection {
  return {
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
    ],
    closeoutLines: ["objective-key: objective:abc123", "history-summary: canary=1 strategy=1 latest=canary:promote"],
    operatorLines: [
      "objective-key: objective:abc123",
      "decision-authority: ready_for_operator outcome=none",
    ],
    historyLines: ["canary: hold Δ0 rollout=hold_for_more_evidence"],
    ...overrides,
  };
}

function runtime(overrides: Partial<AutopilotRuntimeState> = {}): AutopilotRuntimeState {
  return {
    goal: "stabilize Pi-native autopilot",
    mode: "running",
    phase: "execute",
    currentWave: 2,
    currentCycle: 1,
    maxWaves: 5,
    maxExecutionCyclesPerWave: 3,
    dispatchState: "awaiting_report",
    warnings: ["memory_autopilot_status not found", "plan_sync unavailable"],
    substrateMode: "bb",
    objectiveKey: "objective:abc123",
    benchmarkProjection: projection(),
    decisionProjection: decisionProjection(),
    historyProjection: historyProjection(),
    artifactSummaryProjection: artifactSummaryProjection(),
    updatedAtMs: 1,
    ...overrides,
  };
}

function report(overrides: Partial<AutopilotReport> = {}): AutopilotReport {
  return {
    phase: "execute",
    status: "continue",
    summary: "landed the warning surface",
    evidence: ["npm test"],
    artifacts: ["src/extension/index.ts"],
    risks: [],
    timestampMs: 1,
    ...overrides,
  };
}

test("summarizeWarnings returns the latest warning plus overflow count", () => {
  assert.equal(summarizeWarnings([]), undefined);
  assert.equal(summarizeWarnings(["only warning"]), "only warning");
  assert.equal(
    summarizeWarnings(["memory_autopilot_status not found", "plan_sync unavailable"]),
    "plan_sync unavailable (+1 more)",
  );
});

test("buildAutopilotStatusLines exposes substrate mode, degraded warning summary, benchmark projection, decision authority, and history summary", () => {
  const lines = buildAutopilotStatusLines(runtime(), [report()]);
  const joined = lines.join("\n");

  assert.match(joined, /mode: running/);
  assert.match(joined, /substrate: bb/);
  assert.match(joined, /degraded: yes/);
  assert.match(joined, /objective-key: objective:abc123/);
  assert.match(joined, /promotion-readiness: .*canary=promote/);
  assert.match(joined, /decision-authority: state=finalized outcome=promote · intent=recorded · reconcile=ready/);
  assert.match(joined, /history-summary: canary=1 strategy=1 latest=canary:promote/);
  assert.match(joined, /artifact-summary-candidate: stage=shadow_only · confidence=0.74 · replay-guard=pass · governance-guard=hold/);
  assert.match(joined, /warning-summary: plan_sync unavailable \(\+1 more\)/);
  assert.match(joined, /phase: execute/);
});

test("buildAutopilotOverlayLines includes benchmark projection, decision authority, history details, goal, next action, and command help", () => {
  const lines = buildAutopilotOverlayLines(runtime(), [report({ nextAction: "review the warning hardening slice" })]);
  const joined = lines.join("\n");

  assert.match(joined, /Autopilot Inspector/);
  assert.match(joined, /goal: stabilize Pi-native autopilot/);
  assert.match(joined, /objective-key: objective:abc123/);
  assert.match(joined, /promotion-readiness: .*strategy=candidate/);
  assert.match(joined, /decision-authority: state=finalized outcome=promote · intent=recorded · reconcile=ready/);
  assert.match(joined, /authority=authority-2 reasons=canary_promote,operator_intent_recorded/);
  assert.match(joined, /dry_run memory_store\/manual_reconcile outcome=promote/);
  assert.match(joined, /history-summary: canary=1 strategy=1 latest=canary:promote/);
  assert.match(joined, /canary: promote Δ0.02 rollout=promote_current_candidate/);
  assert.match(joined, /artifact-summary-candidate: stage=shadow_only · confidence=0.74 · replay-guard=pass · governance-guard=hold/);
  assert.match(joined, /artifact-summary: objective-key: objective:abc123/);
  assert.match(joined, /next: review the warning hardening slice/);
  assert.match(joined, /\/autopilot-pause/);
  assert.match(joined, /warning-summary: plan_sync unavailable \(\+1 more\)/);
});
