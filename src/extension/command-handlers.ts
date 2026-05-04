import type { ExtensionAPI, ExtensionCommandContext, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
  AUTOPILOT_PAUSE_COMMAND,
  AUTOPILOT_RESUME_COMMAND,
  AUTOPILOT_RUN_COMMAND,
  AUTOPILOT_STATUS_COMMAND,
  AUTOPILOT_STOP_COMMAND,
  DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE,
  DEFAULT_AUTOPILOT_MAX_WAVES,
  deriveAutopilotObjectiveKey,
  type AutopilotPhase,
} from "../autopilot/protocol.js";
import { beginInteractiveRuntime, type AutopilotRuntimeState } from "../autopilot/state.js";
import type { ActiveControlPlaneSnapshot, AutopilotSubstrate } from "../substrate/index.js";

interface CommandHandlerRuntimeAccess {
  getRuntime(): AutopilotRuntimeState | null;
  setRuntime(runtime: AutopilotRuntimeState | null): void;
  getReportsCount(): number;
  setPendingDispatch(pending: boolean): void;
}

interface CommandHandlerDependencies extends CommandHandlerRuntimeAccess {
  pi: ExtensionAPI;
  ensureSubstrate(cwd: string): AutopilotSubstrate;
  persistRuntime(pi: ExtensionAPI, runtime: AutopilotRuntimeState | null): void;
  updateUi(ctx: ExtensionContext, runtime: AutopilotRuntimeState | null): void;
  notify(ctx: ExtensionContext, message: string, kind?: "info" | "warning" | "error"): void;
  preflightAutopilotCommand(
    ctx: ExtensionCommandContext,
    phase: AutopilotRuntimeState["phase"],
  ): { ok: true } | { ok: false; reason: string };
  dispatchCurrentPhase(ctx: ExtensionContext): Promise<void>;
  showStatusOverlay(
    ctx: ExtensionCommandContext,
    runtime: AutopilotRuntimeState | null,
  ): Promise<boolean>;
  statusLines(runtime: AutopilotRuntimeState | null): string[];
}

export function deriveResumePhaseFromControlPlane(snapshot: ActiveControlPlaneSnapshot | null): AutopilotPhase {
  if (!snapshot) return "master_plan";

  const activeSlice = snapshot.readme.activeSlice.trim();
  const handoff = snapshot.readme.intendedHandoff.trim().toLowerCase();
  const owner = snapshot.activeStage.owner.trim().toLowerCase();
  const state = snapshot.activeStage.state.trim().toLowerCase();
  const routeText = `${handoff} ${owner} ${state}`;

  if (activeSlice === "PACK_COMPLETE" || (owner === "closeout" && state.includes("done")) || handoff === "autopilot-closeout") {
    return "closeout";
  }
  if (routeText.includes("execution-reality-audit") || routeText.includes("review") || routeText.includes("done_pending_review")) {
    return "review";
  }
  if (routeText.includes("execute-plan") || routeText.includes("execute")) {
    return "execute";
  }
  if (routeText.includes("plan-creator") || routeText.includes("replan")) {
    return state.includes("replan") ? "replan" : "wave_plan";
  }
  return "master_plan";
}

async function resolveResumePhase(substrate: AutopilotSubstrate): Promise<AutopilotPhase> {
  if (substrate.mode !== "local" || !substrate.controlPlane) return "master_plan";
  const snapshot = await substrate.controlPlane.snapshot();
  if (!snapshot.ok) return "master_plan";
  return deriveResumePhaseFromControlPlane(snapshot.data);
}

