#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const entrypoint = path.resolve(scriptDir, "../dist/substrate/pi-command-smoke.js");

if (!existsSync(entrypoint)) {
  console.error("Missing dist/substrate/pi-command-smoke.js. Run `npm run build` first.");
  process.exit(1);
}

const { formatPiCommandSmokeResult, runPiCommandSmoke } = await import(entrypoint);
const result = runPiCommandSmoke();
for (const line of formatPiCommandSmokeResult(result)) {
  console.log(line);
}
if (!result.ok) {
  process.exitCode = 1;
}
