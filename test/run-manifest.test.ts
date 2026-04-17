import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildAutopilotRunManifest, formatAutopilotDoctorResult, runAutopilotDoctorChecks, type AutopilotPackageMetadata } from "../src/substrate/manifest.ts";

const packageMetadata: AutopilotPackageMetadata = {
  name: "pi-sdk",
  version: "0.1.0",
  description: "Pi-native interactive autopilot package with a shared headless driver",
  keywords: ["pi-package", "pi", "autopilot"],
  files: ["dist", "src", "README.md", "docs/runbooks"],
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
  if (options.includePlanControl ?? true) {
    mkdirSync(path.join(root, "docs", "plan"), { recursive: true });
    writeFileSync(path.join(root, "docs", "plan", "README.md"), "# plan\n");
  }
  writeFileSync(path.join(root, "package.json"), JSON.stringify(packageMetadata, null, 2));
  writeFileSync(path.join(root, "README.md"), "# pi-sdk\n");
  writeFileSync(path.join(root, "docs", "runbooks", "pi-sdk-autopilot-v1-operator-runbook.md"), "# runbook\n");
  writeFileSync(path.join(root, "dist", "sdk", "orchestrator.js"), "#!/usr/bin/env node\n");
  writeFileSync(path.join(root, "dist", "extension", "index.js"), "export default {};\n");
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
