import {
  type AutopilotActiveSlice,
  isAutopilotArtifactSummaryProjection,
  isAutopilotBenchmarkProjection,
  isAutopilotDecisionProjection,
  isAutopilotHistoryProjection,
  isAutopilotPhase,
  isAutopilotReport,
  type AutopilotArtifactSummaryProjection,
  type AutopilotBenchmarkProjection,
  type AutopilotDecisionProjection,
  type AutopilotHistoryProjection,
  type AutopilotPhase,
  type AutopilotReport,
} from "./protocol.js";

export const AUTOPILOT_RUNTIME_ENTRY_TYPE = "autopilot-runtime-state";
export const AUTOPILOT_RUNTIME_MODES = ["idle", "running", "paused", "stopping", "closed"] as const;
export const AUTOPILOT_DISPATCH_STATES = ["idle", "ready", "awaiting_report", "closed"] as const;
export const AUTOPILOT_REPLAN_REASONS = ["same_wave", "roadmap", "cycle_exhausted"] as const;

export type AutopilotRuntimeMode = (typeof AUTOPILOT_RUNTIME_MODES)[number];
export type AutopilotDispatchState = (typeof AUTOPILOT_DISPATCH_STATES)[number];
export type AutopilotReplanReason = (typeof AUTOPILOT_REPLAN_REASONS)[number];

export interface AutopilotRuntimeState {
  goal: string;
  mode: AutopilotRuntimeMode;
  phase: AutopilotPhase;
  currentWave: number;
  currentCycle: number;
  maxWaves: number;
  maxExecutionCyclesPerWave: number;
  dispatchState: AutopilotDispatchState;
  warnings: string[];
  activeSlice?: AutopilotActiveSlice | undefined;
  substrateMode?: "local" | "bb" | undefined;
  objectiveKey?: string | undefined;
  benchmarkProjection?: AutopilotBenchmarkProjection | undefined;
  decisionProjection?: AutopilotDecisionProjection | undefined;
  historyProjection?: AutopilotHistoryProjection | undefined;
  artifactSummaryProjection?: AutopilotArtifactSummaryProjection | undefined;
  autopilotOwnedPaths?: string[] | undefined;
  updatedAtMs: number;
  lastReportTimestampMs?: number | undefined;
  lastReportSummary?: string | undefined;
  replanReason?: AutopilotReplanReason | undefined;
}

export interface InteractiveAutopilotSnapshot {
  reports: AutopilotReport[];
  runtime: AutopilotRuntimeState | null;
}

type MessageEntryLike = {
  type: "message";
  message: {
    role?: string;
    toolName?: string;
    details?: unknown;
  };
};

type CustomEntryLike = {
  type: "custom";
  customType?: string;
  data?: unknown;
};

export type InteractiveSessionEntryLike = MessageEntryLike | CustomEntryLike | { type: string; [key: string]: unknown };

function isRuntimeMode(value: unknown): value is AutopilotRuntimeMode {
  return typeof value === "string" && (AUTOPILOT_RUNTIME_MODES as readonly string[]).includes(value);
}

function isDispatchState(value: unknown): value is AutopilotDispatchState {
  return typeof value === "string" && (AUTOPILOT_DISPATCH_STATES as readonly string[]).includes(value);
}

function isReplanReason(value: unknown): value is AutopilotReplanReason {
  return typeof value === "string" && (AUTOPILOT_REPLAN_REASONS as readonly string[]).includes(value);
}

