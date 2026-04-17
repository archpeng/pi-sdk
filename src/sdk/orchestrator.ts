#!/usr/bin/env node

import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  ModelRegistry,
  SessionManager,
  SettingsManager,
} from "@mariozechner/pi-coding-agent";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCloseoutSummaryLines } from "../autopilot/closeout.js";
import { runAutopilotWorkflow } from "../autopilot/engine.js";
import { buildPhasePrompt } from "../autopilot/phase-prompt.js";
import { buildAutopilotArtifactSummaryProjection } from "../autopilot/artifact-summary-projection.js";
import { buildAutopilotBenchmarkProjection } from "../autopilot/benchmark-projection.js";
import { buildAutopilotDecisionProjection } from "../autopilot/decision-projection.js";
import { buildAutopilotHistoryProjection } from "../autopilot/history-projection.js";
import {
  AUTOPILOT_REPORT_TOOL_NAME,
  deriveAutopilotObjectiveKey,
  formatAutopilotReport,
  type AutopilotPhase,
  type AutopilotReport,
  type AutopilotRunOptions,
  type AutopilotRunSummary,
  isAutopilotToolDetails,
} from "../autopilot/protocol.js";
import { formatAutopilotCliUsage, parseAutopilotCliCommand } from "./cli.js";
import {
  buildPhaseHydrationSections,
  buildRawPhaseEvidence,
  buildAutopilotRunManifest,
  createAutopilotSubstrate,
  formatAutopilotDoctorResult,
  loadAutopilotPackageMetadata,
  loadRunWorkspaceSnapshot,
  preparePhaseHydration,
  resolveAutopilotSubstrateConfig,
  runAutopilotDoctorChecks,
  setRuntimeSubstrate,
  type AutopilotSubstrate,
  type RunWorkspaceSnapshot,
} from "../substrate/index.js";

function resolveExtensionPath(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const candidates = [
    path.resolve(currentDir, "../extension/index.js"),
    path.resolve(currentDir, "../extension/index.ts"),
  ];

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`Could not resolve bundled extension. Tried: ${candidates.join(", ")}`);
  }
  return found;
}

function createAuthAndRegistry(agentDir: string): { authStorage: AuthStorage; modelRegistry: ModelRegistry } {
  const authStorage = AuthStorage.create(path.join(agentDir, "auth.json"));
  const modelRegistry = ModelRegistry.create(authStorage, path.join(agentDir, "models.json"));
  return { authStorage, modelRegistry };
}

function resolveModel(modelRegistry: ModelRegistry, spec: string | undefined) {
  if (!spec) return undefined;

  const [provider, id] = spec.split("/");
  if (!provider || !id) {
    throw new Error(`Model must use provider/id format, received: ${spec}`);
  }

  return modelRegistry.find(provider, id);
}

function recordWarning(warnings: string[], warning: string): void {
  warnings.push(warning);
  console.error(`[substrate] ${warning}`);
}

function createTaskId(goal: string, cwd: string): string {
  return `autopilot:${createHash("sha1").update(`${cwd}\u0000${goal}`).digest("hex").slice(0, 12)}`;
}

async function persistPhaseEvidence(
  substrate: AutopilotSubstrate,
  options: AutopilotRunOptions,
  sessionId: string,
  report: AutopilotReport,
  currentWave: number,
  currentCycle: number,
  warnings: string[],
): Promise<void> {
  const result = await substrate.memory.store({
    content: buildRawPhaseEvidence({
      goal: options.goal,
      cwd: options.cwd,
      report,
      wave: currentWave,
      cycle: currentCycle,
    }),
    toolName: "pi-sdk-autopilot",
    memoryClass: "tool_episodic",
    effectSummary: `${report.phase}/${report.status}: ${report.summary}`,
    sessionId,
    taskId: createTaskId(options.goal, options.cwd),
    metadata: {
      phase: report.phase,
      status: report.status,
      wave: String(currentWave),
      cycle: String(currentCycle),
      cwd: options.cwd,
    },
  });

  if (!result.ok) {
    recordWarning(warnings, result.summary);
  }
}

