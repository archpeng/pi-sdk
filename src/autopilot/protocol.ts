import { createHash } from "node:crypto";

export const AUTOPILOT_REPORT_TOOL_NAME = "autopilot_report";
export const AUTOPILOT_RUN_COMMAND = "autopilot-run";
export const AUTOPILOT_RESUME_COMMAND = "autopilot-resume";
export const AUTOPILOT_PAUSE_COMMAND = "autopilot-pause";
export const AUTOPILOT_STOP_COMMAND = "autopilot-stop";
export const AUTOPILOT_STATUS_COMMAND = "autopilot-status";
export const AUTOPILOT_INTERACTIVE_COMMANDS = [
  AUTOPILOT_RUN_COMMAND,
  AUTOPILOT_RESUME_COMMAND,
  AUTOPILOT_PAUSE_COMMAND,
  AUTOPILOT_STOP_COMMAND,
  AUTOPILOT_STATUS_COMMAND,
] as const;
export const AUTOPILOT_PROTOCOL_HEADER = "[AUTOPILOT RUN]";

export const AUTOPILOT_PHASES = [
  "master_plan",
  "wave_plan",
  "execute",
  "review",
  "replan",
  "closeout",
] as const;

export const AUTOPILOT_STATUSES = [
  "continue",
  "completed",
  "needs_replan",
  "blocked",
  "failed",
  "done",
] as const;

export const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"] as const;

export const DEFAULT_AUTOPILOT_MAX_WAVES = 5;
export const DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE = 3;
export const DEFAULT_AUTOPILOT_THINKING_LEVEL: SupportedThinkingLevel = "high";

export type AutopilotPhase = (typeof AUTOPILOT_PHASES)[number];
export type AutopilotStatus = (typeof AUTOPILOT_STATUSES)[number];
export type SupportedThinkingLevel = (typeof THINKING_LEVELS)[number];
export type AutopilotDecisionMode = "standard" | "goal_directed";

export interface AutopilotReport {
  phase: AutopilotPhase;
  status: AutopilotStatus;
  summary: string;
  waveId?: string | undefined;
  stepId?: string | undefined;
  nextAction?: string | undefined;
  decisionMode?: AutopilotDecisionMode | undefined;
  decisionBasis?: string[] | undefined;
  candidateRoutes?: string[] | undefined;
  evidence: string[];
  artifacts: string[];
  risks: string[];
  timestampMs: number;
}

export interface AutopilotBenchmarkProjection {
  objectiveKey: string;
  source: "bb_autopilot_status";
  summaryLine: string;
  detailLines: string[];
  publishedAtMs?: number | undefined;
}

export interface AutopilotDecisionProjection {
  objectiveKey: string;
  authorityId: string;
  source: "bb_autopilot_decision_authority";
  summaryLine: string;
  detailLines: string[];
  decidedAtMs?: number | undefined;
  finalOutcome?: string | undefined;
  intentState: string;
  reconcileState: string;
}

export type AutopilotHistoryReportKind = "status" | "canary" | "strategy_feedback";

export interface AutopilotHistoryProjection {
  objectiveKey: string;
  source: "bb_autopilot_report_resources";
  summaryLine: string;
  detailLines: string[];
}

export interface AutopilotArtifactSummaryProjection {
  objectiveKey: string;
  reportId: string;
  source: "bb_autopilot_learned_advisory";
  payloadKind: "artifact_summary";
  stage: "shadow_only" | "advisory_only";
  candidateOnly: true;
  confidence: number;
  noRegressionGuard: boolean;
  governanceNoRegressionGuard: boolean;
  summaryLine: string;
  detailLines: string[];
  closeoutLines: string[];
  operatorLines: string[];
  historyLines: string[];
  publishedAtMs?: number | undefined;
}

export interface AutopilotToolDetails {
  report: AutopilotReport;
  historySize: number;
}

export interface AutopilotPromptContext {
  goal: string;
  currentWave: number;
  maxWaves: number;
  currentCycle: number;
  maxExecutionCyclesPerWave: number;
  recentReports: AutopilotReport[];
  activeSlice?: AutopilotActiveSlice | undefined;
  substrateContext?: string[] | undefined;
}

export interface AutopilotActiveSlice {
  stepId: string;
  owner: string;
  state: string;
  objectives: string[];
  requiredDeliverables: string[];
  avoid: string[];
}

export interface AutopilotRunOptions {
  goal: string;
  cwd: string;
  maxWaves: number;
  maxExecutionCyclesPerWave: number;
  thinkingLevel: SupportedThinkingLevel;
  model?: string | undefined;
  ephemeral?: boolean | undefined;
  agentDir?: string | undefined;
  stream?: boolean | undefined;
  substrateMode?: string | undefined;
  planDocsPath?: string | undefined;
  bbMemoryUrl?: string | undefined;
  bbGovernUrl?: string | undefined;
  bbToolsUrl?: string | undefined;
}

export interface AutopilotRunSummary {
  done: boolean;
  reports: AutopilotReport[];
  sessionFile?: string | undefined;
  wavesAttempted: number;
  warnings: string[];
  objectiveKey?: string | undefined;
  benchmarkProjection?: AutopilotBenchmarkProjection | undefined;
  decisionProjection?: AutopilotDecisionProjection | undefined;
  historyProjection?: AutopilotHistoryProjection | undefined;
  artifactSummaryProjection?: AutopilotArtifactSummaryProjection | undefined;
}

