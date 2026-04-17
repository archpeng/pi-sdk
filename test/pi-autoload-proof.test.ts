import test from "node:test";
import assert from "node:assert/strict";
import { runPiStartupAutoloadProof } from "../src/substrate/pi-autoload-proof.ts";

test("runPiStartupAutoloadProof proves project-settings autoload without relying on -e", () => {
  const result = runPiStartupAutoloadProof({ packageRoot: "/home/peng/dt-git/github/pi-sdk" });

  assert.equal(result.ok, true);
  assert.match(result.autoload.output, /No autopilot state recorded yet\./);
  assert.equal(result.autoload.exitCode, 0);
  assert.equal(result.control.exitCode, 1);
  assert.match(result.control.output, /No API key found for openai\./);
});
