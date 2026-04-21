import type { AutopilotRuntimeState } from "../autopilot/state.js";

function summarizeSessionTarget(targetSessionFile: string | undefined): string {
  if (!targetSessionFile) return "target session";
  const segments = targetSessionFile.split(/[\\/]/u).filter(Boolean);
  return segments.at(-1) ?? targetSessionFile;
}

export function buildSessionShutdownMessage(
  reason: string | undefined,
  targetSessionFile: string | undefined,
  runtime: AutopilotRuntimeState | null,
): string | undefined {
  if (!runtime || runtime.mode === "closed") return undefined;

  switch (reason) {
    case "reload":
      return "Autopilot extension reload in progress; runtime state will be rebuilt from the current session history if still applicable.";
    case "new":
      return `Autopilot session handoff: switching to a new session (${summarizeSessionTarget(targetSessionFile)}). Runtime state remains bound to the source session until the destination rebuilds it explicitly.`;
    case "resume":
      return `Autopilot session handoff: resuming into ${summarizeSessionTarget(targetSessionFile)}. Runtime/UI state from the old session is being cleared before rebuild.`;
    case "fork":
      return `Autopilot branch handoff: replacement session ${summarizeSessionTarget(targetSessionFile)} was created from the current path. The destination session must rebuild its runtime state from persisted history.`;
    default:
      return undefined;
  }
}
