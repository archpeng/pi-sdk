import test from "node:test";
import assert from "node:assert/strict";
import {
  formatAutopilotPhaseRoutingMatrixLines,
  resolveAutopilotPhaseRoute,
  resolveAutopilotReportStopLaw,
} from "../src/autopilot/protocol.ts";
import { buildPhasePrompt } from "../src/autopilot/phase-prompt.ts";

test("buildPhasePrompt includes protocol header, routing contract, and substrate context", () => {
  const phaseRoute = resolveAutopilotPhaseRoute("execute");
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
      doneWhen: ["prompt surfaces include the active slice stop law"],
      stopBoundary: ["replan if stop-law evidence is missing or contradictory"],
      avoid: ["wrong-slice progression"],
    },
    phaseRoute,
    phaseRoutingMatrix: formatAutopilotPhaseRoutingMatrixLines(),
    substrateContext: ["Substrate context:", "- workspace: pi-sdk@main, 1 changed"],
  });

  assert.match(prompt, /\[AUTOPILOT RUN\]/);
  assert.match(prompt, /Objective: land interactive autopilot/);
  assert.match(prompt, /Current wave: 2\/5/);
  assert.match(prompt, /wave_plan\/continue/);
  assert.match(prompt, /Current active slice: B1/);
  assert.match(prompt, /Set `stepId` to `B1` in `autopilot_report`/);
  assert.match(prompt, /Current active slice deliverables: active-slice-aware report validation/);
  assert.match(prompt, /Current active slice done_when: prompt surfaces include the active slice stop law/);
  assert.match(prompt, /Current active slice stop_boundary: replan if stop-law evidence is missing or contradictory/);
  assert.match(prompt, /Current active slice avoid list: wrong-slice progression/);
  assert.match(prompt, /Do not claim slice completion unless the current active slice deliverables are actually satisfied/);
  assert.match(prompt, /Populate `doneWhenMet` with the exact active-slice `done_when` items satisfied in this turn/);
  assert.match(prompt, /Populate `stopBoundaryHit` with the exact active-slice `stop_boundary` items that forced replan\/stop/);
  assert.match(prompt, /runtime progression to use `doneWhenMet` \/ `stopBoundaryHit`, not only the requested status string/);
  assert.match(prompt, /Deterministic phase routing matrix:/);
  assert.match(prompt, /`master_plan` -> skill `plan-creator`/);
  assert.match(prompt, /`closeout` -> built-in closeout prompt surface/);
  assert.match(prompt, /Current phase route:/);
  assert.match(prompt, /Deterministic route: `execute` -> skill `execute-plan`/);
  assert.match(prompt, new RegExp(phaseRoute.skillPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(prompt, /Do not substitute another skill or rely on implicit model recall/);
  assert.match(prompt, /Substrate context:/);
  assert.match(prompt, /You MUST call the tool `autopilot_report` exactly once/);
  assert.match(prompt, /Do not ask the user whether to continue\./);
  assert.match(prompt, /Assume the extension scheduler will continue automatically while autopilot mode is running\./);
  assert.match(prompt, /choose the route that gets closest to the overall objective/i);
  assert.match(prompt, /record that decision in `decisionMode`, `decisionBasis`, and `candidateRoutes` when multiple viable routes exist/i);
  assert.match(prompt, /Execute the current wave/);
});

test("resolveAutopilotReportStopLaw derives the runtime status from active-slice stop law", () => {
  const completed = resolveAutopilotReportStopLaw(
    {
      doneWhen: ["all verification passed"],
      stopBoundary: ["replan if verification fails"],
    },
    {
      status: "continue",
      doneWhenMet: ["all verification passed"],
      stopBoundaryHit: [],
    },
  );

  assert.equal(completed.derivedStatus, "completed");
  assert.deepEqual(completed.missingDoneWhen, []);

  const replanned = resolveAutopilotReportStopLaw(
    {
      doneWhen: ["all verification passed"],
      stopBoundary: ["replan if verification fails"],
    },
    {
      status: "completed",
      doneWhenMet: [],
      stopBoundaryHit: ["replan if verification fails"],
    },
  );

  assert.equal(replanned.derivedStatus, "needs_replan");
  assert.deepEqual(replanned.stopBoundaryHit, ["replan if verification fails"]);
});

test("resolveAutopilotReportStopLaw normalizes markdown trailing punctuation", () => {
  const completed = resolveAutopilotReportStopLaw(
    {
      doneWhen: ["all verification passed"],
      stopBoundary: ["replan if verification fails"],
    },
    {
      status: "continue",
      doneWhenMet: ["all verification passed."],
      stopBoundaryHit: [],
    },
  );

  assert.equal(completed.derivedStatus, "completed");
  assert.deepEqual(completed.doneWhenMet, ["all verification passed"]);
  assert.deepEqual(completed.unexpectedDoneWhenMet, []);
});

test("resolveAutopilotPhaseRoute rejects mismatched deterministic routes", () => {
  const reviewRoute = resolveAutopilotPhaseRoute("review");

  assert.throws(
    () =>
      resolveAutopilotPhaseRoute("execute", {
        routeMatrix: {
          execute: reviewRoute,
        },
      }),
    /route mismatch/i,
  );
});
