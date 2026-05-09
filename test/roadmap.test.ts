import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadRoadmapBootstrapSnapshot } from "../src/substrate/roadmap.ts";

function writeIdlePlanReadme(repoRoot: string): string {
  const docsPlan = path.join(repoRoot, "docs", "plan");
  mkdirSync(docsPlan, { recursive: true });
  writeFileSync(
    path.join(docsPlan, "README.md"),
    `# Repo Plan Control Plane

## Active Pack

- none

## Current Active Slice

- none

## Intended Handoff

- none

## Status

- Latest closed pack: \`roadmap-first-pack\`

## Successor Pack

- \`roadmap-second-pack\`
`,
    "utf8",
  );
  return docsPlan;
}

test("loadRoadmapBootstrapSnapshot summarizes idle docs/plan and roadmap candidates", () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-roadmap-bootstrap-"));
  const docsPlan = writeIdlePlanReadme(repoRoot);
  const roadmapDir = path.join(repoRoot, "docs", "roadmap");
  mkdirSync(roadmapDir, { recursive: true });
  writeFileSync(
    path.join(roadmapDir, "pms-pi-tool-surface-roadmap.md"),
    "# Roadmap: PMS Pi Tool Surface Capability Release\n\n## 10. Plan Pack Conversion\n",
    "utf8",
  );

  const snapshot = loadRoadmapBootstrapSnapshot(repoRoot, docsPlan);

  assert.equal(snapshot?.planReadmeIdle, true);
  assert.deepEqual(snapshot?.roadmapFiles, ["docs/roadmap/pms-pi-tool-surface-roadmap.md"]);
  assert.equal(snapshot?.latestClosedPack, "roadmap-first-pack");
  assert.equal(snapshot?.selectedSuccessor, "roadmap-second-pack");
  assert.equal(snapshot?.summaryLines.some((line) => line.includes("docs/plan idle=yes")), true);
  assert.equal(snapshot?.summaryLines.some((line) => line.includes("PMS Pi Tool Surface")), true);
});

test("loadRoadmapBootstrapSnapshot ignores active docs/plan without roadmap signals", () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-roadmap-bootstrap-active-"));
  const docsPlan = path.join(repoRoot, "docs", "plan");
  mkdirSync(docsPlan, { recursive: true });
  writeFileSync(
    path.join(docsPlan, "README.md"),
    `# Repo Plan Control Plane

## Active Pack

- \`docs/plan/active_PLAN.md\`
- \`docs/plan/active_STATUS.md\`
- \`docs/plan/active_WORKSET.md\`

## Current Active Slice

- \`A1\`

## Intended Handoff

- \`execute-plan\`
`,
    "utf8",
  );

  assert.equal(loadRoadmapBootstrapSnapshot(repoRoot, docsPlan), null);
});
