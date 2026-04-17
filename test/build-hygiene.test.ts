import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  files?: string[];
  scripts?: Record<string, string>;
};

test("build script cleans dist before compiling", () => {
  const build = packageJson.scripts?.build ?? "";
  const clean = packageJson.scripts?.clean ?? "";

  assert.match(clean, /rm\s+-rf\s+dist/);
  assert.match(build, /npm run clean/);
  assert.match(build, /tsc -p tsconfig\.json/);
  assert.ok(build.indexOf("npm run clean") < build.indexOf("tsc -p tsconfig.json"));
});

test("package manifest carries release-check scripts and ships the operator runbook", () => {
  const releaseCheck = packageJson.scripts?.["release:check"] ?? "";
  const autoloadSmoke = packageJson.scripts?.["smoke:pi-autoload"] ?? "";
  const commandSmoke = packageJson.scripts?.["smoke:pi-commands"] ?? "";
  const bbBackedSmoke = packageJson.scripts?.["smoke:pi-bb-backed"] ?? "";
  const packagedSmoke = packageJson.scripts?.["smoke:packaged-install"] ?? "";
  const prepack = packageJson.scripts?.prepack ?? "";
  const packDryRun = packageJson.scripts?.["pack:dry-run"] ?? "";
  const files = packageJson.files ?? [];

  assert.match(releaseCheck, /release-readiness-check\.mjs/);
  assert.match(autoloadSmoke, /pi-startup-autoload-proof\.mjs/);
  assert.match(commandSmoke, /pi-command-smoke\.mjs/);
  assert.match(bbBackedSmoke, /pi-bb-backed-smoke\.mjs/);
  assert.match(packagedSmoke, /packaged-install-smoke\.mjs/);
  assert.match(prepack, /npm run build/);
  assert.match(packDryRun, /npm pack --dry-run/);
  assert.ok(files.includes("docs/runbooks"));
});
