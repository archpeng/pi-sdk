import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { resolveAutopilotPackageRoot } from "../substrate/manifest.js";

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

export const AUTOPILOT_CLOSEOUT_PROMPT_SURFACE = "autopilot-closeout";

export interface AutopilotSkillPhaseRoute {
  phase: AutopilotPhase;
  surface: "skill";
  dispatchEncoding: "read_skill_file";
  skillName: "plan-creator" | "execute-plan" | "execution-reality-audit";
  skillPath: string;
  packageSkillPath: string;
  fallbackSkillPath: string;
  resolvedFrom: "package" | "agent_dir";
  requiredTools: string[];
  summary: string;
}

export interface AutopilotPromptPhaseRoute {
  phase: AutopilotPhase;
  surface: "prompt";
  dispatchEncoding: "built_in_prompt";
  promptSurface: typeof AUTOPILOT_CLOSEOUT_PROMPT_SURFACE;
  requiredTools: string[];
  summary: string;
}

export type AutopilotPhaseRoute = AutopilotSkillPhaseRoute | AutopilotPromptPhaseRoute;

function buildPackageOwnedSkillPath(
  skillName: AutopilotSkillPhaseRoute["skillName"],
  packageRoot: string,
): string {
  return path.join(packageRoot, "skills", skillName, "SKILL.md");
}

function buildAgentFallbackSkillPath(
  skillName: AutopilotSkillPhaseRoute["skillName"],
  agentDir: string,
): string {
  return path.join(agentDir, "skills", skillName, "SKILL.md");
}

function resolveRoutedSkillSelection(
  skillName: AutopilotSkillPhaseRoute["skillName"],
  packageRoot: string,
  agentDir: string,
): Pick<AutopilotSkillPhaseRoute, "skillPath" | "packageSkillPath" | "fallbackSkillPath" | "resolvedFrom"> {
  const packageSkillPath = buildPackageOwnedSkillPath(skillName, packageRoot);
  const fallbackSkillPath = buildAgentFallbackSkillPath(skillName, agentDir);

  if (existsSync(packageSkillPath)) {
    return {
      skillPath: packageSkillPath,
      packageSkillPath,
      fallbackSkillPath,
      resolvedFrom: "package",
    };
  }

  if (existsSync(fallbackSkillPath)) {
    return {
      skillPath: fallbackSkillPath,
      packageSkillPath,
      fallbackSkillPath,
      resolvedFrom: "agent_dir",
    };
  }

  return {
    skillPath: packageSkillPath,
    packageSkillPath,
    fallbackSkillPath,
    resolvedFrom: "package",
  };
}

function buildSkillPhaseRoute(
  phase: AutopilotPhase,
  skillName: AutopilotSkillPhaseRoute["skillName"],
  summary: string,
  packageRoot: string,
  agentDir: string,
): AutopilotSkillPhaseRoute {
  const selection = resolveRoutedSkillSelection(skillName, packageRoot, agentDir);
  return {
    phase,
    surface: "skill",
    dispatchEncoding: "read_skill_file",
    skillName,
    ...selection,
    requiredTools: ["read", AUTOPILOT_REPORT_TOOL_NAME],
    summary,
  };
}

function buildPromptPhaseRoute(
  phase: "closeout",
  summary: string,
): AutopilotPromptPhaseRoute {
  return {
    phase,
    surface: "prompt",
    dispatchEncoding: "built_in_prompt",
    promptSurface: AUTOPILOT_CLOSEOUT_PROMPT_SURFACE,
    requiredTools: [AUTOPILOT_REPORT_TOOL_NAME],
    summary,
  };
}

export function resolveAutopilotAgentDir(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.PI_CODING_AGENT_DIR?.trim();
  return configured ? configured : path.join(homedir(), ".pi", "agent");
}

