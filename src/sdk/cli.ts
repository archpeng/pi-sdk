import path from "node:path";
import { parseArgs } from "node:util";
import {
  DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE,
  DEFAULT_AUTOPILOT_MAX_WAVES,
  DEFAULT_AUTOPILOT_THINKING_LEVEL,
  THINKING_LEVELS,
  type AutopilotRunOptions,
  type SupportedThinkingLevel,
} from "../autopilot/protocol.js";

export type AutopilotCliCommand =
  | { kind: "help" }
  | { kind: "version" }
  | { kind: "print-manifest" }
  | { kind: "doctor" }
  | { kind: "run"; options: AutopilotRunOptions };

export function formatAutopilotCliUsage(): string {
  return `pi-sdk-autopilot

Usage:
  pi-sdk-autopilot --goal "<objective>" [options]
  pi-sdk-autopilot --version
  pi-sdk-autopilot --print-manifest
  pi-sdk-autopilot --doctor

Options:
  --goal <text>          Required objective for the autopilot run
  --cwd <path>           Repo to operate on (default: current working directory)
  --model <provider/id>  Optional Pi model identifier
  --thinking <level>     off|minimal|low|medium|high|xhigh (default: ${DEFAULT_AUTOPILOT_THINKING_LEVEL})
  --max-waves <n>        Maximum waves to attempt (default: ${DEFAULT_AUTOPILOT_MAX_WAVES})
  --max-cycles <n>       Maximum execute/review cycles per wave (default: ${DEFAULT_AUTOPILOT_MAX_CYCLES_PER_WAVE})
  --substrate <mode>     local|bb (default: local)
  --plan-docs <path>     Override docs/plan path used for BB workspace sync
  --bb-memory-url <url>  Override BB memory MCP endpoint
  --bb-govern-url <url>  Override BB govern MCP endpoint
  --bb-tools-url <url>   Override BB tools MCP endpoint
  --agent-dir <path>     Override Pi agent directory
  --ephemeral            Use an in-memory session instead of persisted sessions
  --quiet                Suppress assistant text streaming to stdout
  --version              Print the packaged pi-sdk version
  --print-manifest       Print the v1 release/readiness manifest as JSON
  --doctor               Run bounded packaging/readiness diagnostics
  --help                 Show this help
`;
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

export function parseAutopilotCliCommand(argv = process.argv.slice(2)): AutopilotCliCommand {
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
      version: { type: "boolean", default: false },
      "print-manifest": { type: "boolean", default: false },
      doctor: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    allowPositionals: false,
  });

  if (values.help) return { kind: "help" };
  if (values.version) return { kind: "version" };
  if (values["print-manifest"]) return { kind: "print-manifest" };
  if (values.doctor) return { kind: "doctor" };
  if (!values.goal?.trim()) {
    throw new Error("--goal is required");
  }

  return {
    kind: "run",
    options: {
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
    },
  };
}
