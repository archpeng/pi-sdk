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
import { parseArgs } from "node:util";
import { buildPhasePrompt } from "../shared/prompts.js";
import { decidePostReviewAction } from "../shared/state-machine.js";
import {
  AUTOPILOT_REPORT_TOOL_NAME,
  DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE,
  DEFAULT_AUTOPILOT_MAX_WAVES,
  DEFAULT_AUTOPILOT_THINKING_LEVEL,
  THINKING_LEVELS,
  formatAutopilotReport,
  type AutopilotPhase,
  type AutopilotReport,
  type AutopilotRunOptions,
  type AutopilotRunSummary,
  type SupportedThinkingLevel,
  isAutopilotToolDetails,
} from "../shared/types.js";
import {
  buildPhaseHydrationSections,
  buildRawPhaseEvidence,
  createAutopilotSubstrate,
  loadRunWorkspaceSnapshot,
  preparePhaseHydration,
  resolveAutopilotSubstrateConfig,
  setRuntimeSubstrate,
  type AutopilotSubstrate,
  type RunWorkspaceSnapshot,
} from "../substrate/index.js";

function printUsage(): void {
  console.log(`pi-sdk-autopilot\n\nUsage:\n  pi-sdk-autopilot --goal "<objective>" [options]\n\nOptions:\n  --goal <text>          Required objective for the autopilot run\n  --cwd <path>           Repo to operate on (default: current working directory)\n  --model <provider/id>  Optional Pi model identifier\n  --thinking <level>     off|minimal|low|medium|high|xhigh (default: ${DEFAULT_AUTOPILOT_THINKING_LEVEL})\n  --max-waves <n>        Maximum waves to attempt (default: ${DEFAULT_AUTOPILOT_MAX_WAVES})\n  --max-cycles <n>       Maximum execute/review cycles per wave (default: ${DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE})\n  --substrate <mode>     local|bb (default: local)\n  --plan-docs <path>     Override docs/plan path used for BB workspace sync\n  --bb-memory-url <url>  Override BB memory MCP endpoint\n  --bb-govern-url <url>  Override BB govern MCP endpoint\n  --bb-tools-url <url>   Override BB tools MCP endpoint\n  --agent-dir <path>     Override Pi agent directory\n  --ephemeral            Use an in-memory session instead of persisted sessions\n  --quiet                Suppress assistant text streaming to stdout\n  --help                 Show this help\n`);
}

