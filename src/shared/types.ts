export const AUTOPILOT_REPORT_TOOL_NAME = "autopilot_report";
export const AUTOPILOT_STATUS_COMMAND = "autopilot-status";
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

export interface AutopilotReport {
  phase: AutopilotPhase;
  status: AutopilotStatus;
  summary: string;
  waveId?: string | undefined;
  stepId?: string | undefined;
  nextAction?: string | undefined;
  evidence: string[];
  artifacts: string[];
  risks: string[];
  timestampMs: number;
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
  substrateContext?: string[] | undefined;
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
    Array.isArray(candidate.evidence) &&
    Array.isArray(candidate.artifacts) &&
    Array.isArray(candidate.risks) &&
    typeof candidate.timestampMs === "number"
  );
}

export function isAutopilotToolDetails(value: unknown): value is AutopilotToolDetails {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AutopilotToolDetails>;
  return isAutopilotReport(candidate.report) && typeof candidate.historySize === "number";
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