async function runPhase(
  session: Awaited<ReturnType<typeof createAgentSession>>["session"],
  reports: AutopilotReport[],
  phase: AutopilotPhase,
  options: AutopilotRunOptions,
  currentWave: number,
  currentCycle: number,
  substrate: AutopilotSubstrate,
  runWorkspace: RunWorkspaceSnapshot,
  objectiveKey: string,
  warnings: string[],
): Promise<AutopilotReport> {
  const baseline = reports.length;
  const hydration = await preparePhaseHydration({
    substrate,
    phase,
    goal: options.goal,
    currentWave,
    currentCycle,
    recentReports: reports.slice(-6),
    objectiveKey,
    sessionId: session.sessionId,
    runWorkspace,
  });
  for (const warning of hydration.warnings) {
    recordWarning(warnings, warning);
  }

  const prompt = buildPhasePrompt(phase, {
    goal: options.goal,
    currentWave,
    maxWaves: options.maxWaves,
    currentCycle,
    maxExecutionCyclesPerWave: options.maxExecutionCyclesPerWave,
    recentReports: reports.slice(-6),
    substrateContext: buildPhaseHydrationSections(phase, hydration),
  });

  console.error(`\n=== ${phase.toUpperCase()} | wave ${currentWave} | cycle ${currentCycle} ===`);
  await session.prompt(prompt);
  if (options.stream) process.stdout.write("\n");

  const emitted = reports.slice(baseline);
  if (emitted.length !== 1) {
    throw new Error(`Expected exactly one ${AUTOPILOT_REPORT_TOOL_NAME} call during ${phase}, observed ${emitted.length}`);
  }

  const report = emitted[0];
  if (!report) {
    throw new Error(`No report captured for phase ${phase}`);
  }
  if (report.phase !== phase) {
    throw new Error(`Expected report phase ${phase}, received ${report.phase}`);
  }

  console.error(formatAutopilotReport(report));
  await persistPhaseEvidence(substrate, options, session.sessionId, report, currentWave, currentCycle, warnings);
  return report;
}