function parsePositiveInt(value: string, flag: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer, received: ${value}`);
  }
  return parsed;
}

function parseThinkingLevel(value: string | undefined): SupportedThinkingLevel {
  if (!value) return DEFAULT_AUTOPILOT_THINKING_LEVEL;
  if ((THINKING_LEVELS as readonly string[]).includes(value)) {
    return value as SupportedThinkingLevel;
  }
  throw new Error(`Unsupported thinking level: ${value}`);
}

function parseModelSpec(spec: string | undefined): string | undefined {
  if (!spec) return undefined;
  return spec.trim() || undefined;
}

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

function parseCliArgs(argv = process.argv.slice(2)): AutopilotRunOptions | null {
  const { values } = parseArgs({
    args: argv,
    options: {
      goal: { type: "string" },
      cwd: { type: "string" },
      model: { type: "string" },
      thinking: { type: "string" },
      substrate: { type: "string" },
      "plan-docs": { type: "string" },
      "bb-memory-url": { type: "string" },
      "bb-govern-url": { type: "string" },
      "bb-tools-url": { type: "string" },
      "max-waves": { type: "string" },
      "max-cycles": { type: "string" },
      "agent-dir": { type: "string" },
      ephemeral: { type: "boolean", default: false },
      quiet: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    allowPositionals: false,
  });

  if (values.help) return null;
  if (!values.goal?.trim()) {
    throw new Error("--goal is required");
  }

  return {
    goal: values.goal.trim(),
    cwd: path.resolve(values.cwd ?? process.cwd()),
    model: parseModelSpec(values.model),
    thinkingLevel: parseThinkingLevel(values.thinking),
    maxWaves: parsePositiveInt(values["max-waves"] ?? String(DEFAULT_AUTOPILOT_MAX_WAVES), "--max-waves"),
    maxExecutionCyclesPerWave: parsePositiveInt(
      values["max-cycles"] ?? String(DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE),
      "--max-cycles",
    ),
    substrateMode: values.substrate,
    planDocsPath: values["plan-docs"] ? path.resolve(values["plan-docs"]) : undefined,
    bbMemoryUrl: values["bb-memory-url"],
    bbGovernUrl: values["bb-govern-url"],
    bbToolsUrl: values["bb-tools-url"],
    agentDir: values["agent-dir"] ? path.resolve(values["agent-dir"]) : undefined,
    ephemeral: values.ephemeral,
    stream: !values.quiet,
  };
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

  let overallDone = false;
  let wavesAttempted = 0;

  try {
    const masterPlan = await runPhase(session, reports, "master_plan", options, 1, 1, substrate, runWorkspace, warnings);
    if (masterPlan.status === "done") {
      overallDone = true;
    }

    for (let wave = 1; wave <= options.maxWaves && !overallDone; wave += 1) {
      wavesAttempted = wave;

      const wavePlan = await runPhase(session, reports, "wave_plan", options, wave, 1, substrate, runWorkspace, warnings);
      if (wavePlan.status === "done") {
        overallDone = true;
        break;
      }

      let waveCompleted = false;

      for (let cycle = 1; cycle <= options.maxExecutionCyclesPerWave && !overallDone; cycle += 1) {
        const execution = await runPhase(session, reports, "execute", options, wave, cycle, substrate, runWorkspace, warnings);
        if (execution.status === "done") {
          overallDone = true;
          break;
        }
        if (execution.status === "blocked" || execution.status === "failed") {
          throw new Error(`Execution stopped with status ${execution.status}`);
        }

        const review = await runPhase(session, reports, "review", options, wave, cycle, substrate, runWorkspace, warnings);
        const action = decidePostReviewAction(review.status);

        if (action === "closeout") {
          overallDone = true;
          break;
        }
        if (action === "stop") {
          throw new Error(`Review stopped with status ${review.status}`);
        }
        if (action === "next_wave") {
          waveCompleted = true;
          break;
        }
        if (action === "replan") {
          const replan = await runPhase(session, reports, "replan", options, wave, cycle, substrate, runWorkspace, warnings);
          if (replan.status === "done") {
            overallDone = true;
            break;
          }
          if (replan.status === "blocked" || replan.status === "failed") {
            throw new Error(`Replan stopped with status ${replan.status}`);
          }
          continue;
        }
      }

      if (overallDone) break;

      if (!waveCompleted) {
        const recalibration = await runPhase(
          session,
          reports,
          "replan",
          options,
          wave,
          options.maxExecutionCyclesPerWave,
          substrate,
          runWorkspace,
          warnings,
        );
        if (recalibration.status === "done") {
          overallDone = true;
          break;
        }
        if (recalibration.status === "blocked" || recalibration.status === "failed") {
          throw new Error(`Wave recalibration stopped with status ${recalibration.status}`);
        }
      } else if (wave < options.maxWaves) {
        const roadmapReplan = await runPhase(session, reports, "replan", options, wave + 1, 1, substrate, runWorkspace, warnings);
        if (roadmapReplan.status === "done") {
          overallDone = true;
          break;
        }
        if (roadmapReplan.status === "blocked" || roadmapReplan.status === "failed") {
          throw new Error(`Roadmap recalibration stopped with status ${roadmapReplan.status}`);
        }
      }
    }

    const closeout = await runPhase(
      session,
      reports,
      "closeout",
      options,
      Math.max(1, wavesAttempted || 1),
      options.maxExecutionCyclesPerWave,
      substrate,
      runWorkspace,
      warnings,
    );
    overallDone = overallDone || closeout.status === "done";

    return {
      done: overallDone,
      reports,
      sessionFile: session.sessionFile,
      wavesAttempted,
      warnings,
    };
  } finally {
    unsubscribe();
    session.dispose();
    setRuntimeSubstrate(undefined);
  }
}

async function main(): Promise<void> {
  const parsed = parseCliArgs();
  if (!parsed) {
    printUsage();
    return;
  }

  const summary = await runAutopilot(parsed);
  console.error(`\nRun finished. done=${summary.done} wavesAttempted=${summary.wavesAttempted}`);
  if (summary.sessionFile) {
    console.error(`session: ${summary.sessionFile}`);
  }
  if (summary.warnings.length > 0) {
    console.error(`warnings: ${summary.warnings.length}`);
  }
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
  });
}
