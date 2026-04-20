import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { registerAutopilotCommands } from "./command-handlers.js";
import { buildInteractivePrompt, writeAcceptedSliceCompletion } from "./runtime-dispatch.js";
import {
  buildCompactionInstructions,
  buildContinuationContract,
  evaluateLocalDirtyRepoGuard,
  extractAutopilotOwnedPathsFromToolCall,
  missingLocalControlPlaneReason,
} from "./runtime-guardrails.js";
import { buildAutopilotOverlayLines, buildAutopilotStatusLines, buildAutopilotWidgetLines } from "../autopilot/operator.js";
import { buildPhasePrompt } from "../autopilot/phase-prompt.js";
import {
  AUTOPILOT_PHASES,
  AUTOPILOT_REPORT_TOOL_NAME,
  AUTOPILOT_STATUSES,
  deriveAutopilotObjectiveKey,
  formatAutopilotReport,
  type AutopilotReport,
  type AutopilotToolDetails,
  isAutopilotToolDetails,
} from "../autopilot/protocol.js";
import {
  AUTOPILOT_RUNTIME_ENTRY_TYPE,
  advanceInteractiveRuntime,
  haltInteractiveRuntime,
  registerAutopilotOwnedPaths,
  restoreInteractiveRuntime,
  type AutopilotRuntimeState,
} from "../autopilot/state.js";
import {
  createAutopilotSubstrate,
  formatGovernanceBlockReason,
  getRuntimeSubstrate,
  resolveAutopilotSubstrateConfig,
  setRuntimeSubstrate,
  shouldBlockToolCall,
  shouldPreflightToolCall,
  type AutopilotSubstrate,
} from "../substrate/index.js";

const AUTOPILOT_COMPACT_THRESHOLD_TOKENS = 100_000;

