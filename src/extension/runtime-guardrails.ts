import type { AutopilotRuntimeState } from "../autopilot/state.js";
import type { ActiveControlPlaneSnapshot, WorkspaceScanEntry } from "../substrate/types.js";

export function buildContinuationContract(runtime: AutopilotRuntimeState): string {
  return [
    "Autopilot continuation contract:",
    "- Do not ask the user whether to continue.",
    "- Assume pre-authorization to continue while autopilot mode remains running.",
    "- The extension scheduler decides whether another autopilot phase will be queued.",
    "- Only ask the user a question if you are truly blocked on missing external input or a real approval boundary.",
    `- Current autopilot phase: ${runtime.phase}.`,
    `- Current wave/cycle: ${runtime.currentWave}/${runtime.currentCycle}.`,
  ].join("\n");
}

export function buildCompactionInstructions(runtime: AutopilotRuntimeState): string {
  return [
    "Autopilot compaction focus:",
    `- Goal: ${runtime.goal}`,
    `- Preserve the current runnable phase: ${runtime.phase}.`,
    `- Preserve the current wave/cycle: ${runtime.currentWave}/${runtime.currentCycle}.`,
    "- Preserve the latest autopilot decision, blockers, and immediate next action.",
  ].join("\n");
}

function normalizeRepoPath(pathname: string): string {
  return pathname.trim().replace(/^\.\//, "").replace(/\\/g, "/");
}

function summarizePaths(paths: string[], limit = 5): string {
  if (paths.length <= limit) return paths.join(", ");
  return `${paths.slice(0, limit).join(", ")} (+${paths.length - limit} more)`;
}

function extractDirtyPaths(workspace: WorkspaceScanEntry): string[] {
  const combined = [
    ...(workspace.dirty_paths ?? []),
    ...((workspace.dirty_details ?? []).map((entry) => entry.path)),
  ];

  return [...new Set(combined.map(normalizeRepoPath).filter((pathname) => pathname.length > 0))].sort();
}

function buildControlPlaneDirtyAllowance(
  controlPlaneReadmePath: string,
  controlPlane: ActiveControlPlaneSnapshot | null,
  runtime: AutopilotRuntimeState,
): {
  allAllowedPaths: string[];
  controlPlanePaths: string[];
} {
  const controlPlanePaths = [
    controlPlaneReadmePath,
    ...(controlPlane
      ? [
          controlPlane.readme.activePack.planPath,
          controlPlane.readme.activePack.statusPath,
          controlPlane.readme.activePack.worksetPath,
        ]
      : []),
  ]
    .map(normalizeRepoPath)
    .filter((pathname) => pathname.length > 0);

  const allAllowedPaths = [
    ...controlPlanePaths,
    ...((runtime.autopilotOwnedPaths ?? []).map(normalizeRepoPath).filter((pathname) => pathname.length > 0)),
  ];

  return {
    controlPlanePaths: [...new Set(controlPlanePaths)].sort(),
    allAllowedPaths: [...new Set(allAllowedPaths)].sort(),
  };
}

export interface LocalDirtyRepoGuardDecision {
  verdict: "allow" | "allow_with_warning" | "block";
  reason?: string;
  dirtyPaths: string[];
  allowedPaths: string[];
  offendingPaths: string[];
}

export function evaluateLocalDirtyRepoGuard(input: {
  runtime: AutopilotRuntimeState;
  workspace: WorkspaceScanEntry | undefined;
  controlPlane: ActiveControlPlaneSnapshot | null;
  controlPlaneReadmePath: string;
}): LocalDirtyRepoGuardDecision {
  const workspace = input.workspace;
  if (!workspace || workspace.dirty_files === 0) {
    return {
      verdict: "allow",
      dirtyPaths: [],
      allowedPaths: [],
      offendingPaths: [],
    };
  }

  const dirtyPaths = extractDirtyPaths(workspace);
  const allowance = buildControlPlaneDirtyAllowance(input.controlPlaneReadmePath, input.controlPlane, input.runtime);
  const allowedSet = new Set(allowance.allAllowedPaths);

  if (dirtyPaths.length === 0) {
    return {
      verdict: "block",
      reason: `dirty repo guard: ${workspace.name}@${workspace.branch} has ${workspace.dirty_files} dirty files but no path-level detail was available`,
      dirtyPaths,
      allowedPaths: allowance.allAllowedPaths,
      offendingPaths: [],
    };
  }

  const offendingPaths = dirtyPaths.filter((pathname) => !allowedSet.has(pathname));
  if (offendingPaths.length > 0) {
    return {
      verdict: "block",
      reason: `dirty repo guard: ${workspace.name}@${workspace.branch} has dirty files outside the repo-local control-plane / autopilot-owned allowance (${summarizePaths(offendingPaths)})`,
      dirtyPaths,
      allowedPaths: allowance.allAllowedPaths,
      offendingPaths,
    };
  }

  const usedOwnedPaths = dirtyPaths.some((pathname) => !allowance.controlPlanePaths.includes(pathname));
  const allowanceLabel = usedOwnedPaths
    ? "repo-local control-plane / autopilot-owned files"
    : "repo-local control-plane files";

  return {
    verdict: "allow_with_warning",
    reason: `dirty repo guard: allowing local run because dirty paths are limited to ${allowanceLabel} (${summarizePaths(dirtyPaths)})`,
    dirtyPaths,
    allowedPaths: allowance.allAllowedPaths,
    offendingPaths: [],
  };
}

export function extractAutopilotOwnedPathsFromToolCall(
  toolName: string,
  input: Record<string, unknown>,
): string[] {
  if ((toolName === "edit" || toolName === "write") && typeof input.path === "string") {
    return [normalizeRepoPath(input.path)];
  }
  return [];
}

export function missingLocalControlPlaneReason(cwd: string): string {
  return `repo-local active control-plane required for extension-driven autopilot in local mode (${cwd}/docs/plan)`;
}
