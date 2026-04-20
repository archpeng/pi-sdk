import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = "/home/peng/dt-git/github/pi-sdk";

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
