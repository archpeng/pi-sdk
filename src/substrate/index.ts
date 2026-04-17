import path from "node:path";
import { createBBSubstrate } from "./bb.js";
import { createLocalSubstrate } from "./local.js";
import {
  AUTOPILOT_SUBSTRATE_MODES,
  DEFAULT_BB_GOVERN_URL,
  DEFAULT_BB_MEMORY_URL,
  DEFAULT_BB_TIMEOUT_MS,
  DEFAULT_BB_TOOLS_URL,
  type AutopilotSubstrate,
  type AutopilotSubstrateConfig,
  type AutopilotSubstrateMode,
  type CreateAutopilotSubstrateDependencies,
  type ResolveAutopilotSubstrateConfigInput,
} from "./types.js";

function parseMode(value: string | undefined): AutopilotSubstrateMode {
  if (!value) return "local";
  if ((AUTOPILOT_SUBSTRATE_MODES as readonly string[]).includes(value)) {
    return value as AutopilotSubstrateMode;
  }
  throw new Error(`Unsupported substrate mode: ${value}`);
}

export function resolveAutopilotSubstrateConfig(input: ResolveAutopilotSubstrateConfigInput): AutopilotSubstrateConfig {
  const env = input.env ?? process.env;
  return {
    mode: parseMode(input.mode ?? env.PI_SDK_SUBSTRATE),
    cwd: input.cwd,
    planDocsPath: input.planDocsPath ?? path.join(input.cwd, "docs", "plan"),
    bb: {
      memoryUrl: input.bbMemoryUrl ?? env.PI_SDK_BB_MEMORY_URL ?? DEFAULT_BB_MEMORY_URL,
      governUrl: input.bbGovernUrl ?? env.PI_SDK_BB_GOVERN_URL ?? DEFAULT_BB_GOVERN_URL,
      toolsUrl: input.bbToolsUrl ?? env.PI_SDK_BB_TOOLS_URL ?? DEFAULT_BB_TOOLS_URL,
      timeoutMs: input.bbTimeoutMs ?? DEFAULT_BB_TIMEOUT_MS,
    },
  };
}

export function createAutopilotSubstrate(
  config: AutopilotSubstrateConfig,
  dependencies: CreateAutopilotSubstrateDependencies = {},
): AutopilotSubstrate {
  return config.mode === "bb" ? createBBSubstrate(config, dependencies) : createLocalSubstrate(config);
}

export * from "./types.js";
export * from "./governance.js";
export * from "./hydration.js";
export * from "./runtime.js";
export * from "./http-mcp-client.js";
export * from "./manifest.js";
export * from "./package-smoke.js";
export * from "./pi-autoload-proof.js";
export * from "./pi-command-smoke.js";
export * from "./pi-bb-backed-smoke.js";
