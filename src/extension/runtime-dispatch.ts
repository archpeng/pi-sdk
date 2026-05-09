import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
  AUTOPILOT_CLOSEOUT_PROMPT_SURFACE,
  type AutopilotActiveSlice,
  type AutopilotPhase,
  type AutopilotPhaseRoute,
  type AutopilotPromptContext,
  deriveAutopilotObjectiveKey,
  formatAutopilotPhaseRoutingMatrixLines,
  resolveAutopilotPhaseRoute,
  type AutopilotReport,
} from "../autopilot/protocol.js";
import {
  AUTOPILOT_IDLE_PLAN_BOOTSTRAP_STATE,
  haltInteractiveRuntime,
  registerAutopilotOwnedPaths,
  type AutopilotRuntimeState,
} from "../autopilot/state.js";
import {
  buildPhaseHydrationSections,
  CONTROL_PLANE_PACK_COMPLETE_STAGE_ID,
  getRuntimeSubstrate,
  loadRunWorkspaceSnapshot,
  preparePhaseHydration,
  resolveNextStageFromStageOrder,
  type ActiveControlPlaneSnapshot,
  type WorkspaceScanEntry,
} from "../substrate/index.js";

export interface AutopilotPhaseDispatch {
  phaseRoute: AutopilotPhaseRoute;
  preloadedSkillFile?: {
    path: string;
    contents: string;
  } | undefined;
}

function loadRoutedSkillFile(
  phase: AutopilotPhase,
  skillPath: string,
  readTextFile: (path: string) => string,
): { path: string; contents: string } {
  const skillFile = statSync(skillPath, { throwIfNoEntry: false });
  if (!skillFile?.isFile()) {
    throw new Error(`deterministic autopilot phase route for ${phase} requires skill file ${skillPath}`);
  }

  const contents = readTextFile(skillPath).trim();
  if (!contents) {
    throw new Error(`deterministic autopilot phase route for ${phase} requires a non-empty skill file ${skillPath}`);
  }

  return { path: skillPath, contents };
}

export function resolveAutopilotPhaseDispatch(
  phase: AutopilotPhase,
  options?: {
    routeMatrix?: Partial<Record<AutopilotPhase, AutopilotPhaseRoute>>;
    readTextFile?: (path: string) => string;
  },
): AutopilotPhaseDispatch {
  const phaseRoute = resolveAutopilotPhaseRoute(phase, {
    ...(options?.routeMatrix ? { routeMatrix: options.routeMatrix } : {}),
  });
  if (phaseRoute.surface !== "skill") {
    return { phaseRoute };
  }

  return {
    phaseRoute,
    preloadedSkillFile: loadRoutedSkillFile(
      phase,
      phaseRoute.skillPath,
      options?.readTextFile ?? ((skillPath) => readFileSync(skillPath, "utf8")),
    ),
  };
}

export function buildAutopilotPhaseDispatchMessage(
  phasePrompt: string,
  dispatch: AutopilotPhaseDispatch,
): string {
  const { phaseRoute } = dispatch;
  const prelude = [
    "[AUTOPILOT ROUTED DISPATCH]",
    `Phase: ${phaseRoute.phase}`,
    phaseRoute.surface === "skill"
      ? `Bound surface: skill \`${phaseRoute.skillName}\``
      : `Bound surface: prompt \`${phaseRoute.promptSurface}\``,
    `Dispatch encoding: ${phaseRoute.dispatchEncoding}`,
    ...(phaseRoute.surface === "skill"
      ? [
          `Resolved skill file: ${phaseRoute.skillPath}`,
          `Resolved skill source: ${phaseRoute.resolvedFrom}`,
          `Package-owned primary: ${phaseRoute.packageSkillPath}`,
          `Compatibility fallback: ${phaseRoute.fallbackSkillPath}`,
        ]
      : [`Resolved prompt surface: ${phaseRoute.promptSurface}`]),
    "",
    phaseRoute.surface === "skill"
      ? "The extension has already preloaded the routed skill file below. Treat it as the governing instructions for this phase."
      : "The extension has already bound this phase to the repo-local closeout prompt surface below.",
    "Do not silently substitute another skill or fall back to a generic phase prompt.",
  ];

  if (phaseRoute.surface === "skill") {
    return [
      ...prelude,
      "",
      "Preloaded skill instructions:",
      "```md",
      dispatch.preloadedSkillFile?.contents ?? "",
      "```",
      "",
      "Phase-specific autopilot prompt:",
      phasePrompt,
    ].join("\n");
  }

  return [
    ...prelude,
    "",
    "Phase-specific autopilot prompt:",
    phasePrompt,
  ].join("\n");
}

