import test from "node:test";
import assert from "node:assert/strict";
import { createAutopilotSubstrate, resolveAutopilotSubstrateConfig } from "../src/substrate/index.ts";

test("bb substrate parses server-owned autopilot status into bounded projection payload", async () => {
  const substrate = createAutopilotSubstrate(
    resolveAutopilotSubstrateConfig({ cwd: "/repo", mode: "bb", env: {} }),
    {
      fetchImpl: async (_input, init) => {
        const body = typeof init?.body === "string" ? init.body : "";
        if (body.includes('"method":"resources/read"')) {
          if (body.includes('memory://autopilot/canary/reports/recent')) {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                id: 2,
                result: {
                  contents: [
                    {
                      uri: "memory://autopilot/canary/reports/recent",
                      text: JSON.stringify({
                        reports: [
                          {
                            report_id: "canary-1",
                            objective_key: "objective:abc123",
                            verdict: "promote",
                            delta_score: 0.02,
                            rollout_decision: "promote_current_candidate",
                            published_at_ms: 10,
                            lifecycle_state: "published",
                          },
                        ],
                      }),
                    },
                  ],
                },
              }),
              { status: 200, headers: { "content-type": "application/json" } },
            );
          }

          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 3,
              result: {
                contents: [
                  {
                    uri: "memory://autopilot/strategy-feedback/reports/recent",
                    text: JSON.stringify({
                      reports: [
                        {
                          report_id: "strategy-1",
                          objective_key: "objective:abc123",
                          recommendation: "tighten_review_and_budget",
                          replay_score: 0.91,
                          warning_count: 2,
                          published_at_ms: 9,
                          lifecycle_state: "published",
                        },
                      ],
                    }),
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    objective_key: "objective:abc123",
                    queue_lag: 0,
                    queue_drain_state: "idle",
                    replay_health: "fresh",
                    canary_verdict: "promote",
                    rollout_decision: "promote_current_candidate",
                    strategy_feedback_candidate: true,
                    heads: [
                      {
                        kind: "autopilot_run",
                        scope_key: "objective:abc123",
                        found: true,
                        freshness: "fresh",
                      },
                    ],
                    summary: ["queue=idle lag=0", "replay=fresh", "canary=promote"],
                    published_at_ms: 1,
                  }),
                },
              ],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  );

  const status = await substrate.autopilot.status({ objectiveKey: "objective:abc123" });

  assert.equal(status.ok, true);
  assert.deepEqual(status.data, {
    objectiveKey: "objective:abc123",
    queueLag: 0,
    queueDrainState: "idle",
    headFreshness: "fresh",
    replayHealth: "fresh",
    canaryVerdict: "promote",
    rolloutDecision: "promote_current_candidate",
    strategyFeedbackCandidate: true,
    heads: [
      {
        kind: "autopilot_run",
        scopeKey: "objective:abc123",
        found: true,
        freshness: "fresh",
      },
    ],
    summary: ["queue=idle lag=0", "replay=fresh", "canary=promote"],
    publishedAtMs: 1,
  });

  const history = await substrate.autopilot.history({ objectiveKey: "objective:abc123", limit: 5 });
  assert.equal(history.ok, true);
  assert.deepEqual(history.data, {
    objectiveKey: "objective:abc123",
    entries: [
      {
        reportKind: "canary",
        reportId: "canary-1",
        objectiveKey: "objective:abc123",
        label: "promote",
        summaryLine: "promote Δ0.02 rollout=promote_current_candidate",
        publishedAtMs: 10,
        lifecycleState: "published",
      },
      {
        reportKind: "strategy_feedback",
        reportId: "strategy-1",
        objectiveKey: "objective:abc123",
        label: "tighten_review_and_budget",
        summaryLine: "tighten_review_and_budget replay=0.91 warnings=2",
        publishedAtMs: 9,
        lifecycleState: "published",
      },
    ],
  });
});

