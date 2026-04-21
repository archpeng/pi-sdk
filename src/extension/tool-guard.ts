import type { ExtensionCommandContext, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { AUTOPILOT_REPORT_TOOL_NAME } from "../autopilot/protocol.js";

export const AUTOPILOT_REQUIRED_TOOL_NAMES = [AUTOPILOT_REPORT_TOOL_NAME] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatSelectedTools(selectedTools?: string[]): string {
  if (!selectedTools || selectedTools.length === 0) return "(unknown)";
  return [...selectedTools].sort().join(", ");
}

export function getMissingRequiredTools(selectedTools?: string[]): string[] {
  if (!selectedTools) return [];
  return AUTOPILOT_REQUIRED_TOOL_NAMES.filter((toolName) => !selectedTools.includes(toolName));
}

export function buildMissingToolsReason(missingTools: string[], selectedTools?: string[]): string {
  const missing = missingTools.join(", ");
  return `Autopilot cannot continue because required tool(s) are unavailable: ${missing}. Active tools: ${formatSelectedTools(selectedTools)}. If you used --no-tools or --tools, include ${AUTOPILOT_REPORT_TOOL_NAME}.`;
}

function getSystemPromptMaybe(ctx: ExtensionContext): string {
  if (typeof ctx.getSystemPrompt !== "function") return "";
  try {
    return ctx.getSystemPrompt();
  } catch {
    return "";
  }
}

export function preflightAutopilotCommand(ctx: ExtensionCommandContext): { ok: true } | { ok: false; reason: string } {
  const systemPrompt = getSystemPromptMaybe(ctx);
  if (!systemPrompt) return { ok: true };

  const missingTools = AUTOPILOT_REQUIRED_TOOL_NAMES.filter(
    (toolName) => !new RegExp(`\\b${escapeRegExp(toolName)}\\b`, "u").test(systemPrompt),
  );
  if (missingTools.length === 0) return { ok: true };
  return { ok: false, reason: buildMissingToolsReason(missingTools) };
}
