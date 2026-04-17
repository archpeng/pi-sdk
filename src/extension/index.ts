import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { buildAutopilotOverlayLines, buildAutopilotStatusLines, buildAutopilotWidgetLines } from "../autopilot/operator.js";
import { buildPhasePrompt } from "../autopilot/phase-prompt.js";
import {
  AUTOPILOT_PAUSE_COMMAND,
  AUTOPILOT_PHASES,
  AUTOPILOT_REPORT_TOOL_NAME,
  AUTOPILOT_RESUME_COMMAND,
  AUTOPILOT_RUN_COMMAND,
  AUTOPILOT_STATUSES,
  AUTOPILOT_STATUS_COMMAND,
  AUTOPILOT_STOP_COMMAND,
  DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE,
  DEFAULT_AUTOPILOT_MAX_WAVES,
  deriveAutopilotObjectiveKey,
  formatAutopilotReport,
  type AutopilotReport,
  type AutopilotToolDetails,
  isAutopilotToolDetails,
} from "../autopilot/protocol.js";
import {
  AUTOPILOT_RUNTIME_ENTRY_TYPE,
  advanceInteractiveRuntime,
  beginInteractiveRuntime,
  restoreInteractiveRuntime,
  type AutopilotRuntimeState,
} from "../autopilot/state.js";
import {
  buildPhaseHydrationSections,
  createAutopilotSubstrate,
  formatGovernanceBlockReason,
  getRuntimeSubstrate,
  loadRunWorkspaceSnapshot,
  preparePhaseHydration,
  resolveAutopilotSubstrateConfig,
  setRuntimeSubstrate,
  shouldBlockToolCall,
  shouldPreflightToolCall,
  type AutopilotSubstrate,
} from "../substrate/index.js";

const AutopilotReportParams = Type.Object({
  phase: StringEnum(AUTOPILOT_PHASES),
  status: StringEnum(AUTOPILOT_STATUSES),
  summary: Type.String({ description: "Concrete summary of the current phase result" }),
  waveId: Type.Optional(Type.String({ description: "Wave identifier such as wave-1" })),
  stepId: Type.Optional(Type.String({ description: "Optional current step identifier" })),
  nextAction: Type.Optional(Type.String({ description: "What the outer orchestrator should do next" })),
  evidence: Type.Optional(Type.Array(Type.String({ description: "Concrete validation evidence" }))),
  artifacts: Type.Optional(Type.Array(Type.String({ description: "Files or outputs produced" }))),
  risks: Type.Optional(Type.Array(Type.String({ description: "Open risks or blockers" }))),
});

function notify(ctx: ExtensionContext, message: string, kind: "info" | "warning" | "error" = "info"): void {
  if (ctx.hasUI) {
    ctx.ui.notify(message, kind);
    return;
  }
  const sink = kind === "error" ? console.error : console.log;
  sink(message);
}

function persistRuntime(pi: ExtensionAPI, runtime: AutopilotRuntimeState | null): void {
  if (!runtime) return;
  pi.appendEntry(AUTOPILOT_RUNTIME_ENTRY_TYPE, runtime);
}

function truncateWarnings(warnings: string[]): string[] {
  return warnings.slice(-5);
}

function latestReport(reports: AutopilotReport[]): AutopilotReport | undefined {
  return reports.at(-1);
}

function updateUi(ctx: ExtensionContext, runtime: AutopilotRuntimeState | null, reports: AutopilotReport[]): void {
  if (!ctx.hasUI) return;

  const latest = latestReport(reports);
  if (!runtime && !latest) {
    ctx.ui.setStatus("autopilot", undefined);
    ctx.ui.setWidget("autopilot", undefined);
    return;
  }

  if (runtime) {
    const tone = runtime.warnings.length > 0 ? "warning" : runtime.mode === "closed" ? "success" : runtime.mode === "stopping" ? "warning" : "accent";
    ctx.ui.setStatus(
      "autopilot",
      ctx.ui.theme.fg(
        tone,
        `🤖 ${runtime.mode} · ${runtime.phase} · ${runtime.substrateMode ?? "unknown"} · w${runtime.currentWave}/c${runtime.currentCycle}`,
      ),
    );

    const lines = buildAutopilotWidgetLines(runtime, reports);
    lines[0] = `${ctx.ui.theme.fg("accent", "Autopilot")} ${runtime.goal}`;
    ctx.ui.setWidget("autopilot", lines);
    return;
  }

  ctx.ui.setStatus("autopilot", ctx.ui.theme.fg("accent", `🤖 ${latest?.phase ?? "autopilot"} · ${latest?.status ?? "-"}`));
  if (latest) {
    ctx.ui.setWidget("autopilot", [
      `${ctx.ui.theme.fg("accent", "Autopilot")} ${latest.phase} / ${latest.status}`,
      `summary: ${latest.summary}`,
    ]);
  }
}

