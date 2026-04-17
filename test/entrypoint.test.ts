import test from "node:test";
import assert from "node:assert/strict";
import { formatAutopilotCliUsage, parseAutopilotCliCommand } from "../src/sdk/cli.ts";

test("parseAutopilotCliCommand recognizes non-run release/readiness flags", () => {
  assert.equal(parseAutopilotCliCommand(["--help"]).kind, "help");
  assert.equal(parseAutopilotCliCommand(["--version"]).kind, "version");
  assert.equal(parseAutopilotCliCommand(["--print-manifest"]).kind, "print-manifest");
  assert.equal(parseAutopilotCliCommand(["--doctor"]).kind, "doctor");
});

test("parseAutopilotCliCommand builds run options with defaults", () => {
  const command = parseAutopilotCliCommand(["--goal", "ship v1"]);
  assert.equal(command.kind, "run");
  if (command.kind !== "run") return;

  assert.equal(command.options.goal, "ship v1");
  assert.equal(command.options.maxWaves, 5);
  assert.equal(command.options.maxExecutionCyclesPerWave, 3);
  assert.equal(command.options.thinkingLevel, "high");
  assert.equal(command.options.stream, true);
});

test("parseAutopilotCliCommand rejects missing goal when no non-run flag is provided", () => {
  assert.throws(() => parseAutopilotCliCommand([]), /--goal is required/);
});

test("formatAutopilotCliUsage documents version, manifest, and doctor flags", () => {
  const usage = formatAutopilotCliUsage();
  assert.match(usage, /--version/);
  assert.match(usage, /--print-manifest/);
  assert.match(usage, /--doctor/);
});
