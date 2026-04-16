import test from "node:test";
import assert from "node:assert/strict";
import { shouldPreflightToolCall } from "../src/substrate/governance.ts";

test("shouldPreflightToolCall treats write/edit as risky mutations", () => {
  assert.equal(shouldPreflightToolCall("write", { path: "README.md", content: "x" }), true);
  assert.equal(shouldPreflightToolCall("edit", { path: "README.md", oldText: "a", newText: "b" }), true);
});

test("shouldPreflightToolCall ignores read-only operations", () => {
  assert.equal(shouldPreflightToolCall("read", { path: "README.md" }), false);
  assert.equal(shouldPreflightToolCall("bash", { command: "git status --short" }), false);
});

test("shouldPreflightToolCall flags destructive bash patterns", () => {
  assert.equal(shouldPreflightToolCall("bash", { command: "rm -rf dist" }), true);
  assert.equal(shouldPreflightToolCall("bash", { command: "git reset --hard HEAD~1" }), true);
  assert.equal(shouldPreflightToolCall("bash", { command: "sudo systemctl restart service" }), true);
});