export async function buildInteractivePrompt(
  runtime: AutopilotRuntimeState,
  reports: AutopilotReport[],
  cwd: string,
  buildPhasePrompt: (
    phase: AutopilotRuntimeState["phase"],
    context: AutopilotPromptContext,
  ) => string,
): Promise<{
  prompt: string;
  userMessage: string;
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
  const phaseDispatch = resolveAutopilotPhaseDispatch(runtime.phase);
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
  const activeSlice = runtime.activeSlice?.stepId === AUTOPILOT_IDLE_PLAN_BOOTSTRAP_STATE
    ? runtime.activeSlice
    : runWorkspace.controlPlane
      ? {
          stepId: runWorkspace.controlPlane.activeStage.stageId,
          owner: runWorkspace.controlPlane.activeStage.owner,
          state: runWorkspace.controlPlane.activeStage.state,
          objectives: [...runWorkspace.controlPlane.activeStage.objectives],
          requiredDeliverables: [...runWorkspace.controlPlane.activeStage.requiredDeliverables],
          ...(runWorkspace.controlPlane.activeStage.doneWhen
            ? { doneWhen: [...runWorkspace.controlPlane.activeStage.doneWhen] }
            : {}),
          ...(runWorkspace.controlPlane.activeStage.stopBoundary
            ? { stopBoundary: [...runWorkspace.controlPlane.activeStage.stopBoundary] }
            : {}),
          avoid: [...runWorkspace.controlPlane.activeStage.avoid],
        }
      : undefined;
  const dirtyWorkspace = runWorkspace.workspace.find((entry) => entry.path === cwd && entry.dirty_files > 0);
  const controlPlaneReadmePath = path.relative(substrate.config.cwd, path.join(substrate.config.planDocsPath, "README.md")).replace(/\\/g, "/");
  const prompt = buildPhasePrompt(runtime.phase, {
    goal: runtime.goal,
    currentWave: runtime.currentWave,
    maxWaves: runtime.maxWaves,
    currentCycle: runtime.currentCycle,
    maxExecutionCyclesPerWave: runtime.maxExecutionCyclesPerWave,
    recentReports: reports.slice(-6),
    ...(activeSlice ? { activeSlice } : {}),
    phaseRoute: phaseDispatch.phaseRoute,
    phaseRoutingMatrix: formatAutopilotPhaseRoutingMatrixLines(),
    substrateContext: buildPhaseHydrationSections(runtime.phase, {
      ...hydration,
      warnings,
    }),
  });

  return {
    prompt,
    userMessage: buildAutopilotPhaseDispatchMessage(prompt, phaseDispatch),
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

function shouldWriteAcceptedSliceCompletion(report: AutopilotReport): boolean {
  if (report.phase === "closeout") return false;
  if (report.status === "done") return true;
  return report.phase === "review" && report.status === "completed";
}

function toRuntimeActiveSlice(stage: ActiveControlPlaneSnapshot["activeStage"]): AutopilotActiveSlice {
  return {
    stepId: stage.stageId,
    owner: stage.owner,
    state: stage.state,
    objectives: [...stage.objectives],
    requiredDeliverables: [...stage.requiredDeliverables],
    ...(stage.doneWhen ? { doneWhen: [...stage.doneWhen] } : {}),
    ...(stage.stopBoundary ? { stopBoundary: [...stage.stopBoundary] } : {}),
    avoid: [...stage.avoid],
  };
}

function validatePostWritebackSnapshot(
  snapshot: ActiveControlPlaneSnapshot,
  expectedActiveSlice: string,
  expectedIntendedHandoff: string,
): string | null {
  if (snapshot.readme.activeSlice !== expectedActiveSlice) {
    return `repo-local control-plane writeback expected README active slice ${expectedActiveSlice} but found ${snapshot.readme.activeSlice}`;
  }
  if (snapshot.readme.intendedHandoff !== expectedIntendedHandoff) {
    return `repo-local control-plane writeback expected README intended handoff ${expectedIntendedHandoff} but found ${snapshot.readme.intendedHandoff}`;
  }
  if (snapshot.activeStage.stageId !== expectedActiveSlice) {
    return `repo-local control-plane writeback expected active stage ${expectedActiveSlice} but found ${snapshot.activeStage.stageId}`;
  }
  if (expectedActiveSlice === CONTROL_PLANE_PACK_COMPLETE_STAGE_ID) {
    if (snapshot.activeStage.owner !== "closeout" || snapshot.activeStage.state !== "DONE") {
      return "repo-local terminal writeback must parse as PACK_COMPLETE owned by closeout with DONE state";
    }
  }
  return null;
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
  if (!shouldWriteAcceptedSliceCompletion(report)) {
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

  const nextStage = report.status === "done"
    ? null
    : resolveNextStageFromStageOrder(
        snapshot.data.stageOrder,
        snapshot.data.sliceDefinitions,
        runtime.activeSlice.stepId,
      );
  if (!nextStage && report.status !== "done") {
    const reason = `repo-local control-plane has no next stage after ${runtime.activeSlice.stepId}; refusing non-terminal PACK_COMPLETE writeback`;
    const halted = haltInteractiveRuntime(runtime, reason);
    persistRuntime(pi, halted);
    notify(ctx, reason, "warning");
    return halted;
  }

  const expectedActiveSlice = nextStage?.stageId ?? CONTROL_PLANE_PACK_COMPLETE_STAGE_ID;
  const intendedHandoff = nextStage ? nextStage.owner : AUTOPILOT_CLOSEOUT_PROMPT_SURFACE;
  const verificationEvidence = [
    ...report.evidence,
    ...report.artifacts,
    ...(report.evidence.length === 0 && report.artifacts.length === 0 ? [report.summary] : []),
  ];
  const writeback = await substrate.controlPlane.advance({
    completedSlice: runtime.activeSlice.stepId,
    nextActiveSlice: nextStage?.stageId ?? null,
    intendedHandoff,
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

  const postWritebackSnapshot = await substrate.controlPlane.snapshot();
  if (!postWritebackSnapshot.ok || !postWritebackSnapshot.data) {
    const reason = `repo-local control-plane writeback produced unparsable docs/plan for ${expectedActiveSlice}: ${postWritebackSnapshot.summary}`;
    const halted = haltInteractiveRuntime(runtime, reason);
    persistRuntime(pi, halted);
    notify(ctx, reason, "warning");
    return halted;
  }
  const postWritebackMismatch = validatePostWritebackSnapshot(postWritebackSnapshot.data, expectedActiveSlice, intendedHandoff);
  if (postWritebackMismatch) {
    const halted = haltInteractiveRuntime(runtime, postWritebackMismatch);
    persistRuntime(pi, halted);
    notify(ctx, postWritebackMismatch, "warning");
    return halted;
  }

  const updatedRuntime = registerAutopilotOwnedPaths(
    {
      ...runtime,
      activeSlice: toRuntimeActiveSlice(postWritebackSnapshot.data.activeStage),
    },
    writeback.data.updatedFiles,
  );
  persistRuntime(pi, updatedRuntime);
  return updatedRuntime;
}
