import test from "node:test";
import assert from "node:assert/strict";
import { buildPhasePrompt } from "../src/autopilot/phase-prompt.ts";

test("buildPhasePrompt includes protocol header, recent reports, and substrate context", () => {
  const prompt = buildPhasePrompt("execute", {
    goal: "land interactive autopilot",
    currentWave: 2,
    maxWaves: 5,
    currentCycle: 1,
    maxExecutionCyclesPerWave: 3,
    recentReports: [
      {
        phase: "wave_plan",
        status: "continue",
        summary: "selected the next bounded slice",
        waveId: "wave-2",
        stepId: "P7.S3",
        nextAction: "execute the slice",
        evidence: ["workset updated"],
        artifacts: ["docs/plan/pack.md"],
        risks: [],
        timestampMs: 1,
      },
    ],
    substrateContext: ["Substrate context:", "- workspace: pi-sdk@main, 1 changed"],
  });

  assert.match(prompt, /\[AUTOPILOT RUN\]/);
  assert.match(prompt, /Objective: land interactive autopilot/);
  assert.match(prompt, /Current wave: 2\/5/);
  assert.match(prompt, /wave_plan\/continue/);
  assert.match(prompt, /Substrate context:/);
  assert.match(prompt, /You MUST call the tool `autopilot_report` exactly once/);
  assert.match(prompt, /Execute the current wave/);
});
