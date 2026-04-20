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
    activeSlice: {
      stepId: "B1",
      owner: "execute-plan",
      state: "READY",
      objectives: ["make reports active-slice-aware"],
      requiredDeliverables: ["active-slice-aware report validation"],
      avoid: ["wrong-slice progression"],
    },
    substrateContext: ["Substrate context:", "- workspace: pi-sdk@main, 1 changed"],
  });

  assert.match(prompt, /\[AUTOPILOT RUN\]/);
  assert.match(prompt, /Objective: land interactive autopilot/);
  assert.match(prompt, /Current wave: 2\/5/);
  assert.match(prompt, /wave_plan\/continue/);
  assert.match(prompt, /Current active slice: B1/);
  assert.match(prompt, /Set `stepId` to `B1` in `autopilot_report`/);
  assert.match(prompt, /Current active slice deliverables: active-slice-aware report validation/);
  assert.match(prompt, /Current active slice avoid list: wrong-slice progression/);
  assert.match(prompt, /Do not claim slice completion unless the current active slice deliverables are actually satisfied/);
  assert.match(prompt, /Substrate context:/);
  assert.match(prompt, /You MUST call the tool `autopilot_report` exactly once/);
  assert.match(prompt, /Do not ask the user whether to continue\./);
  assert.match(prompt, /Assume the extension scheduler will continue automatically while autopilot mode is running\./);
  assert.match(prompt, /choose the route that gets closest to the overall objective/i);
  assert.match(prompt, /record that decision in `decisionMode`, `decisionBasis`, and `candidateRoutes` when multiple viable routes exist/i);
  assert.match(prompt, /Execute the current wave/);
});
