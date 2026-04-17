#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const entrypoint = path.resolve(scriptDir, "../dist/substrate/pi-bb-backed-smoke.js");

if (!existsSync(entrypoint)) {
  console.error("Missing dist/substrate/pi-bb-backed-smoke.js. Run `npm run build` first.");
  process.exit(1);
}

const { formatPiBbBackedSmokeResult, runPiBbBackedSmoke } = await import(entrypoint);
const result = await runPiBbBackedSmoke();
for (const line of formatPiBbBackedSmokeResult(result)) {
  console.log(line);
}
if (!result.ok) {
  process.exitCode = 1;
}
