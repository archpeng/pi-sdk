import { buildAutopilotArtifactSummaryProjection } from "../autopilot/artifact-summary-projection.js";
import { buildAutopilotBenchmarkProjection } from "../autopilot/benchmark-projection.js";
import { buildAutopilotDecisionProjection } from "../autopilot/decision-projection.js";
import { buildAutopilotHistoryProjection } from "../autopilot/history-projection.js";
import { loadRoadmapBootstrapSnapshot } from "./roadmap.js";
import type { AutopilotPhase, AutopilotReport } from "../shared/types.js";
import type {
  ActiveControlPlaneSnapshot,
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

function summarizeControlPlane(snapshot: ActiveControlPlaneSnapshot | null): string[] {
  if (!snapshot) return [];
  const lines = [
    `active-pack: ${snapshot.readme.activePack.worksetPath}`,
    `active-slice: ${snapshot.activeStage.stageId} owner=${snapshot.activeStage.owner} state=${snapshot.activeStage.state}`,
  ];
  const primaryObjective = snapshot.activeStage.objectives[0];
  if (primaryObjective) {
    lines.push(`active-slice-objective: ${primaryObjective}`);
  }
  return lines;
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
  const controlPlane = substrate.controlPlane ? await substrate.controlPlane.snapshot() : null;

  const warnings = [
    ...(scan.ok ? [] : [scan.summary]),
    ...(plans.ok ? [] : [plans.summary]),
    ...(controlPlane && !controlPlane.ok ? [controlPlane.summary] : []),
  ];

  return {
    workspace: scan.ok ? scan.data : [],
    plans: plans.ok ? plans.data : [],
    controlPlane: controlPlane?.ok ? controlPlane.data : null,
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
  const roadmapBootstrap = input.phase === "master_plan" || input.phase === "wave_plan" || input.phase === "replan" || input.phase === "closeout"
    ? loadRoadmapBootstrapSnapshot(input.substrate.config.cwd, input.substrate.config.planDocsPath)
    : null;
  const hydration: PhaseHydrationSnapshot = {
    workspaceSummary: shouldIncludeWorkspace(input.phase) ? summarizeWorkspace(input.runWorkspace.workspace) : [],
    planSummary: shouldIncludePlans(input.phase) ? summarizePlans(input.runWorkspace.plans) : [],
    controlPlaneSummary: shouldIncludePlans(input.phase) ? summarizeControlPlane(input.runWorkspace.controlPlane) : [],
    roadmapSummary: roadmapBootstrap?.summaryLines ?? [],
    recallSummary: [],
    autopilotStatusSummary: [],
    autopilotDecisionSummary: [],
    autopilotHistorySummary: [],
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

  if (input.objectiveKey) {
    const [status, authority, history, artifactSummary] = await Promise.all([
      input.substrate.autopilot.status({ objectiveKey: input.objectiveKey }),
      input.substrate.autopilot.authority({ objectiveKey: input.objectiveKey }),
      input.substrate.autopilot.history({ objectiveKey: input.objectiveKey, limit: 4 }),
      input.substrate.autopilot.learnedArtifactSummary({ objectiveKey: input.objectiveKey }),
    ]);

    if (status.ok && status.data) {
      const projection = buildAutopilotBenchmarkProjection(status.data);
      if (projection) {
        hydration.benchmarkProjection = projection;
        hydration.autopilotStatusSummary = [
          `objective-key: ${projection.objectiveKey}`,
          `promotion-readiness: ${projection.summaryLine}`,
          ...projection.detailLines.slice(0, 2).map((line) => `autopilot-status: ${line}`),
        ];
      }
    } else if (!status.ok) {
      hydration.warnings.push(status.summary);
    }

    if (authority.ok && authority.data) {
      const reconcilePlan = authority.data.intentState === "recorded" && authority.data.reconcileState === "ready"
        ? await input.substrate.autopilot.decisionReconcilePlan({
            objectiveKey: input.objectiveKey,
            authorityId: authority.data.authorityId,
          })
        : null;
      if (reconcilePlan && !reconcilePlan.ok) {
        hydration.warnings.push(reconcilePlan.summary);
      }

      const projection = buildAutopilotDecisionProjection(
        authority.data,
        reconcilePlan?.ok ? reconcilePlan.data : undefined,
      );
      if (projection) {
        hydration.decisionProjection = projection;
        hydration.autopilotDecisionSummary = [
          `decision-authority: ${projection.summaryLine}`,
          ...projection.detailLines.slice(0, 2).map((line) => `autopilot-decision: ${line}`),
        ];
      }
    } else if (!authority.ok) {
      hydration.warnings.push(authority.summary);
    }

    if (artifactSummary.ok && artifactSummary.data) {
      hydration.artifactSummaryProjection = buildAutopilotArtifactSummaryProjection(artifactSummary.data);
    } else if (!artifactSummary.ok) {
      hydration.warnings.push(artifactSummary.summary);
    }

    if (history.ok || hydration.artifactSummaryProjection) {
      const projection = buildAutopilotHistoryProjection(history.ok ? history.data : undefined, hydration.artifactSummaryProjection);
      if (projection) {
        hydration.historyProjection = projection;
        hydration.autopilotHistorySummary = [
          `history-summary: ${projection.summaryLine}`,
          ...projection.detailLines.slice(0, 2).map((line) => `autopilot-history: ${line}`),
        ];
      }
    }
    if (!history.ok) {
      hydration.warnings.push(history.summary);
    }
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
    ...hydration.controlPlaneSummary,
    ...hydration.roadmapSummary,
    ...hydration.recallSummary,
    ...hydration.autopilotStatusSummary,
    ...hydration.autopilotDecisionSummary,
    ...hydration.autopilotHistorySummary,
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
