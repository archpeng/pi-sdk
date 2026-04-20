import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type {
  ActiveControlPlaneSnapshot,
  AutopilotSubstrate,
  AutopilotSubstrateConfig,
  ControlPlaneProgressTransitionInput,
  MemoryRecallPayload,
  MemoryStorePayload,
  GovernEvaluatePayload,
  GovernPolicyPayload,
  PlanSyncEntry,
  WorkspaceDirtyPathEntry,
  WorkspaceScanEntry,
  WorksetActiveStageSnapshot,
} from "./types.js";
import { loadLocalControlPlaneSnapshot } from "./control-plane.js";
import { applyControlPlaneProgressWriteback, buildControlPlaneProgressTransition } from "./control-plane.js";

function ok<TData>(summary: string, data: TData, rawText = ""): { ok: true; summary: string; data: TData; rawText: string } {
  return {
    ok: true,
    summary,
    data,
    rawText,
  };
}

function runGit(pathname: string, args: string[]): string {
  return execFileSync("git", ["-C", pathname, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function runGitRaw(pathname: string, args: string[]): string {
  return execFileSync("git", ["-C", pathname, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).replace(/\s+$/, "");
}

function normalizeRepoRelativePath(pathname: string): string {
  return pathname.trim().replace(/^\.\//, "").replace(/\\/g, "/");
}

function unquoteGitPath(pathname: string): string {
  const trimmed = pathname.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function resolveStatusPath(rawPath: string): string {
  const unquoted = unquoteGitPath(rawPath);
  const renamedTarget = unquoted.includes(" -> ") ? unquoted.split(" -> ").at(-1) ?? unquoted : unquoted;
  return normalizeRepoRelativePath(renamedTarget);
}

function parseGitStatusEntries(statusOutput: string): WorkspaceDirtyPathEntry[] {
  const entries = new Map<string, WorkspaceDirtyPathEntry>();

  for (const rawLine of statusOutput.split("\n")) {
    if (rawLine.trim().length === 0) continue;
    const line = rawLine.replace(/\r$/, "");
    if (line.length < 4) continue;

    const pathText = line.slice(3);
    const pathname = resolveStatusPath(pathText);
    if (!pathname) continue;

    entries.set(pathname, {
      path: pathname,
      index_status: line[0] ?? " ",
      worktree_status: line[1] ?? " ",
    });
  }

  return [...entries.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function scanLocalWorkspace(pathname: string): WorkspaceScanEntry | null {
  try {
    const branch = runGit(pathname, ["rev-parse", "--abbrev-ref", "HEAD"]);
    const statusOutput = runGitRaw(pathname, ["status", "--porcelain"]);
    const dirtyDetails = parseGitStatusEntries(statusOutput);
    const dirtyPaths = dirtyDetails.map((entry) => entry.path);
    const dirtyFiles = dirtyDetails.length;
    let remote = "";
    try {
      remote = runGit(pathname, ["remote", "get-url", "origin"]);
    } catch {
      remote = "";
    }
    let recentCommits: string[] = [];
    try {
      recentCommits = runGit(pathname, ["log", "--oneline", "-n", "3"])
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    } catch {
      recentCommits = [];
    }

    return {
      path: pathname,
      name: path.basename(pathname),
      branch,
      dirty_files: dirtyFiles,
      status_summary: dirtyFiles === 0 ? "clean" : `${dirtyFiles} dirty`,
      remote,
      recent_commits: recentCommits,
      dirty_paths: dirtyPaths,
      dirty_details: dirtyDetails,
    };
  } catch {
    return null;
  }
}

export function createLocalSubstrate(config: AutopilotSubstrateConfig): AutopilotSubstrate {
  return {
    mode: "local",
    config,
    memory: {
      async recall() {
        return ok<MemoryRecallPayload>("local memory port: no recall configured", { items: [], count: 0 });
      },
      async store() {
        return ok<MemoryStorePayload>("local memory port: writeback skipped", { stored: false, response: null });
      },
    },
    govern: {
      async policy() {
        return ok<GovernPolicyPayload>("local govern port: no policy source configured", { policy: null });
      },
      async evaluate() {
        return ok<GovernEvaluatePayload>("local govern port: preflight bypassed", { decision: "allow" });
      },
    },
    workspace: {
      async scan(input) {
        const entries = input.workspaces
          .map((workspace) => scanLocalWorkspace(workspace))
          .filter((entry): entry is WorkspaceScanEntry => entry !== null);
        return ok<WorkspaceScanEntry[]>(
          `local workspace scan: ${entries.length} workspace(s)`,
          entries,
        );
      },
      async planSync() {
        return ok<PlanSyncEntry[]>("local workspace port: no remote plan sync configured", []);
      },
    },
    controlPlane: {
      async snapshot() {
        try {
          const snapshot = loadLocalControlPlaneSnapshot(config.planDocsPath, config.cwd);
          return ok<ActiveControlPlaneSnapshot | null>("local control-plane snapshot loaded", snapshot);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return ok<ActiveControlPlaneSnapshot | null>(
            `local control-plane snapshot unavailable: ${message}`,
            null,
          );
        }
      },
      async advance(input: ControlPlaneProgressTransitionInput & { nextStage: WorksetActiveStageSnapshot | null }) {
        try {
          const snapshot = loadLocalControlPlaneSnapshot(config.planDocsPath, config.cwd);
          const transition = buildControlPlaneProgressTransition(input);
          const readmePath = path.join(config.planDocsPath, "README.md");
          const statusPath = path.join(config.cwd, snapshot.readme.activePack.statusPath);
          const worksetPath = path.join(config.cwd, snapshot.readme.activePack.worksetPath);
          const updated = applyControlPlaneProgressWriteback({
            readmeMarkdown: readFileSync(readmePath, "utf8"),
            statusMarkdown: readFileSync(statusPath, "utf8"),
            worksetMarkdown: readFileSync(worksetPath, "utf8"),
            transition,
            nextStage: input.nextStage,
          });
          writeFileSync(readmePath, updated.readmeMarkdown, "utf8");
          writeFileSync(statusPath, updated.statusMarkdown, "utf8");
          writeFileSync(worksetPath, updated.worksetMarkdown, "utf8");
          return ok(
            "local control-plane writeback applied",
            {
              nextActiveSlice: input.nextStage?.stageId ?? null,
              updatedFiles: [
                path.relative(config.cwd, readmePath).replace(/\\/g, "/"),
                snapshot.readme.activePack.statusPath,
                snapshot.readme.activePack.worksetPath,
              ],
            },
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          return ok(
            `local control-plane writeback unavailable: ${message}`,
            {
              nextActiveSlice: null,
              updatedFiles: [],
            },
          );
        }
      },
    },
    autopilot: {
      async status() {
        return ok("local autopilot status projection unavailable", null);
      },
      async history() {
        return ok("local autopilot history projection unavailable", null);
      },
      async authority() {
        return ok("local autopilot decision authority projection unavailable", null);
      },
      async decisionAuthority() {
        return ok("local autopilot decision authority tool unavailable", null);
      },
      async decisionIntent() {
        return ok("local autopilot decision intent tool unavailable", null);
      },
      async decisionReconcilePlan() {
        return ok("local autopilot decision reconcile tool unavailable", null);
      },
      async learnedArtifactSummary() {
        return ok("local autopilot learned artifact summary projection unavailable", null);
      },
    },
  };
}
