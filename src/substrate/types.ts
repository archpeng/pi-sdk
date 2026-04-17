import type {
  AutopilotArtifactSummaryProjection,
  AutopilotBenchmarkProjection,
  AutopilotDecisionProjection,
  AutopilotHistoryProjection,
  AutopilotHistoryReportKind,
} from "../autopilot/protocol.js";
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

export interface AutopilotStatusHead {
  kind: string;
  scopeKey: string;
  found: boolean;
  freshness: string;
}

export interface AutopilotStatusPayload {
  objectiveKey: string;
  queueLag?: number;
  queueDrainState?: string;
  headFreshness?: string;
  replayHealth?: string;
  canaryVerdict?: string;
  rolloutDecision?: string;
  strategyFeedbackCandidate?: boolean;
  heads: AutopilotStatusHead[];
  summary: string[];
  publishedAtMs?: number;
}

export interface AutopilotStatusInput {
  objectiveKey: string;
  staleAfterMs?: number;
}

export interface AutopilotHistoryEntryPayload {
  reportKind: AutopilotHistoryReportKind;
  reportId: string;
  objectiveKey: string;
  label: string;
  summaryLine: string;
  publishedAtMs: number;
  reportRef?: string;
  lifecycleState?: string;
}

export interface AutopilotHistoryPayload {
  objectiveKey: string;
  entries: AutopilotHistoryEntryPayload[];
}

export interface AutopilotHistoryInput {
  objectiveKey: string;
  limit?: number;
}

export interface AutopilotDecisionEvidenceRefsPayload {
  statusReportId?: string | undefined;
  canaryReportId?: string | undefined;
  strategyFeedbackReportId?: string | undefined;
  sourceRefs: string[];
}

export interface AutopilotDecisionAuthorityPayload {
  authorityId: string;
  authorityRef: string;
  objectiveKey: string;
  lifecycleState: string;
  decisionState: string;
  intentState: string;
  reconcileState: string;
  finalOutcome?: string | undefined;
  reasonCodes: string[];
  evidence: AutopilotDecisionEvidenceRefsPayload;
  decidedAtMs: number;
  scopeFamily: string;
  scopeKey: string;
  requiresManualReconcile: boolean;
  supersedesAuthorityId?: string | undefined;
  supersededByAuthorityId?: string | undefined;
  intentOutcome?: string | undefined;
  intentNote?: string | undefined;
  intentSourceRefs?: string[] | undefined;
}

export interface AutopilotDecisionAuthorityInput {
  objectiveKey: string;
  authorityId?: string;
}

export interface AutopilotDecisionAuthorityToolInput {
  objectiveKey: string;
  persist?: boolean;
}

export interface AutopilotDecisionPayloadTemplate {
  toolName: string;
  memoryClass: string;
  content: string;
  effectSummary: string;
  metadata: Record<string, string>;
}

export interface AutopilotDecisionAuthorityToolPayload {
  authority: AutopilotDecisionAuthorityPayload;
  persisted: boolean;
}

export interface AutopilotDecisionIntentInput {
  objectiveKey: string;
  authorityId?: string;
  intentState: "recorded" | "withdrawn";
  note?: string;
  sourceRefs?: string[];
  persist?: boolean;
}

export interface AutopilotDecisionIntentPayload {
  authority: AutopilotDecisionAuthorityPayload;
  persisted: boolean;
  payloadTemplate?: AutopilotDecisionPayloadTemplate | undefined;
}

export interface AutopilotDecisionReconcilePlanInput {
  objectiveKey: string;
  authorityId?: string;
}

export interface AutopilotDecisionReconcilePlanPayload {
  mode: "dry_run";
  authority: AutopilotDecisionAuthorityPayload;
  scopeStatus: Record<string, unknown> | null;
  payloadTemplate: AutopilotDecisionPayloadTemplate;
}

export interface AutopilotArtifactSummaryPayloadProjection {
  closeoutLines: string[];
  operatorLines: string[];
  historyLines: string[];
}

export interface AutopilotLearnedArtifactSummaryPayload {
  reportId: string;
  reportRef: string;
  objectiveKey: string;
  lifecycleState: string;
  payloadKind: "artifact_summary";
  stage: "shadow_only" | "advisory_only";
  candidateOnly: true;
  confidence: number;
  evidenceSummary: string[];
  noRegressionGuard: boolean;
  governanceNoRegressionGuard: boolean;
  sourceRefs: string[];
  summaryProjection: AutopilotArtifactSummaryPayloadProjection;
  publishedAtMs?: number | undefined;
}

export interface AutopilotLearnedArtifactSummaryInput {
  objectiveKey: string;
}

export interface AutopilotPort {
  status(input: AutopilotStatusInput): Promise<SubstrateResult<AutopilotStatusPayload | null>>;
  history(input: AutopilotHistoryInput): Promise<SubstrateResult<AutopilotHistoryPayload | null>>;
  authority(input: AutopilotDecisionAuthorityInput): Promise<SubstrateResult<AutopilotDecisionAuthorityPayload | null>>;
  decisionAuthority(
    input: AutopilotDecisionAuthorityToolInput,
  ): Promise<SubstrateResult<AutopilotDecisionAuthorityToolPayload | null>>;
  decisionIntent(input: AutopilotDecisionIntentInput): Promise<SubstrateResult<AutopilotDecisionIntentPayload | null>>;
  decisionReconcilePlan(
    input: AutopilotDecisionReconcilePlanInput,
  ): Promise<SubstrateResult<AutopilotDecisionReconcilePlanPayload | null>>;
  learnedArtifactSummary(
    input: AutopilotLearnedArtifactSummaryInput,
  ): Promise<SubstrateResult<AutopilotLearnedArtifactSummaryPayload | null>>;
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
  readonly autopilot: AutopilotPort;
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
  autopilotStatusSummary: string[];
  autopilotDecisionSummary: string[];
  autopilotHistorySummary: string[];
  benchmarkProjection?: AutopilotBenchmarkProjection | undefined;
  decisionProjection?: AutopilotDecisionProjection | undefined;
  historyProjection?: AutopilotHistoryProjection | undefined;
  artifactSummaryProjection?: AutopilotArtifactSummaryProjection | undefined;
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
  objectiveKey?: string;
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
