import { createMcpHttpClient } from "./http-mcp-client.js";
import { normalizeGovernDecision } from "./governance.js";
import type {
  AutopilotDecisionAuthorityPayload,
  AutopilotDecisionAuthorityToolPayload,
  AutopilotDecisionIntentPayload,
  AutopilotDecisionPayloadTemplate,
  AutopilotDecisionReconcilePlanPayload,
  AutopilotHistoryPayload,
  AutopilotLearnedArtifactSummaryPayload,
  AutopilotStatusPayload,
  AutopilotSubstrate,
  AutopilotSubstrateConfig,
  CreateAutopilotSubstrateDependencies,
  GovernEvaluatePayload,
  GovernPolicyPayload,
  MemoryRecallPayload,
  MemoryStorePayload,
  PlanSyncEntry,
  WorkspaceScanEntry,
} from "./types.js";

function errorResult<TData>(summary: string, data: TData, error: string, rawText = "") {
  return {
    ok: false as const,
    summary,
    data,
    rawText,
    error,
  };
}

function okResult<TData>(summary: string, data: TData, rawText = "") {
  return {
    ok: true as const,
    summary,
    data,
    rawText,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function readAutopilotStatusPayload(value: unknown): AutopilotStatusPayload | null {
  const payload = asRecord(value);
  if (!payload || typeof payload.objective_key !== "string") {
    return null;
  }

  const heads = Array.isArray(payload.heads)
    ? payload.heads
        .map((entry) => {
          const head = asRecord(entry);
          if (!head || typeof head.kind !== "string" || typeof head.scope_key !== "string") {
            return null;
          }
          return {
            kind: head.kind,
            scopeKey: head.scope_key,
            found: Boolean(head.found),
            freshness: typeof head.freshness === "string" ? head.freshness : "unknown",
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    : [];

  const aggregateHeadFreshness =
    typeof payload.head_freshness === "string"
      ? payload.head_freshness
      : heads.some((entry) => entry.freshness === "stale")
        ? "stale"
        : heads.some((entry) => entry.freshness === "fresh")
          ? "fresh"
          : heads.length > 0
            ? heads[0]?.freshness
            : undefined;

  return {
    objectiveKey: payload.objective_key,
    ...(typeof payload.queue_lag === "number" ? { queueLag: payload.queue_lag } : {}),
    ...(typeof payload.queue_drain_state === "string" ? { queueDrainState: payload.queue_drain_state } : {}),
    ...(typeof aggregateHeadFreshness === "string" ? { headFreshness: aggregateHeadFreshness } : {}),
    ...(typeof payload.replay_health === "string" ? { replayHealth: payload.replay_health } : {}),
    ...(typeof payload.canary_verdict === "string" ? { canaryVerdict: payload.canary_verdict } : {}),
    ...(typeof payload.rollout_decision === "string" ? { rolloutDecision: payload.rollout_decision } : {}),
    ...(typeof payload.strategy_feedback_candidate === "boolean"
      ? { strategyFeedbackCandidate: payload.strategy_feedback_candidate }
      : {}),
    heads,
    summary: readStringArray(payload.summary),
    ...(typeof payload.published_at_ms === "number" ? { publishedAtMs: payload.published_at_ms } : {}),
  };
}

function readAutopilotHistoryPayload(objectiveKey: string, canaryValue: unknown, strategyValue: unknown, limit = 6): AutopilotHistoryPayload {
  const canaryReports = Array.isArray(asRecord(canaryValue)?.reports) ? (asRecord(canaryValue)?.reports as unknown[]) : [];
  const strategyReports = Array.isArray(asRecord(strategyValue)?.reports) ? (asRecord(strategyValue)?.reports as unknown[]) : [];

  const entries = [
    ...canaryReports.map((report) => {
      const value = asRecord(report);
      if (!value || value.objective_key !== objectiveKey || typeof value.report_id !== "string") return null;
      return {
        reportKind: "canary" as const,
        reportId: value.report_id,
        objectiveKey,
        label: typeof value.verdict === "string" ? value.verdict : "unknown",
        summaryLine: `${typeof value.verdict === "string" ? value.verdict : "unknown"} Δ${typeof value.delta_score === "number" ? value.delta_score : "?"} rollout=${typeof value.rollout_decision === "string" ? value.rollout_decision : "unknown"}`,
        publishedAtMs: typeof value.published_at_ms === "number" ? value.published_at_ms : 0,
        ...(typeof value.report_ref === "string" ? { reportRef: value.report_ref } : {}),
        ...(typeof value.lifecycle_state === "string" ? { lifecycleState: value.lifecycle_state } : {}),
      };
    }),
    ...strategyReports.map((report) => {
      const value = asRecord(report);
      if (!value || value.objective_key !== objectiveKey || typeof value.report_id !== "string") return null;
      return {
        reportKind: "strategy_feedback" as const,
        reportId: value.report_id,
        objectiveKey,
        label: typeof value.recommendation === "string" ? value.recommendation : "unknown",
        summaryLine: `${typeof value.recommendation === "string" ? value.recommendation : "unknown"} replay=${typeof value.replay_score === "number" ? value.replay_score : "?"} warnings=${typeof value.warning_count === "number" ? value.warning_count : "?"}`,
        publishedAtMs: typeof value.published_at_ms === "number" ? value.published_at_ms : 0,
        ...(typeof value.report_ref === "string" ? { reportRef: value.report_ref } : {}),
        ...(typeof value.lifecycle_state === "string" ? { lifecycleState: value.lifecycle_state } : {}),
      };
    }),
  ]
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => right.publishedAtMs - left.publishedAtMs)
    .slice(0, limit);

  return {
    objectiveKey,
    entries,
  };
}

function readAutopilotDecisionEvidence(value: unknown): AutopilotDecisionAuthorityPayload["evidence"] | null {
  const payload = asRecord(value);
  if (!payload) return null;
  return {
    ...(typeof payload.status_report_id === "string" ? { statusReportId: payload.status_report_id } : {}),
    ...(typeof payload.canary_report_id === "string" ? { canaryReportId: payload.canary_report_id } : {}),
    ...(typeof payload.strategy_feedback_report_id === "string"
      ? { strategyFeedbackReportId: payload.strategy_feedback_report_id }
      : {}),
    sourceRefs: readStringArray(payload.source_refs),
  };
}

function readAutopilotDecisionAuthorityRecord(value: unknown): AutopilotDecisionAuthorityPayload | null {
  const payload = asRecord(value);
  if (!payload || typeof payload.authority_id !== "string" || typeof payload.objective_key !== "string") {
    return null;
  }

  const evidence = readAutopilotDecisionEvidence(payload.evidence);
  if (!evidence) return null;

  return {
    authorityId: payload.authority_id,
    authorityRef:
      typeof payload.authority_ref === "string"
        ? payload.authority_ref
        : `memory://autopilot/decision-authority/${payload.authority_id}`,
    objectiveKey: payload.objective_key,
    lifecycleState: typeof payload.lifecycle_state === "string" ? payload.lifecycle_state : "unknown",
    decisionState: typeof payload.decision_state === "string" ? payload.decision_state : "unknown",
    intentState: typeof payload.intent_state === "string" ? payload.intent_state : "unknown",
    reconcileState: typeof payload.reconcile_state === "string" ? payload.reconcile_state : "unknown",
    ...(typeof payload.final_outcome === "string" ? { finalOutcome: payload.final_outcome } : {}),
    reasonCodes: readStringArray(payload.reason_codes),
    evidence,
    decidedAtMs: typeof payload.decided_at_ms === "number" ? payload.decided_at_ms : 0,
    scopeFamily: typeof payload.scope_family === "string" ? payload.scope_family : "unknown",
    scopeKey: typeof payload.scope_key === "string" ? payload.scope_key : payload.objective_key,
    requiresManualReconcile: Boolean(payload.requires_manual_reconcile),
    ...(typeof payload.supersedes_authority_id === "string"
      ? { supersedesAuthorityId: payload.supersedes_authority_id }
      : {}),
    ...(typeof payload.superseded_by_authority_id === "string"
      ? { supersededByAuthorityId: payload.superseded_by_authority_id }
      : {}),
    ...(typeof payload.intent_outcome === "string" ? { intentOutcome: payload.intent_outcome } : {}),
    ...(typeof payload.intent_note === "string" ? { intentNote: payload.intent_note } : {}),
    ...(Array.isArray(payload.intent_source_refs)
      ? { intentSourceRefs: readStringArray(payload.intent_source_refs) }
      : {}),
  };
}

function readAutopilotDecisionAuthorityPayload(value: unknown): AutopilotDecisionAuthorityPayload | null {
  const payload = asRecord(value);
  if (!payload) return null;
  return readAutopilotDecisionAuthorityRecord(payload.authority ?? value);
}

function readAutopilotDecisionPayloadTemplate(value: unknown): AutopilotDecisionPayloadTemplate | null {
  const payload = asRecord(value);
  if (
    !payload ||
    typeof payload.tool_name !== "string" ||
    typeof payload.memory_class !== "string" ||
    typeof payload.content !== "string" ||
    typeof payload.effect_summary !== "string"
  ) {
    return null;
  }

  const metadata = asRecord(payload.metadata);
  return {
    toolName: payload.tool_name,
    memoryClass: payload.memory_class,
    content: payload.content,
    effectSummary: payload.effect_summary,
    metadata: Object.fromEntries(
      Object.entries(metadata ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    ),
  };
}

function readAutopilotDecisionAuthorityToolPayload(value: unknown): AutopilotDecisionAuthorityToolPayload | null {
  const payload = asRecord(value);
  const authority = readAutopilotDecisionAuthorityPayload(value);
  if (!payload || !authority || typeof payload.persisted !== "boolean") {
    return null;
  }
  return {
    authority,
    persisted: payload.persisted,
  };
}

function readAutopilotDecisionIntentPayload(value: unknown): AutopilotDecisionIntentPayload | null {
  const payload = asRecord(value);
  const authority = readAutopilotDecisionAuthorityPayload(value);
  if (!payload || !authority || typeof payload.persisted !== "boolean") {
    return null;
  }
  return {
    authority,
    persisted: payload.persisted,
    ...(readAutopilotDecisionPayloadTemplate(payload.payload_template)
      ? { payloadTemplate: readAutopilotDecisionPayloadTemplate(payload.payload_template) ?? undefined }
      : {}),
  };
}

function readAutopilotDecisionReconcilePlanPayload(value: unknown): AutopilotDecisionReconcilePlanPayload | null {
  const payload = asRecord(value);
  const authority = readAutopilotDecisionAuthorityPayload(value);
  const template = readAutopilotDecisionPayloadTemplate(payload?.payload_template);
  if (!payload || payload.mode !== "dry_run" || !authority || !template) {
    return null;
  }
  return {
    mode: "dry_run",
    authority,
    scopeStatus: asRecord(payload.scope_status),
    payloadTemplate: template,
  };
}

function readArtifactSummaryProjectionLines(value: unknown): AutopilotLearnedArtifactSummaryPayload["summaryProjection"] | null {
  const payload = asRecord(value);
  if (!payload) return null;
  return {
    closeoutLines: readStringArray(payload.closeout_lines),
    operatorLines: readStringArray(payload.operator_lines),
    historyLines: readStringArray(payload.history_lines),
  };
}

function readAutopilotLearnedArtifactSummaryPayload(value: unknown): AutopilotLearnedArtifactSummaryPayload | null {
  const envelope = asRecord(asRecord(value)?.report ?? value);
  if (
    !envelope ||
    typeof envelope.report_id !== "string" ||
    typeof envelope.report_ref !== "string" ||
    typeof envelope.objective_key !== "string"
  ) {
    return null;
  }

  const payload = asRecord(envelope.payload);
  if (!payload || payload.payload_kind !== "artifact_summary") {
    return null;
  }

  const summaryProjection = readArtifactSummaryProjectionLines(payload.summary_projection);
  if (!summaryProjection) {
    return null;
  }

  return {
    reportId: envelope.report_id,
    reportRef: envelope.report_ref,
    objectiveKey: envelope.objective_key,
    lifecycleState: typeof envelope.lifecycle_state === "string" ? envelope.lifecycle_state : "unknown",
    payloadKind: "artifact_summary",
    stage: payload.stage === "advisory_only" ? "advisory_only" : "shadow_only",
    candidateOnly: true,
    confidence: typeof payload.confidence === "number" ? payload.confidence : 0,
    evidenceSummary: readStringArray(payload.evidence_summary),
    noRegressionGuard: Boolean(payload.no_regression_guard),
    governanceNoRegressionGuard: Boolean(payload.governance_no_regression_guard),
    sourceRefs: readStringArray(payload.source_refs),
    summaryProjection,
    ...(typeof envelope.published_at_ms === "number" ? { publishedAtMs: envelope.published_at_ms } : {}),
  };
}

export function createBBSubstrate(
  config: AutopilotSubstrateConfig,
  dependencies: CreateAutopilotSubstrateDependencies = {},
): AutopilotSubstrate {
  const memoryClient = createMcpHttpClient({
    baseUrl: config.bb.memoryUrl,
    ...(dependencies.fetchImpl ? { fetchImpl: dependencies.fetchImpl } : {}),
    timeoutMs: config.bb.timeoutMs,
  });
  const governClient = createMcpHttpClient({
    baseUrl: config.bb.governUrl,
    ...(dependencies.fetchImpl ? { fetchImpl: dependencies.fetchImpl } : {}),
    timeoutMs: config.bb.timeoutMs,
  });
  const toolsClient = createMcpHttpClient({
    baseUrl: config.bb.toolsUrl,
    ...(dependencies.fetchImpl ? { fetchImpl: dependencies.fetchImpl } : {}),
    timeoutMs: config.bb.timeoutMs,
  });

  return {
    mode: "bb",
    config,
    memory: {
      async recall(input) {
        const result = await memoryClient.callTool("memory_recall", {
          query: input.query,
          limit: input.limit,
          ...(input.toolName ? { tool_name: input.toolName } : {}),
          ...(input.memoryClass ? { memory_class: input.memoryClass } : {}),
          ...(input.sessionId ? { session_id: input.sessionId } : {}),
          ...(input.contextHash ? { context_hash: input.contextHash } : {}),
          ...(input.graphMode ? { graph_mode: input.graphMode } : {}),
        });

        const payload = asRecord(result.parsed);
        const items = Array.isArray(payload?.nodes) ? payload.nodes : [];
        const count = typeof payload?.count === "number" ? payload.count : items.length;
        if (!result.ok) {
          return errorResult<MemoryRecallPayload>(
            `bb memory recall failed: ${result.error ?? "unknown error"}`,
            { items: [], count: 0 },
            result.error ?? "bb memory recall failed",
            result.rawText,
          );
        }

        return okResult<MemoryRecallPayload>(`bb memory recall: ${count} hit(s)`, { items, count }, result.rawText);
      },
      async store(input) {
        const result = await memoryClient.callTool("memory_store", {
          content: input.content,
          tool_name: input.toolName,
          memory_class: input.memoryClass,
          ...(input.effectSummary ? { effect_summary: input.effectSummary } : {}),
          ...(input.sessionId ? { session_id: input.sessionId } : {}),
          ...(input.taskId ? { task_id: input.taskId } : {}),
          ...(input.metadata ? { metadata: input.metadata } : {}),
        });

        if (!result.ok) {
          return errorResult<MemoryStorePayload>(
            `bb memory store failed: ${result.error ?? "unknown error"}`,
            { stored: false, response: null },
            result.error ?? "bb memory store failed",
            result.rawText,
          );
        }

        return okResult<MemoryStorePayload>("bb memory store: raw evidence accepted", { stored: true, response: result.parsed }, result.rawText);
      },
    },
    govern: {
      async policy() {
        const result = await governClient.callTool("govern_policy", {});
        if (!result.ok) {
          return errorResult<GovernPolicyPayload>(
            `bb govern policy failed: ${result.error ?? "unknown error"}`,
            { policy: null },
            result.error ?? "bb govern policy failed",
            result.rawText,
          );
        }

        return okResult<GovernPolicyPayload>("bb govern policy loaded", { policy: asRecord(result.parsed) }, result.rawText);
      },
      async evaluate(input) {
        const result = await governClient.callTool("govern_evaluate", {
          tool_name: input.toolName,
          args: input.args,
          ...(input.cwd ? { cwd: input.cwd } : {}),
        });

        const payload = asRecord(result.parsed);
        if (!result.ok) {
          return errorResult<GovernEvaluatePayload>(
            `bb govern evaluate failed: ${result.error ?? "unknown error"}`,
            { decision: "unknown" },
            result.error ?? "bb govern evaluate failed",
            result.rawText,
          );
        }

        return okResult<GovernEvaluatePayload>(
          `bb govern evaluate: ${String(payload?.decision ?? "unknown")}`,
          {
            decision: normalizeGovernDecision(typeof payload?.decision === "string" ? payload.decision : undefined),
            ...(typeof payload?.rule_id === "string" ? { ruleId: payload.rule_id } : {}),
            ...(typeof payload?.reason === "string" ? { reason: payload.reason } : {}),
          },
          result.rawText,
        );
      },
    },
    workspace: {
      async scan(input) {
        const result = await toolsClient.callTool("workspace_scan", {
          workspaces: input.workspaces,
        });

        const payload = Array.isArray(result.parsed) ? (result.parsed as WorkspaceScanEntry[]) : [];
        if (!result.ok) {
          return errorResult<WorkspaceScanEntry[]>(
            `bb workspace scan failed: ${result.error ?? "unknown error"}`,
            [],
            result.error ?? "bb workspace scan failed",
            result.rawText,
          );
        }

        return okResult<WorkspaceScanEntry[]>(`bb workspace scan: ${payload.length} workspace(s)`, payload, result.rawText);
      },
      async planSync(input) {
        const result = await toolsClient.callTool("plan_sync", {
          docs_path: input.docsPath,
        });

        const payload = Array.isArray(result.parsed) ? (result.parsed as PlanSyncEntry[]) : [];
        if (!result.ok) {
          return errorResult<PlanSyncEntry[]>(
            `bb plan sync failed: ${result.error ?? "unknown error"}`,
            [],
            result.error ?? "bb plan sync failed",
            result.rawText,
          );
        }

        return okResult<PlanSyncEntry[]>(`bb plan sync: ${payload.length} plan file(s)`, payload, result.rawText);
      },
    },
    autopilot: {
      async status(input) {
        const result = await memoryClient.callTool("memory_autopilot_status", {
          objective_key: input.objectiveKey,
          ...(typeof input.staleAfterMs === "number" ? { stale_after_ms: input.staleAfterMs } : {}),
        });

        if (!result.ok) {
          return errorResult<AutopilotStatusPayload | null>(
            `bb autopilot status failed: ${result.error ?? "unknown error"}`,
            null,
            result.error ?? "bb autopilot status failed",
            result.rawText,
          );
        }

        const payload = readAutopilotStatusPayload(result.parsed);
        return okResult<AutopilotStatusPayload | null>(
          payload ? "bb autopilot status loaded" : "bb autopilot status returned no structured payload",
          payload,
          result.rawText,
        );
      },
      async history(input) {
        const [canary, strategy] = await Promise.all([
          memoryClient.readResource("memory://autopilot/canary/reports/recent"),
          memoryClient.readResource("memory://autopilot/strategy-feedback/reports/recent"),
        ]);

        if (!canary.ok) {
          return errorResult<AutopilotHistoryPayload | null>(
            `bb autopilot history failed: ${canary.error ?? "unknown error"}`,
            null,
            canary.error ?? "bb autopilot history failed",
            canary.rawText,
          );
        }
        if (!strategy.ok) {
          return errorResult<AutopilotHistoryPayload | null>(
            `bb autopilot history failed: ${strategy.error ?? "unknown error"}`,
            null,
            strategy.error ?? "bb autopilot history failed",
            strategy.rawText,
          );
        }

        const payload = readAutopilotHistoryPayload(input.objectiveKey, canary.parsed, strategy.parsed, input.limit ?? 6);
        return okResult<AutopilotHistoryPayload | null>(
          `bb autopilot history: ${payload.entries.length} entr${payload.entries.length === 1 ? "y" : "ies"}`,
          payload,
          [canary.rawText, strategy.rawText].filter(Boolean).join("\n"),
        );
      },
      async authority(input) {
        const uri = input.authorityId
          ? `memory://autopilot/decision-authority/${encodeURIComponent(input.authorityId)}`
          : `memory://autopilot/decision-authority/current/${encodeURIComponent(input.objectiveKey)}`;
        const result = await memoryClient.readResource(uri);

        if (!result.ok) {
          return errorResult<AutopilotDecisionAuthorityPayload | null>(
            `bb autopilot decision authority failed: ${result.error ?? "unknown error"}`,
            null,
            result.error ?? "bb autopilot decision authority failed",
            result.rawText,
          );
        }

        const payload = readAutopilotDecisionAuthorityPayload(result.parsed);
        return okResult<AutopilotDecisionAuthorityPayload | null>(
          payload ? "bb autopilot decision authority loaded" : "bb autopilot decision authority returned no structured payload",
          payload,
          result.rawText,
        );
      },
      async decisionAuthority(input) {
        const result = await memoryClient.callTool("memory_autopilot_decision_authority", {
          objective_key: input.objectiveKey,
          ...(typeof input.persist === "boolean" ? { persist: input.persist } : {}),
        });

        if (!result.ok) {
          return errorResult<AutopilotDecisionAuthorityToolPayload | null>(
            `bb autopilot decision authority tool failed: ${result.error ?? "unknown error"}`,
            null,
            result.error ?? "bb autopilot decision authority tool failed",
            result.rawText,
          );
        }

        const payload = readAutopilotDecisionAuthorityToolPayload(result.parsed);
        return okResult<AutopilotDecisionAuthorityToolPayload | null>(
          payload ? "bb autopilot decision authority materialized" : "bb autopilot decision authority tool returned no structured payload",
          payload,
          result.rawText,
        );
      },
      async decisionIntent(input) {
        const result = await memoryClient.callTool("memory_autopilot_decision_intent", {
          objective_key: input.objectiveKey,
          intent_state: input.intentState,
          ...(input.authorityId ? { authority_id: input.authorityId } : {}),
          ...(input.note ? { note: input.note } : {}),
          ...(input.sourceRefs ? { source_refs: input.sourceRefs } : {}),
          ...(typeof input.persist === "boolean" ? { persist: input.persist } : {}),
        });

        if (!result.ok) {
          return errorResult<AutopilotDecisionIntentPayload | null>(
            `bb autopilot decision intent failed: ${result.error ?? "unknown error"}`,
            null,
            result.error ?? "bb autopilot decision intent failed",
            result.rawText,
          );
        }

        const payload = readAutopilotDecisionIntentPayload(result.parsed);
        return okResult<AutopilotDecisionIntentPayload | null>(
          payload ? "bb autopilot decision intent loaded" : "bb autopilot decision intent returned no structured payload",
          payload,
          result.rawText,
        );
      },
      async decisionReconcilePlan(input) {
        const result = await memoryClient.callTool("memory_autopilot_decision_reconcile_plan", {
          objective_key: input.objectiveKey,
          ...(input.authorityId ? { authority_id: input.authorityId } : {}),
        });

        if (!result.ok) {
          return errorResult<AutopilotDecisionReconcilePlanPayload | null>(
            `bb autopilot decision reconcile plan failed: ${result.error ?? "unknown error"}`,
            null,
            result.error ?? "bb autopilot decision reconcile plan failed",
            result.rawText,
          );
        }

        const payload = readAutopilotDecisionReconcilePlanPayload(result.parsed);
        return okResult<AutopilotDecisionReconcilePlanPayload | null>(
          payload ? "bb autopilot decision reconcile plan loaded" : "bb autopilot decision reconcile plan returned no structured payload",
          payload,
          result.rawText,
        );
      },
      async learnedArtifactSummary(input) {
        const result = await memoryClient.readResource(
          `memory://autopilot/learned-advisory/current/${encodeURIComponent(input.objectiveKey)}/artifact_summary`,
        );

        if (!result.ok) {
          return errorResult<AutopilotLearnedArtifactSummaryPayload | null>(
            `bb autopilot learned artifact summary failed: ${result.error ?? "unknown error"}`,
            null,
            result.error ?? "bb autopilot learned artifact summary failed",
            result.rawText,
          );
        }

        const payload = readAutopilotLearnedArtifactSummaryPayload(result.parsed);
        return okResult<AutopilotLearnedArtifactSummaryPayload | null>(
          payload
            ? "bb autopilot learned artifact summary loaded"
            : "bb autopilot learned artifact summary returned no structured payload",
          payload,
          result.rawText,
        );
      },
    },
  };
}
