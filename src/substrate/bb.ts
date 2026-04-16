import { createMcpHttpClient } from "./http-mcp-client.js";
import { normalizeGovernDecision } from "./governance.js";
import type {
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
  };
}
