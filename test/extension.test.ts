import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import test from "node:test";
import assert from "node:assert/strict";
import autopilotExtension from "../src/extension/index.ts";
import { resolveAutopilotPhaseRoute } from "../src/autopilot/protocol.ts";
import { deriveResumePhaseFromControlPlane } from "../src/extension/command-handlers.ts";
import {
  buildAutopilotPhaseDispatchMessage,
  resolveAutopilotPhaseDispatch,
} from "../src/extension/runtime-dispatch.ts";
import type { AutopilotSubstrate, WorkspaceScanEntry } from "../src/substrate/index.ts";
import { setRuntimeSubstrate } from "../src/substrate/index.ts";

interface FakeCommand {
  description?: string;
  handler: (args: string, ctx: any) => Promise<void> | void;
}


test("deriveResumePhaseFromControlPlane resumes directly from repo-local handoff truth", () => {
  const base = {
    readme: {
      activePack: {
        planPath: "docs/plan/active_PLAN.md",
        statusPath: "docs/plan/active_STATUS.md",
        worksetPath: "docs/plan/active_WORKSET.md",
      },
      activeSlice: "P1",
      intendedHandoff: "execute-plan",
    },
    activeStage: {
      stageId: "P1",
      owner: "execute-plan",
      state: "READY",
      priority: "highest",
      objectives: [],
      requiredDeliverables: [],
      doneWhen: [],
      stopBoundary: [],
      avoid: [],
    },
    stageOrder: ["P1", "P2"],
    sliceDefinitions: {},
  };

  assert.equal(deriveResumePhaseFromControlPlane(base), "execute");
  assert.equal(
    deriveResumePhaseFromControlPlane({
      ...base,
      readme: { ...base.readme, intendedHandoff: "execution-reality-audit" },
      activeStage: { ...base.activeStage, owner: "execution-reality-audit", state: "DONE_PENDING_REVIEW" },
    }),
    "review",
  );
  assert.equal(
    deriveResumePhaseFromControlPlane({
      ...base,
      readme: { ...base.readme, activeSlice: "PACK_COMPLETE", intendedHandoff: "autopilot-closeout" },
      activeStage: { ...base.activeStage, stageId: "PACK_COMPLETE", owner: "closeout", state: "DONE" },
    }),
    "closeout",
  );
});

function createFakePi() {
  const handlers = new Map<string, Array<(event: any, ctx: any) => Promise<any> | any>>();
  const commands = new Map<string, FakeCommand>();
  const tools: Array<{ name: string; execute?: (toolCallId: string, params: any) => Promise<any> | any }> = [];
  const sentUserMessages: Array<{ content: unknown; options?: { deliverAs?: "steer" | "followUp" } }> = [];
  const appendedEntries: Array<{ customType: string; data: unknown }> = [];

  const pi = {
    on(event: string, handler: (event: any, ctx: any) => Promise<any> | any) {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
    },
    registerCommand(name: string, options: FakeCommand) {
      commands.set(name, options);
    },
    registerTool(tool: { name: string; execute?: (toolCallId: string, params: any) => Promise<any> | any }) {
      tools.push(tool);
    },
    sendUserMessage(content: unknown, options?: { deliverAs?: "steer" | "followUp" }) {
      sentUserMessages.push({ content, options });
    },
    appendEntry(customType: string, data?: unknown) {
      appendedEntries.push({ customType, data });
    },
    getThinkingLevel() {
      return "high";
    },
    sendMessage() {
      // not needed in these tests
    },
  };

  return { pi: pi as any, handlers, commands, tools, sentUserMessages, appendedEntries };
}

function createFakeContext(overrides: Partial<any> = {}) {
  const notifications: Array<{ message: string; kind: string }> = [];
  const statusUpdates: unknown[] = [];
  const widgetUpdates: unknown[] = [];
  const workingIndicators: Array<unknown> = [];
  return {
    cwd: "/repo",
    hasUI: true,
    ui: {
      notify(message: string, kind = "info") {
        notifications.push({ message, kind });
      },
      setStatus(...args: unknown[]) {
        statusUpdates.push(args);
      },
      setWidget(...args: unknown[]) {
        widgetUpdates.push(args);
      },
      setWorkingIndicator(options?: unknown) {
        workingIndicators.push(options);
      },
      theme: {
        fg: (_token: string, text: string) => text,
      },
    },
    sessionManager: {
      getBranch() {
        return [];
      },
    },
    getSystemPrompt() {
      return "Active tools: read bash edit write autopilot_report";
    },
    isIdle() {
      return true;
    },
    hasPendingMessages() {
      return false;
    },
    abort() {},
    signal: undefined,
    notifications,
    statusUpdates,
    widgetUpdates,
    workingIndicators,
    ...overrides,
  };
}

function createTempAgentDir(skillFiles: Record<string, string>): string {
  const agentDir = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-agent-dir-"));
  for (const [skillName, contents] of Object.entries(skillFiles)) {
    const skillDir = path.join(agentDir, "skills", skillName);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(path.join(skillDir, "SKILL.md"), contents, "utf8");
  }
  return agentDir;
}

