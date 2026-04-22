#!/usr/bin/env node

import { existsSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageSmokeEntrypoint = path.resolve(scriptDir, "../dist/substrate/package-smoke.js");
const bbSmokeEntrypoint = path.resolve(scriptDir, "../dist/substrate/pi-bb-backed-smoke.js");

if (!existsSync(packageSmokeEntrypoint) || !existsSync(bbSmokeEntrypoint)) {
  console.error("Missing packaged smoke entrypoints. Run `npm run build` first.");
  process.exit(1);
}

const { formatPackagedInstallSmokeResult, runPackagedInstallSmoke } = await import(packageSmokeEntrypoint);
const { formatPiBbBackedSmokeResult, runPiBbBackedSmoke } = await import(bbSmokeEntrypoint);

const packagedResult = runPackagedInstallSmoke({ cleanup: false });
const smokeRoot = path.resolve(packagedResult.installedPackageRoot, "../../..");
const installedPackageAlias = path.join(smokeRoot, `${packagedResult.packageName}-package-proof`);

try {
  rmSync(installedPackageAlias, { recursive: true, force: true });
  symlinkSync(packagedResult.installedPackageRoot, installedPackageAlias, "dir");

  for (const line of formatPackagedInstallSmokeResult(packagedResult)) {
    console.log(line);
  }

  console.log(`installed-package alias: ${installedPackageAlias} -> ${packagedResult.installedPackageRoot}`);
  console.log("installed-package clean-room routed-phase proof:");
  const cleanRoomPhaseResult = await runPiBbBackedSmoke({
    packageRoot: installedPackageAlias,
    goal: "prove packaged clean-room routed phase",
  });
  for (const line of formatPiBbBackedSmokeResult(cleanRoomPhaseResult)) {
    console.log(`  ${line}`);
  }

  if (!packagedResult.ok || !cleanRoomPhaseResult.ok) {
    process.exitCode = 1;
  }
} finally {
  rmSync(installedPackageAlias, { recursive: true, force: true });
  rmSync(smokeRoot, { recursive: true, force: true });
}
