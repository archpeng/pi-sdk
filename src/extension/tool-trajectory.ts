import { createHash } from "node:crypto";
import type { AutopilotRuntimeState } from "../autopilot/state.js";
import type { AutopilotSubstrate, MemoryStoreInput } from "../substrate/types.js";

export const TOOL_USE_TRAJECTORY_CLAIM_KIND = "tool_use_trajectory_v1";
const PRODUCER_KIND = "pi";
const SIDE_EFFECT_TOOLS = new Set(["autopilot_report", "bash", "edit", "memory_store", "write"]);
const VALIDATION_TOOLS = new Set(["bash", "govern_evaluate", "memory_recall", "plan_sync", "workspace_scan"]);

type FinalStatus = "success" | "failed" | "partial";

type ToolEvent = {
  toolName: string;
  toolCallId?: string | undefined;
  isError?: boolean | undefined;
};

type SessionManagerLike = {
  getSessionFile?: () => string | undefined;
  getSessionId?: () => string;
};

type ExtensionContextLike = {
  cwd: string;
  sessionManager?: SessionManagerLike | undefined;
};

type ToolUseTrajectory = {
  claim_kind: typeof TOOL_USE_TRAJECTORY_CLAIM_KIND;
  producer_kind: typeof PRODUCER_KIND;
  producer_session_id: string;
  producer_run_id: string;
  session_id: string;
  evidence_refs: string[];
  cwd: string;
  task_family: string;
  task_kind: string;
  goal_summary: string;
  environment_preconditions: string[];
  tool_sequence: string[];
  tool_success_names: string[];
  tool_failure_names: string[];
  side_effect_tool_names: string[];
  failure_modes: string[];
  repair_actions: string[];
  validation_checks: string[];
  governance_decisions: string[];
  final_status: FinalStatus;
  mutated: boolean;
  duration_ms: number;
};

type TurnState = {
  startedAtMs: number;
  toolSequence: string[];
  successes: Set<string>;
  failures: Set<string>;
  sideEffects: Set<string>;
  validationChecks: Set<string>;
  governanceDecisions: string[];
};

export interface ToolTrajectoryRecorder {
  startTurn(): void;
  recordToolCall(event: ToolEvent): void;
  recordToolResult(event: ToolEvent): void;
  recordGovernanceDecision(toolName: string, decision: string): void;
  flush(ctx: ExtensionContextLike): Promise<MemoryStoreInput | null>;
}

export function createToolTrajectoryRecorder(input: {
  getRuntime: () => AutopilotRuntimeState | null;
  getSubstrate: () => AutopilotSubstrate | undefined;
  now?: () => number;
}): ToolTrajectoryRecorder {
  const now = input.now ?? Date.now;
  let turn: TurnState | null = null;
  let lastStoredRunId = "";

  function ensureTurn(): TurnState {
    if (!turn) {
      turn = {
        startedAtMs: now(),
        toolSequence: [],
        successes: new Set(),
        failures: new Set(),
        sideEffects: new Set(),
        validationChecks: new Set(),
        governanceDecisions: [],
      };
    }
    return turn;
  }

  return {
    startTurn() {
      turn = {
        startedAtMs: now(),
        toolSequence: [],
        successes: new Set(),
        failures: new Set(),
        sideEffects: new Set(),
        validationChecks: new Set(),
        governanceDecisions: [],
      };
    },
    recordToolCall(event) {
      const state = ensureTurn();
      state.toolSequence.push(event.toolName);
      if (SIDE_EFFECT_TOOLS.has(event.toolName)) state.sideEffects.add(event.toolName);
    },
    recordToolResult(event) {
      const state = ensureTurn();
      if (event.isError) {
        state.failures.add(event.toolName);
        return;
      }
      state.successes.add(event.toolName);
      if (VALIDATION_TOOLS.has(event.toolName)) state.validationChecks.add(`tool:${event.toolName}`);
    },
    recordGovernanceDecision(toolName, decision) {
      const state = ensureTurn();
      state.governanceDecisions.push(`${toolName}:${decision}`);
    },
    async flush(ctx) {
      const state = turn;
      turn = null;
      const substrate = input.getSubstrate();
      if (!state || state.toolSequence.length === 0 || !substrate || substrate.mode !== "bb") return null;

      const trajectory = buildTrajectory({
        state,
        ctx,
        runtime: input.getRuntime(),
        endedAtMs: now(),
      });
      if (trajectory.producer_run_id === lastStoredRunId) return null;
      lastStoredRunId = trajectory.producer_run_id;

      const storeInput = buildMemoryStoreInput(trajectory);
      const result = await substrate.memory.store(storeInput);
      return result.ok ? storeInput : null;
    },
  };
}

