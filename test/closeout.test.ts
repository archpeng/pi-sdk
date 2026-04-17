import test from "node:test";
import assert from "node:assert/strict";
import { buildCloseoutSummaryLines } from "../src/autopilot/closeout.ts";

test("buildCloseoutSummaryLines emits a reusable closeout summary", () => {
  const lines = buildCloseoutSummaryLines({
    done: true,
    wavesAttempted: 2,
    objectiveKey: "objective:abc123",
    benchmarkProjection: {
      objectiveKey: "objective:abc123",
      source: "bb_autopilot_status",
      summaryLine:
        "queue=idle lag=0 · heads=fresh · replay=fresh · canary=promote · strategy=candidate · rollout=promote_current_candidate",
      detailLines: ["queue=idle lag=0", "replay=fresh"],
      publishedAtMs: 1,
    },
    decisionProjection: {
      objectiveKey: "objective:abc123",
      authorityId: "authority-2",
      source: "bb_autopilot_decision_authority",
      summaryLine: "state=finalized outcome=promote · intent=recorded · reconcile=ready",
      detailLines: [
        "authority=authority-2 reasons=canary_promote,operator_intent_recorded",
        "dry_run memory_store/manual_reconcile outcome=promote",
      ],
      decidedAtMs: 2,
      finalOutcome: "promote",
      intentState: "recorded",
      reconcileState: "ready",
    },
    historyProjection: {
      objectiveKey: "objective:abc123",
      source: "bb_autopilot_report_resources",
      summaryLine: "canary=1 strategy=1 latest=canary:promote · artifact_summary=shadow_only@0.74",
      detailLines: [
        "canary: promote Δ0.02 rollout=promote_current_candidate",
        "strategy_feedback: tighten_review_and_budget replay=0.91 warnings=2",
        "artifact-summary-candidate: history-summary: canary=1 strategy=1 latest=canary:promote",
      ],
    },
    artifactSummaryProjection: {
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
      detailLines: ["report=learned-1 lifecycle=candidate candidate_only=true"],
      closeoutLines: [
        "objective-key: objective:abc123",
        "promotion-readiness: strategy=tighten_review_and_budget replay=0.64 warnings=1",
      ],
      operatorLines: ["objective-key: objective:abc123"],
      historyLines: ["canary: hold Δ0 rollout=hold_for_more_evidence"],
    },
    reports: [
      {
        phase: "closeout",
        status: "done",
        summary: "interactive autopilot closeout complete",
        evidence: ["npm test", "npm run build"],
        artifacts: ["README.md"],
        risks: [],
        timestampMs: 1,
      },
    ],
    warnings: ["bb-memory endpoint stale locally"],
    sessionFile: "/tmp/session.jsonl",
  });

  assert.deepEqual(lines, [
    "Run finished. done=true wavesAttempted=2",
    "session: /tmp/session.jsonl",
    "objective-key: objective:abc123",
    "latest: closeout/done :: interactive autopilot closeout complete",
    "promotion-readiness: queue=idle lag=0 · heads=fresh · replay=fresh · canary=promote · strategy=candidate · rollout=promote_current_candidate",
    "decision-authority: state=finalized outcome=promote · intent=recorded · reconcile=ready",
    "history-summary: canary=1 strategy=1 latest=canary:promote · artifact_summary=shadow_only@0.74",
    "artifact-summary-candidate: stage=shadow_only · confidence=0.74 · replay-guard=pass · governance-guard=hold",
    "artifact-summary-closeout: objective-key: objective:abc123",
    "artifact-summary-closeout: promotion-readiness: strategy=tighten_review_and_budget replay=0.64 warnings=1",
    "warnings: 1",
    "warning-summary: bb-memory endpoint stale locally",
  ]);
});