export function registerAutopilotCommands(deps: CommandHandlerDependencies): void {
  deps.pi.registerCommand(AUTOPILOT_RUN_COMMAND, {
    description: "Start Pi-native autopilot in the current session",
    handler: async (args, ctx: ExtensionCommandContext) => {
      const goal = args.trim();
      if (!goal) {
        deps.notify(ctx, `Usage: /${AUTOPILOT_RUN_COMMAND} <goal>`, "warning");
        return;
      }
      const current = deps.getRuntime();
      if (current && current.mode === "running" && current.dispatchState === "awaiting_report") {
        deps.notify(ctx, "Autopilot is already running in this session.", "warning");
        return;
      }

      const preflight = deps.preflightAutopilotCommand(ctx, "master_plan");
      if (!preflight.ok) {
        deps.notify(ctx, preflight.reason, "warning");
        return;
      }

      const substrate = deps.ensureSubstrate(ctx.cwd);
      const runtime: AutopilotRuntimeState = {
        ...beginInteractiveRuntime({
          goal,
          maxWaves: DEFAULT_AUTOPILOT_MAX_WAVES,
          maxExecutionCyclesPerWave: DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE,
          objectiveKey: deriveAutopilotObjectiveKey(goal, ctx.cwd),
        }),
        substrateMode: substrate.mode,
      };
      deps.setRuntime(runtime);
      deps.setPendingDispatch(false);
      deps.persistRuntime(deps.pi, runtime);
      deps.updateUi(ctx, runtime);
      await deps.dispatchCurrentPhase(ctx);
    },
  });

  deps.pi.registerCommand(AUTOPILOT_RESUME_COMMAND, {
    description: "Resume Pi-native autopilot in the current session",
    handler: async (args, ctx: ExtensionCommandContext) => {
      const goal = args.trim();
      let runtime = deps.getRuntime();
      const substrate = deps.ensureSubstrate(ctx.cwd);

      if (!runtime) {
        if (!goal) {
          deps.notify(ctx, `Usage: /${AUTOPILOT_RESUME_COMMAND} <goal>`, "warning");
          return;
        }
        runtime = {
          ...beginInteractiveRuntime({
            goal,
            maxWaves: DEFAULT_AUTOPILOT_MAX_WAVES,
            maxExecutionCyclesPerWave: DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE,
            objectiveKey: deriveAutopilotObjectiveKey(goal, ctx.cwd),
          }),
          phase: await resolveResumePhase(substrate),
        };
      } else if (runtime.mode === "closed" && goal) {
        runtime = beginInteractiveRuntime({
          goal,
          maxWaves: runtime.maxWaves,
          maxExecutionCyclesPerWave: runtime.maxExecutionCyclesPerWave,
          objectiveKey: deriveAutopilotObjectiveKey(goal, ctx.cwd),
        });
      } else if (runtime.mode === "closed") {
        deps.notify(ctx, "Autopilot is already closed. Start a new run with /autopilot-run <goal>.", "warning");
        return;
      }

      const preflight = deps.preflightAutopilotCommand(ctx, runtime.phase);
      if (!preflight.ok) {
        deps.notify(ctx, preflight.reason, "warning");
        return;
      }

      const resolvedGoal = goal || runtime.goal;
      const resumed: AutopilotRuntimeState = {
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
      deps.setRuntime(resumed);
      deps.persistRuntime(deps.pi, resumed);
      deps.updateUi(ctx, resumed);
      if (resumed.dispatchState === "ready") {
        await deps.dispatchCurrentPhase(ctx);
      }
    },
  });

  deps.pi.registerCommand(AUTOPILOT_PAUSE_COMMAND, {
    description: "Pause automatic next-phase scheduling",
    handler: async (_args, ctx: ExtensionCommandContext) => {
      const runtime = deps.getRuntime();
      if (!runtime) {
        deps.notify(ctx, "No autopilot state recorded yet.", "info");
        return;
      }
      const paused: AutopilotRuntimeState = {
        ...runtime,
        mode: "paused",
        updatedAtMs: Date.now(),
      };
      deps.setRuntime(paused);
      deps.persistRuntime(deps.pi, paused);
      deps.updateUi(ctx, paused);
      deps.notify(ctx, "Autopilot paused. Use /autopilot-resume to continue.", "info");
    },
  });

  deps.pi.registerCommand(AUTOPILOT_STOP_COMMAND, {
    description: "Stop automatic autopilot continuation",
    handler: async (args, ctx: ExtensionCommandContext) => {
      const runtime = deps.getRuntime();
      if (!runtime) {
        deps.notify(ctx, "No autopilot state recorded yet.", "info");
        return;
      }
      const stopping: AutopilotRuntimeState = {
        ...runtime,
        mode: "stopping",
        updatedAtMs: Date.now(),
      };
      deps.setRuntime(stopping);
      deps.setPendingDispatch(false);
      deps.persistRuntime(deps.pi, stopping);
      deps.updateUi(ctx, stopping);
      if (args.trim() === "now" && !ctx.isIdle()) {
        ctx.abort();
      }
      deps.notify(ctx, "Autopilot stop requested. No further phases will be auto-queued.", "warning");
    },
  });

  deps.pi.registerCommand(AUTOPILOT_STATUS_COMMAND, {
    description: "Show the current Pi-native autopilot state",
    handler: async (args, ctx: ExtensionCommandContext) => {
      if (args.trim() === "overlay") {
        const shown = await deps.showStatusOverlay(ctx, deps.getRuntime());
        if (shown) return;
      }

      const lines = deps.statusLines(deps.getRuntime());
      if (lines.length === 0) {
        deps.notify(ctx, "No autopilot state recorded yet.", "info");
        return;
      }
      deps.notify(ctx, lines.join("\n"), "info");
    },
  });
}
