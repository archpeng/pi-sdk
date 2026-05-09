import test from "node:test";
import assert from "node:assert/strict";
import { buildPhaseHydrationSections, loadRunWorkspaceSnapshot } from "../src/substrate/hydration.ts";

test("buildPhaseHydrationSections keeps empty hydration out of prompts", () => {
  const sections = buildPhaseHydrationSections("execute", {
    workspaceSummary: [],
    planSummary: [],
    controlPlaneSummary: [],
    roadmapSummary: [],
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
    controlPlaneSummary: ["active-slice: A2 owner=execute-plan state=READY"],
    roadmapSummary: ["roadmap-bootstrap: docs/plan idle=yes", "roadmap: docs/roadmap/pms-pi-tool-surface-roadmap.md"],
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
  assert.equal(sections.some((line) => line.includes("active-slice: A2 owner=execute-plan state=READY")), true);
  assert.equal(sections.some((line) => line.includes("roadmap-bootstrap: docs/plan idle=yes")), true);
  assert.equal(sections.some((line) => line.includes("roadmap: docs/roadmap/pms-pi-tool-surface-roadmap.md")), true);
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

test("loadRunWorkspaceSnapshot preserves a control-plane snapshot when the substrate provides one", async () => {
  const snapshot = await loadRunWorkspaceSnapshot({
    config: {
      mode: "local",
      cwd: "/repo",
      planDocsPath: "/repo/docs/plan",
      bb: {
        memoryUrl: "http://127.0.0.1:3100/mcp",
        governUrl: "http://127.0.0.1:3101/mcp",
        toolsUrl: "http://127.0.0.1:3102/mcp",
        timeoutMs: 5_000,
      },
    },
    mode: "local",
    memory: {
      async recall() {
        return { ok: true, summary: "ok", data: { items: [], count: 0 }, rawText: "" };
      },
      async store() {
        return { ok: true, summary: "ok", data: { stored: false, response: null }, rawText: "" };
      },
    },
    govern: {
      async policy() {
        return { ok: true, summary: "ok", data: { policy: null }, rawText: "" };
      },
      async evaluate() {
        return { ok: true, summary: "ok", data: { decision: "allow" }, rawText: "" };
      },
    },
    workspace: {
      async scan() {
        return { ok: true, summary: "ok", data: [], rawText: "" };
      },
      async planSync() {
        return { ok: true, summary: "ok", data: [], rawText: "" };
      },
    },
    controlPlane: {
      async snapshot() {
        return {
          ok: true,
          summary: "ok",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: "A2",
              intendedHandoff: "execute-plan",
            },
            activeStage: {
              stageId: "A2",
              owner: "execute-plan",
              state: "READY",
              priority: "highest",
              objectives: ["resolve the repo-local active pack"],
              requiredDeliverables: ["active pack file loading"],
              avoid: ["BB dependency"],
            },
            stageOrder: ["A1", "A2", "A3"],
            sliceDefinitions: {
              A2: {
                stageId: "A2",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["resolve the repo-local active pack"],
                requiredDeliverables: ["active pack file loading"],
                avoid: ["BB dependency"],
              },
              A3: {
                stageId: "A3",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["write STATUS / WORKSET"],
                requiredDeliverables: ["deterministic writeback contract"],
                avoid: ["model-owned control-plane edits"],
              },
            },
          },
          rawText: "",
        };
      },
    },
    autopilot: {
      async status() {
        return { ok: true, summary: "ok", data: null, rawText: "" };
      },
      async history() {
        return { ok: true, summary: "ok", data: null, rawText: "" };
      },
      async authority() {
        return { ok: true, summary: "ok", data: null, rawText: "" };
      },
      async decisionAuthority() {
        return { ok: true, summary: "ok", data: null, rawText: "" };
      },
      async decisionIntent() {
        return { ok: true, summary: "ok", data: null, rawText: "" };
      },
      async decisionReconcilePlan() {
        return { ok: true, summary: "ok", data: null, rawText: "" };
      },
      async learnedArtifactSummary() {
        return { ok: true, summary: "ok", data: null, rawText: "" };
      },
    },
  });

  assert.equal(snapshot.controlPlane?.readme.activeSlice, "A2");
  assert.equal(snapshot.controlPlane?.activeStage.stageId, "A2");
  assert.deepEqual(snapshot.warnings, []);
});