const AutopilotReportParams = Type.Object({
  phase: StringEnum(AUTOPILOT_PHASES),
  status: StringEnum(AUTOPILOT_STATUSES),
  summary: Type.String({ description: "Concrete summary of the current phase result" }),
  waveId: Type.Optional(Type.String({ description: "Wave identifier such as wave-1" })),
  stepId: Type.Optional(Type.String({ description: "Optional current step identifier" })),
  nextAction: Type.Optional(Type.String({ description: "What the outer orchestrator should do next" })),
  decisionMode: Type.Optional(Type.Union([Type.Literal("standard"), Type.Literal("goal_directed")])),
  decisionBasis: Type.Optional(Type.Array(Type.String({ description: "Why the chosen route best advances the overall objective" }))),
  candidateRoutes: Type.Optional(Type.Array(Type.String({ description: "Candidate routes considered before choosing the next path" }))),
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
  let compactionInFlight = false;

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

  const redispatchIfRunnable = async (ctx: ExtensionContext) => {
    if (!runtime || runtime.mode !== "running" || runtime.dispatchState !== "ready") return;
    await dispatchCurrentPhase(ctx);
  };

  const dispatchCurrentPhase = async (ctx: ExtensionContext) => {
    if (!runtime) return;

    const built = await buildInteractivePrompt(runtime, reports, ctx.cwd, buildPhasePrompt);
    if (built.substrateMode === "local" && !built.activeSlice) {
      const reason = missingLocalControlPlaneReason(ctx.cwd);
      runtime = haltInteractiveRuntime(runtime, reason);
      persistRuntime(pi, runtime);
      updateUi(ctx, runtime, reports);
      notify(ctx, reason, "warning");
      return;
    }

    let dirtyGuardWarning: string | undefined;
    if (built.substrateMode === "local" && !runtime.lastReportTimestampMs) {
      const decision = evaluateLocalDirtyRepoGuard({
        runtime,
        workspace: built.dirtyWorkspace,
        controlPlane: built.controlPlane,
        controlPlaneReadmePath: built.controlPlaneReadmePath,
      });
      if (decision.verdict === "block") {
        const reason = decision.reason ?? "dirty repo guard blocked the initial local run";
        runtime = haltInteractiveRuntime(runtime, reason);
        persistRuntime(pi, runtime);
        updateUi(ctx, runtime, reports);
        notify(ctx, reason, "warning");
        return;
      }
      dirtyGuardWarning = decision.verdict === "allow_with_warning" ? decision.reason : undefined;
      if (dirtyGuardWarning) {
        notify(ctx, dirtyGuardWarning, "info");
      }
    }

    const warnings = dirtyGuardWarning && !built.warnings.includes(dirtyGuardWarning)
      ? truncateWarnings([...built.warnings, dirtyGuardWarning])
      : built.warnings;

    runtime = {
      ...runtime,
      warnings,
      ...(built.activeSlice ? { activeSlice: built.activeSlice } : { activeSlice: undefined }),
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
  pi.on("session_compact", async (_event, ctx) => {
    compactionInFlight = false;
    rebuild(ctx);
    await redispatchIfRunnable(ctx);
  });
  pi.on("session_shutdown", async (_event, ctx) => {
    compactionInFlight = false;
    setRuntimeSubstrate(undefined);
    if (ctx.hasUI) {
      ctx.ui.setStatus("autopilot", undefined);
      ctx.ui.setWidget("autopilot", undefined);
    }
  });

  pi.on("before_agent_start", async (event, _ctx) => {
    if (!runtime || runtime.mode !== "running") return undefined;

    const contract = buildContinuationContract(runtime);
    return {
      message: {
        customType: "autopilot-continuation-contract",
        content: `Autopilot continuation contract active.\n${contract}`,
        display: true,
      },
      systemPrompt: `${event.systemPrompt}\n\n${contract}`,
    };
  });

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === AUTOPILOT_REPORT_TOOL_NAME) return undefined;

    if (runtime?.mode === "running" && runtime.substrateMode === "local") {
      const ownedPaths = extractAutopilotOwnedPathsFromToolCall(
        event.toolName,
        event.input as Record<string, unknown>,
      );
      if (ownedPaths.length > 0) {
        runtime = registerAutopilotOwnedPaths(runtime, ownedPaths);
        persistRuntime(pi, runtime);
      }
    }

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
      runtime = await writeAcceptedSliceCompletion(pi, ctx, runtime, event.details.report, persistRuntime, notify);
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

    const usage = typeof ctx.getContextUsage === "function" ? ctx.getContextUsage() : null;
    if (!compactionInFlight && usage && typeof usage.tokens === "number" && usage.tokens > AUTOPILOT_COMPACT_THRESHOLD_TOKENS) {
      compactionInFlight = true;
      ctx.compact({
        customInstructions: buildCompactionInstructions(runtime),
        onError: (error) => {
          compactionInFlight = false;
          notify(ctx, `Autopilot compaction failed: ${error.message}`, "warning");
          void redispatchIfRunnable(ctx);
        },
      });
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
      if (runtime && params.phase !== runtime.phase) {
        const reason = `autopilot_report phase must match the current runtime phase (${runtime.phase})`;
        runtime = haltInteractiveRuntime(runtime, reason);
        persistRuntime(pi, runtime);
        throw new Error(reason);
      }
      if (runtime?.activeSlice && params.stepId !== runtime.activeSlice.stepId) {
        const reason = `autopilot_report stepId must match the active slice (${runtime.activeSlice.stepId})`;
        runtime = haltInteractiveRuntime(runtime, reason);
        persistRuntime(pi, runtime);
        throw new Error(reason);
      }
      const report: AutopilotReport = {
        phase: params.phase,
        status: params.status,
        summary: params.summary,
        waveId: params.waveId,
        stepId: params.stepId,
        nextAction: params.nextAction,
        decisionMode: params.decisionMode,
        decisionBasis: [...(params.decisionBasis ?? [])],
        candidateRoutes: [...(params.candidateRoutes ?? [])],
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

  registerAutopilotCommands({
    pi,
    getRuntime: () => runtime,
    setRuntime: (nextRuntime) => {
      runtime = nextRuntime;
    },
    getReportsCount: () => reports.length,
    setPendingDispatch: (pending) => {
      pendingDispatch = pending;
    },
    ensureSubstrate,
    persistRuntime,
    updateUi: (ctx, nextRuntime) => updateUi(ctx, nextRuntime, reports),
    notify,
    dispatchCurrentPhase,
    showStatusOverlay: (ctx, nextRuntime) => showStatusOverlay(ctx, nextRuntime, reports),
    statusLines: (nextRuntime) => buildAutopilotStatusLines(nextRuntime, reports),
  });
}