export function getAutopilotPhaseRouteMatrix(options?: {
  packageRoot?: string;
  agentDir?: string;
  env?: NodeJS.ProcessEnv;
}): Record<AutopilotPhase, AutopilotPhaseRoute> {
  const packageRoot = options?.packageRoot ?? resolveAutopilotPackageRoot();
  const agentDir = options?.agentDir ?? resolveAutopilotAgentDir(options?.env);
  return {
    master_plan: buildSkillPhaseRoute("master_plan", "plan-creator", "plan the full workstream", packageRoot, agentDir),
    wave_plan: buildSkillPhaseRoute("wave_plan", "plan-creator", "plan the current wave", packageRoot, agentDir),
    execute: buildSkillPhaseRoute("execute", "execute-plan", "execute the current slice", packageRoot, agentDir),
    review: buildSkillPhaseRoute("review", "execution-reality-audit", "review the executed slice", packageRoot, agentDir),
    replan: buildSkillPhaseRoute("replan", "plan-creator", "replan the current wave or roadmap", packageRoot, agentDir),
    closeout: buildPromptPhaseRoute("closeout", "use the built-in repo-local closeout surface"),
  };
}

export function resolveAutopilotPhaseRoute(
  phase: AutopilotPhase,
  options?: {
    routeMatrix?: Partial<Record<AutopilotPhase, AutopilotPhaseRoute>>;
    packageRoot?: string;
    agentDir?: string;
    env?: NodeJS.ProcessEnv;
  },
): AutopilotPhaseRoute {
  const routeMatrix = options?.routeMatrix ?? getAutopilotPhaseRouteMatrix({
    ...(options?.packageRoot ? { packageRoot: options.packageRoot } : {}),
    ...(options?.agentDir ? { agentDir: options.agentDir } : {}),
    ...(options?.env ? { env: options.env } : {}),
  });
  const route = routeMatrix[phase];
  if (!route) {
    throw new Error(`deterministic autopilot phase route missing for ${phase}`);
  }
  if (route.phase !== phase) {
    throw new Error(`deterministic autopilot phase route mismatch: requested ${phase} but route encodes ${route.phase}`);
  }
  if (route.surface === "skill") {
    if (!route.skillName.trim()) {
      throw new Error(`deterministic autopilot phase route missing skill name for ${phase}`);
    }
    if (!route.skillPath.trim()) {
      throw new Error(`deterministic autopilot phase route missing skill path for ${phase}`);
    }
    if (!route.packageSkillPath.trim()) {
      throw new Error(`deterministic autopilot phase route missing package skill path for ${phase}`);
    }
    if (!route.fallbackSkillPath.trim()) {
      throw new Error(`deterministic autopilot phase route missing fallback skill path for ${phase}`);
    }
  } else if (!route.promptSurface.trim()) {
    throw new Error(`deterministic autopilot phase route missing prompt surface for ${phase}`);
  }
  return route;
}

export function formatAutopilotPhaseRoutingMatrixLines(options?: {
  packageRoot?: string;
  agentDir?: string;
  env?: NodeJS.ProcessEnv;
}): string[] {
  const routeMatrix = getAutopilotPhaseRouteMatrix(options);
  return AUTOPILOT_PHASES.map((phase) => {
    const route = resolveAutopilotPhaseRoute(phase, { routeMatrix });
    return route.surface === "skill"
      ? `- \`${phase}\` -> skill \`${route.skillName}\``
      : `- \`${phase}\` -> built-in closeout prompt surface`;
  });
}

export function formatAutopilotCurrentPhaseRouteLines(route: AutopilotPhaseRoute): string[] {
  if (route.surface === "skill") {
    return [
      `- Deterministic route: \`${route.phase}\` -> skill \`${route.skillName}\`.`,
      `- Package-owned primary skill path: \`${route.packageSkillPath}\`.`,
      `- Compatibility fallback skill path: \`${route.fallbackSkillPath}\`.`,
      `- Resolved skill source for this turn: \`${route.resolvedFrom}\`.`,
      `- Before any other repo work, use \`read\` on \`${route.skillPath}\`.`,
      "- Treat that skill as the governing instructions for this phase.",
      "- Do not substitute another skill or rely on implicit model recall.",
    ];
  }

  return [
    `- Deterministic route: \`${route.phase}\` -> built-in closeout prompt surface.`,
    "- Use the repo-local closeout prompt in this phase; do not assume a separate global closeout skill.",
    "- Do not substitute another skill or rely on implicit model recall.",
  ];
}

