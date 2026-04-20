import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
  type AutopilotActiveSlice,
  deriveAutopilotObjectiveKey,
  type AutopilotReport,
} from "../autopilot/protocol.js";
import {
  haltInteractiveRuntime,
  registerAutopilotOwnedPaths,
  type AutopilotRuntimeState,
} from "../autopilot/state.js";
import {
  buildPhaseHydrationSections,
  getRuntimeSubstrate,
  loadRunWorkspaceSnapshot,
  preparePhaseHydration,
  resolveNextStageFromStageOrder,
  type ActiveControlPlaneSnapshot,
  type WorkspaceScanEntry,
} from "../substrate/index.js";

export async function buildInteractivePrompt(
  runtime: AutopilotRuntimeState,
  reports: AutopilotReport[],
  cwd: string,
  buildPhasePrompt: (
    phase: AutopilotRuntimeState["phase"],
    context: {
      goal: string;
      currentWave: number;
      maxWaves: number;
      currentCycle: number;
      maxExecutionCyclesPerWave: number;
      recentReports: AutopilotReport[];
      activeSlice?: AutopilotActiveSlice | undefined;
      substrateContext?: string[] | undefined;
    },
  ) => string,
): Promise<{
  prompt: string;
  warnings: string[];
  substrateMode: "local" | "bb";
  objectiveKey: string;
  activeSlice: AutopilotActiveSlice | undefined;
  dirtyWorkspace: WorkspaceScanEntry | undefined;
  controlPlane: ActiveControlPlaneSnapshot | null;
  controlPlaneReadmePath: string;
  benchmarkProjection: AutopilotRuntimeState["benchmarkProjection"];
  decisionProjection: AutopilotRuntimeState["decisionProjection"];
  historyProjection: AutopilotRuntimeState["historyProjection"];
  artifactSummaryProjection: AutopilotRuntimeState["artifactSummaryProjection"];
}> {
  const substrate = getRuntimeSubstrate();
  if (!substrate) {
    throw new Error("autopilot substrate must be initialized before dispatch");
  }
  const objectiveKey = runtime.objectiveKey ?? deriveAutopilotObjectiveKey(runtime.goal, cwd);
  const runWorkspace = await loadRunWorkspaceSnapshot(substrate);
  const hydration = await preparePhaseHydration({
    substrate,
    phase: runtime.phase,
    goal: runtime.goal,
    currentWave: runtime.currentWave,
    currentCycle: runtime.currentCycle,
    recentReports: reports.slice(-6),
    objectiveKey,
    runWorkspace,
  });

  const warnings = [...runtime.warnings, ...runWorkspace.warnings, ...hydration.warnings].slice(-5);
  const activeSlice = runWorkspace.controlPlane
    ? {
        stepId: runWorkspace.controlPlane.activeStage.stageId,
        owner: runWorkspace.controlPlane.activeStage.owner,
        state: runWorkspace.controlPlane.activeStage.state,
        objectives: [...runWorkspace.controlPlane.activeStage.objectives],
        requiredDeliverables: [...runWorkspace.controlPlane.activeStage.requiredDeliverables],
        avoid: [...runWorkspace.controlPlane.activeStage.avoid],
      }
    : undefined;
  const dirtyWorkspace = runWorkspace.workspace.find((entry) => entry.path === cwd && entry.dirty_files > 0);
  const controlPlaneReadmePath = path.relative(substrate.config.cwd, path.join(substrate.config.planDocsPath, "README.md")).replace(/\\/g, "/");

  return {
    prompt: buildPhasePrompt(runtime.phase, {
      goal: runtime.goal,
      currentWave: runtime.currentWave,
      maxWaves: runtime.maxWaves,
      currentCycle: runtime.currentCycle,
      maxExecutionCyclesPerWave: runtime.maxExecutionCyclesPerWave,
      recentReports: reports.slice(-6),
      ...(activeSlice ? { activeSlice } : {}),
      substrateContext: buildPhaseHydrationSections(runtime.phase, {
        ...hydration,
        warnings,
      }),
    }),
    warnings,
    substrateMode: substrate.mode,
    objectiveKey,
    activeSlice,
    dirtyWorkspace,
    controlPlane: runWorkspace.controlPlane,
    controlPlaneReadmePath,
    benchmarkProjection: hydration.benchmarkProjection,
    decisionProjection: hydration.decisionProjection,
    historyProjection: hydration.historyProjection,
    artifactSummaryProjection: hydration.artifactSummaryProjection,
  };
}

export async function writeAcceptedSliceCompletion(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  runtime: AutopilotRuntimeState,
  report: AutopilotReport,
  persistRuntime: (pi: ExtensionAPI, runtime: AutopilotRuntimeState | null) => void,
  notify: (ctx: ExtensionContext, message: string, kind?: "info" | "warning" | "error") => void,
): Promise<AutopilotRuntimeState> {
  const substrate = getRuntimeSubstrate();
  if (!substrate?.controlPlane || !runtime.activeSlice) {
    return runtime;
  }
  if (substrate.mode !== "local") {
    return runtime;
  }
  if (report.stepId !== runtime.activeSlice.stepId) {
    return runtime;
  }
  if (report.status !== "completed" && report.status !== "done") {
    return runtime;
  }

  const snapshot = await substrate.controlPlane.snapshot();
  if (!snapshot.ok || !snapshot.data) {
    const reason = "unable to resolve repo-local control-plane snapshot for accepted slice completion";
    const halted = haltInteractiveRuntime(runtime, reason);
    persistRuntime(pi, halted);
    notify(ctx, reason, "warning");
    return halted;
  }

  const nextStage = resolveNextStageFromStageOrder(
    snapshot.data.stageOrder,
    snapshot.data.sliceDefinitions,
    runtime.activeSlice.stepId,
  );
  const verificationEvidence = [
    ...report.evidence,
    ...report.artifacts,
    ...(report.evidence.length === 0 && report.artifacts.length === 0 ? [report.summary] : []),
  ];
  const writeback = await substrate.controlPlane.advance({
    completedSlice: runtime.activeSlice.stepId,
    nextActiveSlice: nextStage?.stageId ?? null,
    intendedHandoff: snapshot.data.readme.intendedHandoff,
    closeoutSummary: report.summary,
    verificationEvidence,
    nextStage,
  });

  if (!writeback.ok || writeback.data.updatedFiles.length === 0) {
    const reason = `deterministic control-plane writeback failed for completed slice ${runtime.activeSlice.stepId}`;
    const halted = haltInteractiveRuntime(runtime, reason);
    persistRuntime(pi, halted);
    notify(ctx, reason, "warning");
    return halted;
  }

  const updatedRuntime = registerAutopilotOwnedPaths(
    {
      ...runtime,
      ...(nextStage
        ? {
            activeSlice: {
              stepId: nextStage.stageId,
              owner: nextStage.owner,
              state: nextStage.state,
              objectives: [...nextStage.objectives],
              requiredDeliverables: [...nextStage.requiredDeliverables],
              avoid: [...nextStage.avoid],
            },
          }
        : { activeSlice: undefined }),
    },
    writeback.data.updatedFiles,
  );
  persistRuntime(pi, updatedRuntime);
  return updatedRuntime;
}
