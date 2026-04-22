import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AUTOPILOT_SUBSTRATE_MODES } from "./types.js";

export interface AutopilotPackageMetadata {
  name: string;
  version: string;
  description?: string | undefined;
  keywords?: string[] | undefined;
  files?: string[] | undefined;
  main?: string | undefined;
  types?: string | undefined;
  bin?: Record<string, string> | undefined;
  pi?: {
    extensions?: string[] | undefined;
  } | undefined;
}

export interface AutopilotRunManifest {
  packageName: string;
  version: string;
  description: string;
  packageRoot: string;
  productExpression: string;
  entrypoints: {
    bin: string | null;
    main: string | null;
    types: string | null;
    extensions: string[];
  };
  install: {
    localPackage: string;
    ephemeralExtension: string;
    devSetup: string[];
  };
  upgrade: {
    refreshDependencies: string[];
    packageManager: string[];
  };
  diagnostics: {
    version: string;
    manifest: string;
    doctor: string;
    acceptance: string;
    packDryRun: string;
    packagedInstall: string;
    piAutoload: string;
    piCommands: string;
    piBbBacked: string;
  };
  interactiveCommands: string[];
  docs: {
    readme: string;
    runbook: string;
    architecture: string;
    planControl: string;
  };
  skills: {
    routedRoot: string;
    routedSkillNames: string[];
    packageEntryPattern: string;
    primarySource: string;
    compatibilityFallback: string;
  };
  substrateModes: readonly string[];
}

export interface AutopilotDoctorCheck {
  key: string;
  ok: boolean;
  detail: string;
}

export interface AutopilotDoctorResult {
  packageName: string;
  version: string;
  ok: boolean;
  checks: AutopilotDoctorCheck[];
}

export const ROUTED_AUTOPILOT_SKILL_NAMES = ["plan-creator", "execute-plan", "execution-reality-audit"] as const;

const ROUTED_AUTOPILOT_SKILL_REQUIRED_FILES: Record<(typeof ROUTED_AUTOPILOT_SKILL_NAMES)[number], readonly string[]> = {
  "plan-creator": [
    "skills/plan-creator/SKILL.md",
    "skills/plan-creator/references/autopilot-control-plane-pack.md",
    "skills/plan-creator/assets/README.autopilot.template.md",
    "skills/plan-creator/assets/PLAN.autopilot.template.md",
    "skills/plan-creator/assets/STATUS.autopilot.template.md",
    "skills/plan-creator/assets/WORKSET.autopilot.template.md",
  ],
  "execute-plan": [
    "skills/execute-plan/SKILL.md",
    "skills/execute-plan/references/autopilot-control-plane-execution.md",
    "skills/execute-plan/assets/README.autopilot.template.md",
    "skills/execute-plan/assets/PLAN.autopilot.template.md",
    "skills/execute-plan/assets/STATUS.autopilot.template.md",
    "skills/execute-plan/assets/WORKSET.autopilot.template.md",
  ],
  "execution-reality-audit": ["skills/execution-reality-audit/SKILL.md"],
};

export function resolveAutopilotPackageRoot(metaUrl = import.meta.url): string {
  return path.resolve(path.dirname(fileURLToPath(metaUrl)), "../..");
}

export function loadAutopilotPackageMetadata(packageRoot = resolveAutopilotPackageRoot()): AutopilotPackageMetadata {
  const packageJsonPath = path.join(packageRoot, "package.json");
  return JSON.parse(readFileSync(packageJsonPath, "utf8")) as AutopilotPackageMetadata;
}

export function buildAutopilotRunManifest(input: {
  packageRoot?: string;
  packageMetadata?: AutopilotPackageMetadata;
} = {}): AutopilotRunManifest {
  const packageRoot = input.packageRoot ?? resolveAutopilotPackageRoot();
  const metadata = input.packageMetadata ?? loadAutopilotPackageMetadata(packageRoot);

  return {
    packageName: metadata.name,
    version: metadata.version,
    description: metadata.description ?? "Pi-native interactive autopilot package with a shared headless driver",
    packageRoot,
    productExpression: "Pi-native interactive autopilot package with a shared headless driver",
    entrypoints: {
      bin: metadata.bin?.["pi-sdk-autopilot"] ?? null,
      main: metadata.main ?? null,
      types: metadata.types ?? null,
      extensions: metadata.pi?.extensions ?? [],
    },
    install: {
      localPackage: "pi install /absolute/path/to/package",
      ephemeralExtension: "pi -e /absolute/path/to/package",
      devSetup: ["npm install", "npm run build"],
    },
    upgrade: {
      refreshDependencies: ["npm install", "npm run build"],
      packageManager: ["pi update"],
    },
    diagnostics: {
      version: "node dist/sdk/orchestrator.js --version",
      manifest: "node dist/sdk/orchestrator.js --print-manifest",
      doctor: "node dist/sdk/orchestrator.js --doctor",
      acceptance: "npm run release:check",
      packDryRun: "npm pack --dry-run",
      packagedInstall: "npm run smoke:packaged-install",
      piAutoload: "npm run smoke:pi-autoload",
      piCommands: "npm run smoke:pi-commands",
      piBbBacked: "npm run smoke:pi-bb-backed",
    },
    interactiveCommands: [
      "/autopilot-run <goal>",
      "/autopilot-resume [goal]",
      "/autopilot-pause",
      "/autopilot-stop",
      "/autopilot-status",
      "/autopilot-status overlay",
    ],
    docs: {
      readme: "README.md",
      runbook: "docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md",
      architecture: "docs/architecture.md",
      planControl: "docs/plan/README.md",
    },
    skills: {
      routedRoot: "skills",
      routedSkillNames: [...ROUTED_AUTOPILOT_SKILL_NAMES],
      packageEntryPattern: "skills/<skillName>/SKILL.md",
      primarySource: "<packageRoot>/skills/<skillName>/SKILL.md",
      compatibilityFallback: "${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/<skillName>/SKILL.md",
    },
    substrateModes: AUTOPILOT_SUBSTRATE_MODES,
  };
}

