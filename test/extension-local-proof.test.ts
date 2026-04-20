import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import autopilotExtension from "../src/extension/index.ts";
import { setRuntimeSubstrate } from "../src/substrate/index.ts";

function createFakePi() {
  const handlers = new Map<string, Array<(event: any, ctx: any) => Promise<any> | any>>();
  const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> | void }>();
  const tools: Array<{ name: string }> = [];
  const sentUserMessages: Array<{ content: unknown; options?: { deliverAs?: "steer" | "followUp" } }> = [];
  const appendedEntries: Array<{ customType: string; data: unknown }> = [];

  const pi = {
    on(event: string, handler: (event: any, ctx: any) => Promise<any> | any) {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
    },
    registerCommand(name: string, options: { handler: (args: string, ctx: any) => Promise<void> | void }) {
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
    sendMessage() {},
  };

  return { pi: pi as any, handlers, commands, tools, sentUserMessages, appendedEntries };
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

function writeLocalPlanPack(repoRoot: string): void {
  const docsPlan = path.join(repoRoot, "docs", "plan");
  mkdirSync(docsPlan, { recursive: true });

  writeFileSync(
    path.join(docsPlan, "README.md"),
    `# pi-sdk Plan Control Plane

## Active Pack

- \`docs/plan/active_PLAN.md\`
- \`docs/plan/active_STATUS.md\`
- \`docs/plan/active_WORKSET.md\`

## Current Active Slice

- \`D2\`

## Intended Handoff

- \`execute-plan\`
`,
    "utf8",
  );

  writeFileSync(
    path.join(docsPlan, "active_PLAN.md"),
    `# Example Plan

#### \`D2\` — same-session-local-e2e-proof

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- prove extension-only local same-session plan progression

交付物：

1. local-mode same-session proof
2. real file writeback proof

必须避免：

1. fake substrate final proof

#### \`D3\` — closeout-and-handoff

- Owner: \`closeout\`
- State: \`READY\`
- Priority: \`medium\`

目标：

- close the pack honestly

交付物：

1. final plan closeout

必须避免：

1. stale active pack pointer
`,
    "utf8",
  );

  writeFileSync(
    path.join(docsPlan, "active_STATUS.md"),
    `# Example Status

## Current Step

- active_step: \`D2\`

## Planned Stages

- [x] \`D1\` dirty-repo-and-drift-guard
- [ ] \`D2\` same-session-local-e2e-proof
- [ ] \`D3\` closeout-and-handoff

## Immediate Focus

### \`D2\`

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- prove extension-only local same-session plan progression
`,
    "utf8",
  );

  writeFileSync(
    path.join(docsPlan, "active_WORKSET.md"),
    `# Example Workset

## Stage Order

- [x] \`D1\` dirty-repo-and-drift-guard
- [ ] \`D2\` same-session-local-e2e-proof
- [ ] \`D3\` closeout-and-handoff

## Active Stage

### \`D2\`

- Owner: \`execute-plan\`
- State: \`READY\`
- Priority: \`highest\`

目标：

- prove extension-only local same-session plan progression

必须交付：

1. local-mode same-session proof
2. real file writeback proof

必须避免：

1. fake substrate final proof
`,
    "utf8",
  );
}

test("extension-only local mode can progress a repo-local active slice and rewrite the control plane before redispatching", async () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-extension-local-proof-"));
  writeLocalPlanPack(repoRoot);
  setRuntimeSubstrate(undefined);

  const { pi, handlers, commands, sentUserMessages } = createFakePi();
  autopilotExtension(pi);

  const ctx = {
    cwd: repoRoot,
    hasUI: true,
    ui: {
      notify() {},
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
  };

  try {
    await commands.get("autopilot-run")?.handler("complete the active slice", ctx);

    assert.equal(sentUserMessages.length, 1);
    assert.match(String(sentUserMessages[0]?.content), /Current active slice: D2/);

    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "master_plan",
            status: "completed",
            summary: "local proof slice completed",
            stepId: "D2",
            evidence: ["extension-only local proof passed"],
            artifacts: ["docs/plan/active_STATUS.md"],
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
    assert.match(String(sentUserMessages[1]?.content), /Current active slice: D3/);

    const readme = readFileSync(path.join(repoRoot, "docs", "plan", "README.md"), "utf8");
    const status = readFileSync(path.join(repoRoot, "docs", "plan", "active_STATUS.md"), "utf8");
    const workset = readFileSync(path.join(repoRoot, "docs", "plan", "active_WORKSET.md"), "utf8");

    assert.match(readme, /## Current Active Slice[\s\S]*- `D3`/);
    assert.match(status, /- active_step: `D3`/);
    assert.match(workset, /### `D3`/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});