function createFakeSubstrate(cwd: string): AutopilotSubstrate {
  return {
    mode: "bb",
    config: {
      mode: "bb",
      cwd,
      planDocsPath: `${cwd}/docs/plan`,
      bb: {
        memoryUrl: "http://127.0.0.1:3100/mcp",
        governUrl: "http://127.0.0.1:3101/mcp",
        toolsUrl: "http://127.0.0.1:3102/mcp",
        timeoutMs: 5_000,
      },
    },
    memory: {
      async recall() {
        return { ok: true, summary: "bb memory recall: 0 hit(s)", data: { items: [], count: 0 }, rawText: "" };
      },
      async store() {
        return { ok: true, summary: "bb memory store: raw evidence accepted", data: { stored: true, response: null }, rawText: "" };
      },
    },
    govern: {
      async policy() {
        return { ok: true, summary: "bb govern policy loaded", data: { policy: null }, rawText: "" };
      },
      async evaluate() {
        return { ok: true, summary: "bb govern evaluate: allow", data: { decision: "allow" }, rawText: "" };
      },
    },
    workspace: {
      async scan() {
        return {
          ok: true,
          summary: "bb workspace scan: 1 workspace(s)",
          data: [
            {
              path: cwd,
              name: "pi-sdk",
              branch: "main",
              dirty_files: 0,
              status_summary: "clean",
              remote: "origin",
              recent_commits: [],
            },
          ],
          rawText: "",
        };
      },
      async planSync() {
        return { ok: true, summary: "bb plan sync: 1 plan file(s)", data: [], rawText: "" };
      },
    },
    controlPlane: {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: "B1",
              intendedHandoff: "execute-plan",
            },
            activeStage: {
              stageId: "B1",
              owner: "execute-plan",
              state: "READY",
              priority: "highest",
              objectives: ["make reports active-slice-aware"],
              requiredDeliverables: ["active-slice-aware report validation"],
              doneWhen: ["active-slice-aware report validation"],
              stopBoundary: ["wrong-slice progression remains after execution"],
              avoid: ["wrong-slice progression"],
            },
            stageOrder: ["B1", "B2", "B3", "C1", "C2", "C3"],
            sliceDefinitions: {
              B1: {
                stageId: "B1",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["make reports active-slice-aware"],
                requiredDeliverables: ["active-slice-aware report validation"],
                doneWhen: ["active-slice-aware report validation"],
                stopBoundary: ["wrong-slice progression remains after execution"],
                avoid: ["wrong-slice progression"],
              },
              B2: {
                stageId: "B2",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["bind prompt completion to active slice deliverables"],
                requiredDeliverables: ["active slice deliverable contract"],
                doneWhen: ["active slice deliverable contract"],
                stopBoundary: ["prompt-only completion drift remains"],
                avoid: ["prompt-only completion drift"],
              },
              B3: {
                stageId: "B3",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["align runtime stop law with slice truth"],
                requiredDeliverables: ["wrong-slice hard stop"],
                doneWhen: ["wrong-slice hard stop"],
                stopBoundary: ["soft mismatch fallback remains"],
                avoid: ["soft mismatch fallback"],
              },
              C1: {
                stageId: "C1",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["bind run and resume to local control-plane truth"],
                requiredDeliverables: ["local control-plane aware run/resume path"],
                avoid: ["goal-only fallback"],
              },
              C2: {
                stageId: "C2",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["write accepted reports back to control plane"],
                requiredDeliverables: ["deterministic writeback orchestration"],
                avoid: ["model-picked next slice"],
              },
              C3: {
                stageId: "C3",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["preserve control truth across compact/resume"],
                requiredDeliverables: ["control-truth resync after compact"],
                avoid: ["control-plane drift"],
              },
            },
          },
          rawText: "",
        };
      },
      async advance() {
        return {
          ok: true,
          summary: "local control-plane writeback applied",
          data: { nextActiveSlice: "B2", updatedFiles: ["docs/plan/README.md"] },
          rawText: "",
        };
      },
    },
    autopilot: {
      async status() {
        return {
          ok: true,
          summary: "bb autopilot status loaded",
          data: {
            objectiveKey: "objective:abc123",
            queueLag: 0,
            queueDrainState: "idle",
            headFreshness: "fresh",
            replayHealth: "fresh",
            canaryVerdict: "promote",
            rolloutDecision: "promote_current_candidate",
            strategyFeedbackCandidate: true,
            summary: ["queue=idle lag=0", "replay=fresh", "canary=promote"],
            publishedAtMs: 1,
            heads: [
              {
                kind: "autopilot_run",
                scopeKey: "objective:abc123",
                found: true,
                freshness: "fresh",
              },
            ],
          },
          rawText: "",
        };
      },
      async history() {
        return {
          ok: true,
          summary: "bb autopilot history loaded",
          data: {
            objectiveKey: "objective:abc123",
            entries: [
              {
                reportKind: "canary",
                reportId: "canary-1",
                objectiveKey: "objective:abc123",
                label: "promote",
                summaryLine: "promote Δ0.02 rollout=promote_current_candidate",
                publishedAtMs: 10,
              },
            ],
          },
          rawText: "",
        };
      },
      async authority() {
        return {
          ok: true,
          summary: "bb autopilot decision authority loaded",
          data: {
            authorityId: "authority-2",
            authorityRef: "memory://autopilot/decision-authority/authority-2",
            objectiveKey: "objective:abc123",
            lifecycleState: "published",
            decisionState: "finalized",
            intentState: "recorded",
            reconcileState: "ready",
            finalOutcome: "promote",
            reasonCodes: ["canary_promote", "operator_intent_recorded"],
            evidence: {
              statusReportId: "status-1",
              canaryReportId: "canary-1",
              strategyFeedbackReportId: "strategy-1",
              sourceRefs: ["memory://autopilot/status/objective:abc123"],
            },
            decidedAtMs: 21,
            scopeFamily: "autopilot_promotion_decision",
            scopeKey: "objective:abc123",
            requiresManualReconcile: true,
            intentOutcome: "promote",
            intentNote: "operator approved dry run",
            intentSourceRefs: ["memory://operator/note/1"],
          },
          rawText: "",
        };
      },
      async decisionAuthority() {
        return {
          ok: true,
          summary: "bb autopilot decision authority materialized",
          data: null,
          rawText: "",
        };
      },
      async decisionIntent() {
        return {
          ok: true,
          summary: "bb autopilot decision intent recorded",
          data: {
            authority: {
              authorityId: "authority-2",
              authorityRef: "memory://autopilot/decision-authority/authority-2",
              objectiveKey: "objective:abc123",
              lifecycleState: "published",
              decisionState: "finalized",
              intentState: "recorded",
              reconcileState: "ready",
              finalOutcome: "promote",
              reasonCodes: ["canary_promote", "operator_intent_recorded"],
              evidence: {
                statusReportId: "status-1",
                canaryReportId: "canary-1",
                strategyFeedbackReportId: "strategy-1",
                sourceRefs: ["memory://autopilot/status/objective:abc123"],
              },
              decidedAtMs: 21,
              scopeFamily: "autopilot_promotion_decision",
              scopeKey: "objective:abc123",
              requiresManualReconcile: true,
            },
            persisted: true,
            payloadTemplate: {
              toolName: "memory_store",
              memoryClass: "governance",
              content: "AUTOPILOT_PROMOTION_DECISION",
              effectSummary: "Canonical autopilot promotion decision reconcile.",
              metadata: {
                scope_family: "autopilot_promotion_decision",
                scope_key: "objective:abc123",
                scope_write_source: "manual_reconcile",
                autopilot_decision_authority_id: "authority-2",
                autopilot_decision_outcome: "promote",
              },
            },
          },
          rawText: "",
        };
      },
      async decisionReconcilePlan() {
        return {
          ok: true,
          summary: "bb autopilot decision reconcile plan loaded",
          data: {
            mode: "dry_run",
            authority: {
              authorityId: "authority-2",
              authorityRef: "memory://autopilot/decision-authority/authority-2",
              objectiveKey: "objective:abc123",
              lifecycleState: "published",
              decisionState: "finalized",
              intentState: "recorded",
              reconcileState: "ready",
              finalOutcome: "promote",
              reasonCodes: ["canary_promote", "operator_intent_recorded"],
              evidence: {
                statusReportId: "status-1",
                canaryReportId: "canary-1",
                strategyFeedbackReportId: "strategy-1",
                sourceRefs: ["memory://autopilot/status/objective:abc123"],
              },
              decidedAtMs: 21,
              scopeFamily: "autopilot_promotion_decision",
              scopeKey: "objective:abc123",
              requiresManualReconcile: true,
            },
            scopeStatus: { scopeFamily: "autopilot_promotion_decision", scopeKey: "objective:abc123" },
            payloadTemplate: {
              toolName: "memory_store",
              memoryClass: "governance",
              content: "AUTOPILOT_PROMOTION_DECISION",
              effectSummary: "Canonical autopilot promotion decision reconcile.",
              metadata: {
                scope_family: "autopilot_promotion_decision",
                scope_key: "objective:abc123",
                scope_write_source: "manual_reconcile",
                autopilot_decision_authority_id: "authority-2",
                autopilot_decision_outcome: "promote",
              },
            },
          },
          rawText: "",
        };
      },
      async learnedArtifactSummary() {
        return {
          ok: true,
          summary: "bb autopilot learned artifact summary loaded",
          data: {
            reportId: "learned-1",
            reportRef: "memory://autopilot/learned-advisory/reports/learned-1",
            objectiveKey: "objective:abc123",
            lifecycleState: "candidate",
            payloadKind: "artifact_summary",
            stage: "shadow_only",
            candidateOnly: true,
            confidence: 0.74,
            evidenceSummary: ["history_entries=1"],
            noRegressionGuard: true,
            governanceNoRegressionGuard: false,
            sourceRefs: ["memory://autopilot/status/reports/status-1"],
            summaryProjection: {
              closeoutLines: ["objective-key: objective:abc123"],
              operatorLines: ["objective-key: objective:abc123"],
              historyLines: ["canary: promote Δ0.02 rollout=promote_current_candidate"],
            },
            publishedAtMs: 12,
          },
          rawText: "",
        };
      },
    },
  };
}

function createFakeLocalSubstrate(
  cwd: string,
  controlPlane: AutopilotSubstrate["controlPlane"] extends infer T ? T : never,
  workspaceEntries: WorkspaceScanEntry[] = [],
): AutopilotSubstrate {
  return {
    mode: "local",
    config: {
      mode: "local",
      cwd,
      planDocsPath: `${cwd}/docs/plan`,
      bb: {
        memoryUrl: "http://127.0.0.1:3100/mcp",
        governUrl: "http://127.0.0.1:3101/mcp",
        toolsUrl: "http://127.0.0.1:3102/mcp",
        timeoutMs: 5_000,
      },
    },
    memory: {
      async recall() {
        return { ok: true, summary: "local memory", data: { items: [], count: 0 }, rawText: "" };
      },
      async store() {
        return { ok: true, summary: "local memory", data: { stored: false, response: null }, rawText: "" };
      },
    },
    govern: {
      async policy() {
        return { ok: true, summary: "local govern", data: { policy: null }, rawText: "" };
      },
      async evaluate() {
        return { ok: true, summary: "local govern", data: { decision: "allow" }, rawText: "" };
      },
    },
    workspace: {
      async scan() {
        return { ok: true, summary: `local workspace scan: ${workspaceEntries.length} workspace(s)`, data: workspaceEntries, rawText: "" };
      },
      async planSync() {
        return { ok: true, summary: "local workspace", data: [], rawText: "" };
      },
    },
    controlPlane,
    autopilot: {
      async status() {
        return { ok: true, summary: "local autopilot", data: null, rawText: "" };
      },
      async history() {
        return { ok: true, summary: "local autopilot", data: null, rawText: "" };
      },
      async authority() {
        return { ok: true, summary: "local autopilot", data: null, rawText: "" };
      },
      async decisionAuthority() {
        return { ok: true, summary: "local autopilot", data: null, rawText: "" };
      },
      async decisionIntent() {
        return { ok: true, summary: "local autopilot", data: null, rawText: "" };
      },
      async decisionReconcilePlan() {
        return { ok: true, summary: "local autopilot", data: null, rawText: "" };
      },
      async learnedArtifactSummary() {
        return { ok: true, summary: "local autopilot", data: null, rawText: "" };
      },
    },
  };
}

