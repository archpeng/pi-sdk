import type { ExtensionContext } from "@mariozechner/pi-coding-agent";
import { buildAutopilotWidgetLines } from "../autopilot/operator.js";
import type { AutopilotReport } from "../autopilot/protocol.js";
import type { AutopilotRuntimeState } from "../autopilot/state.js";

const AUTOPILOT_PHASE_LABELS: Record<AutopilotRuntimeState["phase"], string> = {
  master_plan: "MP",
  wave_plan: "WP",
  execute: "EX",
  review: "RV",
  replan: "RP",
  closeout: "CL",
};

type WorkingIndicatorTone = "accent" | "success" | "warning" | "muted" | "dim";

function latestReport(reports: AutopilotReport[]): AutopilotReport | undefined {
  return reports.at(-1);
}

function workingIndicatorTone(runtime: AutopilotRuntimeState): WorkingIndicatorTone {
  if (runtime.warnings.length > 0) return "warning";
  if (runtime.mode === "closed") return "success";
  if (runtime.mode === "paused") return "warning";
  if (runtime.mode === "stopping") return "warning";
  switch (runtime.phase) {
    case "execute":
      return "success";
    case "review":
      return "warning";
    case "replan":
      return "muted";
    case "closeout":
      return "dim";
    default:
      return "accent";
  }
}

function buildWorkingIndicator(ctx: ExtensionContext, runtime: AutopilotRuntimeState): { frames: string[]; intervalMs?: number } {
  const label = AUTOPILOT_PHASE_LABELS[runtime.phase] ?? "AP";
  const tone = workingIndicatorTone(runtime);
  if (runtime.mode === "running") {
    return {
      frames: [
        ctx.ui.theme.fg(tone, `${label}·`),
        ctx.ui.theme.fg(tone, `${label}•`),
        ctx.ui.theme.fg(tone, `${label}●`),
        ctx.ui.theme.fg(tone, `${label}•`),
      ],
      intervalMs: 120,
    };
  }
  if (runtime.mode === "paused") {
    return { frames: [ctx.ui.theme.fg("warning", `${label}‖`)] };
  }
  if (runtime.mode === "stopping") {
    return { frames: [ctx.ui.theme.fg("warning", `${label}■`)] };
  }
  if (runtime.mode === "closed") {
    return { frames: [ctx.ui.theme.fg("success", `${label}✓`)] };
  }
  return { frames: [ctx.ui.theme.fg("dim", `${label}·`)] };
}

function updateWorkingIndicator(ctx: ExtensionContext, runtime: AutopilotRuntimeState | null): void {
  if (!ctx.hasUI) return;
  const ui = ctx.ui as ExtensionContext["ui"] & { setWorkingIndicator?: (options?: { frames?: string[]; intervalMs?: number }) => void };
  if (typeof ui.setWorkingIndicator !== "function") return;
  if (!runtime) {
    ui.setWorkingIndicator();
    return;
  }
  ui.setWorkingIndicator(buildWorkingIndicator(ctx, runtime));
}

export function clearAutopilotUi(ctx: ExtensionContext): void {
  if (!ctx.hasUI) return;
  ctx.ui.setStatus("autopilot", undefined);
  ctx.ui.setWidget("autopilot", undefined);
  updateWorkingIndicator(ctx, null);
}

export function updateAutopilotUi(
  ctx: ExtensionContext,
  runtime: AutopilotRuntimeState | null,
  reports: AutopilotReport[],
): void {
  if (!ctx.hasUI) return;

  const latest = latestReport(reports);
  if (!runtime && !latest) {
    clearAutopilotUi(ctx);
    return;
  }

  if (runtime) {
    const tone: WorkingIndicatorTone = runtime.warnings.length > 0
      ? "warning"
      : runtime.mode === "closed"
        ? "success"
        : runtime.mode === "stopping"
          ? "warning"
          : "accent";
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
    updateWorkingIndicator(ctx, runtime);
    return;
  }

  ctx.ui.setStatus("autopilot", ctx.ui.theme.fg("accent", `🤖 ${latest?.phase ?? "autopilot"} · ${latest?.status ?? "-"}`));
  if (latest) {
    ctx.ui.setWidget("autopilot", [
      `${ctx.ui.theme.fg("accent", "Autopilot")} ${latest.phase} / ${latest.status}`,
      `summary: ${latest.summary}`,
    ]);
  }
  updateWorkingIndicator(ctx, null);
}