export interface AutopilotPhaseRequest {
  phase: AutopilotPhase;
  currentWave: number;
  currentCycle: number;
}

export interface AutopilotWorkflowSummary {
  done: boolean;
  reports: AutopilotReport[];
  wavesAttempted: number;
}

const PHASE_SET = new Set<string>(AUTOPILOT_PHASES);
const STATUS_SET = new Set<string>(AUTOPILOT_STATUSES);

export function isAutopilotPhase(value: unknown): value is AutopilotPhase {
  return typeof value === "string" && PHASE_SET.has(value);
}

export function isAutopilotStatus(value: unknown): value is AutopilotStatus {
  return typeof value === "string" && STATUS_SET.has(value);
}

export function isAutopilotReport(value: unknown): value is AutopilotReport {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AutopilotReport>;
  return (
    isAutopilotPhase(candidate.phase) &&
    isAutopilotStatus(candidate.status) &&
    typeof candidate.summary === "string" &&
    (candidate.decisionMode === undefined || candidate.decisionMode === "standard" || candidate.decisionMode === "goal_directed") &&
    (candidate.decisionBasis === undefined || Array.isArray(candidate.decisionBasis)) &&
    (candidate.candidateRoutes === undefined || Array.isArray(candidate.candidateRoutes)) &&
    Array.isArray(candidate.evidence) &&
    Array.isArray(candidate.artifacts) &&
    Array.isArray(candidate.risks) &&
    typeof candidate.timestampMs === "number"
  );
}

export function isAutopilotBenchmarkProjection(value: unknown): value is AutopilotBenchmarkProjection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AutopilotBenchmarkProjection>;
  return (
    typeof candidate.objectiveKey === "string" &&
    candidate.source === "bb_autopilot_status" &&
    typeof candidate.summaryLine === "string" &&
    Array.isArray(candidate.detailLines) &&
    (candidate.publishedAtMs === undefined || typeof candidate.publishedAtMs === "number")
  );
}

export function isAutopilotDecisionProjection(value: unknown): value is AutopilotDecisionProjection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AutopilotDecisionProjection>;
  return (
    typeof candidate.objectiveKey === "string" &&
    typeof candidate.authorityId === "string" &&
    candidate.source === "bb_autopilot_decision_authority" &&
    typeof candidate.summaryLine === "string" &&
    Array.isArray(candidate.detailLines) &&
    (candidate.decidedAtMs === undefined || typeof candidate.decidedAtMs === "number") &&
    (candidate.finalOutcome === undefined || typeof candidate.finalOutcome === "string") &&
    typeof candidate.intentState === "string" &&
    typeof candidate.reconcileState === "string"
  );
}

export function isAutopilotHistoryProjection(value: unknown): value is AutopilotHistoryProjection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AutopilotHistoryProjection>;
  return (
    typeof candidate.objectiveKey === "string" &&
    candidate.source === "bb_autopilot_report_resources" &&
    typeof candidate.summaryLine === "string" &&
    Array.isArray(candidate.detailLines)
  );
}

export function isAutopilotArtifactSummaryProjection(value: unknown): value is AutopilotArtifactSummaryProjection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AutopilotArtifactSummaryProjection>;
  return (
    typeof candidate.objectiveKey === "string" &&
    typeof candidate.reportId === "string" &&
    candidate.source === "bb_autopilot_learned_advisory" &&
    candidate.payloadKind === "artifact_summary" &&
    (candidate.stage === "shadow_only" || candidate.stage === "advisory_only") &&
    candidate.candidateOnly === true &&
    typeof candidate.confidence === "number" &&
    typeof candidate.noRegressionGuard === "boolean" &&
    typeof candidate.governanceNoRegressionGuard === "boolean" &&
    typeof candidate.summaryLine === "string" &&
    Array.isArray(candidate.detailLines) &&
    Array.isArray(candidate.closeoutLines) &&
    Array.isArray(candidate.operatorLines) &&
    Array.isArray(candidate.historyLines) &&
    (candidate.publishedAtMs === undefined || typeof candidate.publishedAtMs === "number")
  );
}

export function isAutopilotToolDetails(value: unknown): value is AutopilotToolDetails {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AutopilotToolDetails>;
  return isAutopilotReport(candidate.report) && typeof candidate.historySize === "number";
}

export function deriveAutopilotObjectiveKey(goal: string, cwd: string): string {
  return `objective:${createHash("sha1").update(`${cwd}\u0000${goal}`).digest("hex").slice(0, 12)}`;
}

export function formatAutopilotReport(report: AutopilotReport): string {
  const lines = [
    `phase: ${report.phase}`,
    `status: ${report.status}`,
    `wave: ${report.waveId ?? "-"}`,
    `step: ${report.stepId ?? "-"}`,
    `summary: ${report.summary}`,
  ];

  if (report.nextAction) lines.push(`nextAction: ${report.nextAction}`);
  if (report.evidence.length > 0) lines.push(`evidence: ${report.evidence.join(" | ")}`);
  if (report.artifacts.length > 0) lines.push(`artifacts: ${report.artifacts.join(" | ")}`);
  if (report.risks.length > 0) lines.push(`risks: ${report.risks.join(" | ")}`);
  return lines.join("\n");
}
