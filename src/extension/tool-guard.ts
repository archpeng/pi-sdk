import type { ExtensionCommandContext, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
  AUTOPILOT_REPORT_TOOL_NAME,
  getRequiredToolNamesForAutopilotPhase,
  resolveAutopilotPhaseRoute,
  type AutopilotPhase,
} from "../autopilot/protocol.js";

export const AUTOPILOT_REQUIRED_TOOL_NAMES = [AUTOPILOT_REPORT_TOOL_NAME] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatSelectedTools(selectedTools?: string[]): string {
  if (!selectedTools || selectedTools.length === 0) return "(unknown)";
  return [...selectedTools].sort().join(", ");
}

export function getMissingRequiredTools(selectedTools: string[] | undefined, phase: AutopilotPhase): string[] {
  if (!selectedTools) return [];
  const requiredTools = getRequiredToolNamesForAutopilotPhase(phase);
  return requiredTools.filter((toolName) => !selectedTools.includes(toolName));
}

export function buildMissingToolsReason(
  missingTools: string[],
  selectedTools: string[] | undefined,
  phase: AutopilotPhase,
): string {
  const route = resolveAutopilotPhaseRoute(phase);
  const missing = missingTools.join(", ");
  const required = getRequiredToolNamesForAutopilotPhase(phase).join(", ");
  const routeLabel = route.surface === "skill"
    ? `skill route ${route.skillName}`
    : "built-in closeout prompt route";
  return `Autopilot cannot continue because required tool(s) are unavailable for ${phase} (${routeLabel}): ${missing}. Active tools: ${formatSelectedTools(selectedTools)}. If you used --no-tools or --tools, include ${required}.`;
}

function getSystemPromptMaybe(ctx: ExtensionContext): string {
  if (typeof ctx.getSystemPrompt !== "function") return "";
  try {
    return ctx.getSystemPrompt();
  } catch {
    return "";
  }
}

export function preflightAutopilotCommand(
  ctx: ExtensionCommandContext,
  phase: AutopilotPhase,
): { ok: true } | { ok: false; reason: string } {
  const systemPrompt = getSystemPromptMaybe(ctx);
  if (!systemPrompt) return { ok: true };

  try {
    const requiredTools = getRequiredToolNamesForAutopilotPhase(phase);
    const missingTools = requiredTools.filter(
      (toolName) => !new RegExp(`\\b${escapeRegExp(toolName)}\\b`, "u").test(systemPrompt),
    );
    if (missingTools.length === 0) return { ok: true };
    return { ok: false, reason: buildMissingToolsReason(missingTools, undefined, phase) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : `failed to resolve deterministic tool contract for ${phase}`;
    return { ok: false, reason };
  }
}