function joinPackagePath(packageRoot: string, relativePath: string): string {
  return path.join(packageRoot, ...relativePath.split("/"));
}

function formatCheckState(ok: boolean, detail: string): string {
  return ok ? detail : `missing/invalid: ${detail}`;
}

export function runAutopilotDoctorChecks(input: {
  packageRoot?: string;
  packageMetadata?: AutopilotPackageMetadata;
} = {}): AutopilotDoctorResult {
  const manifest = buildAutopilotRunManifest(input);
  const metadata = input.packageMetadata ?? loadAutopilotPackageMetadata(manifest.packageRoot);
  const files = metadata.files ?? [];
  const keywords = metadata.keywords ?? [];
  const routedSkillFiles = ROUTED_AUTOPILOT_SKILL_NAMES.flatMap((skillName) => ROUTED_AUTOPILOT_SKILL_REQUIRED_FILES[skillName]);

  const checks: AutopilotDoctorCheck[] = [
    {
      key: "package-json",
      ok: existsSync(joinPackagePath(manifest.packageRoot, "package.json")),
      detail: formatCheckState(existsSync(joinPackagePath(manifest.packageRoot, "package.json")), "package.json present"),
    },
    {
      key: "bin-entry",
      ok: manifest.entrypoints.bin === "./dist/sdk/orchestrator.js",
      detail: formatCheckState(
        manifest.entrypoints.bin === "./dist/sdk/orchestrator.js",
        `bin pi-sdk-autopilot -> ${manifest.entrypoints.bin ?? "<missing>"}`,
      ),
    },
    {
      key: "pi-extension-entry",
      ok: manifest.entrypoints.extensions.includes("./src/extension/index.ts"),
      detail: formatCheckState(
        manifest.entrypoints.extensions.includes("./src/extension/index.ts"),
        `pi.extensions includes ./src/extension/index.ts (${manifest.entrypoints.extensions.join(", ") || "<none>"})`,
      ),
    },
    {
      key: "packaged-files",
      ok: files.includes("dist") && files.includes("src") && files.includes("skills") && files.includes("README.md") && files.includes("docs/runbooks"),
      detail: formatCheckState(
        files.includes("dist") && files.includes("src") && files.includes("skills") && files.includes("README.md") && files.includes("docs/runbooks"),
        `files=${files.join(", ") || "<none>"}`,
      ),
    },
    {
      key: "pi-package-keyword",
      ok: keywords.includes("pi-package"),
      detail: formatCheckState(keywords.includes("pi-package"), `keywords=${keywords.join(", ") || "<none>"}`),
    },
    {
      key: "dist-bin-exists",
      ok: existsSync(joinPackagePath(manifest.packageRoot, "dist/sdk/orchestrator.js")),
      detail: formatCheckState(
        existsSync(joinPackagePath(manifest.packageRoot, "dist/sdk/orchestrator.js")),
        "dist/sdk/orchestrator.js present",
      ),
    },
    {
      key: "dist-extension-exists",
      ok: existsSync(joinPackagePath(manifest.packageRoot, "dist/extension/index.js")),
      detail: formatCheckState(
        existsSync(joinPackagePath(manifest.packageRoot, "dist/extension/index.js")),
        "dist/extension/index.js present",
      ),
    },
    {
      key: "readme-exists",
      ok: existsSync(joinPackagePath(manifest.packageRoot, manifest.docs.readme)),
      detail: formatCheckState(existsSync(joinPackagePath(manifest.packageRoot, manifest.docs.readme)), `${manifest.docs.readme} present`),
    },
    {
      key: "runbook-exists",
      ok: existsSync(joinPackagePath(manifest.packageRoot, manifest.docs.runbook)),
      detail: formatCheckState(existsSync(joinPackagePath(manifest.packageRoot, manifest.docs.runbook)), `${manifest.docs.runbook} present`),
    },
    {
      key: "routed-skill-root-exists",
      ok: existsSync(joinPackagePath(manifest.packageRoot, manifest.skills.routedRoot)),
      detail: formatCheckState(
        existsSync(joinPackagePath(manifest.packageRoot, manifest.skills.routedRoot)),
        `${manifest.skills.routedRoot} present`,
      ),
    },
    {
      key: "routed-skill-files-exist",
      ok: routedSkillFiles.every((relativePath) => existsSync(joinPackagePath(manifest.packageRoot, relativePath))),
      detail: formatCheckState(
        routedSkillFiles.every((relativePath) => existsSync(joinPackagePath(manifest.packageRoot, relativePath))),
        routedSkillFiles.join(", "),
      ),
    },
  ];

  return {
    packageName: manifest.packageName,
    version: manifest.version,
    ok: checks.every((check) => check.ok),
    checks,
  };
}

export function formatAutopilotDoctorResult(result: AutopilotDoctorResult): string[] {
  return [
    `package: ${result.packageName}@${result.version}`,
    `doctor: ${result.ok ? "PASS" : "FAIL"}`,
    ...result.checks.map((check) => `- [${check.ok ? "PASS" : "FAIL"}] ${check.key}: ${check.detail}`),
  ];
}
