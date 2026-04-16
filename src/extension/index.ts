import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import {
  AUTOPILOT_PHASES,
  AUTOPILOT_REPORT_TOOL_NAME,
  AUTOPILOT_STATUSES,
  AUTOPILOT_STATUS_COMMAND,
  formatAutopilotReport,
  type AutopilotReport,
  type AutopilotToolDetails,
  isAutopilotToolDetails,
} from "../shared/types.js";

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

function collectReports(ctx: ExtensionContext): AutopilotReport[] {
  const reports: AutopilotReport[] = [];

  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type !== "message") continue;
    const message = entry.message;
    if (message.role !== "toolResult" || message.toolName !== AUTOPILOT_REPORT_TOOL_NAME) continue;
    const details = message.details;
    if (isAutopilotToolDetails(details)) {
      reports.push(details.report);
    }
  }

  return reports;
}

function updateUi(ctx: ExtensionContext, reports: AutopilotReport[]): void {
  if (!ctx.hasUI) return;

  const latest = reports.at(-1);
  if (!latest) {
    ctx.ui.setStatus("autopilot", undefined);
    ctx.ui.setWidget("autopilot", undefined);
    return;
  }

  const statusText = ctx.ui.theme.fg(
    latest.status === "done" ? "success" : latest.status === "failed" || latest.status === "blocked" ? "error" : "accent",
    `🤖 ${latest.phase} · ${latest.status}`,
  );
  ctx.ui.setStatus("autopilot", statusText);

  const lines = [
    `${ctx.ui.theme.fg("accent", "Autopilot")} ${latest.phase} / ${latest.status}`,
    `wave: ${latest.waveId ?? "-"}`,
    `summary: ${latest.summary}`,
  ];
  if (latest.nextAction) lines.push(`next: ${latest.nextAction}`);
  if (latest.risks.length > 0) lines.push(`risks: ${latest.risks.join(" | ")}`);
  ctx.ui.setWidget("autopilot", lines);
}

export default function autopilotExtension(pi: ExtensionAPI): void {
  let reports: AutopilotReport[] = [];

  const rebuild = (ctx: ExtensionContext) => {
    reports = collectReports(ctx);
    updateUi(ctx, reports);
  };

  pi.on("session_start", async (_event, ctx) => rebuild(ctx));
  pi.on("session_tree", async (_event, ctx) => rebuild(ctx));
  pi.on("session_shutdown", async (_event, ctx) => {
    if (ctx.hasUI) {
      ctx.ui.setStatus("autopilot", undefined);
      ctx.ui.setWidget("autopilot", undefined);
    }
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName !== AUTOPILOT_REPORT_TOOL_NAME) return;
    if (isAutopilotToolDetails(event.details)) {
      reports.push(event.details.report);
      updateUi(ctx, reports);
    }
  });

  pi.registerTool({
    name: AUTOPILOT_REPORT_TOOL_NAME,
    label: "Autopilot Report",
    description: "Persist a structured phase report for the external autopilot orchestrator.",
    promptSnippet: "Persist structured autopilot phase progress for orchestration.",
    promptGuidelines: [
      "When operating under an autopilot protocol, call this tool exactly once at the end of the prompt.",
      "Use the status field to tell the orchestrator whether to continue execution, replan, stop, or close out.",
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

  pi.registerCommand(AUTOPILOT_STATUS_COMMAND, {
    description: "Show the latest autopilot report",
    handler: async (_args, ctx) => {
      const latest = reports.at(-1);
      if (!latest) {
        if (ctx.hasUI) ctx.ui.notify("No autopilot state recorded yet.", "info");
        else console.log("No autopilot state recorded yet.");
        return;
      }

      const output = formatAutopilotReport(latest);
      if (ctx.hasUI) ctx.ui.notify(output, "info");
      else console.log(output);
    },
  });
}
