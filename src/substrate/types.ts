import type { AutopilotPhase, AutopilotReport } from "../shared/types.js";

export const AUTOPILOT_SUBSTRATE_MODES = ["local", "bb"] as const;
export type AutopilotSubstrateMode = (typeof AUTOPILOT_SUBSTRATE_MODES)[number];

export const DEFAULT_BB_MEMORY_URL = "http://127.0.0.1:3100/mcp";
export const DEFAULT_BB_GOVERN_URL = "http://127.0.0.1:3101/mcp";
export const DEFAULT_BB_TOOLS_URL = "http://127.0.0.1:3102/mcp";
export const DEFAULT_BB_TIMEOUT_MS = 5_000;

export type MemoryClass =
  | "user_memory"
  | "tool_episodic"
  | "tool_semantic"
  | "procedural"
  | "governance"
  | "environment";

export type GovernDecision = "allow" | "deny" | "require_approval" | "unknown";
export type GraphRecallMode = "off" | "assist" | "deep";

export interface SubstrateResult<TData> {
  ok: boolean;
  summary: string;
  data: TData;
  rawText: string;
  error?: string;
}

export interface MemoryRecallInput {
  query: string;
  limit: number;
  toolName?: string;
  memoryClass?: MemoryClass[];
  sessionId?: string;
  contextHash?: string;
  graphMode?: GraphRecallMode;
}

export interface MemoryRecallPayload {
  items: unknown[];
  count: number;
}

export interface MemoryStoreInput {
  content: string;
  toolName: string;
  memoryClass: MemoryClass;
  effectSummary?: string;
  sessionId?: string;
  taskId?: string;
  metadata?: Record<string, string>;
}

export interface MemoryStorePayload {
  stored: boolean;
  response: unknown | null;
}

export interface GovernEvaluateInput {
  toolName: string;
  args: Record<string, unknown>;
  cwd?: string;
}

export interface GovernEvaluatePayload {
  decision: GovernDecision;
  ruleId?: string;
  reason?: string;
}

export interface GovernPolicyPayload {
  policy: Record<string, unknown> | null;
}

export interface WorkspaceScanEntry {
  path: string;
  name: string;
  branch: string;
  dirty_files: number;
  status_summary: string;
  remote: string;
  recent_commits: string[];
}

export interface PlanSyncEntry {
  file: string;
  title: string;
  checklist_items: number;
  done: number;
  in_progress: number;
  pending: number;
}

export interface WorkspaceScanInput {
  workspaces: string[];
}

export interface PlanSyncInput {
  docsPath: string;
}

export interface MemoryPort {
  recall(input: MemoryRecallInput): Promise<SubstrateResult<MemoryRecallPayload>>;
  store(input: MemoryStoreInput): Promise<SubstrateResult<MemoryStorePayload>>;
}

export interface GovernPort {
  policy(): Promise<SubstrateResult<GovernPolicyPayload>>;
  evaluate(input: GovernEvaluateInput): Promise<SubstrateResult<GovernEvaluatePayload>>;
}

export interface WorkspacePort {
  scan(input: WorkspaceScanInput): Promise<SubstrateResult<WorkspaceScanEntry[]>>;
  planSync(input: PlanSyncInput): Promise<SubstrateResult<PlanSyncEntry[]>>;
}

export interface AutopilotSubstrateConfig {
  mode: AutopilotSubstrateMode;
  cwd: string;
  planDocsPath: string;
  bb: {
    memoryUrl: string;
    governUrl: string;
    toolsUrl: string;
    timeoutMs: number;
  };
}

export interface AutopilotSubstrate {
  readonly mode: AutopilotSubstrateMode;
  readonly config: AutopilotSubstrateConfig;
  readonly memory: MemoryPort;
  readonly govern: GovernPort;
  readonly workspace: WorkspacePort;
}

export interface ResolveAutopilotSubstrateConfigInput {
  cwd: string;
  mode?: string;
  planDocsPath?: string;
  bbMemoryUrl?: string;
  bbGovernUrl?: string;
  bbToolsUrl?: string;
  bbTimeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export interface CreateAutopilotSubstrateDependencies {
  fetchImpl?: typeof fetch;
}

export interface PhaseHydrationSnapshot {
  workspaceSummary: string[];
  planSummary: string[];
  recallSummary: string[];
  governPolicySummary: string[];
  warnings: string[];
}

export interface RunWorkspaceSnapshot {
  workspace: WorkspaceScanEntry[];
  plans: PlanSyncEntry[];
  warnings: string[];
}

export interface PreparePhaseHydrationInput {
  substrate: AutopilotSubstrate;
  phase: AutopilotPhase;
  goal: string;
  currentWave: number;
  currentCycle: number;
  recentReports: AutopilotReport[];
  sessionId?: string;
  runWorkspace: RunWorkspaceSnapshot;
}

export interface BuildPhaseEvidenceInput {
  goal: string;
  cwd: string;
  report: AutopilotReport;
  wave: number;
  cycle: number;
}
