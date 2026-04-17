import test from "node:test";
import assert from "node:assert/strict";
import autopilotExtension from "../src/extension/index.ts";
import type { AutopilotSubstrate } from "../src/substrate/index.ts";
import { setRuntimeSubstrate } from "../src/substrate/index.ts";

interface FakeCommand {
  description?: string;
  handler: (args: string, ctx: any) => Promise<void> | void;
}

function createFakePi() {
  const handlers = new Map<string, Array<(event: any, ctx: any) => Promise<any> | any>>();
  const commands = new Map<string, FakeCommand>();
  const tools: Array<{ name: string }> = [];
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
    registerTool(tool: { name: string }) {
      tools.push(tool);
    },
    sendUserMessage(content: unknown, options?: { deliverAs?: "steer" | "followUp" }) {
      sentUserMessages.push({ content, options });
    },
    appendEntry(customType: string, data?: unknown) {
      appendedEntries.push({ customType, data });
    },
    sendMessage() {
      // not needed in these tests
    },
  };

  return { pi: pi as any, handlers, commands, tools, sentUserMessages, appendedEntries };
}

function createFakeContext(overrides: Partial<any> = {}) {
  const notifications: Array<{ message: string; kind: string }> = [];
  return {
    cwd: "/repo",
    hasUI: true,
    ui: {
      notify(message: string, kind = "info") {
        notifications.push({ message, kind });
      },
      setStatus() {},
      setWidget() {},
      theme: {
        fg: (_token: string, text: string) => text,
      },
    },
    sessionManager: {
      getBranch() {
        return [];
      },
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
    ...overrides,
  };
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

test("/autopilot-run queues the first phase prompt in the current session", async () => {
  const { pi, commands, sentUserMessages, appendedEntries } = createFakePi();
  autopilotExtension(pi);

  const command = commands.get("autopilot-run");
  assert.ok(command);

  await command?.handler("land the Pi-native autopilot", createFakeContext());

  assert.equal(sentUserMessages.length, 1);
  assert.match(String(sentUserMessages[0]?.content), /Objective: land the Pi-native autopilot/);
  assert.equal(appendedEntries.length > 0, true);
});

test("tool_result followed by turn_end queues the next phase prompt when autopilot is running", async () => {
  const { pi, handlers, commands, sentUserMessages } = createFakePi();
  autopilotExtension(pi);

  const ctx = createFakeContext();
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
});

test("/autopilot-pause prevents automatic next-phase queueing until resumed", async () => {
  const { pi, handlers, commands, sentUserMessages } = createFakePi();
  autopilotExtension(pi);

  const ctx = createFakeContext();
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

test("/autopilot-status overlay opens a bounded inspector overlay when UI is available", async () => {
  const { pi, commands } = createFakePi();
  autopilotExtension(pi);

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

  await commands.get("autopilot-run")?.handler("land the Pi-native autopilot", ctx);
  await commands.get("autopilot-status")?.handler("overlay", ctx);

  assert.equal(overlays.length, 1);
  assert.deepEqual(overlays[0]?.options, {
    overlay: true,
    overlayOptions: { anchor: "top-right", width: "50%", margin: 1, maxHeight: 16 },
  });
});
