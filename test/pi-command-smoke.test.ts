import test from "node:test";
import assert from "node:assert/strict";
import { runPiCommandSmoke } from "../src/substrate/pi-command-smoke.ts";

test("runPiCommandSmoke exercises multiple auto-loaded slash commands without model execution", () => {
  const result = runPiCommandSmoke({ packageRoot: "/home/peng/dt-git/github/pi-sdk" });

  assert.equal(result.ok, true);
  assert.equal(result.commands.length >= 5, true);
  assert.match(result.commands.find((command) => command.commandText === "/autopilot-status")?.output ?? "", /No autopilot state recorded yet\./);
  assert.match(result.commands.find((command) => command.commandText === "/autopilot-run")?.output ?? "", /Usage: \/autopilot-run <goal>/);
  assert.match(result.commands.find((command) => command.commandText === "/autopilot-resume")?.output ?? "", /Usage: \/autopilot-resume <goal>/);
});