async function runHandlers(
  handlers: Map<string, Array<(event: any, ctx: any) => Promise<any> | any>>,
  eventName: string,
  event: any,
  ctx: any,
) {
  for (const handler of handlers.get(eventName) ?? []) {
    await handler(event, ctx);
  }
}

async function submitAutopilotToolReport(
  tool: { execute?: (toolCallId: string, params: any) => Promise<any> | any },
  handlers: Map<string, Array<(event: any, ctx: any) => Promise<any> | any>>,
  ctx: any,
  toolCallId: string,
  params: any,
) {
  assert.ok(tool.execute);
  const result = await tool.execute(toolCallId, params);
  await runHandlers(
    handlers,
    "tool_result",
    {
      toolName: "autopilot_report",
      details: result?.details,
    },
    ctx,
  );
  await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);
  return result;
}

test("extension registers the Pi-native interactive autopilot commands", () => {
  const { pi, commands, tools } = createFakePi();

  autopilotExtension(pi);

  assert.deepEqual([...commands.keys()].sort(), [
    "autopilot-pause",
    "autopilot-resume",
    "autopilot-run",
    "autopilot-status",
    "autopilot-stop",
  ]);
  assert.equal(tools.some((tool) => tool.name === "autopilot_report"), true);
});

test("thinking_level_select refreshes active autopilot status", async () => {
  const { pi, handlers, commands } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    await runHandlers(handlers, "thinking_level_select", { level: "xhigh", previousLevel: "high" }, ctx);

    assert.match(String(ctx.statusUpdates.at(-1)), /think:xhigh/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-run queues the first phase prompt in the current session", async () => {
  const { pi, commands, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  const command = commands.get("autopilot-run");
  assert.ok(command);

  try {
    await command?.handler("land the Pi-native autopilot", ctx);

    assert.equal(sentUserMessages.length, 1);
    assert.match(String(sentUserMessages[0]?.content), /Objective: land the Pi-native autopilot/);
    assert.match(String(sentUserMessages[0]?.content), /Current active slice: B1/);
    assert.equal(appendedEntries.length > 0, true);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("resolveAutopilotPhaseDispatch rejects a missing deterministic route mapping", () => {
  assert.throws(
    () =>
      resolveAutopilotPhaseDispatch("execute", {
        routeMatrix: {},
      }),
    /route missing/i,
  );
});

test("resolveAutopilotPhaseDispatch rejects a missing package-owned routed skill file when no fallback exists", () => {
  const agentDir = createTempAgentDir({});
  const packageRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-missing-routed-skill-"));

  try {
    const route = resolveAutopilotPhaseRoute("execute", { packageRoot, agentDir });
    if (route.surface !== "skill") {
      throw new Error("expected a skill route");
    }

    assert.equal(route.resolvedFrom, "package");
    assert.throws(
      () =>
        resolveAutopilotPhaseDispatch("execute", {
          routeMatrix: {
            execute: route,
          },
        }),
      /requires skill file/i,
    );
  } finally {
    rmSync(agentDir, { recursive: true, force: true });
    rmSync(packageRoot, { recursive: true, force: true });
  }
});

test("resolveAutopilotPhaseDispatch rejects a blank fallback routed skill file", () => {
  const packageRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-blank-package-root-"));
  const agentDir = createTempAgentDir({
    "execute-plan": "   \n\n",
  });

  try {
    const route = resolveAutopilotPhaseRoute("execute", { packageRoot, agentDir });
    if (route.surface !== "skill") {
      throw new Error("expected a skill route");
    }

    assert.equal(route.resolvedFrom, "agent_dir");
    assert.throws(
      () =>
        resolveAutopilotPhaseDispatch("execute", {
          routeMatrix: {
            execute: route,
          },
        }),
      /non-empty skill file/i,
    );
  } finally {
    rmSync(agentDir, { recursive: true, force: true });
    rmSync(packageRoot, { recursive: true, force: true });
  }
});

test("/autopilot-run injects the package-owned routed skill file into the dispatched user message", async () => {
  const { pi, commands, sentUserMessages } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    const dispatched = String(sentUserMessages[0]?.content);
    assert.match(dispatched, /\[AUTOPILOT ROUTED DISPATCH\]/);
    assert.match(dispatched, /Bound surface: skill `plan-creator`/);
    assert.match(dispatched, /Resolved skill source: package/);
    assert.match(dispatched, /Package-owned primary:/);
    assert.match(dispatched, /name: plan-creator/);
    assert.match(dispatched, /Phase-specific autopilot prompt:/);
    assert.match(dispatched, /Objective: land the Pi-native autopilot/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("resolveAutopilotPhaseRoute falls back to the agent-dir skill when the package-owned skill is absent", () => {
  const agentDir = createTempAgentDir({
    "execute-plan": "# Execute Plan\n\n- Ship the current slice.\n",
  });
  const packageRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-missing-package-root-"));

  try {
    const route = resolveAutopilotPhaseRoute("execute", { packageRoot, agentDir });
    if (route.surface !== "skill") {
      throw new Error("expected a skill route");
    }

    assert.equal(route.resolvedFrom, "agent_dir");
    assert.equal(route.skillPath, path.join(agentDir, "skills", "execute-plan", "SKILL.md"));
    assert.equal(route.packageSkillPath, path.join(packageRoot, "skills", "execute-plan", "SKILL.md"));
    assert.equal(route.fallbackSkillPath, path.join(agentDir, "skills", "execute-plan", "SKILL.md"));
  } finally {
    rmSync(agentDir, { recursive: true, force: true });
    rmSync(packageRoot, { recursive: true, force: true });
  }
});

test("buildAutopilotPhaseDispatchMessage preloads resolved skill contents into the routed dispatch", () => {
  const agentDir = createTempAgentDir({
    "execute-plan": "# Execute Plan\n\n- Ship the current slice.\n",
  });

  try {
    const skillPath = path.join(agentDir, "skills", "execute-plan", "SKILL.md");
    const dispatch = resolveAutopilotPhaseDispatch("execute", {
      routeMatrix: {
        execute: {
          phase: "execute",
          surface: "skill",
          dispatchEncoding: "read_skill_file",
          skillName: "execute-plan",
          skillPath,
          packageSkillPath: path.join("/package", "skills", "execute-plan", "SKILL.md"),
          fallbackSkillPath: skillPath,
          resolvedFrom: "agent_dir",
          requiredTools: ["read", "autopilot_report"],
          summary: "execute the current slice",
        },
      },
    });

    const routed = buildAutopilotPhaseDispatchMessage("Execute the current wave.", dispatch);

    assert.match(routed, /Bound surface: skill `execute-plan`/);
    assert.match(routed, /Resolved skill source: agent_dir/);
    assert.match(routed, /Compatibility fallback:/);
    assert.match(routed, /# Execute Plan/);
    assert.match(routed, /Execute the current wave\./);
  } finally {
    rmSync(agentDir, { recursive: true, force: true });
  }
});

test("/autopilot-run fails fast when the current tool allowlist omits autopilot_report", async () => {
  const { pi, commands, sentUserMessages } = createFakePi();
  const ctx = createFakeContext({
    getSystemPrompt() {
      return "Active tools: read bash edit write";
    },
  });
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    assert.equal(sentUserMessages.length, 0);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /autopilot_report/);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /--no-tools|--tools/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-run fails fast when the current tool allowlist omits read for a skill-bound phase", async () => {
  const { pi, commands, sentUserMessages } = createFakePi();
  const ctx = createFakeContext({
    getSystemPrompt() {
      return "Active tools: bash edit write autopilot_report";
    },
  });
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    assert.equal(sentUserMessages.length, 0);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /read/);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /master_plan/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});


test("/autopilot-run still starts when the agent-dir fallback tree is missing but the package-owned routed skill exists", async () => {
  const { pi, commands, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  const priorAgentDir = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = path.join(os.tmpdir(), `pi-sdk-missing-agent-dir-${Date.now()}`);
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    assert.equal(sentUserMessages.length, 1);
    assert.match(String(sentUserMessages[0]?.content), /Resolved skill source: package/);
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.notEqual(latestRuntime?.mode, "closed");
  } finally {
    if (priorAgentDir === undefined) {
      delete process.env.PI_CODING_AGENT_DIR;
    } else {
      process.env.PI_CODING_AGENT_DIR = priorAgentDir;
    }
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-resume fails fast when the current tool allowlist omits autopilot_report", async () => {
  const { pi, commands, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext({
    getSystemPrompt() {
      return "Active tools: read bash edit write";
    },
  });
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", createFakeContext());
    assert.equal(sentUserMessages.length, 1);

    await commands.get("autopilot-pause")?.handler("", ctx);
    await commands.get("autopilot-resume")?.handler("", ctx);

    assert.equal(sentUserMessages.length, 1);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /autopilot_report/);
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.notEqual(latestRuntime?.mode, "running");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-run in local mode halts when no repo-local active control plane is available", async () => {
  const { pi, commands, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot unavailable: missing docs/plan pack",
          data: null,
          rawText: "",
        };
      },
      async advance() {
        return {
          ok: true,
          summary: "unused",
          data: { nextActiveSlice: null, updatedFiles: [] },
          rawText: "",
        };
      },
    }),
  );
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    assert.equal(sentUserMessages.length, 0);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /repo-local active control-plane/i);
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.equal(latestRuntime?.mode, "closed");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});


test("/autopilot-resume without prior runtime starts from docs/plan review handoff", async () => {
  const { pi, commands, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: "P1",
              intendedHandoff: "execution-reality-audit",
            },
            activeStage: {
              stageId: "P1",
              owner: "execution-reality-audit",
              state: "DONE_PENDING_REVIEW",
              priority: "highest",
              objectives: ["review completed execution"],
              requiredDeliverables: ["review verdict"],
              doneWhen: ["implementation evidence accepted"],
              stopBoundary: ["review finds unsafe tool exposure"],
              avoid: ["skipping review"],
            },
            stageOrder: ["P1", "P2"],
            sliceDefinitions: {},
          },
          rawText: "",
        };
      },
      async advance() {
        return {
          ok: true,
          summary: "unused",
          data: { nextActiveSlice: null, updatedFiles: [] },
          rawText: "",
        };
      },
    }),
  );
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-resume")?.handler("auto-guide-service-pi-native-mvp-v1-2026-05-02", ctx);

    const latestRuntime = appendedEntries.at(-1)?.data as { phase?: string; activeSlice?: { stepId?: string } } | undefined;
    assert.equal(latestRuntime?.phase, "review");
    assert.equal(latestRuntime?.activeSlice?.stepId, "P1");
    assert.equal(sentUserMessages.length, 1);
    assert.match(String(sentUserMessages[0]?.content), /Phase: review/);
    assert.match(String(sentUserMessages[0]?.content), /Bound surface: skill `execution-reality-audit`/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-resume in local mode re-syncs the active slice from the current control-plane snapshot", async () => {
  const { pi, commands, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: "C1",
              intendedHandoff: "execute-plan",
            },
            activeStage: {
              stageId: "C1",
              owner: "execute-plan",
              state: "READY",
              priority: "highest",
              objectives: ["bind run and resume to local control-plane truth"],
              requiredDeliverables: ["local control-plane aware run/resume path"],
              avoid: ["goal-only fallback"],
            },
            stageOrder: ["C1", "C2", "C3"],
            sliceDefinitions: {
              C1: {
                stageId: "C1",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["bind run and resume to local control-plane truth"],
                requiredDeliverables: ["local control-plane aware run/resume path"],
                avoid: ["goal-only fallback"],
              },
              C2: {
                stageId: "C2",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["write accepted reports back to control plane"],
                requiredDeliverables: ["deterministic writeback orchestration"],
                avoid: ["model-picked next slice"],
              },
              C3: {
                stageId: "C3",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["preserve control truth across compact/resume"],
                requiredDeliverables: ["control-truth resync after compact"],
                avoid: ["control-plane drift"],
              },
            },
          },
          rawText: "",
        };
      },
      async advance() {
        return {
          ok: true,
          summary: "unused",
          data: { nextActiveSlice: null, updatedFiles: [] },
          rawText: "",
        };
      },
    }),
  );
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    const latestRuntime = appendedEntries.at(-1)?.data as { activeSlice?: { stepId?: string } } | undefined;
    assert.equal(latestRuntime?.activeSlice?.stepId, "C1");
    assert.match(String(sentUserMessages[0]?.content), /Current active slice: C1/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("execute completion in local mode dispatches same-slice review; review completion writes the next active slice", async () => {
  const { pi, handlers, commands, tools, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  let advanceCalls = 0;
  const controlState = {
    activeSlice: "C2",
    intendedHandoff: "execution-reality-audit",
    activeStage: {
      stageId: "C2",
      owner: "execute-plan",
      state: "READY",
      priority: "highest",
      objectives: ["write accepted reports back to control plane"],
      requiredDeliverables: ["deterministic writeback orchestration"],
      avoid: ["model-picked next slice"],
    },
  };

  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: controlState.activeSlice,
              intendedHandoff: controlState.intendedHandoff,
            },
            activeStage: controlState.activeStage,
            stageOrder: ["C1", "C2", "C3"],
            sliceDefinitions: {
              C2: controlState.activeStage,
              C3: {
                stageId: "C3",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["preserve control truth across compact/resume"],
                requiredDeliverables: ["control-truth resync after compact"],
                avoid: ["control-plane drift"],
              },
            },
          },
          rawText: "",
        };
      },
      async advance(input) {
        advanceCalls += 1;
        assert.equal(input.intendedHandoff, "execute-plan");
        controlState.activeSlice = input.nextStage?.stageId ?? "PACK_COMPLETE";
        controlState.intendedHandoff = input.intendedHandoff;
        if (input.nextStage) {
          controlState.activeStage = input.nextStage;
        }
        return {
          ok: true,
          summary: "local control-plane writeback applied",
          data: { nextActiveSlice: controlState.activeSlice, updatedFiles: ["docs/plan/README.md"] },
          rawText: "",
        };
      },
    }),
  );
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    assert.match(String(sentUserMessages[0]?.content), /Current active slice: C2/);

    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "master_plan",
            status: "continue",
            summary: "C2 route planned",
            stepId: "C2",
            evidence: ["control-plane writeback route planned"],
            artifacts: ["docs/plan/README.md"],
            risks: [],
            timestampMs: 2,
          },
          historySize: 1,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);
    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "wave_plan",
            status: "continue",
            summary: "C2 execute queued",
            stepId: "C2",
            evidence: ["execute route queued"],
            artifacts: ["docs/plan/active_WORKSET.md"],
            risks: [],
            timestampMs: 3,
          },
          historySize: 2,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    const tool = tools.find((candidate) => candidate.name === "autopilot_report");
    assert.ok(tool?.execute);
    const executeResult = await tool.execute?.("tool-call-1", {
      phase: "execute",
      status: "completed",
      summary: "C2 execute landed",
      stepId: "C2",
      evidence: ["execute dispatches review without accepted writeback"],
      artifacts: ["src/extension/index.ts"],
      risks: [],
    });
    assert.equal(executeResult?.details?.report?.status, "completed");
    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: executeResult?.details,
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    assert.equal(advanceCalls, 0);
    assert.equal(controlState.activeSlice, "C2");
    assert.equal(sentUserMessages.length, 4);
    assert.match(String(sentUserMessages[3]?.content), /Bound surface: skill `execution-reality-audit`/);
    assert.match(String(sentUserMessages[3]?.content), /Current active slice: C2/);
    const runtimeAfterExecute = appendedEntries.at(-1)?.data as { autopilotOwnedPaths?: string[] } | undefined;
    assert.notEqual(runtimeAfterExecute?.autopilotOwnedPaths?.includes("docs/plan/README.md"), true);

    const reviewResult = await tool.execute?.("tool-call-2", {
      phase: "review",
      status: "completed",
      summary: "C2 review accepted",
      stepId: "C2",
      evidence: ["review-owned accepted writeback applied"],
      artifacts: ["docs/plan/README.md"],
      risks: [],
    });
    assert.equal(reviewResult?.details?.report?.status, "completed");
    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: reviewResult?.details,
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    assert.equal(advanceCalls, 1);
    assert.equal(controlState.activeSlice, "C3");
    assert.equal(controlState.intendedHandoff, "execute-plan");
    assert.equal(sentUserMessages.length, 5);
    assert.match(String(sentUserMessages[4]?.content), /Current active slice: C3/);
    const latestRuntime = appendedEntries.at(-1)?.data as { autopilotOwnedPaths?: string[] } | undefined;
    assert.equal(latestRuntime?.autopilotOwnedPaths?.includes("docs/plan/README.md"), true);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("review completion without a next local stage halts before PACK_COMPLETE writeback", async () => {
  const { pi, handlers, commands, tools, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  let advanceCalls = 0;
  const controlState = {
    activeSlice: "L1",
    intendedHandoff: "execute-plan",
    activeStage: {
      stageId: "L1",
      owner: "execute-plan",
      state: "READY",
      priority: "highest",
      objectives: ["prove last-stage review cannot silently terminalize docs/plan"],
      requiredDeliverables: ["non-terminal PACK_COMPLETE guard"],
      avoid: ["unsafe PACK_COMPLETE writeback"],
    },
  };

  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: controlState.activeSlice,
              intendedHandoff: controlState.intendedHandoff,
            },
            activeStage: controlState.activeStage,
            stageOrder: ["L1"],
            sliceDefinitions: {
              L1: controlState.activeStage,
            },
          },
          rawText: "",
        };
      },
      async advance() {
        advanceCalls += 1;
        controlState.activeSlice = "PACK_COMPLETE";
        return {
          ok: true,
          summary: "unsafe terminal writeback should not run",
          data: { nextActiveSlice: null, updatedFiles: ["docs/plan/README.md"] },
          rawText: "",
        };
      },
    }),
  );
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    const tool = tools.find((candidate) => candidate.name === "autopilot_report");
    assert.ok(tool?.execute);

    await submitAutopilotToolReport(tool, handlers, ctx, "tool-call-l1-master", {
      phase: "master_plan",
      status: "continue",
      summary: "L1 route planned",
      stepId: "L1",
      evidence: ["last-stage guard route planned"],
      artifacts: ["docs/plan/README.md"],
      risks: [],
    });
    await submitAutopilotToolReport(tool, handlers, ctx, "tool-call-l1-wave", {
      phase: "wave_plan",
      status: "continue",
      summary: "L1 execute queued",
      stepId: "L1",
      evidence: ["last-stage guard queued"],
      artifacts: ["docs/plan/active_WORKSET.md"],
      risks: [],
    });
    await submitAutopilotToolReport(tool, handlers, ctx, "tool-call-l1-execute", {
      phase: "execute",
      status: "completed",
      summary: "L1 execute landed",
      stepId: "L1",
      evidence: ["execute still dispatches review without accepted writeback"],
      artifacts: ["src/extension/runtime-dispatch.ts"],
      risks: [],
    });

    assert.equal(sentUserMessages.length, 4);
    assert.match(String(sentUserMessages[3]?.content), /Bound surface: skill `execution-reality-audit`/);
    assert.match(String(sentUserMessages[3]?.content), /Current active slice: L1/);

    await submitAutopilotToolReport(tool, handlers, ctx, "tool-call-l1-review", {
      phase: "review",
      status: "completed",
      summary: "L1 review accepted but no next stage exists",
      stepId: "L1",
      evidence: ["last-stage review acceptance attempted"],
      artifacts: ["docs/plan/active_STATUS.md"],
      risks: [],
    });

    assert.equal(advanceCalls, 0);
    assert.equal(controlState.activeSlice, "L1");
    assert.equal(sentUserMessages.length, 4);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /refusing non-terminal PACK_COMPLETE writeback/);
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.equal(latestRuntime?.mode, "closed");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("objective-terminal done writes parser-compatible PACK_COMPLETE and dispatches closeout", async () => {
  const { pi, handlers, commands, tools, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  let advanceCalls = 0;
  const activeStage = {
    stageId: "T1",
    owner: "execute-plan",
    state: "READY",
    priority: "highest",
    objectives: ["prove explicit terminal writeback"],
    requiredDeliverables: ["PACK_COMPLETE parser sentinel"],
    doneWhen: ["terminal writeback path is explicit"],
    stopBoundary: ["terminal writeback cannot be parsed"],
    avoid: ["implicit non-terminal PACK_COMPLETE"],
  };
  const packCompleteStage = {
    stageId: "PACK_COMPLETE",
    owner: "closeout",
    state: "DONE",
    priority: "terminal",
    objectives: ["close the pack through the repo-local closeout prompt surface"],
    requiredDeliverables: ["final closeout summary and residual handoff"],
    doneWhen: [],
    stopBoundary: [],
    avoid: ["dispatching another execute/review phase from terminal parser truth"],
  };
  const controlState = {
    activeSlice: "T1",
    intendedHandoff: "execute-plan",
    activeStage,
  };

  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: controlState.activeSlice,
              intendedHandoff: controlState.intendedHandoff,
            },
            activeStage: controlState.activeStage,
            stageOrder: ["T1"],
            sliceDefinitions: {
              T1: activeStage,
            },
          },
          rawText: "",
        };
      },
      async advance(input) {
        advanceCalls += 1;
        assert.equal(input.nextStage, null);
        assert.equal(input.intendedHandoff, "autopilot-closeout");
        controlState.activeSlice = "PACK_COMPLETE";
        controlState.intendedHandoff = input.intendedHandoff;
        controlState.activeStage = packCompleteStage;
        return {
          ok: true,
          summary: "terminal control-plane writeback applied",
          data: { nextActiveSlice: "PACK_COMPLETE", updatedFiles: ["docs/plan/README.md", "docs/plan/active_STATUS.md", "docs/plan/active_WORKSET.md"] },
          rawText: "",
        };
      },
    }),
  );
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    const tool = tools.find((candidate) => candidate.name === "autopilot_report");
    assert.ok(tool?.execute);

    await submitAutopilotToolReport(tool, handlers, ctx, "tool-call-t1-master", {
      phase: "master_plan",
      status: "continue",
      summary: "T1 route planned",
      stepId: "T1",
      evidence: ["terminal route planned"],
      artifacts: ["docs/plan/README.md"],
      risks: [],
    });
    await submitAutopilotToolReport(tool, handlers, ctx, "tool-call-t1-wave", {
      phase: "wave_plan",
      status: "continue",
      summary: "T1 execute queued",
      stepId: "T1",
      evidence: ["terminal execute queued"],
      artifacts: ["docs/plan/active_WORKSET.md"],
      risks: [],
    });
    const doneResult = await submitAutopilotToolReport(tool, handlers, ctx, "tool-call-t1-execute", {
      phase: "execute",
      status: "done",
      summary: "T1 objective terminal writeback accepted",
      stepId: "T1",
      doneWhenMet: ["terminal writeback path is explicit"],
      evidence: ["objective-terminal done path used"],
      artifacts: ["docs/plan/active_WORKSET.md"],
      risks: [],
    });

    assert.equal(doneResult?.details?.report?.status, "done");
    assert.equal(advanceCalls, 1);
    assert.equal(controlState.activeSlice, "PACK_COMPLETE");
    assert.equal(controlState.intendedHandoff, "autopilot-closeout");
    assert.equal(sentUserMessages.length, 4);
    assert.match(String(sentUserMessages[3]?.content), /Bound surface: prompt `autopilot-closeout`/);
    assert.match(String(sentUserMessages[3]?.content), /Current active slice: PACK_COMPLETE/);
    const latestRuntime = appendedEntries.at(-1)?.data as { phase?: string; mode?: string; activeSlice?: { stepId?: string } } | undefined;
    assert.equal(latestRuntime?.phase, "closeout");
    assert.equal(latestRuntime?.mode, "running");
    assert.equal(latestRuntime?.activeSlice?.stepId, "PACK_COMPLETE");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("local edit/write tool calls register best-effort autopilot-owned paths", async () => {
  const { pi, handlers, commands, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeLocalSubstrate(ctx.cwd, {
    async snapshot() {
      return {
        ok: true,
        summary: "local control-plane snapshot loaded",
        data: {
          readme: {
            activePack: {
              planPath: "docs/plan/active_PLAN.md",
              statusPath: "docs/plan/active_STATUS.md",
              worksetPath: "docs/plan/active_WORKSET.md",
            },
            activeSlice: "C1",
            intendedHandoff: "execute-plan",
          },
          activeStage: {
            stageId: "C1",
            owner: "execute-plan",
            state: "READY",
            priority: "highest",
            objectives: ["bind run and resume to local control-plane truth"],
            requiredDeliverables: ["local control-plane aware run/resume path"],
            avoid: ["goal-only fallback"],
          },
          stageOrder: ["C1", "C2"],
          sliceDefinitions: {
            C1: {
              stageId: "C1",
              owner: "execute-plan",
              state: "READY",
              priority: "highest",
              objectives: ["bind run and resume to local control-plane truth"],
              requiredDeliverables: ["local control-plane aware run/resume path"],
              avoid: ["goal-only fallback"],
            },
          },
        },
        rawText: "",
      };
    },
    async advance() {
      return {
        ok: true,
        summary: "unused",
        data: { nextActiveSlice: null, updatedFiles: [] },
        rawText: "",
      };
    },
  }));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    await runHandlers(
      handlers,
      "tool_call",
      {
        toolName: "edit",
        input: { path: "src/extension/index.ts", edits: [] },
      },
      ctx,
    );

    const latestRuntime = appendedEntries.at(-1)?.data as { autopilotOwnedPaths?: string[] } | undefined;
    assert.equal(latestRuntime?.autopilotOwnedPaths?.includes("src/extension/index.ts"), true);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("autopilot_report rejects a phase that does not match the current runtime phase", async () => {
  const { pi, commands, tools, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    const tool = tools.find((candidate) => candidate.name === "autopilot_report");
    assert.ok(tool?.execute);

    await assert.rejects(
      () =>
        tool.execute?.("tool-call-1", {
          phase: "review",
          status: "continue",
          summary: "wrong phase report",
          stepId: "B1",
        }),
      /current runtime phase/i,
    );
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.equal(latestRuntime?.mode, "closed");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("autopilot_report rejects a stepId that does not match the active slice truth", async () => {
  const { pi, commands, tools, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    const tool = tools.find((candidate) => candidate.name === "autopilot_report");
    assert.ok(tool?.execute);

    await assert.rejects(
      () =>
        tool.execute?.("tool-call-1", {
          phase: "master_plan",
          status: "continue",
          summary: "master plan frozen",
          stepId: "WRONG",
        }),
      /active slice/i,
    );
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.equal(latestRuntime?.mode, "closed");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("autopilot_report in execute phase derives status from active-slice done_when / stop_boundary", async () => {
  const { pi, handlers, commands, tools } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "master_plan",
            status: "continue",
            summary: "master plan frozen",
            evidence: [],
            artifacts: [],
            risks: [],
            timestampMs: 1,
          },
          historySize: 1,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);
    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "wave_plan",
            status: "continue",
            summary: "wave plan frozen",
            stepId: "B1",
            evidence: [],
            artifacts: [],
            risks: [],
            timestampMs: 2,
          },
          historySize: 2,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    const tool = tools.find((candidate) => candidate.name === "autopilot_report");
    assert.ok(tool?.execute);

    const incomplete = await tool.execute?.("tool-call-1", {
      phase: "execute",
      status: "completed",
      summary: "implementation landed but stop law not yet evidenced",
      stepId: "B1",
      doneWhenMet: [],
      evidence: ["edited runtime"],
      artifacts: ["src/extension/index.ts"],
    });
    assert.equal(incomplete?.details?.report?.status, "continue");

    const completed = await tool.execute?.("tool-call-2", {
      phase: "execute",
      status: "continue",
      summary: "implementation and proof landed",
      stepId: "B1",
      doneWhenMet: ["active-slice-aware report validation"],
      evidence: ["targeted tests passed"],
      artifacts: ["test/extension.test.ts"],
    });
    assert.equal(completed?.details?.report?.status, "completed");

    const replanned = await tool.execute?.("tool-call-3", {
      phase: "execute",
      status: "continue",
      summary: "execution hit the active stop boundary",
      stepId: "B1",
      stopBoundaryHit: ["wrong-slice progression remains after execution"],
      evidence: ["stop law triggered"],
      artifacts: ["src/autopilot/phase-prompt.ts"],
    });
    assert.equal(replanned?.details?.report?.status, "needs_replan");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("autopilot_report rejects stop-law items that are not in the active slice contract", async () => {
  const { pi, handlers, commands, tools, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "master_plan",
            status: "continue",
            summary: "master plan frozen",
            evidence: [],
            artifacts: [],
            risks: [],
            timestampMs: 1,
          },
          historySize: 1,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);
    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "wave_plan",
            status: "continue",
            summary: "wave plan frozen",
            stepId: "B1",
            evidence: [],
            artifacts: [],
            risks: [],
            timestampMs: 2,
          },
          historySize: 2,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    const tool = tools.find((candidate) => candidate.name === "autopilot_report");
    assert.ok(tool?.execute);

    await assert.rejects(
      () =>
        tool.execute?.("tool-call-3", {
          phase: "execute",
          status: "completed",
          summary: "claimed completion with a fake stop-law item",
          stepId: "B1",
          doneWhenMet: ["not part of the active slice"],
        }),
      /doneWhenMet must match active slice done_when items/i,
    );
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.equal(latestRuntime?.mode, "closed");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("tool_result followed by turn_end queues the next phase prompt when autopilot is running", async () => {
  const { pi, handlers, commands, sentUserMessages } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    assert.equal(sentUserMessages.length, 1);

    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "master_plan",
            status: "continue",
            summary: "master plan frozen",
            evidence: [],
            artifacts: [],
            risks: [],
            timestampMs: 1,
          },
          historySize: 1,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    assert.equal(sentUserMessages.length, 2);
    assert.match(String(sentUserMessages[1]?.content), /Create or refine the plan for the current wave/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("before_agent_start injects a continuation contract while autopilot is running", async () => {
  const { pi, handlers, commands } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    const results = [];
    for (const handler of handlers.get("before_agent_start") ?? []) {
      results.push(
        await handler(
          {
            prompt: "continue",
            images: [],
            systemPrompt: "Base system prompt",
          },
          ctx,
        ),
      );
    }

    assert.equal(results.length > 0, true);
    const merged = results.find((value) => value && typeof value === "object") as { systemPrompt?: string; message?: { content?: string } } | undefined;
    assert.ok(merged);
    assert.match(merged.systemPrompt ?? "", /Do not ask the user whether to continue\./);
    assert.match(merged.systemPrompt ?? "", /Assume pre-authorization to continue while autopilot mode remains running\./);
    assert.match(merged.message?.content ?? "", /autopilot continuation contract active/i);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("before_agent_start halts autopilot when selectedTools omit autopilot_report", async () => {
  const { pi, handlers, commands, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    const results = [];
    for (const handler of handlers.get("before_agent_start") ?? []) {
      results.push(
        await handler(
          {
            prompt: "continue",
            images: [],
            systemPrompt: "Base system prompt",
            systemPromptOptions: {
              selectedTools: ["read", "bash", "edit", "write"],
            },
          },
          ctx,
        ),
      );
    }

    const merged = results.find((value) => value && typeof value === "object") as { systemPrompt?: string; message?: { content?: string } } | undefined;
    assert.ok(merged);
    assert.match(merged.message?.content ?? "", /autopilot_report/);
    assert.match(merged.systemPrompt ?? "", /required tools are missing/i);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /autopilot_report/);
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.equal(latestRuntime?.mode, "closed");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("before_agent_start halts autopilot when selectedTools omit read for a skill-bound phase", async () => {
  const { pi, handlers, commands, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    const results = [];
    for (const handler of handlers.get("before_agent_start") ?? []) {
      results.push(
        await handler(
          {
            prompt: "continue",
            images: [],
            systemPrompt: "Base system prompt",
            systemPromptOptions: {
              selectedTools: ["bash", "edit", "write", "autopilot_report"],
            },
          },
          ctx,
        ),
      );
    }

    const merged = results.find((value) => value && typeof value === "object") as { systemPrompt?: string; message?: { content?: string } } | undefined;
    assert.ok(merged);
    assert.match(merged.message?.content ?? "", /read/);
    assert.match(merged.message?.content ?? "", /master_plan/);
    assert.match(merged.systemPrompt ?? "", /required tools are missing/i);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /read/);
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.equal(latestRuntime?.mode, "closed");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("autopilot updates the working indicator to reflect runtime phase and mode", async () => {
  const { pi, commands } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    const runningIndicator = ctx.workingIndicators.at(-1) as { frames?: string[] } | undefined;
    assert.ok(runningIndicator?.frames?.some((frame) => /MP/.test(frame)));

    await commands.get("autopilot-pause")?.handler("", ctx);
    const pausedIndicator = ctx.workingIndicators.at(-1) as { frames?: string[] } | undefined;
    assert.deepEqual(pausedIndicator?.frames, ["MP‖"]);

    await commands.get("autopilot-stop")?.handler("", ctx);
    const stoppingIndicator = ctx.workingIndicators.at(-1) as { frames?: string[] } | undefined;
    assert.deepEqual(stoppingIndicator?.frames, ["MP■"]);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("session_shutdown uses Pi 0.68 replacement metadata for clearer autopilot handoff cleanup", async () => {
  const { pi, handlers, commands } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    await runHandlers(
      handlers,
      "session_shutdown",
      {
        reason: "fork",
        targetSessionFile: "/tmp/forked-session.jsonl",
      },
      ctx,
    );

    assert.match(ctx.notifications.at(-1)?.message ?? "", /forked-session\.jsonl/);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /branch handoff/i);
    assert.equal(ctx.workingIndicators.at(-1), undefined);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-pause prevents automatic next-phase queueing until resumed", async () => {
  const { pi, handlers, commands, sentUserMessages } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    await commands.get("autopilot-pause")?.handler("", ctx);

    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "master_plan",
            status: "continue",
            summary: "master plan frozen",
            evidence: [],
            artifacts: [],
            risks: [],
            timestampMs: 1,
          },
          historySize: 1,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    assert.equal(sentUserMessages.length, 1);

    await commands.get("autopilot-resume")?.handler("", ctx);
    assert.equal(sentUserMessages.length, 2);
    assert.match(String(sentUserMessages[1]?.content), /Create or refine the plan for the current wave/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-status surfaces benchmark projection and decision authority when BB status is available", async () => {
  const { pi, commands } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    await commands.get("autopilot-status")?.handler("", ctx);

    const latest = ctx.notifications.at(-1)?.message ?? "";
    assert.match(latest, /objective-key: objective:[a-f0-9]{12}/);
    assert.match(latest, /promotion-readiness: .*canary=promote/);
    assert.match(latest, /decision-authority: state=finalized outcome=promote · intent=recorded · reconcile=ready/);
    assert.match(latest, /history-summary: canary=1 · strategy=0 · latest=canary:promote · artifact_summary=shadow_only@0.74/);
    assert.match(latest, /artifact-summary-candidate: stage=shadow_only · confidence=0.74 · replay-guard=pass · governance-guard=hold/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-status surfaces goal-directed decision state from the latest report", async () => {
  const { pi, handlers, commands } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "review",
            status: "needs_replan",
            summary: "review selected the lower-risk route",
            nextAction: "replan around the safer route",
            decisionMode: "goal_directed",
            decisionBasis: ["preserves validated progress", "keeps the route closest to the final objective"],
            candidateRoutes: ["fast risky patch", "safer incremental route"],
            evidence: [],
            artifacts: [],
            risks: [],
            timestampMs: 2,
          },
          historySize: 1,
        },
      },
      ctx,
    );

    await commands.get("autopilot-status")?.handler("", ctx);

    const latest = ctx.notifications.at(-1)?.message ?? "";
    assert.match(latest, /decision-mode: goal_directed/);
    assert.match(latest, /decision-basis: preserves validated progress \| keeps the route closest to the final objective/);
    assert.match(latest, /candidate-routes: fast risky patch \| safer incremental route/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-status overlay opens a bounded inspector overlay when UI is available", async () => {
  const { pi, commands } = createFakePi();
  const overlays: Array<{ options: unknown }> = [];
  const ctx = createFakeContext({
    ui: {
      notify() {},
      setStatus() {},
      setWidget() {},
      custom(_factory: unknown, options: unknown) {
        overlays.push({ options });
        return Promise.resolve(undefined);
      },
      theme: {
        fg: (_token: string, text: string) => text,
      },
    },
  });
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    await commands.get("autopilot-status")?.handler("overlay", ctx);

    assert.equal(overlays.length, 1);
    assert.deepEqual(overlays[0]?.options, {
      overlay: true,
      overlayOptions: { anchor: "top-right", width: "50%", margin: 1, maxHeight: 16 },
    });
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("session_compact rebuilds running runtime state and auto-redispatches the ready phase", async () => {
  const { pi, handlers, sentUserMessages } = createFakePi();
  const ctx = createFakeContext({
    sessionManager: {
      getBranch() {
        return [
          {
            type: "message",
            message: {
              role: "toolResult",
              toolName: "autopilot_report",
              details: {
                report: {
                  phase: "master_plan",
                  status: "continue",
                  summary: "master plan frozen",
                  evidence: [],
                  artifacts: [],
                  risks: [],
                  timestampMs: 1,
                },
                historySize: 1,
              },
            },
          },
          {
            type: "custom",
            customType: "autopilot-runtime-state",
            data: {
              goal: "goal",
              mode: "running",
              phase: "wave_plan",
              currentWave: 1,
              currentCycle: 1,
              maxWaves: 5,
              maxExecutionCyclesPerWave: 3,
              dispatchState: "ready",
              warnings: [],
              updatedAtMs: 10,
            },
          },
        ];
      },
    },
  });
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await runHandlers(handlers, "session_compact", { fromExtension: false }, ctx);

    assert.equal(sentUserMessages.length, 1);
    assert.match(String(sentUserMessages[0]?.content), /Create or refine the plan for the current wave/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("session_compact rebuilds but does not auto-redispatch when runtime is paused", async () => {
  const { pi, handlers, sentUserMessages } = createFakePi();
  autopilotExtension(pi);

  const ctx = createFakeContext({
    sessionManager: {
      getBranch() {
        return [
          {
            type: "message",
            message: {
              role: "toolResult",
              toolName: "autopilot_report",
              details: {
                report: {
                  phase: "master_plan",
                  status: "continue",
                  summary: "master plan frozen",
                  evidence: [],
                  artifacts: [],
                  risks: [],
                  timestampMs: 1,
                },
                historySize: 1,
              },
            },
          },
          {
            type: "custom",
            customType: "autopilot-runtime-state",
            data: {
              goal: "goal",
              mode: "paused",
              phase: "wave_plan",
              currentWave: 1,
              currentCycle: 1,
              maxWaves: 5,
              maxExecutionCyclesPerWave: 3,
              dispatchState: "ready",
              warnings: [],
              updatedAtMs: 10,
            },
          },
        ];
      },
    },
  });

  await runHandlers(handlers, "session_compact", { fromExtension: false }, ctx);

  assert.equal(sentUserMessages.length, 0);
});

test("turn_end triggers compaction instead of immediate redispatch when context pressure is high", async () => {
  const { pi, handlers, commands, sentUserMessages } = createFakePi();
  const compactCalls: Array<{ customInstructions?: string }> = [];
  const ctx = createFakeContext({
    getContextUsage() {
      return { tokens: 100_001 };
    },
    compact(options: { customInstructions?: string }) {
      compactCalls.push({ customInstructions: options.customInstructions });
    },
  });
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    assert.equal(sentUserMessages.length, 1);

    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "master_plan",
            status: "continue",
            summary: "master plan frozen",
            evidence: [],
            artifacts: [],
            risks: [],
            timestampMs: 1,
          },
          historySize: 1,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    assert.equal(compactCalls.length, 1);
    assert.match(compactCalls[0]?.customInstructions ?? "", /autopilot/i);
    assert.equal(sentUserMessages.length, 1);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("high-context compaction flow preserves autopilot continuation end-to-end", async () => {
  const { pi, handlers, commands, sentUserMessages } = createFakePi();
  const branchEntries: any[] = [];
  const compactCalls: Array<{ customInstructions?: string }> = [];
  const ctx = createFakeContext({
    sessionManager: {
      getBranch() {
        return branchEntries;
      },
    },
    getContextUsage() {
      return { tokens: 100_001 };
    },
    compact(options: { customInstructions?: string }) {
      compactCalls.push({ customInstructions: options.customInstructions });
    },
  });
  setRuntimeSubstrate(createFakeSubstrate(ctx.cwd));
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    assert.equal(sentUserMessages.length, 1);

    const reportEvent = {
      toolName: "autopilot_report",
      details: {
        report: {
          phase: "master_plan",
          status: "continue",
          summary: "master plan frozen",
          evidence: [],
          artifacts: [],
          risks: [],
          timestampMs: 1,
        },
        historySize: 1,
      },
    };

    await runHandlers(handlers, "tool_result", reportEvent, ctx);
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    assert.equal(compactCalls.length, 1);
    assert.equal(sentUserMessages.length, 1);

    branchEntries.splice(
      0,
      branchEntries.length,
      {
        type: "message",
        message: {
          role: "toolResult",
          toolName: "autopilot_report",
          details: reportEvent.details,
        },
      },
      {
        type: "custom",
        customType: "autopilot-runtime-state",
        data: {
          goal: "land the Pi-native autopilot",
          mode: "running",
          phase: "wave_plan",
          currentWave: 1,
          currentCycle: 1,
          maxWaves: 5,
          maxExecutionCyclesPerWave: 3,
          dispatchState: "ready",
          warnings: [],
          activeSlice: {
            stepId: "B1",
            owner: "execute-plan",
            state: "READY",
            objectives: ["make reports active-slice-aware"],
            requiredDeliverables: ["active-slice-aware report validation"],
            avoid: ["wrong-slice progression"],
          },
          updatedAtMs: 10,
        },
      },
    );

    await runHandlers(handlers, "session_compact", { fromExtension: false }, ctx);

    assert.equal(sentUserMessages.length, 2);
    assert.match(String(sentUserMessages[1]?.content), /Create or refine the plan for the current wave/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("session_compact in local mode re-syncs a stale runtime slice from the current control-plane snapshot before redispatch", async () => {
  const { pi, handlers, sentUserMessages } = createFakePi();
  const controlState = {
    activeSlice: "C3",
    activeStage: {
      stageId: "C3",
      owner: "execute-plan",
      state: "READY",
      priority: "highest",
      objectives: ["preserve control truth across compact/resume"],
      requiredDeliverables: ["control-truth resync after compact"],
      avoid: ["control-plane drift"],
    },
  };
  const ctx = createFakeContext({
    sessionManager: {
      getBranch() {
        return [
          {
            type: "message",
            message: {
              role: "toolResult",
              toolName: "autopilot_report",
              details: {
                report: {
                  phase: "master_plan",
                  status: "continue",
                  summary: "master plan frozen",
                  evidence: [],
                  artifacts: [],
                  risks: [],
                  timestampMs: 1,
                },
                historySize: 1,
              },
            },
          },
          {
            type: "custom",
            customType: "autopilot-runtime-state",
            data: {
              goal: "goal",
              mode: "running",
              phase: "wave_plan",
              currentWave: 1,
              currentCycle: 1,
              maxWaves: 5,
              maxExecutionCyclesPerWave: 3,
              dispatchState: "ready",
              warnings: [],
              activeSlice: {
                stepId: "C2",
                owner: "execute-plan",
                state: "READY",
                objectives: ["write accepted reports back to control plane"],
                requiredDeliverables: ["deterministic writeback orchestration"],
                avoid: ["model-picked next slice"],
              },
              updatedAtMs: 10,
            },
          },
        ];
      },
    },
  });
  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: controlState.activeSlice,
              intendedHandoff: "execute-plan",
            },
            activeStage: controlState.activeStage,
            stageOrder: ["C1", "C2", "C3"],
            sliceDefinitions: {
              C3: controlState.activeStage,
            },
          },
          rawText: "",
        };
      },
      async advance() {
        return {
          ok: true,
          summary: "unused",
          data: { nextActiveSlice: null, updatedFiles: [] },
          rawText: "",
        };
      },
    }),
  );
  autopilotExtension(pi);

  try {
    await runHandlers(handlers, "session_compact", { fromExtension: false }, ctx);

    assert.equal(sentUserMessages.length, 1);
    assert.match(String(sentUserMessages[0]?.content), /Current active slice: C3/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-resume in local mode prefers updated control-plane truth over a stale runtime slice", async () => {
  const { pi, handlers, commands, sentUserMessages } = createFakePi();
  const ctx = createFakeContext();
  const controlState = {
    activeSlice: "C2",
    activeStage: {
      stageId: "C2",
      owner: "execute-plan",
      state: "READY",
      priority: "highest",
      objectives: ["write accepted reports back to control plane"],
      requiredDeliverables: ["deterministic writeback orchestration"],
      avoid: ["model-picked next slice"],
    },
  };
  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: controlState.activeSlice,
              intendedHandoff: "execute-plan",
            },
            activeStage: controlState.activeStage,
            stageOrder: ["C1", "C2", "C3"],
            sliceDefinitions: {
              C2: controlState.activeStage,
              C3: {
                stageId: "C3",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["preserve control truth across compact/resume"],
                requiredDeliverables: ["control-truth resync after compact"],
                avoid: ["control-plane drift"],
              },
            },
          },
          rawText: "",
        };
      },
      async advance() {
        return {
          ok: true,
          summary: "unused",
          data: { nextActiveSlice: null, updatedFiles: [] },
          rawText: "",
        };
      },
    }),
  );
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "master_plan",
            status: "continue",
            summary: "master plan frozen",
            evidence: [],
            artifacts: [],
            risks: [],
            timestampMs: 1,
          },
          historySize: 1,
        },
      },
      ctx,
    );
    await commands.get("autopilot-pause")?.handler("", ctx);
    controlState.activeSlice = "C3";
    controlState.activeStage = {
      stageId: "C3",
      owner: "execute-plan",
      state: "READY",
      priority: "highest",
      objectives: ["preserve control truth across compact/resume"],
      requiredDeliverables: ["control-truth resync after compact"],
      avoid: ["control-plane drift"],
    };

    await commands.get("autopilot-resume")?.handler("", ctx);

    assert.equal(sentUserMessages.length, 2);
    assert.match(String(sentUserMessages[1]?.content), /Current active slice: C3/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-run in local mode allows control-plane-only dirty repos on the initial run", async () => {
  const { pi, commands, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: "D1",
              intendedHandoff: "execute-plan",
            },
            activeStage: {
              stageId: "D1",
              owner: "execute-plan",
              state: "READY",
              priority: "highest",
              objectives: ["land dirty-repo and drift guards"],
              requiredDeliverables: ["dirty-repo guard"],
              avoid: ["unsafe auto-run"],
            },
            stageOrder: ["D1", "D2", "D3"],
            sliceDefinitions: {
              D1: {
                stageId: "D1",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["land dirty-repo and drift guards"],
                requiredDeliverables: ["dirty-repo guard"],
                avoid: ["unsafe auto-run"],
              },
            },
          },
          rawText: "",
        };
      },
      async advance() {
        return {
          ok: true,
          summary: "unused",
          data: { nextActiveSlice: null, updatedFiles: [] },
          rawText: "",
        };
      },
    }, [
      {
        path: ctx.cwd,
        name: "repo",
        branch: "main",
        dirty_files: 4,
        status_summary: "4 dirty",
        remote: "",
        recent_commits: [],
        dirty_paths: [
          "docs/plan/README.md",
          "docs/plan/active_PLAN.md",
          "docs/plan/active_STATUS.md",
          "docs/plan/active_WORKSET.md",
        ],
      },
    ]),
  );
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    assert.equal(sentUserMessages.length, 1);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /allowing local run/i);
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string; warnings?: string[] } | undefined;
    assert.equal(latestRuntime?.mode, "running");
    assert.equal(latestRuntime?.warnings?.some((warning) => /control-plane files/i.test(warning)), true);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-run in local mode still halts when foreign dirty paths are present", async () => {
  const { pi, commands, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: "D1",
              intendedHandoff: "execute-plan",
            },
            activeStage: {
              stageId: "D1",
              owner: "execute-plan",
              state: "READY",
              priority: "highest",
              objectives: ["land dirty-repo and drift guards"],
              requiredDeliverables: ["dirty-repo guard"],
              avoid: ["unsafe auto-run"],
            },
            stageOrder: ["D1", "D2", "D3"],
            sliceDefinitions: {
              D1: {
                stageId: "D1",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["land dirty-repo and drift guards"],
                requiredDeliverables: ["dirty-repo guard"],
                avoid: ["unsafe auto-run"],
              },
            },
          },
          rawText: "",
        };
      },
      async advance() {
        return {
          ok: true,
          summary: "unused",
          data: { nextActiveSlice: null, updatedFiles: [] },
          rawText: "",
        };
      },
    }, [
      {
        path: ctx.cwd,
        name: "repo",
        branch: "main",
        dirty_files: 5,
        status_summary: "5 dirty",
        remote: "",
        recent_commits: [],
        dirty_paths: [
          "docs/plan/README.md",
          "docs/plan/active_PLAN.md",
          "docs/plan/active_STATUS.md",
          "docs/plan/active_WORKSET.md",
          "src/extension/index.ts",
        ],
      },
    ]),
  );
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    assert.equal(sentUserMessages.length, 0);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /outside the repo-local control-plane/i);
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.equal(latestRuntime?.mode, "closed");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("/autopilot-run in local mode halts when the repo is dirty but no path-level detail is available", async () => {
  const { pi, commands, sentUserMessages, appendedEntries } = createFakePi();
  const ctx = createFakeContext();
  setRuntimeSubstrate(
    createFakeLocalSubstrate(ctx.cwd, {
      async snapshot() {
        return {
          ok: true,
          summary: "local control-plane snapshot loaded",
          data: {
            readme: {
              activePack: {
                planPath: "docs/plan/active_PLAN.md",
                statusPath: "docs/plan/active_STATUS.md",
                worksetPath: "docs/plan/active_WORKSET.md",
              },
              activeSlice: "D1",
              intendedHandoff: "execute-plan",
            },
            activeStage: {
              stageId: "D1",
              owner: "execute-plan",
              state: "READY",
              priority: "highest",
              objectives: ["land dirty-repo and drift guards"],
              requiredDeliverables: ["dirty-repo guard"],
              avoid: ["unsafe auto-run"],
            },
            stageOrder: ["D1", "D2", "D3"],
            sliceDefinitions: {
              D1: {
                stageId: "D1",
                owner: "execute-plan",
                state: "READY",
                priority: "highest",
                objectives: ["land dirty-repo and drift guards"],
                requiredDeliverables: ["dirty-repo guard"],
                avoid: ["unsafe auto-run"],
              },
            },
          },
          rawText: "",
        };
      },
      async advance() {
        return {
          ok: true,
          summary: "unused",
          data: { nextActiveSlice: null, updatedFiles: [] },
          rawText: "",
        };
      },
    }, [
      {
        path: ctx.cwd,
        name: "repo",
        branch: "main",
        dirty_files: 2,
        status_summary: "2 dirty",
        remote: "",
        recent_commits: [],
      },
    ]),
  );
  autopilotExtension(pi);

  try {
    await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);

    assert.equal(sentUserMessages.length, 0);
    assert.match(ctx.notifications.at(-1)?.message ?? "", /no path-level detail/i);
    const latestRuntime = appendedEntries.at(-1)?.data as { mode?: string } | undefined;
    assert.equal(latestRuntime?.mode, "closed");
  } finally {
    setRuntimeSubstrate(undefined);
  }
});