function buildTrajectory(input: {
  state: TurnState;
  ctx: ExtensionContextLike;
  runtime: AutopilotRuntimeState | null;
  endedAtMs: number;
}): ToolUseTrajectory {
  const sessionId = resolveProducerSessionId(input.ctx);
  const taskFamily = input.runtime?.activeSlice?.stepId ?? input.runtime?.objectiveKey ?? "pi_tool_turn";
  const taskKind = input.runtime?.phase ?? "tool_turn";
  const goalSummary = input.runtime?.activeSlice?.objectives[0] ?? input.runtime?.goal ?? `Pi tool-use turn in ${input.ctx.cwd}`;
  const runId = buildRunId(sessionId, input.state.startedAtMs, input.state.toolSequence);
  const failures = [...input.state.failures].sort();
  const successes = [...input.state.successes].sort();

  return {
    claim_kind: TOOL_USE_TRAJECTORY_CLAIM_KIND,
    producer_kind: PRODUCER_KIND,
    producer_session_id: sessionId,
    producer_run_id: runId,
    session_id: sessionId,
    evidence_refs: [`${sessionId}#${runId}`],
    cwd: input.ctx.cwd,
    task_family: taskFamily,
    task_kind: taskKind,
    goal_summary: compact(goalSummary),
    environment_preconditions: ["producer=pi-extension", "memory_store=mcp"],
    tool_sequence: [...input.state.toolSequence],
    tool_success_names: successes,
    tool_failure_names: failures,
    side_effect_tool_names: [...input.state.sideEffects].sort(),
    failure_modes: failures.map((toolName) => `${toolName}:tool_error`),
    repair_actions: failures.filter((toolName) => input.state.successes.has(toolName)).map((toolName) => `${toolName}:retry_succeeded`),
    validation_checks: [...input.state.validationChecks].sort(),
    governance_decisions: [...input.state.governanceDecisions],
    final_status: deriveFinalStatus(input.state),
    mutated: input.state.sideEffects.size > 0,
    duration_ms: Math.max(0, input.endedAtMs - input.state.startedAtMs),
  };
}

function buildMemoryStoreInput(trajectory: ToolUseTrajectory): MemoryStoreInput {
  return {
    content: JSON.stringify(trajectory),
    toolName: `${trajectory.producer_kind}.tool_trajectory`,
    memoryClass: "tool_episodic",
    effectSummary: `${trajectory.task_kind}/${trajectory.final_status}: ${trajectory.goal_summary}`,
    sessionId: trajectory.producer_session_id,
    taskId: trajectory.task_family,
    metadata: {
      claim_kind: trajectory.claim_kind,
      producer_kind: trajectory.producer_kind,
      producer_session_id: trajectory.producer_session_id,
      producer_run_id: trajectory.producer_run_id,
      task_family: trajectory.task_family,
      task_kind: trajectory.task_kind,
      final_status: trajectory.final_status,
      evidence_refs: trajectory.evidence_refs.join("|"),
    },
  };
}

function resolveProducerSessionId(ctx: ExtensionContextLike): string {
  return ctx.sessionManager?.getSessionFile?.() ?? ctx.sessionManager?.getSessionId?.() ?? `${ctx.cwd}:ephemeral`;
}

function buildRunId(sessionId: string, startedAtMs: number, toolSequence: string[]): string {
  return createHash("sha1").update(`${sessionId}\0${startedAtMs}\0${toolSequence.join("|")}`).digest("hex").slice(0, 16);
}

function deriveFinalStatus(state: TurnState): FinalStatus {
  if (state.failures.size === 0) return "success";
  return state.successes.size > 0 ? "partial" : "failed";
}

function compact(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}