export function isAutopilotRuntimeState(value: unknown): value is AutopilotRuntimeState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AutopilotRuntimeState>;
  return (
    typeof candidate.goal === "string" &&
    isRuntimeMode(candidate.mode) &&
    isAutopilotPhase(candidate.phase) &&
    typeof candidate.currentWave === "number" &&
    typeof candidate.currentCycle === "number" &&
    typeof candidate.maxWaves === "number" &&
    typeof candidate.maxExecutionCyclesPerWave === "number" &&
    isDispatchState(candidate.dispatchState) &&
    Array.isArray(candidate.warnings) &&
    (candidate.activeSlice === undefined ||
      (typeof candidate.activeSlice.stepId === "string" &&
        typeof candidate.activeSlice.owner === "string" &&
        typeof candidate.activeSlice.state === "string" &&
        Array.isArray(candidate.activeSlice.objectives) &&
        Array.isArray(candidate.activeSlice.requiredDeliverables) &&
        (candidate.activeSlice.doneWhen === undefined || Array.isArray(candidate.activeSlice.doneWhen)) &&
        (candidate.activeSlice.stopBoundary === undefined || Array.isArray(candidate.activeSlice.stopBoundary)) &&
        Array.isArray(candidate.activeSlice.avoid))) &&
    (candidate.substrateMode === undefined || candidate.substrateMode === "local" || candidate.substrateMode === "bb") &&
    (candidate.objectiveKey === undefined || typeof candidate.objectiveKey === "string") &&
    (candidate.benchmarkProjection === undefined || isAutopilotBenchmarkProjection(candidate.benchmarkProjection)) &&
    (candidate.decisionProjection === undefined || isAutopilotDecisionProjection(candidate.decisionProjection)) &&
    (candidate.historyProjection === undefined || isAutopilotHistoryProjection(candidate.historyProjection)) &&
    (candidate.artifactSummaryProjection === undefined || isAutopilotArtifactSummaryProjection(candidate.artifactSummaryProjection)) &&
    (candidate.autopilotOwnedPaths === undefined ||
      (Array.isArray(candidate.autopilotOwnedPaths) &&
        candidate.autopilotOwnedPaths.every((ownedPath) => typeof ownedPath === "string"))) &&
    typeof candidate.updatedAtMs === "number" &&
    (candidate.replanReason === undefined || isReplanReason(candidate.replanReason))
  );
}

export function beginInteractiveRuntime(input: {
  goal: string;
  maxWaves: number;
  maxExecutionCyclesPerWave: number;
  objectiveKey?: string | undefined;
}): AutopilotRuntimeState {
  return {
    goal: input.goal,
    mode: "running",
    phase: "master_plan",
    currentWave: 1,
    currentCycle: 1,
    maxWaves: input.maxWaves,
    maxExecutionCyclesPerWave: input.maxExecutionCyclesPerWave,
    dispatchState: "ready",
    warnings: [],
    autopilotOwnedPaths: [],
    ...(input.objectiveKey ? { objectiveKey: input.objectiveKey } : {}),
    updatedAtMs: Date.now(),
  };
}