function ensureSubstrate(cwd: string): AutopilotSubstrate {
  const existing = getRuntimeSubstrate();
  if (existing && existing.config.cwd === cwd) return existing;

  const substrate = createAutopilotSubstrate(
    resolveAutopilotSubstrateConfig({
      cwd,
      ...(process.env.PI_SDK_SUBSTRATE ? { mode: process.env.PI_SDK_SUBSTRATE } : {}),
      env: process.env,
    }),
  );
  setRuntimeSubstrate(substrate);
  return substrate;
}

async function buildInteractivePrompt(
  runtime: AutopilotRuntimeState,
  reports: AutopilotReport[],
  cwd: string,
): Promise<{
  prompt: string;
  warnings: string[];
  substrateMode: "local" | "bb";
  objectiveKey: string;
  benchmarkProjection: AutopilotRuntimeState["benchmarkProjection"];
  decisionProjection: AutopilotRuntimeState["decisionProjection"];
  historyProjection: AutopilotRuntimeState["historyProjection"];
  artifactSummaryProjection: AutopilotRuntimeState["artifactSummaryProjection"];
}> {
  const substrate = ensureSubstrate(cwd);
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

  const warnings = truncateWarnings([...runtime.warnings, ...runWorkspace.warnings, ...hydration.warnings]);
  const prompt = buildPhasePrompt(runtime.phase, {
    goal: runtime.goal,
    currentWave: runtime.currentWave,
    maxWaves: runtime.maxWaves,
    currentCycle: runtime.currentCycle,
    maxExecutionCyclesPerWave: runtime.maxExecutionCyclesPerWave,
    recentReports: reports.slice(-6),
    substrateContext: buildPhaseHydrationSections(runtime.phase, {
      ...hydration,
      warnings,
    }),
  });

  return {
    prompt,
    warnings,
    substrateMode: substrate.mode,
    objectiveKey,
    benchmarkProjection: hydration.benchmarkProjection,
    decisionProjection: hydration.decisionProjection,
    historyProjection: hydration.historyProjection,
    artifactSummaryProjection: hydration.artifactSummaryProjection,
  };
}

async function showStatusOverlay(
  ctx: ExtensionCommandContext,
  runtime: AutopilotRuntimeState | null,
  reports: AutopilotReport[],
): Promise<boolean> {
  if (!ctx.hasUI || typeof (ctx.ui as { custom?: unknown }).custom !== "function") {
    return false;
  }

  const lines = buildAutopilotOverlayLines(runtime, reports);
  const custom = (ctx.ui as {
    custom: (
      factory: (tui: unknown, theme: { fg: (token: string, text: string) => string }, kb: unknown, done: (value: undefined) => void) => {
        render(width: number): string[];
        invalidate(): void;
        handleInput?(data: string): void;
      },
      options: Record<string, unknown>,
    ) => Promise<unknown>;
  }).custom;

  await custom(
    (_tui, theme, _kb, done) => ({
      render: (_width: number) => lines.map((line, index) => (index === 0 ? theme.fg("accent", line) : line)),
      invalidate() {},
      handleInput() {
        done(undefined);
      },
    }),
    { overlay: true, overlayOptions: { anchor: "top-right", width: "50%", margin: 1, maxHeight: 16 } },
  );

  return true;
}