export async function runAutopilot(options: AutopilotRunOptions): Promise<AutopilotRunSummary> {
  const cwd = path.resolve(options.cwd);
  const agentDir = options.agentDir ?? getAgentDir();
  const substrateConfig = resolveAutopilotSubstrateConfig({
    cwd,
    ...(options.substrateMode ? { mode: options.substrateMode } : {}),
    ...(options.planDocsPath ? { planDocsPath: options.planDocsPath } : {}),
    ...(options.bbMemoryUrl ? { bbMemoryUrl: options.bbMemoryUrl } : {}),
    ...(options.bbGovernUrl ? { bbGovernUrl: options.bbGovernUrl } : {}),
    ...(options.bbToolsUrl ? { bbToolsUrl: options.bbToolsUrl } : {}),
  });
  const substrate = createAutopilotSubstrate(substrateConfig);
  setRuntimeSubstrate(substrate);

  const objectiveKey = deriveAutopilotObjectiveKey(options.goal, cwd);
  const warnings: string[] = [];
  const runWorkspace = await loadRunWorkspaceSnapshot(substrate);
  for (const warning of runWorkspace.warnings) {
    recordWarning(warnings, warning);
  }

  const { authStorage, modelRegistry } = createAuthAndRegistry(agentDir);
  const settingsManager = SettingsManager.create(cwd, agentDir);
  const resourceLoader = new DefaultResourceLoader({
    cwd,
    agentDir,
    settingsManager,
    additionalExtensionPaths: [resolveExtensionPath()],
  });
  await resourceLoader.reload();

  const sessionManager = options.ephemeral ? SessionManager.inMemory() : SessionManager.create(cwd);
  const model = resolveModel(modelRegistry, options.model);
  if (options.model && !model) {
    throw new Error(`Model not found or unavailable via ModelRegistry: ${options.model}`);
  }

  const sessionOptions = {
    cwd,
    agentDir,
    authStorage,
    modelRegistry,
    settingsManager,
    resourceLoader,
    sessionManager,
    thinkingLevel: options.thinkingLevel,
    ...(model ? { model } : {}),
  };

  const { session } = await createAgentSession(sessionOptions);

  const reports: AutopilotReport[] = [];
  const unsubscribe = session.subscribe((event) => {
    if (options.stream && event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      process.stdout.write(event.assistantMessageEvent.delta);
    }

    if (event.type === "tool_execution_end" && event.toolName === AUTOPILOT_REPORT_TOOL_NAME) {
      const details = (event.result as { details?: unknown }).details;
      if (isAutopilotToolDetails(details)) {
        reports.push(details.report);
      }
    }
  });

  try {
    const workflow = await runAutopilotWorkflow({
      maxWaves: options.maxWaves,
      maxExecutionCyclesPerWave: options.maxExecutionCyclesPerWave,
      runPhase: async ({ phase, currentWave, currentCycle }) =>
        runPhase(
          session,
          reports,
          phase,
          options,
          currentWave,
          currentCycle,
          substrate,
          runWorkspace,
          objectiveKey,
          warnings,
        ),
    });

    const [status, authority, history, artifactSummary] = await Promise.all([
      substrate.autopilot.status({ objectiveKey }),
      substrate.autopilot.authority({ objectiveKey }),
      substrate.autopilot.history({ objectiveKey, limit: 4 }),
      substrate.autopilot.learnedArtifactSummary({ objectiveKey }),
    ]);
    if (!status.ok) {
      recordWarning(warnings, status.summary);
    }
    if (!authority.ok) {
      recordWarning(warnings, authority.summary);
    }
    if (!history.ok) {
      recordWarning(warnings, history.summary);
    }
    if (!artifactSummary.ok) {
      recordWarning(warnings, artifactSummary.summary);
    }

    let reconcilePlan = null;
    if (authority.ok && authority.data && authority.data.intentState === "recorded" && authority.data.reconcileState === "ready") {
      reconcilePlan = await substrate.autopilot.decisionReconcilePlan({
        objectiveKey,
        authorityId: authority.data.authorityId,
      });
      if (!reconcilePlan.ok) {
        recordWarning(warnings, reconcilePlan.summary);
      }
    }

    const artifactSummaryProjection =
      artifactSummary.ok && artifactSummary.data
        ? buildAutopilotArtifactSummaryProjection(artifactSummary.data)
        : undefined;

    return {
      done: workflow.done,
      reports: workflow.reports,
      sessionFile: session.sessionFile,
      wavesAttempted: workflow.wavesAttempted,
      warnings,
      objectiveKey,
      ...(status.ok && status.data ? { benchmarkProjection: buildAutopilotBenchmarkProjection(status.data) } : {}),
      ...(authority.ok && authority.data
        ? { decisionProjection: buildAutopilotDecisionProjection(authority.data, reconcilePlan?.ok ? reconcilePlan.data : undefined) }
        : {}),
      ...((history.ok && history.data) || artifactSummaryProjection
        ? { historyProjection: buildAutopilotHistoryProjection(history.ok ? history.data : undefined, artifactSummaryProjection) }
        : {}),
      ...(artifactSummaryProjection ? { artifactSummaryProjection } : {}),
    };
  } finally {
    unsubscribe();
    session.dispose();
    setRuntimeSubstrate(undefined);
  }
}

async function main(): Promise<void> {
  const command = parseAutopilotCliCommand();

  switch (command.kind) {
    case "help":
      console.log(formatAutopilotCliUsage());
      return;
    case "version":
      console.log(loadAutopilotPackageMetadata().version);
      return;
    case "print-manifest":
      console.log(JSON.stringify(buildAutopilotRunManifest(), null, 2));
      return;
    case "doctor": {
      const result = runAutopilotDoctorChecks();
      for (const line of formatAutopilotDoctorResult(result)) {
        console.log(line);
      }
      if (!result.ok) {
        process.exitCode = 1;
      }
      return;
    }
    case "run": {
      const summary = await runAutopilot(command.options);
      console.error("");
      for (const line of buildCloseoutSummaryLines(summary)) {
        console.error(line);
      }
      return;
    }
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
  });
}
