import test from "node:test";
import assert from "node:assert/strict";
import { buildPhaseHydrationSections } from "../src/substrate/hydration.ts";

test("buildPhaseHydrationSections keeps empty hydration out of prompts", () => {
  const sections = buildPhaseHydrationSections("execute", {
    workspaceSummary: [],
    planSummary: [],
    recallSummary: [],
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
    governPolicySummary: ["policy: write/edit require governance preflight"],
    warnings: ["warning: bb-memory unavailable on previous attempt"],
  });

  assert.equal(sections[0], "Substrate context:");
  assert.equal(sections.some((line) => line.includes("workspace: main, clean")), true);
  assert.equal(sections.some((line) => line.includes("memory: prior adapter failure")), true);
  assert.equal(sections.some((line) => line.includes("policy: write/edit require governance preflight")), true);
  assert.equal(sections.some((line) => line.includes("warning: bb-memory unavailable")), true);
});