test("bb substrate parses BB-owned artifact-summary learned advisory resources", async () => {
  const substrate = createAutopilotSubstrate(
    resolveAutopilotSubstrateConfig({ cwd: "/repo", mode: "bb", env: {} }),
    {
      fetchImpl: async (_input, init) => {
        const body = typeof init?.body === "string" ? init.body : "";
        if (body.includes('memory://autopilot/learned-advisory/current/objective%3Aabc123/artifact_summary')) {
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              result: {
                contents: [
                  {
                    uri: "memory://autopilot/learned-advisory/current/objective%3Aabc123/artifact_summary",
                    text: JSON.stringify({
                      report: {
                        report_id: "learned-1",
                        report_kind: "learned_advisory",
                        report_ref: "memory://autopilot/learned-advisory/reports/learned-1",
                        objective_key: "objective:abc123",
                        lifecycle_state: "candidate",
                        published_at_ms: 12,
                        advisory_only: true,
                        payload: {
                          payload_kind: "artifact_summary",
                          objective_key: "objective:abc123",
                          confidence: 0.74,
                          evidence_summary: ["history_entries=2"],
                          no_regression_guard: true,
                          governance_no_regression_guard: false,
                          candidate_only: true,
                          stage: "shadow_only",
                          source_refs: ["memory://autopilot/status/reports/status-1"],
                          summary_projection: {
                            closeout_lines: ["objective-key: objective:abc123"],
                            operator_lines: ["objective-key: objective:abc123", "decision-authority: ready_for_operator outcome=none"],
                            history_lines: ["canary: hold Δ0 rollout=hold_for_more_evidence"],
                          },
                        },
                      },
                    }),
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({ jsonrpc: "2.0", id: 1, result: { contents: [] } }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  );

  const advisory = await substrate.autopilot.learnedArtifactSummary({ objectiveKey: "objective:abc123" });
  assert.equal(advisory.ok, true);
  assert.deepEqual(advisory.data, {
    reportId: "learned-1",
    reportRef: "memory://autopilot/learned-advisory/reports/learned-1",
    objectiveKey: "objective:abc123",
    lifecycleState: "candidate",
    payloadKind: "artifact_summary",
    stage: "shadow_only",
    candidateOnly: true,
    confidence: 0.74,
    evidenceSummary: ["history_entries=2"],
    noRegressionGuard: true,
    governanceNoRegressionGuard: false,
    sourceRefs: ["memory://autopilot/status/reports/status-1"],
    summaryProjection: {
      closeoutLines: ["objective-key: objective:abc123"],
      operatorLines: ["objective-key: objective:abc123", "decision-authority: ready_for_operator outcome=none"],
      historyLines: ["canary: hold Δ0 rollout=hold_for_more_evidence"],
    },
    publishedAtMs: 12,
  });
});

test("bb substrate parses decision authority resources plus dry-run intent/reconcile tool payloads", async () => {
  const substrate = createAutopilotSubstrate(
    resolveAutopilotSubstrateConfig({ cwd: "/repo", mode: "bb", env: {} }),
    {
      fetchImpl: async (_input, init) => {
        const body = typeof init?.body === "string" ? init.body : "";
        if (body.includes('"method":"resources/read"')) {
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              result: {
                contents: [
                  {
                    uri: "memory://autopilot/decision-authority/current/objective%3Aabc123",
                    text: JSON.stringify({
                      authority: {
                        authority_id: "authority-1",
                        authority_ref: "memory://autopilot/decision-authority/authority-1",
                        objective_key: "objective:abc123",
                        lifecycle_state: "published",
                        decision_state: "finalized",
                        intent_state: "recorded",
                        reconcile_state: "ready",
                        final_outcome: "promote",
                        reason_codes: ["canary_promote", "operator_intent_recorded"],
                        evidence: {
                          status_report_id: "status-1",
                          canary_report_id: "canary-1",
                          strategy_feedback_report_id: "strategy-1",
                          source_refs: ["memory://autopilot/status/objective:abc123"],
                        },
                        decided_at_ms: 20,
                        scope_family: "autopilot_promotion_decision",
                        scope_key: "objective:abc123",
                        requires_manual_reconcile: true,
                        intent_outcome: "promote",
                        intent_note: "operator approved dry run",
                        intent_source_refs: ["memory://operator/note/1"],
                      },
                    }),
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (body.includes('"name":"memory_autopilot_decision_intent"')) {
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 3,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      authority: {
                        authority_id: "authority-2",
                        authority_ref: "memory://autopilot/decision-authority/authority-2",
                        objective_key: "objective:abc123",
                        lifecycle_state: "published",
                        decision_state: "finalized",
                        intent_state: "recorded",
                        reconcile_state: "ready",
                        final_outcome: "promote",
                        reason_codes: ["canary_promote", "operator_intent_recorded"],
                        evidence: {
                          status_report_id: "status-1",
                          canary_report_id: "canary-1",
                          strategy_feedback_report_id: "strategy-1",
                          source_refs: ["memory://autopilot/status/objective:abc123"],
                        },
                        decided_at_ms: 21,
                        scope_family: "autopilot_promotion_decision",
                        scope_key: "objective:abc123",
                        requires_manual_reconcile: true,
                        supersedes_authority_id: "authority-1",
                        intent_outcome: "promote",
                        intent_note: "operator approved dry run",
                        intent_source_refs: ["memory://operator/note/1"],
                      },
                      persisted: true,
                      payload_template: {
                        tool_name: "memory_store",
                        memory_class: "governance",
                        content: "AUTOPILOT_PROMOTION_DECISION",
                        effect_summary: "Canonical autopilot promotion decision reconcile.",
                        metadata: {
                          scope_family: "autopilot_promotion_decision",
                          scope_key: "objective:abc123",
                          scope_write_source: "manual_reconcile",
                          autopilot_decision_authority_id: "authority-2",
                          autopilot_decision_outcome: "promote",
                        },
                      },
                    }),
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (body.includes('"name":"memory_autopilot_decision_reconcile_plan"')) {
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 4,
              result: {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      mode: "dry_run",
                      authority: {
                        authority_id: "authority-2",
                        authority_ref: "memory://autopilot/decision-authority/authority-2",
                        objective_key: "objective:abc123",
                        lifecycle_state: "published",
                        decision_state: "finalized",
                        intent_state: "recorded",
                        reconcile_state: "ready",
                        final_outcome: "promote",
                        reason_codes: ["canary_promote", "operator_intent_recorded"],
                        evidence: {
                          status_report_id: "status-1",
                          canary_report_id: "canary-1",
                          strategy_feedback_report_id: "strategy-1",
                          source_refs: ["memory://autopilot/status/objective:abc123"],
                        },
                        decided_at_ms: 21,
                        scope_family: "autopilot_promotion_decision",
                        scope_key: "objective:abc123",
                        requires_manual_reconcile: true,
                        supersedes_authority_id: "authority-1",
                        intent_outcome: "promote",
                      },
                      scope_status: {
                        scopeFamily: "autopilot_promotion_decision",
                        scopeKey: "objective:abc123",
                      },
                      payload_template: {
                        tool_name: "memory_store",
                        memory_class: "governance",
                        content: "AUTOPILOT_PROMOTION_DECISION",
                        effect_summary: "Canonical autopilot promotion decision reconcile.",
                        metadata: {
                          scope_family: "autopilot_promotion_decision",
                          scope_key: "objective:abc123",
                          scope_write_source: "manual_reconcile",
                          autopilot_decision_authority_id: "authority-2",
                          autopilot_decision_outcome: "promote",
                        },
                      },
                    }),
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({ objective_key: "objective:abc123", summary: [] }),
                },
              ],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  );

  const authority = await substrate.autopilot.authority({ objectiveKey: "objective:abc123" });
  assert.equal(authority.ok, true);
  assert.deepEqual(authority.data, {
    authorityId: "authority-1",
    authorityRef: "memory://autopilot/decision-authority/authority-1",
    objectiveKey: "objective:abc123",
    lifecycleState: "published",
    decisionState: "finalized",
    intentState: "recorded",
    reconcileState: "ready",
    finalOutcome: "promote",
    reasonCodes: ["canary_promote", "operator_intent_recorded"],
    evidence: {
      statusReportId: "status-1",
      canaryReportId: "canary-1",
      strategyFeedbackReportId: "strategy-1",
      sourceRefs: ["memory://autopilot/status/objective:abc123"],
    },
    decidedAtMs: 20,
    scopeFamily: "autopilot_promotion_decision",
    scopeKey: "objective:abc123",
    requiresManualReconcile: true,
    intentOutcome: "promote",
    intentNote: "operator approved dry run",
    intentSourceRefs: ["memory://operator/note/1"],
  });

  const intent = await substrate.autopilot.decisionIntent({
    objectiveKey: "objective:abc123",
    intentState: "recorded",
    note: "operator approved dry run",
    sourceRefs: ["memory://operator/note/1"],
  });
  assert.equal(intent.ok, true);
  assert.equal(intent.data?.persisted, true);
  assert.equal(intent.data?.authority.authorityId, "authority-2");
  assert.equal(intent.data?.payloadTemplate?.toolName, "memory_store");
  assert.equal(intent.data?.payloadTemplate?.metadata.scope_write_source, "manual_reconcile");

  const reconcile = await substrate.autopilot.decisionReconcilePlan({ objectiveKey: "objective:abc123" });
  assert.equal(reconcile.ok, true);
  assert.equal(reconcile.data?.mode, "dry_run");
  assert.equal(reconcile.data?.authority.authorityId, "authority-2");
  assert.equal(reconcile.data?.payloadTemplate.toolName, "memory_store");
  assert.equal(reconcile.data?.payloadTemplate.metadata.autopilot_decision_outcome, "promote");
  assert.equal(reconcile.data?.payloadTemplate.metadata.scope_write_source, "manual_reconcile");
});
