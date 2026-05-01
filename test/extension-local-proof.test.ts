import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import autopilotExtension from "../src/extension/index.ts";
import { setRuntimeSubstrate } from "../src/substrate/index.ts";

function createFakePi() {
  const handlers = new Map<string, Array<(event: any, ctx: any) => Promise<any> | any>>();
  const commands = new Map<string, { handler: (args: string, ctx: any) => Promise<void> | void }>();
  const tools: Array<{ name: string; execute?: (toolCallId: string, params: any) => Promise<any> | any }> = [];
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
    registerTool(tool: { name: string; execute?: (toolCallId: string, params: any) => Promise<any> | any }) {
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

function createTempAgentDir(skillFiles: Record<string, string>): string {
  const agentDir = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-agent-dir-"));
  for (const [skillName, contents] of Object.entries(skillFiles)) {
    const skillDir = path.join(agentDir, "skills", skillName);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(path.join(skillDir, "SKILL.md"), contents, "utf8");
  }
  return agentDir;
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
2. execute completion keeps D2 active until review acceptance
3. execute-phase stop-law completion proof

done_when:

1. local execute review is routed with deterministic skill preload
2. execute completion dispatches review without advancing the active slice

stop_boundary:

1. stop if execute completion mutates docs/plan before review
2. stop if execute completion skips explicit stop-law reporting

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

done_when:

1. accepted review writeback keeps explicit stop-law sections

stop_boundary:

1. stop if review-owned writeback points outside docs/plan

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

必须交付：

1. local-mode same-session proof
2. execute completion keeps D2 active until review acceptance
3. execute-phase stop-law completion proof

done_when:

1. local execute review is routed with deterministic skill preload
2. execute completion dispatches review without advancing the active slice

stop_boundary:

1. stop if execute completion mutates docs/plan before review
2. stop if execute completion skips explicit stop-law reporting

必须避免：

1. fake substrate final proof
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
2. execute completion keeps D2 active until review acceptance
3. execute-phase stop-law completion proof

done_when:

1. local execute review is routed with deterministic skill preload
2. execute completion dispatches review without advancing the active slice

stop_boundary:

1. stop if execute completion mutates docs/plan before review
2. stop if execute completion skips explicit stop-law reporting

必须避免：

1. fake substrate final proof
`,
    "utf8",
  );
}

test("extension-only local mode keeps execute on the same slice and rewrites the control plane after review", async () => {
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
            status: "continue",
            summary: "local proof route planned",
            stepId: "D2",
            evidence: ["extension-only local proof planned"],
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

    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "wave_plan",
            status: "continue",
            summary: "local proof execute queued",
            stepId: "D2",
            evidence: ["wave keeps D2 active for execute"],
            artifacts: ["docs/plan/active_WORKSET.md"],
            risks: [],
            timestampMs: 2,
          },
          historySize: 2,
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
            phase: "execute",
            status: "completed",
            summary: "execute proof landed",
            stepId: "D2",
            doneWhenMet: [
              "local execute review is routed with deterministic skill preload",
              "execute completion dispatches review without advancing the active slice",
            ],
            evidence: ["execute proof exercised review dispatch without accepted writeback"],
            artifacts: ["docs/plan/active_STATUS.md"],
            risks: [],
            timestampMs: 3,
          },
          historySize: 3,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    assert.equal(sentUserMessages.length, 4);
    assert.match(String(sentUserMessages[3]?.content), /Bound surface: skill `execution-reality-audit`/);
    assert.match(String(sentUserMessages[3]?.content), /Current active slice: D2/);

    const readmeAfterExecute = readFileSync(path.join(repoRoot, "docs", "plan", "README.md"), "utf8");
    const statusAfterExecute = readFileSync(path.join(repoRoot, "docs", "plan", "active_STATUS.md"), "utf8");
    const worksetAfterExecute = readFileSync(path.join(repoRoot, "docs", "plan", "active_WORKSET.md"), "utf8");

    assert.match(readmeAfterExecute, /## Current Active Slice[\s\S]*- `D2`/);
    assert.match(statusAfterExecute, /- active_step: `D2`/);
    assert.match(worksetAfterExecute, /## Active Stage[\s\S]*### `D2`/);

    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: {
          report: {
            phase: "review",
            status: "completed",
            summary: "review accepted local proof",
            stepId: "D2",
            doneWhenMet: [
              "local execute review is routed with deterministic skill preload",
              "execute completion dispatches review without advancing the active slice",
            ],
            evidence: ["review-owned accepted writeback exercised"],
            artifacts: ["docs/plan/active_STATUS.md"],
            risks: [],
            timestampMs: 4,
          },
          historySize: 4,
        },
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    assert.equal(sentUserMessages.length, 5);
    assert.match(String(sentUserMessages[4]?.content), /Current active slice: D3/);

    const readme = readFileSync(path.join(repoRoot, "docs", "plan", "README.md"), "utf8");
    const status = readFileSync(path.join(repoRoot, "docs", "plan", "active_STATUS.md"), "utf8");
    const workset = readFileSync(path.join(repoRoot, "docs", "plan", "active_WORKSET.md"), "utf8");

    assert.match(readme, /## Current Active Slice[\s\S]*- `D3`/);
    assert.match(status, /- active_step: `D3`/);
    assert.match(status, /done_when:[\s\S]*accepted review writeback keeps explicit stop-law sections/);
    assert.match(workset, /### `D3`/);
    assert.match(workset, /stop_boundary:[\s\S]*stop if review-owned writeback points outside docs\/plan/);
  } finally {
    setRuntimeSubstrate(undefined);
  }
});

test("local execute proof binds routed skills, uses stop-law completion, and redispatches the next slice from single-root docs/plan truth", async () => {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-extension-local-proof-routed-"));
  const agentDir = createTempAgentDir({
    "plan-creator": "# plan-creator\n\nUse the plan lane.",
    "execute-plan": "# execute-plan\n\nUse the execute lane.",
    "execution-reality-audit": "# execution-reality-audit\n\nUse the review lane.",
  });
  const priorAgentDir = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = agentDir;
  writeLocalPlanPack(repoRoot);
  setRuntimeSubstrate(undefined);

  const { pi, handlers, commands, tools, sentUserMessages, appendedEntries } = createFakePi();
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
    assert.match(String(sentUserMessages[0]?.content), /\[AUTOPILOT ROUTED DISPATCH\]/);
    assert.match(String(sentUserMessages[0]?.content), /Bound surface: skill `plan-creator`/);
    assert.match(String(sentUserMessages[0]?.content), /Current active slice: D2/);

    const tool = tools.find((candidate) => candidate.name === "autopilot_report");
    assert.ok(tool?.execute);

    const masterPlan = await tool.execute?.("tool-call-1", {
      phase: "master_plan",
      status: "continue",
      summary: "planned the proof route",
      stepId: "D2",
      evidence: ["local control plane loaded"],
      artifacts: ["docs/plan/README.md"],
      risks: [],
    });
    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: masterPlan?.details,
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    assert.equal(sentUserMessages.length, 2);
    assert.match(String(sentUserMessages[1]?.content), /Bound surface: skill `plan-creator`/);
    assert.match(String(sentUserMessages[1]?.content), /Current active slice: D2/);

    const wavePlan = await tool.execute?.("tool-call-2", {
      phase: "wave_plan",
      status: "continue",
      summary: "queued the execute proof",
      stepId: "D2",
      evidence: ["execute slice stays bounded"],
      artifacts: ["docs/plan/active_WORKSET.md"],
      risks: [],
    });
    await runHandlers(
      handlers,
      "tool_result",
      {
        toolName: "autopilot_report",
        details: wavePlan?.details,
      },
      ctx,
    );
    await runHandlers(handlers, "turn_end", { toolResults: [], message: { role: "assistant", content: [] } }, ctx);

    assert.equal(sentUserMessages.length, 3);
    assert.match(String(sentUserMessages[2]?.content), /Bound surface: skill `execute-plan`/);
    assert.match(String(sentUserMessages[2]?.content), /Current active slice: D2/);
    assert.match(
      String(sentUserMessages[2]?.content),
      /Current active slice done_when: local execute review is routed with deterministic skill preload \| execute completion dispatches review without advancing the active slice/,
    );
    assert.match(
      String(sentUserMessages[2]?.content),
      /Current active slice stop_boundary: stop if execute completion mutates docs\/plan before review \| stop if execute completion skips explicit stop-law reporting/,
    );

    const executeResult = await tool.execute?.("tool-call-3", {
      phase: "execute",
      status: "continue",
      summary: "execute proof landed",
      stepId: "D2",
      doneWhenMet: [
        "local execute review is routed with deterministic skill preload",
        "execute completion dispatches review without advancing the active slice",
      ],
      evidence: ["execute proof exercised routed dispatch without accepted writeback"],
      artifacts: ["docs/plan/active_STATUS.md", "docs/plan/active_WORKSET.md"],
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

    assert.equal(sentUserMessages.length, 4);
    assert.match(String(sentUserMessages[3]?.content), /Bound surface: skill `execution-reality-audit`/);
    assert.match(String(sentUserMessages[3]?.content), /Current active slice: D2/);
    assert.match(
      String(sentUserMessages[3]?.content),
      /Current active slice done_when: local execute review is routed with deterministic skill preload \| execute completion dispatches review without advancing the active slice/,
    );

    const readmeAfterExecute = readFileSync(path.join(repoRoot, "docs", "plan", "README.md"), "utf8");
    const statusAfterExecute = readFileSync(path.join(repoRoot, "docs", "plan", "active_STATUS.md"), "utf8");
    const worksetAfterExecute = readFileSync(path.join(repoRoot, "docs", "plan", "active_WORKSET.md"), "utf8");
    const runtimeAfterExecute = appendedEntries.at(-1)?.data as { autopilotOwnedPaths?: string[] } | undefined;

    assert.match(readmeAfterExecute, /## Current Active Slice[\s\S]*- `D2`/);
    assert.match(statusAfterExecute, /## Immediate Focus[\s\S]*### `D2`/);
    assert.match(worksetAfterExecute, /## Active Stage[\s\S]*### `D2`/);
    assert.notEqual(runtimeAfterExecute?.autopilotOwnedPaths?.includes("docs/plan/README.md"), true);

    const reviewResult = await tool.execute?.("tool-call-4", {
      phase: "review",
      status: "continue",
      summary: "review accepted local proof",
      stepId: "D2",
      doneWhenMet: [
        "local execute review is routed with deterministic skill preload",
        "execute completion dispatches review without advancing the active slice",
      ],
      evidence: ["review-owned accepted writeback exercised"],
      artifacts: ["docs/plan/active_STATUS.md", "docs/plan/active_WORKSET.md"],
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

    assert.equal(sentUserMessages.length, 5);
    assert.match(String(sentUserMessages[4]?.content), /Current active slice: D3/);

    const readme = readFileSync(path.join(repoRoot, "docs", "plan", "README.md"), "utf8");
    const status = readFileSync(path.join(repoRoot, "docs", "plan", "active_STATUS.md"), "utf8");
    const workset = readFileSync(path.join(repoRoot, "docs", "plan", "active_WORKSET.md"), "utf8");
    const latestRuntime = appendedEntries.at(-1)?.data as { autopilotOwnedPaths?: string[] } | undefined;

    assert.match(readme, /## Current Active Slice[\s\S]*- `D3`/);
    assert.match(status, /## Immediate Focus[\s\S]*### `D3`/);
    assert.match(status, /done_when:[\s\S]*accepted review writeback keeps explicit stop-law sections/);
    assert.match(workset, /## Active Stage[\s\S]*### `D3`/);
    assert.match(workset, /stop_boundary:[\s\S]*stop if review-owned writeback points outside docs\/plan/);
    assert.equal(latestRuntime?.autopilotOwnedPaths?.includes("docs/plan/README.md"), true);
    assert.equal(latestRuntime?.autopilotOwnedPaths?.includes("docs/plan/active_STATUS.md"), true);
    assert.equal(latestRuntime?.autopilotOwnedPaths?.includes("docs/plan/active_WORKSET.md"), true);
  } finally {
    setRuntimeSubstrate(undefined);
    rmSync(agentDir, { recursive: true, force: true });
    if (priorAgentDir === undefined) {
      delete process.env.PI_CODING_AGENT_DIR;
    } else {
      process.env.PI_CODING_AGENT_DIR = priorAgentDir;
    }
  }
});
