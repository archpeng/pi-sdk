import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveAutopilotPackageRoot } from "./manifest.js";

export interface PiStartupAutoloadCommandResult {
  label: "autoload" | "control";
  cwd: string;
  exitCode: number | null;
  output: string;
}

export interface PiStartupAutoloadProofResult {
  ok: boolean;
  packageRoot: string;
  autoload: PiStartupAutoloadCommandResult;
  control: PiStartupAutoloadCommandResult;
}

export interface RunPiStartupAutoloadProofInput {
  packageRoot?: string;
  cleanup?: boolean;
}

function buildProofEnv(agentDir: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PI_CODING_AGENT_DIR: agentDir,
    PI_OFFLINE: "1",
    OPENAI_API_KEY: "",
    ANTHROPIC_API_KEY: "",
    ANTHROPIC_OAUTH_TOKEN: "",
    GEMINI_API_KEY: "",
  };
}

function runPiSlashCommand(cwd: string, agentDir: string, label: "autoload" | "control"): PiStartupAutoloadCommandResult {
  const result = spawnSync("pi", ["--provider", "openai", "--model", "gpt-4o-mini", "-p", "/autopilot-status"], {
    cwd,
    encoding: "utf8",
    env: buildProofEnv(agentDir),
    shell: false,
  });

  return {
    label,
    cwd,
    exitCode: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

export function runPiStartupAutoloadProof(input: RunPiStartupAutoloadProofInput = {}): PiStartupAutoloadProofResult {
  const packageRoot = input.packageRoot ?? resolveAutopilotPackageRoot();
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-autoload-proof-"));
  const autoloadProject = path.join(tempRoot, "autoload-project");
  const controlProject = path.join(tempRoot, "control-project");
  const agentDir = path.join(tempRoot, "agent");

  mkdirSync(path.join(autoloadProject, ".pi"), { recursive: true });
  mkdirSync(controlProject, { recursive: true });
  mkdirSync(agentDir, { recursive: true });

  writeFileSync(
    path.join(autoloadProject, ".pi", "settings.json"),
    `${JSON.stringify({ packages: [packageRoot] }, null, 2)}\n`,
  );

  try {
    const autoload = runPiSlashCommand(autoloadProject, agentDir, "autoload");
    const control = runPiSlashCommand(controlProject, agentDir, "control");

    return {
      ok:
        autoload.exitCode === 0 &&
        /No autopilot state recorded yet\./u.test(autoload.output) &&
        control.exitCode === 1 &&
        /No API key found for openai\./u.test(control.output),
      packageRoot,
      autoload,
      control,
    };
  } finally {
    if (input.cleanup !== false) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

export function formatPiStartupAutoloadProofResult(result: PiStartupAutoloadProofResult): string[] {
  return [
    `package-root: ${result.packageRoot}`,
    `pi-startup-autoload-proof: ${result.ok ? "PASS" : "FAIL"}`,
    `- autoload exit=${result.autoload.exitCode ?? "null"}: ${result.autoload.output || "<empty>"}`,
    `- control exit=${result.control.exitCode ?? "null"}: ${result.control.output || "<empty>"}`,
  ];
}
