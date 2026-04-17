import test from "node:test";
import assert from "node:assert/strict";
import { buildPhaseHydrationSections } from "../src/substrate/hydration.ts";

test("buildPhaseHydrationSections keeps empty hydration out of prompts", () => {
  const sections = buildPhaseHydrationSections("execute", {
    workspaceSummary: [],
    planSummary: [],
    recallSummary: [],
    autopilotStatusSummary: [],
    autopilotDecisionSummary: [],
    autopilotHistorySummary: [],
    governPolicySummary: [],
    warnings: [],
  });

  assert.deepEqual(sections, []);
});

test("buildPhaseHydrationSections includes minimal phase-specific BB context", () => {
  const sections = buildPhaseHydrationSections("execute", {
    workspaceSummary: ["workspace: main, clean"],
    planSummary: ["plan: P1.S2 active"],
    recallSummary: ["memory: prior adapter failure path requires fail-open summary"],
    autopilotStatusSummary: ["autopilot-status: queue=idle lag=0", "promotion-readiness: canary=promote"],
    autopilotDecisionSummary: [
      "decision-authority: state=finalized outcome=promote · intent=recorded · reconcile=ready",
      "autopilot-decision: dry_run memory_store/manual_reconcile outcome=promote",
    ],
    autopilotHistorySummary: ["history-summary: canary=1 strategy=1 latest=canary:promote", "autopilot-history: canary: promote Δ0.02 rollout=promote_current_candidate"],
    governPolicySummary: ["policy: write/edit require governance preflight"],
    warnings: ["warning: bb-memory unavailable on previous attempt"],
  });

  assert.equal(sections[0], "Substrate context:");
  assert.equal(sections.some((line) => line.includes("workspace: main, clean")), true);
  assert.equal(sections.some((line) => line.includes("memory: prior adapter failure")), true);
  assert.equal(sections.some((line) => line.includes("autopilot-status: queue=idle lag=0")), true);
  assert.equal(sections.some((line) => line.includes("promotion-readiness: canary=promote")), true);
  assert.equal(sections.some((line) => line.includes("decision-authority: state=finalized outcome=promote · intent=recorded · reconcile=ready")), true);
  assert.equal(sections.some((line) => line.includes("autopilot-decision: dry_run memory_store/manual_reconcile outcome=promote")), true);
  assert.equal(sections.some((line) => line.includes("history-summary: canary=1 strategy=1 latest=canary:promote")), true);
  assert.equal(sections.some((line) => line.includes("autopilot-history: canary: promote Δ0.02 rollout=promote_current_candidate")), true);
  assert.equal(sections.some((line) => line.includes("policy: write/edit require governance preflight")), true);
  assert.equal(sections.some((line) => line.includes("warning: bb-memory unavailable")), true);
});
