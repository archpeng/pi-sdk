#!/usr/bin/env node

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const entrypoint = path.resolve(scriptDir, "../dist/substrate/pi-autoload-proof.js");

if (!existsSync(entrypoint)) {
  console.error("Missing dist/substrate/pi-autoload-proof.js. Run `npm run build` first.");
  process.exit(1);
}

const { formatPiStartupAutoloadProofResult, runPiStartupAutoloadProof } = await import(entrypoint);
const result = runPiStartupAutoloadProof();
for (const line of formatPiStartupAutoloadProofResult(result)) {
  console.log(line);
}
if (!result.ok) {
  process.exitCode = 1;
}