function normalizeOwnedPath(pathname: string): string {
  return pathname.trim().replace(/^\.\//, "").replace(/\\/g, "/");
}

export function registerAutopilotOwnedPaths(
  runtime: AutopilotRuntimeState,
  paths: string[],
): AutopilotRuntimeState {
  const nextOwnedPaths = new Set(
    (runtime.autopilotOwnedPaths ?? [])
      .map(normalizeOwnedPath)
      .filter((pathname) => pathname.length > 0),
  );

  for (const pathname of paths.map(normalizeOwnedPath)) {
    if (!pathname) continue;
    nextOwnedPaths.add(pathname);
  }

  return {
    ...runtime,
    autopilotOwnedPaths: [...nextOwnedPaths].sort(),
    updatedAtMs: Date.now(),
  };
}

function transition(
  runtime: AutopilotRuntimeState,
  phase: AutopilotPhase,
  currentWave: number,
  currentCycle: number,
  replanReason?: AutopilotReplanReason,
): AutopilotRuntimeState {
  const next: AutopilotRuntimeState = {
    ...runtime,
    phase,
    currentWave,
    currentCycle,
    dispatchState: phase === "closeout" && runtime.mode === "closed" ? "closed" : "ready",
    updatedAtMs: Date.now(),
  };

  if (replanReason) {
    next.replanReason = replanReason;
  } else {
    delete next.replanReason;
  }

  return next;
}

function closeRuntime(runtime: AutopilotRuntimeState, report: AutopilotReport): AutopilotRuntimeState {
  return {
    ...runtime,
    phase: report.phase,
    mode: "closed",
    dispatchState: "closed",
    updatedAtMs: report.timestampMs,
    lastReportTimestampMs: report.timestampMs,
    lastReportSummary: report.summary,
  };
}

export function haltInteractiveRuntime(runtime: AutopilotRuntimeState, reason: string): AutopilotRuntimeState {
  const warning = reason.trim();
  return {
    ...runtime,
    mode: "closed",
    dispatchState: "closed",
    warnings: warning ? [...runtime.warnings, warning] : runtime.warnings,
    updatedAtMs: Date.now(),
    lastReportSummary: warning || runtime.lastReportSummary,
  };
}

export function advanceInteractiveRuntime(runtime: AutopilotRuntimeState, report: AutopilotReport): AutopilotRuntimeState {
  const nextBase: AutopilotRuntimeState = {
    ...runtime,
    updatedAtMs: report.timestampMs,
    lastReportTimestampMs: report.timestampMs,
    lastReportSummary: report.summary,
  };

  if (report.phase === "closeout") {
    return closeRuntime(nextBase, report);
  }

  if (report.status === "blocked" || report.status === "failed") {
    return closeRuntime(nextBase, report);
  }

  if (report.status === "done") {
    return transition(nextBase, "closeout", runtime.currentWave, runtime.currentCycle);
  }

  switch (report.phase) {
    case "master_plan":
      return transition(nextBase, "wave_plan", 1, 1);
    case "wave_plan":
      return transition(nextBase, "execute", runtime.currentWave, runtime.currentCycle);
    case "execute":
      return transition(nextBase, "review", runtime.currentWave, runtime.currentCycle);
    case "review":
      switch (report.status) {
        case "continue":
          if (runtime.currentCycle >= runtime.maxExecutionCyclesPerWave) {
            return transition(nextBase, "replan", runtime.currentWave, runtime.currentCycle, "cycle_exhausted");
          }
          return transition(nextBase, "execute", runtime.currentWave, runtime.currentCycle + 1);
        case "needs_replan":
          return transition(nextBase, "replan", runtime.currentWave, runtime.currentCycle, "same_wave");
        case "completed":
          if (runtime.currentWave >= runtime.maxWaves) {
            return transition(nextBase, "closeout", runtime.currentWave, runtime.currentCycle);
          }
          return transition(nextBase, "replan", runtime.currentWave + 1, 1, "roadmap");
        default:
          return transition(nextBase, "closeout", runtime.currentWave, runtime.currentCycle);
      }
    case "replan":
      switch (runtime.replanReason) {
        case "roadmap":
          return transition(nextBase, "wave_plan", runtime.currentWave, 1);
        case "cycle_exhausted":
          if (runtime.currentWave >= runtime.maxWaves) {
            return transition(nextBase, "closeout", runtime.currentWave, runtime.currentCycle);
          }
          return transition(nextBase, "wave_plan", runtime.currentWave + 1, 1);
        case "same_wave":
        default:
          if (runtime.currentCycle >= runtime.maxExecutionCyclesPerWave) {
            if (runtime.currentWave >= runtime.maxWaves) {
              return transition(nextBase, "closeout", runtime.currentWave, runtime.currentCycle);
            }
            return transition(nextBase, "wave_plan", runtime.currentWave + 1, 1);
          }
          return transition(nextBase, "execute", runtime.currentWave, runtime.currentCycle + 1);
      }
  }
}

export function restoreInteractiveRuntime(entries: InteractiveSessionEntryLike[]): InteractiveAutopilotSnapshot {
  const reports: AutopilotReport[] = [];
  let runtime: AutopilotRuntimeState | null = null;

  for (const entry of entries) {
    if (entry.type === "message") {
      const message = (entry as MessageEntryLike).message;
      if (message.role === "toolResult" && message.toolName === "autopilot_report") {
        const details = message.details as { report?: unknown } | undefined;
        if (details && isAutopilotReport(details.report)) {
          reports.push(details.report);
        }
      }
    }

    if (entry.type === "custom" && (entry as CustomEntryLike).customType === AUTOPILOT_RUNTIME_ENTRY_TYPE) {
      const data = (entry as CustomEntryLike).data;
      if (isAutopilotRuntimeState(data)) {
        runtime = data;
      }
    }
  }

  return { reports, runtime };
}
