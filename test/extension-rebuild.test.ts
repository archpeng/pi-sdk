import test from "node:test";
import assert from "node:assert/strict";
import autopilotExtension from "../src/extension/index.ts";

function createFakePi() {
  const handlers = new Map<string, Array<(event: any, ctx: any) => Promise<any> | any>>();
  const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> | void }>();

  const pi = {
    on(event: string, handler: (event: any, ctx: any) => Promise<any> | any) {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
    },
    registerCommand(name: string, options: { handler: (args: string, ctx: any) => Promise<void> | void }) {
      commands.set(name, options);
    },
    registerTool() {},
    sendUserMessage() {},
    appendEntry() {},
    sendMessage() {},
  };

  return { pi: pi as any, handlers, commands };
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

test("session_start rebuild restores persisted runtime state for /autopilot-status", async () => {
  const { pi, handlers, commands } = createFakePi();
  autopilotExtension(pi);

  const notifications: string[] = [];
  const ctx = {
    cwd: "/repo",
    hasUI: true,
    ui: {
      notify(message: string) {
        notifications.push(message);
      },
      setStatus() {},
      setWidget() {},
      theme: {
        fg: (_token: string, text: string) => text,
      },
    },
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
    isIdle() {
      return true;
    },
    hasPendingMessages() {
      return false;
    },
    abort() {},
    signal: undefined,
  };

  await runHandlers(handlers, "session_start", { reason: "resume" }, ctx);
  await commands.get("autopilot-status")?.handler("", ctx);

  assert.equal(notifications.length > 0, true);
  assert.match(notifications.at(-1) ?? "", /mode: paused/);
  assert.match(notifications.at(-1) ?? "", /phase: wave_plan/);
  assert.match(notifications.at(-1) ?? "", /goal: goal/);
});