export function getRequiredToolNamesForAutopilotPhase(
  phase: AutopilotPhase,
  options?: {
    packageRoot?: string;
    agentDir?: string;
    env?: NodeJS.ProcessEnv;
  },
): string[] {
  const route = resolveAutopilotPhaseRoute(phase, options);
  return [...new Set(route.requiredTools)];
}

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
  doneWhenMet?: string[] | undefined;
  stopBoundaryHit?: string[] | undefined;
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
  phaseRoute?: AutopilotPhaseRoute | undefined;
  phaseRoutingMatrix?: string[] | undefined;
}

export interface AutopilotActiveSlice {
  stepId: string;
  owner: string;
  state: string;
  objectives: string[];
  requiredDeliverables: string[];
  doneWhen?: string[] | undefined;
  stopBoundary?: string[] | undefined;
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
    (candidate.doneWhenMet === undefined || Array.isArray(candidate.doneWhenMet)) &&
    (candidate.stopBoundaryHit === undefined || Array.isArray(candidate.stopBoundaryHit)) &&
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

function normalizeStopLawItems(items: string[] | undefined): string[] {
  return [...new Set((items ?? []).map((item) => item.trim()).filter((item) => item.length > 0))];
}

export interface AutopilotReportStopLawResolution {
  usesStopLaw: boolean;
  doneWhen: string[];
  stopBoundary: string[];
  doneWhenMet: string[];
  stopBoundaryHit: string[];
  missingDoneWhen: string[];
  unexpectedDoneWhenMet: string[];
  unexpectedStopBoundaryHit: string[];
  derivedStatus: AutopilotStatus;
}

export function resolveAutopilotReportStopLaw(
  activeSlice: Pick<AutopilotActiveSlice, "doneWhen" | "stopBoundary"> | undefined,
  report: Pick<AutopilotReport, "status" | "doneWhenMet" | "stopBoundaryHit">,
): AutopilotReportStopLawResolution {
  const doneWhen = normalizeStopLawItems(activeSlice?.doneWhen);
  const stopBoundary = normalizeStopLawItems(activeSlice?.stopBoundary);
  const doneWhenMet = normalizeStopLawItems(report.doneWhenMet);
  const stopBoundaryHit = normalizeStopLawItems(report.stopBoundaryHit);
  const missingDoneWhen = doneWhen.filter((item) => !doneWhenMet.includes(item));
  const unexpectedDoneWhenMet = doneWhenMet.filter((item) => !doneWhen.includes(item));
  const unexpectedStopBoundaryHit = stopBoundaryHit.filter((item) => !stopBoundary.includes(item));
  const usesStopLaw = doneWhen.length > 0 || stopBoundary.length > 0;

  let derivedStatus = report.status;
  if (usesStopLaw && report.status !== "blocked" && report.status !== "failed") {
    if (stopBoundaryHit.length > 0) {
      derivedStatus = "needs_replan";
    } else if (doneWhen.length > 0) {
      derivedStatus = missingDoneWhen.length === 0 ? (report.status === "done" ? "done" : "completed") : "continue";
    }
  }

  return {
    usesStopLaw,
    doneWhen,
    stopBoundary,
    doneWhenMet,
    stopBoundaryHit,
    missingDoneWhen,
    unexpectedDoneWhenMet,
    unexpectedStopBoundaryHit,
    derivedStatus,
  };
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
  if ((report.doneWhenMet ?? []).length > 0) lines.push(`doneWhenMet: ${(report.doneWhenMet ?? []).join(" | ")}`);
  if ((report.stopBoundaryHit ?? []).length > 0) lines.push(`stopBoundaryHit: ${(report.stopBoundaryHit ?? []).join(" | ")}`);
  if (report.evidence.length > 0) lines.push(`evidence: ${report.evidence.join(" | ")}`);
  if (report.artifacts.length > 0) lines.push(`artifacts: ${report.artifacts.join(" | ")}`);
  if (report.risks.length > 0) lines.push(`risks: ${report.risks.join(" | ")}`);
  return lines.join("\n");
}