export default function autopilotExtension(pi: ExtensionAPI): void {
  let reports: AutopilotReport[] = [];
  let runtime: AutopilotRuntimeState | null = null;
  let pendingDispatch = false;

  const rebuild = (ctx: ExtensionContext) => {
    const restored = restoreInteractiveRuntime(ctx.sessionManager.getBranch() as never[]);
    reports = restored.reports;
    runtime = restored.runtime;
    pendingDispatch = false;
    if (runtime && runtime.mode !== "closed") {
      const substrate = ensureSubstrate(ctx.cwd);
      const objectiveKey = runtime.objectiveKey ?? deriveAutopilotObjectiveKey(runtime.goal, ctx.cwd);
      if (runtime.substrateMode !== substrate.mode || runtime.objectiveKey !== objectiveKey) {
        runtime = { ...runtime, substrateMode: substrate.mode, objectiveKey };
        persistRuntime(pi, runtime);
      }
    } else {
      setRuntimeSubstrate(undefined);
    }
    updateUi(ctx, runtime, reports);
  };

  const dispatchCurrentPhase = async (ctx: ExtensionContext) => {
    if (!runtime) return;

    const built = await buildInteractivePrompt(runtime, reports, ctx.cwd);
    runtime = {
      ...runtime,
      warnings: built.warnings,
      substrateMode: built.substrateMode,
      objectiveKey: built.objectiveKey,
      benchmarkProjection: built.benchmarkProjection,
      decisionProjection: built.decisionProjection,
      historyProjection: built.historyProjection,
      artifactSummaryProjection: built.artifactSummaryProjection,
      dispatchState: "awaiting_report",
      updatedAtMs: Date.now(),
    };
    persistRuntime(pi, runtime);
    updateUi(ctx, runtime, reports);

    if (ctx.isIdle() && !ctx.hasPendingMessages()) {
      pi.sendUserMessage(built.prompt);
    } else {
      pi.sendUserMessage(built.prompt, { deliverAs: "followUp" });
    }
  };

  pi.on("session_start", async (_event, ctx) => rebuild(ctx));
  pi.on("session_tree", async (_event, ctx) => rebuild(ctx));
  pi.on("session_shutdown", async (_event, ctx) => {
    setRuntimeSubstrate(undefined);
    if (ctx.hasUI) {
      ctx.ui.setStatus("autopilot", undefined);
      ctx.ui.setWidget("autopilot", undefined);
    }
  });

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === AUTOPILOT_REPORT_TOOL_NAME) return undefined;

    const substrate = getRuntimeSubstrate();
    if (!substrate || substrate.mode !== "bb") return undefined;
    if (!shouldPreflightToolCall(event.toolName, event.input as Record<string, unknown>)) return undefined;

    const result = await substrate.govern.evaluate({
      toolName: event.toolName,
      args: event.input as Record<string, unknown>,
      cwd: ctx.cwd,
    });

    if (!result.ok) {
      notify(ctx, `[bb-govern] ${result.summary}`, "warning");
      return undefined;
    }

    if (shouldBlockToolCall(result.data.decision)) {
      return {
        block: true,
        reason: formatGovernanceBlockReason(result.data),
      };
    }

    return undefined;
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName !== AUTOPILOT_REPORT_TOOL_NAME) return;
    if (!isAutopilotToolDetails(event.details)) return;

    reports.push(event.details.report);
    if (runtime) {
      runtime = advanceInteractiveRuntime(runtime, event.details.report);
      persistRuntime(pi, runtime);
      pendingDispatch = runtime.mode === "running" && runtime.dispatchState === "ready";
      if (runtime.mode === "closed") {
        setRuntimeSubstrate(undefined);
      }
    }

    updateUi(ctx, runtime, reports);
  });

  pi.on("turn_end", async (_event, ctx) => {
    if (!pendingDispatch) return;
    pendingDispatch = false;

    if (!runtime || runtime.mode !== "running" || runtime.dispatchState !== "ready") {
      updateUi(ctx, runtime, reports);
      return;
    }

    await dispatchCurrentPhase(ctx);
  });

  pi.registerTool({
    name: AUTOPILOT_REPORT_TOOL_NAME,
    label: "Autopilot Report",
    description: "Persist a structured phase report for the Pi autopilot scheduler.",
    promptSnippet: "Persist structured autopilot phase progress for orchestration.",
    promptGuidelines: [
      "When operating under an autopilot protocol, call this tool exactly once at the end of the prompt.",
      "Use the status field to tell the scheduler whether to continue execution, replan, stop, or close out.",
    ],
    parameters: AutopilotReportParams,
    async execute(_toolCallId, params) {
      const report: AutopilotReport = {
        phase: params.phase,
        status: params.status,
        summary: params.summary,
        waveId: params.waveId,
        stepId: params.stepId,
        nextAction: params.nextAction,
        evidence: [...(params.evidence ?? [])],
        artifacts: [...(params.artifacts ?? [])],
        risks: [...(params.risks ?? [])],
        timestampMs: Date.now(),
      };

      const details: AutopilotToolDetails = {
        report,
        historySize: reports.length + 1,
      };

      return {
        content: [
          {
            type: "text",
            text: `Recorded ${report.phase}/${report.status}: ${report.summary}`,
          },
        ],
        details,
      };
    },
  });

  pi.registerCommand(AUTOPILOT_RUN_COMMAND, {
    description: "Start Pi-native autopilot in the current session",
    handler: async (args, ctx: ExtensionCommandContext) => {
      const goal = args.trim();
      if (!goal) {
        notify(ctx, `Usage: /${AUTOPILOT_RUN_COMMAND} <goal>`, "warning");
        return;
      }
      if (runtime && runtime.mode === "running" && runtime.dispatchState === "awaiting_report") {
        notify(ctx, "Autopilot is already running in this session.", "warning");
        return;
      }

      const substrate = ensureSubstrate(ctx.cwd);
      runtime = {
        ...beginInteractiveRuntime({
          goal,
          maxWaves: DEFAULT_AUTOPILOT_MAX_WAVES,
          maxExecutionCyclesPerWave: DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE,
          objectiveKey: deriveAutopilotObjectiveKey(goal, ctx.cwd),
        }),
        substrateMode: substrate.mode,
      };
      reports = [];
      pendingDispatch = false;
      persistRuntime(pi, runtime);
      updateUi(ctx, runtime, reports);
      await dispatchCurrentPhase(ctx);
    },
  });

  pi.registerCommand(AUTOPILOT_RESUME_COMMAND, {
    description: "Resume Pi-native autopilot in the current session",
    handler: async (args, ctx: ExtensionCommandContext) => {
      const goal = args.trim();

      if (!runtime) {
        if (!goal) {
          notify(ctx, `Usage: /${AUTOPILOT_RESUME_COMMAND} <goal>`, "warning");
          return;
        }
        runtime = beginInteractiveRuntime({
          goal,
          maxWaves: DEFAULT_AUTOPILOT_MAX_WAVES,
          maxExecutionCyclesPerWave: DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE,
          objectiveKey: deriveAutopilotObjectiveKey(goal, ctx.cwd),
        });
      } else if (runtime.mode === "closed" && goal) {
        runtime = beginInteractiveRuntime({
          goal,
          maxWaves: runtime.maxWaves,
          maxExecutionCyclesPerWave: runtime.maxExecutionCyclesPerWave,
          objectiveKey: deriveAutopilotObjectiveKey(goal, ctx.cwd),
        });
      } else if (runtime.mode === "closed") {
        notify(ctx, "Autopilot is already closed. Start a new run with /autopilot-run <goal>.", "warning");
        return;
      }

      const substrate = ensureSubstrate(ctx.cwd);
      const resolvedGoal = goal || runtime.goal;
      runtime = {
        ...runtime,
        goal: resolvedGoal,
        mode: "running",
        substrateMode: substrate.mode,
        objectiveKey: deriveAutopilotObjectiveKey(resolvedGoal, ctx.cwd),
        ...(goal
          ? {
              benchmarkProjection: undefined,
              decisionProjection: undefined,
              historyProjection: undefined,
              artifactSummaryProjection: undefined,
            }
          : {}),
        updatedAtMs: Date.now(),
      };
      persistRuntime(pi, runtime);
      updateUi(ctx, runtime, reports);
      if (runtime.dispatchState === "ready") {
        await dispatchCurrentPhase(ctx);
      }
    },
  });

  pi.registerCommand(AUTOPILOT_PAUSE_COMMAND, {
    description: "Pause automatic next-phase scheduling",
    handler: async (_args, ctx: ExtensionCommandContext) => {
      if (!runtime) {
        notify(ctx, "No autopilot state recorded yet.", "info");
        return;
      }
      runtime = {
        ...runtime,
        mode: "paused",
        updatedAtMs: Date.now(),
      };
      persistRuntime(pi, runtime);
      updateUi(ctx, runtime, reports);
      notify(ctx, "Autopilot paused. Use /autopilot-resume to continue.", "info");
    },
  });

  pi.registerCommand(AUTOPILOT_STOP_COMMAND, {
    description: "Stop automatic autopilot continuation",
    handler: async (args, ctx: ExtensionCommandContext) => {
      if (!runtime) {
        notify(ctx, "No autopilot state recorded yet.", "info");
        return;
      }
      runtime = {
        ...runtime,
        mode: "stopping",
        updatedAtMs: Date.now(),
      };
      pendingDispatch = false;
      persistRuntime(pi, runtime);
      updateUi(ctx, runtime, reports);
      if (args.trim() === "now" && !ctx.isIdle()) {
        ctx.abort();
      }
      notify(ctx, "Autopilot stop requested. No further phases will be auto-queued.", "warning");
    },
  });

  pi.registerCommand(AUTOPILOT_STATUS_COMMAND, {
    description: "Show the current Pi-native autopilot state",
    handler: async (args, ctx: ExtensionCommandContext) => {
      if (args.trim() === "overlay") {
        const shown = await showStatusOverlay(ctx, runtime, reports);
        if (shown) return;
      }

      const lines = buildAutopilotStatusLines(runtime, reports);
      if (lines.length === 0) {
        notify(ctx, "No autopilot state recorded yet.", "info");
        return;
      }
      notify(ctx, lines.join("\n"), "info");
    },
  });
}
