import test from "node:test";
import assert from "node:assert/strict";
import { beginInteractiveRuntime } from "../src/autopilot/state.ts";
import { buildSessionShutdownMessage } from "../src/extension/session-transition.ts";
import { updateAutopilotUi } from "../src/extension/runtime-ui.ts";
import { preflightAutopilotCommand } from "../src/extension/tool-guard.ts";

test("preflightAutopilotCommand accepts prompts that still include phase-required tools", () => {
  const result = preflightAutopilotCommand({
    getSystemPrompt() {
      return "Active tools: read bash edit write autopilot_report";
    },
  } as any, "master_plan");

  assert.deepEqual(result, { ok: true });
});

test("preflightAutopilotCommand reports a missing autopilot_report tool", () => {
  const result = preflightAutopilotCommand({
    getSystemPrompt() {
      return "Active tools: read bash edit write";
    },
  } as any, "master_plan");

  assert.equal(result.ok, false);
  assert.match(result.reason, /autopilot_report/);
  assert.match(result.reason, /--no-tools|--tools/);
});

test("buildSessionShutdownMessage summarizes replacement session targets for fork handoff", () => {
  const runtime = beginInteractiveRuntime({
    goal: "goal",
    maxWaves: 4,
    maxExecutionCyclesPerWave: 3,
    objectiveKey: "objective:test",
  });

  const message = buildSessionShutdownMessage("fork", "/tmp/forked-session.jsonl", runtime);

  assert.match(message ?? "", /forked-session\.jsonl/);
  assert.match(message ?? "", /branch handoff/i);
  assert.equal(buildSessionShutdownMessage("fork", "/tmp/forked-session.jsonl", { ...runtime, mode: "closed" }), undefined);
});

test("updateAutopilotUi renders paused runtime status and working-indicator truth", () => {
  const statusUpdates: Array<[string, string | undefined]> = [];
  const widgetUpdates: Array<[string, string[] | undefined]> = [];
  const workingIndicators: unknown[] = [];
  const ctx = {
    hasUI: true,
    ui: {
      setStatus(key: string, text: string | undefined) {
        statusUpdates.push([key, text]);
      },
      setWidget(key: string, content: string[] | undefined) {
        widgetUpdates.push([key, content]);
      },
      setWorkingIndicator(options?: unknown) {
        workingIndicators.push(options);
      },
      theme: {
        fg: (_token: string, text: string) => text,
      },
    },
  } as any;
  const runtime = {
    ...beginInteractiveRuntime({
      goal: "goal",
      maxWaves: 4,
      maxExecutionCyclesPerWave: 3,
      objectiveKey: "objective:test",
    }),
    mode: "paused",
    phase: "wave_plan",
    substrateMode: "local",
  } as const;

  updateAutopilotUi(ctx, runtime, []);

  assert.match(statusUpdates.at(-1)?.[1] ?? "", /paused/);
  assert.match(statusUpdates.at(-1)?.[1] ?? "", /wave_plan/);
  assert.equal(widgetUpdates.at(-1)?.[0], "autopilot");
  const indicator = workingIndicators.at(-1) as { frames?: string[] } | undefined;
  assert.deepEqual(indicator?.frames, ["WP‖"]);
});
