import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildAutopilotRunManifest, formatAutopilotDoctorResult, runAutopilotDoctorChecks, type AutopilotPackageMetadata } from "../src/substrate/manifest.ts";

const packageMetadata: AutopilotPackageMetadata = {
  name: "pi-sdk",
  version: "0.1.0",
  description: "Pi-native interactive autopilot package with a shared headless driver",
  keywords: ["pi-package", "pi", "autopilot"],
  files: ["dist", "src", "skills", "README.md", "docs/runbooks"],
  main: "./dist/index.js",
  types: "./dist/index.d.ts",
  bin: {
    "pi-sdk-autopilot": "./dist/sdk/orchestrator.js",
  },
  pi: {
    extensions: ["./src/extension/index.ts"],
  },
};

function createFixtureRoot(options: { includePlanControl?: boolean } = {}): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-manifest-"));
  mkdirSync(path.join(root, "dist", "sdk"), { recursive: true });
  mkdirSync(path.join(root, "dist", "extension"), { recursive: true });
  mkdirSync(path.join(root, "docs", "runbooks"), { recursive: true });
  mkdirSync(path.join(root, "skills", "plan-creator", "references"), { recursive: true });
  mkdirSync(path.join(root, "skills", "plan-creator", "assets"), { recursive: true });
  mkdirSync(path.join(root, "skills", "execute-plan", "references"), { recursive: true });
  mkdirSync(path.join(root, "skills", "execute-plan", "assets"), { recursive: true });
  mkdirSync(path.join(root, "skills", "execution-reality-audit"), { recursive: true });
  if (options.includePlanControl ?? true) {
    mkdirSync(path.join(root, "docs", "plan"), { recursive: true });
    writeFileSync(path.join(root, "docs", "plan", "README.md"), "# plan\n");
  }
  writeFileSync(path.join(root, "package.json"), JSON.stringify(packageMetadata, null, 2));
  writeFileSync(path.join(root, "README.md"), "# pi-sdk\n");
  writeFileSync(path.join(root, "docs", "runbooks", "pi-sdk-autopilot-v1-operator-runbook.md"), "# runbook\n");
  writeFileSync(path.join(root, "dist", "sdk", "orchestrator.js"), "#!/usr/bin/env node\n");
  writeFileSync(path.join(root, "dist", "extension", "index.js"), "export default {};\n");
  writeFileSync(path.join(root, "skills", "plan-creator", "SKILL.md"), "# plan creator\n");
  writeFileSync(path.join(root, "skills", "plan-creator", "references", "autopilot-control-plane-pack.md"), "# ref\n");
  writeFileSync(path.join(root, "skills", "plan-creator", "assets", "README.autopilot.template.md"), "# tmpl\n");
  writeFileSync(path.join(root, "skills", "plan-creator", "assets", "PLAN.autopilot.template.md"), "# tmpl\n");
  writeFileSync(path.join(root, "skills", "plan-creator", "assets", "STATUS.autopilot.template.md"), "# tmpl\n");
  writeFileSync(path.join(root, "skills", "plan-creator", "assets", "WORKSET.autopilot.template.md"), "# tmpl\n");
  writeFileSync(path.join(root, "skills", "execute-plan", "SKILL.md"), "# execute plan\n");
  writeFileSync(path.join(root, "skills", "execute-plan", "references", "autopilot-control-plane-execution.md"), "# ref\n");
  writeFileSync(path.join(root, "skills", "execute-plan", "assets", "README.autopilot.template.md"), "# tmpl\n");
  writeFileSync(path.join(root, "skills", "execute-plan", "assets", "PLAN.autopilot.template.md"), "# tmpl\n");
  writeFileSync(path.join(root, "skills", "execute-plan", "assets", "STATUS.autopilot.template.md"), "# tmpl\n");
  writeFileSync(path.join(root, "skills", "execute-plan", "assets", "WORKSET.autopilot.template.md"), "# tmpl\n");
  writeFileSync(path.join(root, "skills", "execution-reality-audit", "SKILL.md"), "# audit\n");
  return root;
}

