import type { AutopilotPhase, AutopilotReport } from "../shared/types.js";
import type {
  BuildPhaseEvidenceInput,
  MemoryRecallPayload,
  PhaseHydrationSnapshot,
  PlanSyncEntry,
  PreparePhaseHydrationInput,
  RunWorkspaceSnapshot,
  WorkspaceScanEntry,
} from "./types.js";

function summarizeWorkspace(entries: WorkspaceScanEntry[]): string[] {
  return entries.slice(0, 2).map((entry) => `workspace: ${entry.name}@${entry.branch}, ${entry.status_summary}`);
}

function summarizePlans(entries: PlanSyncEntry[]): string[] {
  return entries.slice(0, 2).map((entry) => {
    const progress = `${entry.done}/${entry.checklist_items}`;
    return `plan: ${entry.file} (${progress} done, ${entry.in_progress} in progress)`;
  });
}

function summarizeRecallItem(item: unknown): string | null {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const candidates = [record.content, record.observation, record.summary, record.effect_summary];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
}

function summarizeRecall(payload: MemoryRecallPayload): string[] {
  return payload.items
    .map(summarizeRecallItem)
    .filter((value): value is string => Boolean(value))
    .slice(0, 3)
    .map((line) => `memory: ${line}`);
}

function summarizeGovernPolicy(policy: Record<string, unknown> | null): string[] {
  if (!policy) return [];
  const lines: string[] = [];
  const requiresApproval = Array.isArray(policy.requires_approval_tools)
    ? policy.requires_approval_tools.filter((value): value is string => typeof value === "string")
    : [];
  if (requiresApproval.length > 0) {
    lines.push(`policy: approval for ${requiresApproval.join(", ")}`);
  }
  const allowedTools = Array.isArray(policy.allowed_tools)
    ? policy.allowed_tools.filter((value): value is string => typeof value === "string")
    : [];
  if (allowedTools.length > 0) {
    lines.push(`policy: allow ${allowedTools.slice(0, 6).join(", ")}`);
  }
  return lines;
}

function lastReportSummary(recentReports: AutopilotReport[]): string | undefined {
  const latest = recentReports.at(-1);
  if (!latest) return undefined;
  return `${latest.phase}/${latest.status}: ${latest.summary}`;
}

export async function loadRunWorkspaceSnapshot(substrate: PreparePhaseHydrationInput["substrate"]): Promise<RunWorkspaceSnapshot> {
  const scan = await substrate.workspace.scan({ workspaces: [substrate.config.cwd] });
  const plans = await substrate.workspace.planSync({ docsPath: substrate.config.planDocsPath });

  const warnings = [
    ...(scan.ok ? [] : [scan.summary]),
    ...(plans.ok ? [] : [plans.summary]),
  ];

  return {
    workspace: scan.ok ? scan.data : [],
    plans: plans.ok ? plans.data : [],
    warnings,
  };
}

function buildRecallQuery(phase: AutopilotPhase, goal: string, recentReports: AutopilotReport[], currentWave: number, currentCycle: number): string {
  const parts = [`goal: ${goal}`, `phase: ${phase}`, `wave: ${currentWave}`, `cycle: ${currentCycle}`];
  const latest = lastReportSummary(recentReports);
  if (latest) parts.push(`latest: ${latest}`);
  return parts.join(" | ");
}

function shouldIncludeWorkspace(phase: AutopilotPhase): boolean {
  return phase === "master_plan" || phase === "wave_plan" || phase === "replan" || phase === "closeout" || phase === "execute";
}

function shouldIncludePlans(phase: AutopilotPhase): boolean {
  return phase !== "review";
}

export async function preparePhaseHydration(input: PreparePhaseHydrationInput): Promise<PhaseHydrationSnapshot> {
  const hydration: PhaseHydrationSnapshot = {
    workspaceSummary: shouldIncludeWorkspace(input.phase) ? summarizeWorkspace(input.runWorkspace.workspace) : [],
    planSummary: shouldIncludePlans(input.phase) ? summarizePlans(input.runWorkspace.plans) : [],
    recallSummary: [],
    governPolicySummary: [],
    warnings: [],
  };

  const recall = await input.substrate.memory.recall({
    query: buildRecallQuery(input.phase, input.goal, input.recentReports, input.currentWave, input.currentCycle),
    limit: input.phase === "master_plan" || input.phase === "wave_plan" ? 4 : 3,
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    graphMode: input.phase === "master_plan" || input.phase === "wave_plan" || input.phase === "replan" ? "assist" : "off",
  });
  if (recall.ok) {
    hydration.recallSummary = summarizeRecall(recall.data);
  } else {
    hydration.warnings.push(recall.summary);
  }

  if (input.phase === "execute") {
    const policy = await input.substrate.govern.policy();
    if (policy.ok) {
      hydration.governPolicySummary = summarizeGovernPolicy(policy.data.policy);
    } else {
      hydration.warnings.push(policy.summary);
    }
  }

  return hydration;
}

export function buildPhaseHydrationSections(_phase: AutopilotPhase, hydration: PhaseHydrationSnapshot): string[] {
  const lines = [
    ...hydration.workspaceSummary,
    ...hydration.planSummary,
    ...hydration.recallSummary,
    ...hydration.governPolicySummary,
    ...hydration.warnings.map((warning) => `warning: ${warning}`),
  ];

  if (lines.length === 0) return [];
  return ["Substrate context:", ...lines.map((line) => `- ${line}`)];
}

export function buildRawPhaseEvidence(input: BuildPhaseEvidenceInput): string {
  return JSON.stringify(
    {
      kind: "autopilot_phase_evidence",
      goal: input.goal,
      cwd: input.cwd,
      wave: input.wave,
      cycle: input.cycle,
      report: input.report,
    },
    null,
    2,
  );
}
