#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const steps = [
  ["npm", ["test"]],
  ["npm", ["run", "typecheck"]],
  ["npm", ["run", "build"]],
  ["node", ["dist/sdk/orchestrator.js", "--help"]],
  ["node", ["dist/sdk/orchestrator.js", "--version"]],
  ["node", ["dist/sdk/orchestrator.js", "--print-manifest"]],
  ["node", ["dist/sdk/orchestrator.js", "--doctor"]],
  ["npm", ["pack", "--dry-run"]],
  ["npm", ["run", "smoke:packaged-install"]],
];

for (const [command, args] of steps) {
  console.error(`\n[release-check] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
