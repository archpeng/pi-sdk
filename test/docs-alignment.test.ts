import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("README documents local substrate as repo-local control-plane aware rather than pure no-op", () => {
  const readme = readFileSync(path.join(REPO_ROOT, "README.md"), "utf8");

  assert.match(readme, /local substrate.*repo-local control-plane/i);
  assert.match(readme, /local substrate.*git workspace/i);
  assert.match(readme, /control-plane-aware dirty-repo/i);
  assert.doesNotMatch(readme, /所有 substrate port 都是显式 no-op/);
});

test("architecture documents the dirty-repo guard as landed and narrows the remaining repo-safety gaps", () => {
  const architecture = readFileSync(path.join(REPO_ROOT, "docs/architecture.md"), "utf8");

  assert.match(architecture, /dirty-repo guard 已落地/i);
  assert.match(architecture, /control-plane-only dirty/i);
  assert.doesNotMatch(architecture, /当前没有：[\s\S]*dirty-repo guard/);
});

test("plan-creator requires explicit autopilot transition contracts for machine packs", () => {
  const skill = readFileSync(path.join(REPO_ROOT, "skills/plan-creator/SKILL.md"), "utf8");
  const readmeTemplate = readFileSync(path.join(REPO_ROOT, "skills/plan-creator/assets/README.autopilot.template.md"), "utf8");
  const reference = readFileSync(path.join(REPO_ROOT, "skills/plan-creator/references/autopilot-control-plane-pack.md"), "utf8");

  for (const content of [skill, readmeTemplate, reference]) {
    assert.match(content, /Autopilot Transition Contract|transition FSM/i);
    assert.match(content, /execute\/completed[\s\S]*review/i);
    assert.match(content, /review\/completed[\s\S]*writeback/i);
  }
});
