import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  ROUTED_AUTOPILOT_SKILL_NAMES,
  loadAutopilotPackageMetadata,
  resolveAutopilotPackageRoot,
  type AutopilotPackageMetadata,
} from "./manifest.js";

export interface PackagedInstallSmokeCommandResult {
  label: string;
  command: string;
  args: string[];
  cwd: string;
  ok: boolean;
  status: number | null;
  stdout: string;
  stderr: string;
}

export interface PackagedInstallSmokeResult {
  ok: boolean;
  packageName: string;
  version: string;
  tarballFilename: string;
  installedPackageRoot: string;
  versionOutput: string;
  doctorOutput: string;
  runbookPresent: boolean;
  routedSkillEntriesPresent: boolean;
  routedSkillEntries: Array<{ skillName: string; path: string; present: boolean }>;
  commands: PackagedInstallSmokeCommandResult[];
}

export interface RunPackagedInstallSmokeInput {
  packageRoot?: string;
  packageMetadata?: AutopilotPackageMetadata;
  cleanup?: boolean;
}

function normalizeRelativePath(relativePath: string): string[] {
  return relativePath.replace(/^\.\//, "").split("/");
}

function runCommand(
  commands: PackagedInstallSmokeCommandResult[],
  label: string,
  command: string,
  args: string[],
  cwd: string,
): PackagedInstallSmokeCommandResult {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: process.env,
    shell: false,
  });

  const commandResult: PackagedInstallSmokeCommandResult = {
    label,
    command,
    args,
    cwd,
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
  commands.push(commandResult);

  if (!commandResult.ok) {
    throw new Error(
      `${label} failed (${command} ${args.join(" ")})\nstdout:\n${commandResult.stdout}\nstderr:\n${commandResult.stderr}`,
    );
  }

  return commandResult;
}

function readTarballFilename(stdout: string): string {
  const lines = stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  const tarball = lines.at(-1);
  if (!tarball?.endsWith(".tgz")) {
    throw new Error(`Could not determine tarball filename from npm pack output:\n${stdout}`);
  }
  return tarball;
}

export function runPackagedInstallSmoke(input: RunPackagedInstallSmokeInput = {}): PackagedInstallSmokeResult {
  const packageRoot = input.packageRoot ?? resolveAutopilotPackageRoot();
  const metadata = input.packageMetadata ?? loadAutopilotPackageMetadata(packageRoot);
  const commands: PackagedInstallSmokeCommandResult[] = [];
  const smokeRoot = mkdtempSync(path.join(os.tmpdir(), `${metadata.name.replace(/[^a-z0-9_-]/giu, "-")}-smoke-`));

  try {
    const pack = runCommand(commands, "npm-pack", "npm", ["pack", "--pack-destination", smokeRoot], packageRoot);
    const tarballFilename = readTarballFilename(pack.stdout);
    const tarballPath = path.join(smokeRoot, tarballFilename);

    const installRoot = path.join(smokeRoot, "install-root");
    mkdirSync(installRoot, { recursive: true });
    writeFileSync(
      path.join(installRoot, "package.json"),
      JSON.stringify({ name: `${metadata.name}-smoke-root`, private: true }, null, 2),
    );

    runCommand(
      commands,
      "npm-install",
      "npm",
      ["install", "--prefer-offline", "--no-audit", "--fund", "false", tarballPath],
      installRoot,
    );

    const installedPackageRoot = path.join(installRoot, "node_modules", metadata.name);
    const cliRelative = metadata.bin?.["pi-sdk-autopilot"] ?? Object.values(metadata.bin ?? {})[0] ?? "./dist/sdk/orchestrator.js";
    const cliPath = path.join(installedPackageRoot, ...normalizeRelativePath(cliRelative));

    const version = runCommand(commands, "cli-version", "node", [cliPath, "--version"], installRoot);
    const doctor = runCommand(commands, "cli-doctor", "node", [cliPath, "--doctor"], installRoot);
    const runbookPresent = existsSync(path.join(installedPackageRoot, "docs", "runbooks", "pi-sdk-autopilot-v1-operator-runbook.md"));
    const routedSkillEntries = ROUTED_AUTOPILOT_SKILL_NAMES.map((skillName) => {
      const skillPath = path.join(installedPackageRoot, "skills", skillName, "SKILL.md");
      return {
        skillName,
        path: skillPath,
        present: existsSync(skillPath),
      };
    });
    const routedSkillEntriesPresent = routedSkillEntries.every((entry) => entry.present);

    return {
      ok: commands.every((command) => command.ok) && runbookPresent && routedSkillEntriesPresent,
      packageName: metadata.name,
      version: metadata.version,
      tarballFilename,
      installedPackageRoot,
      versionOutput: version.stdout.trim(),
      doctorOutput: doctor.stdout.trim(),
      runbookPresent,
      routedSkillEntriesPresent,
      routedSkillEntries,
      commands,
    };
  } finally {
    if (input.cleanup !== false) {
      rmSync(smokeRoot, { recursive: true, force: true });
    }
  }
}

export function formatPackagedInstallSmokeResult(result: PackagedInstallSmokeResult): string[] {
  return [
    `package: ${result.packageName}@${result.version}`,
    `packaged-install-smoke: ${result.ok ? "PASS" : "FAIL"}`,
    `tarball: ${result.tarballFilename}`,
    `installed-package-root: ${result.installedPackageRoot}`,
    `version: ${result.versionOutput || "<empty>"}`,
    `doctor: ${result.doctorOutput || "<empty>"}`,
    `runbook: ${result.runbookPresent ? "present" : "missing"}`,
    `routed-skills: ${result.routedSkillEntriesPresent ? "present" : "missing"}`,
    ...result.routedSkillEntries.map((entry) => `- [${entry.present ? "PASS" : "FAIL"}] routed-skill ${entry.skillName}: ${entry.path}`),
    ...result.commands.map((command) => `- [${command.ok ? "PASS" : "FAIL"}] ${command.label}: ${command.command} ${command.args.join(" ")}`),
  ];
}
