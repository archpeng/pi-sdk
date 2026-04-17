#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const entrypoint = path.resolve(scriptDir, "../dist/substrate/package-smoke.js");

if (!existsSync(entrypoint)) {
  console.error("Missing dist/substrate/package-smoke.js. Run `npm run build` first.");
  process.exit(1);
}

const { formatPackagedInstallSmokeResult, runPackagedInstallSmoke } = await import(entrypoint);
const result = runPackagedInstallSmoke();
for (const line of formatPackagedInstallSmokeResult(result)) {
  console.log(line);
}
if (!result.ok) {
  process.exitCode = 1;
}