test("buildAutopilotRunManifest returns install, diagnostics, and docs truth for release readiness", () => {
  const manifest = buildAutopilotRunManifest({ packageRoot: "/repo", packageMetadata });

  assert.equal(manifest.packageName, "pi-sdk");
  assert.equal(manifest.version, "0.1.0");
  assert.equal(manifest.entrypoints.bin, "./dist/sdk/orchestrator.js");
  assert.deepEqual(manifest.entrypoints.extensions, ["./src/extension/index.ts"]);
  assert.equal(manifest.install.localPackage, "pi install /absolute/path/to/package");
  assert.equal(manifest.diagnostics.doctor, "node dist/sdk/orchestrator.js --doctor");
  assert.equal(manifest.docs.runbook, "docs/runbooks/pi-sdk-autopilot-v1-operator-runbook.md");
  assert.equal(manifest.diagnostics.packagedInstall, "npm run smoke:packaged-install");
  assert.equal(manifest.diagnostics.piAutoload, "npm run smoke:pi-autoload");
  assert.equal(manifest.diagnostics.piCommands, "npm run smoke:pi-commands");
  assert.equal(manifest.diagnostics.piBbBacked, "npm run smoke:pi-bb-backed");
  assert.equal(manifest.skills.routedRoot, "skills");
  assert.equal(manifest.skills.packageEntryPattern, "skills/<skillName>/SKILL.md");
  assert.equal(manifest.skills.primarySource, "<packageRoot>/skills/<skillName>/SKILL.md");
  assert.equal(manifest.skills.compatibilityFallback, "${PI_CODING_AGENT_DIR:-~/.pi/agent}/skills/<skillName>/SKILL.md");
  assert.deepEqual(manifest.skills.routedSkillNames, ["plan-creator", "execute-plan", "execution-reality-audit"]);
});

test("runAutopilotDoctorChecks passes when required packaging/readiness surfaces exist", () => {
  const fixtureRoot = createFixtureRoot();
  const result = runAutopilotDoctorChecks({ packageRoot: fixtureRoot, packageMetadata });

  assert.equal(result.ok, true);
  assert.equal(result.checks.every((check) => check.ok), true);
  assert.match(formatAutopilotDoctorResult(result).join("\n"), /doctor: PASS/);
});

test("runAutopilotDoctorChecks passes for installed-package shape without repo plan-control docs", () => {
  const fixtureRoot = createFixtureRoot({ includePlanControl: false });
  const result = runAutopilotDoctorChecks({ packageRoot: fixtureRoot, packageMetadata });

  assert.equal(result.ok, true);
  assert.equal(result.checks.some((check) => check.key === "plan-control-exists"), false);
});

test("runAutopilotDoctorChecks fails when packaged runbook coverage is missing", () => {
  const fixtureRoot = createFixtureRoot();
  const brokenMetadata: AutopilotPackageMetadata = {
    ...packageMetadata,
    files: ["dist", "src", "README.md"],
  };
  const result = runAutopilotDoctorChecks({ packageRoot: fixtureRoot, packageMetadata: brokenMetadata });

  assert.equal(result.ok, false);
  assert.equal(result.checks.some((check) => check.key === "packaged-files" && !check.ok), true);
});

test("runAutopilotDoctorChecks fails when routed skill files are missing from the package root", () => {
  const fixtureRoot = createFixtureRoot();
  unlinkSync(path.join(fixtureRoot, "skills", "execute-plan", "SKILL.md"));

  const result = runAutopilotDoctorChecks({ packageRoot: fixtureRoot, packageMetadata });

  assert.equal(result.ok, false);
  assert.equal(result.checks.some((check) => check.key === "routed-skill-files-exist" && !check.ok), true);
});
