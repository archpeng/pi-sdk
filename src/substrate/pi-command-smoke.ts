import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveAutopilotPackageRoot } from "./manifest.js";

export interface PiCommandSmokeCommandResult {
  commandText: string;
  exitCode: number | null;
  output: string;
}

export interface PiCommandSmokeResult {
  ok: boolean;
  packageRoot: string;
  commands: PiCommandSmokeCommandResult[];
}

export interface RunPiCommandSmokeInput {
  packageRoot?: string;
  cleanup?: boolean;
}

const COMMANDS = [
  "/autopilot-status",
  "/autopilot-run",
  "/autopilot-resume",
  "/autopilot-pause",
  "/autopilot-stop",
] as const;

function buildEnv(agentDir: string): NodeJS.ProcessEnv {
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

function runCommand(cwd: string, agentDir: string, commandText: string): PiCommandSmokeCommandResult {
  const result = spawnSync("pi", ["--provider", "openai", "--model", "gpt-4o-mini", "-p", commandText], {
    cwd,
    encoding: "utf8",
    env: buildEnv(agentDir),
    shell: false,
  });

  return {
    commandText,
    exitCode: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim(),
  };
}

export function runPiCommandSmoke(input: RunPiCommandSmokeInput = {}): PiCommandSmokeResult {
  const packageRoot = input.packageRoot ?? resolveAutopilotPackageRoot();
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-command-smoke-"));
  const projectRoot = path.join(tempRoot, "project");
  const agentDir = path.join(tempRoot, "agent");

  mkdirSync(path.join(projectRoot, ".pi"), { recursive: true });
  mkdirSync(agentDir, { recursive: true });
  writeFileSync(path.join(projectRoot, ".pi", "settings.json"), `${JSON.stringify({ packages: [packageRoot] }, null, 2)}\n`);

  try {
    const commands = COMMANDS.map((commandText) => runCommand(projectRoot, agentDir, commandText));

    return {
      ok:
        commands.every((command) => command.exitCode === 0) &&
        /No autopilot state recorded yet\./u.test(commands.find((command) => command.commandText === "/autopilot-status")?.output ?? "") &&
        /Usage: \/autopilot-run <goal>/u.test(commands.find((command) => command.commandText === "/autopilot-run")?.output ?? "") &&
        /Usage: \/autopilot-resume <goal>/u.test(commands.find((command) => command.commandText === "/autopilot-resume")?.output ?? ""),
      packageRoot,
      commands,
    };
  } finally {
    if (input.cleanup !== false) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

export function formatPiCommandSmokeResult(result: PiCommandSmokeResult): string[] {
  return [
    `package-root: ${result.packageRoot}`,
    `pi-command-smoke: ${result.ok ? "PASS" : "FAIL"}`,
    ...result.commands.map((command) => `- ${command.commandText} exit=${command.exitCode ?? "null"}: ${command.output || "<empty>"}`),
  ];
}
