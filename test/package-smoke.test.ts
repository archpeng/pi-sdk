import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { runPackagedInstallSmoke } from "../src/substrate/package-smoke.ts";
import type { AutopilotPackageMetadata } from "../src/substrate/manifest.ts";

const fixtureMetadata: AutopilotPackageMetadata = {
  name: "pi-sdk-fixture",
  version: "0.0.1-test",
  description: "fixture package",
  keywords: ["pi-package"],
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

function createFixturePackageRoot(): string {
  const root = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-package-smoke-"));
  mkdirSync(path.join(root, "dist", "sdk"), { recursive: true });
  mkdirSync(path.join(root, "dist", "extension"), { recursive: true });
  mkdirSync(path.join(root, "docs", "runbooks"), { recursive: true });
  mkdirSync(path.join(root, "src", "extension"), { recursive: true });

  writeFileSync(path.join(root, "package.json"), JSON.stringify(fixtureMetadata, null, 2));
  writeFileSync(path.join(root, "README.md"), "# fixture\n");
  writeFileSync(path.join(root, "docs", "runbooks", "pi-sdk-autopilot-v1-operator-runbook.md"), "# runbook\n");
  writeFileSync(path.join(root, "src", "extension", "index.ts"), "export default function () {}\n");
  writeFileSync(path.join(root, "dist", "index.js"), "export const ok = true;\n");
  writeFileSync(path.join(root, "dist", "index.d.ts"), "export declare const ok: true;\n");
  writeFileSync(path.join(root, "dist", "extension", "index.js"), "export default function () {}\n");
  writeFileSync(
    path.join(root, "dist", "sdk", "orchestrator.js"),
    `#!/usr/bin/env node\nconst version = ${JSON.stringify(fixtureMetadata.version)};\nif (process.argv.includes('--version')) { console.log(version); process.exit(0); }\nif (process.argv.includes('--doctor')) { console.log('doctor: PASS'); process.exit(0); }\nconsole.log('help');\n`,
  );

  return root;
}

test("runPackagedInstallSmoke packs and installs a tarball into a clean temp project", () => {
  const fixtureRoot = createFixturePackageRoot();
  const result = runPackagedInstallSmoke({ packageRoot: fixtureRoot, packageMetadata: fixtureMetadata });

  assert.equal(result.ok, true);
  assert.match(result.versionOutput, /0\.0\.1-test/);
  assert.match(result.doctorOutput, /doctor: PASS/);
  assert.equal(result.runbookPresent, true);
  assert.equal(result.commands.every((command) => command.ok), true);
});
