import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { resolveAutopilotPackageRoot } from "./manifest.js";

export interface PiBbBackedSmokeCommandResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  output: string;
  timedOut: boolean;
}

export interface PiBbBackedSmokeResult {
  ok: boolean;
  packageRoot: string;
  goal: string;
  run: PiBbBackedSmokeCommandResult;
  status: PiBbBackedSmokeCommandResult;
  rpcStatus: PiBbBackedSmokeCommandResult;
  sessionFiles: string[];
  sessionEntryTypes: string[];
  rpcSessionFiles: string[];
  rpcSessionEntryTypes: string[];
  providerPhases: string[];
  mcpToolCalls: string[];
  mcpResourceReads: string[];
}

export interface RunPiBbBackedSmokeInput {
  packageRoot?: string;
  goal?: string;
  timeoutMs?: number;
  cleanup?: boolean;
}

function seedStubSkills(agentDir: string): void {
  const skills: Array<{ name: string; summary: string }> = [
    { name: "plan-creator", summary: "Stub routed skill for BB-backed smoke planning phases." },
    { name: "execute-plan", summary: "Stub routed skill for BB-backed smoke execute phase." },
    { name: "execution-reality-audit", summary: "Stub routed skill for BB-backed smoke review phase." },
  ];

  for (const skill of skills) {
    const skillDir = path.join(agentDir, "skills", skill.name);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(
      path.join(skillDir, "SKILL.md"),
      `# ${skill.name}\n\n${skill.summary}\n`,
      "utf8",
    );
  }
}

function createToolResult(id: string | number | undefined, payload: unknown): string {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    result: {
      content: [{ type: "text", text: JSON.stringify(payload) }],
    },
  });
}

function createResourceResult(id: string | number | undefined, payload: unknown): string {
  return JSON.stringify({
    jsonrpc: "2.0",
    id,
    result: {
      contents: [{ text: JSON.stringify(payload) }],
    },
  });
}

function parseRequestBody(requestBody: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(requestBody);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function extractPhase(requestBody: string): string {
  const payload = parseRequestBody(requestBody);
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || typeof message !== "object") continue;
    const content = (message as { content?: unknown }).content;
    if (typeof content !== "string") continue;
    const matches = [...content.matchAll(/set `phase` to `([^`]+)`/gu)];
    const phase = matches.at(-1)?.[1];
    if (phase) return phase;
  }

  return "master_plan";
}

function buildAutopilotReportArgs(phase: string): string {
  const nextAction = phase === "closeout" ? "stop" : "closeout";
  return JSON.stringify({
    phase,
    status: "done",
    summary: `stub ${phase} done`,
    waveId: "wave-1",
    stepId: `${phase}-1`,
    nextAction,
    evidence: [`provider=stub`, `phase=${phase}`],
    artifacts: [],
    risks: [],
  });
}

function requestHasToolResult(requestBody: string): boolean {
  const payload = parseRequestBody(requestBody);
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];
  return messages.some((message) => message && typeof message === "object" && (message as { role?: unknown }).role === "tool");
}

async function listen(server: http.Server): Promise<number> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to resolve listening port");
  }
  return address.port;
}

async function closeServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

function buildSmokeEnv(agentDir: string, mcpUrl: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PI_CODING_AGENT_DIR: agentDir,
    PI_SDK_SUBSTRATE: "bb",
    PI_SDK_BB_MEMORY_URL: mcpUrl,
    PI_SDK_BB_GOVERN_URL: mcpUrl,
    PI_SDK_BB_TOOLS_URL: mcpUrl,
    OPENAI_API_KEY: "",
    ANTHROPIC_API_KEY: "",
    ANTHROPIC_OAUTH_TOKEN: "",
    GEMINI_API_KEY: "",
  };
}

function listFilesRecursive(root: string): string[] {
  const output: string[] = [];

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      output.push(...listFilesRecursive(absolute));
      continue;
    }
    output.push(absolute);
  }

  return output;
}

function listSessionFiles(agentDir: string): string[] {
  if (!statSync(agentDir, { throwIfNoEntry: false })?.isDirectory()) {
    return [];
  }

  return listFilesRecursive(agentDir).filter((file) => file.endsWith(".jsonl")).sort();
}

function readSessionEntryTypes(sessionFile: string): string[] {
  const content = readFileSync(sessionFile, "utf8");
  const seen = new Set<string>();

  for (const line of content.split(/\n+/u).filter(Boolean)) {
    try {
      const parsed = JSON.parse(line) as { type?: unknown; customType?: unknown };
      if (parsed.type === "custom" && typeof parsed.customType === "string") {
        seen.add(parsed.customType);
        continue;
      }
      if (typeof parsed.type === "string") {
        seen.add(parsed.type);
      }
    } catch {
      // Ignore malformed lines in smoke-only evidence parsing.
    }
  }

  return [...seen];
}

async function runPiArgs(cwd: string, env: NodeJS.ProcessEnv, args: string[], timeoutMs: number): Promise<PiBbBackedSmokeCommandResult> {
  return await new Promise((resolve) => {
    const child = spawn("pi", args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const finish = (exitCode: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        exitCode,
        signal,
        timedOut,
        output: `${stdout}${stderr}`.trim(),
      });
    };

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.once("error", (error) => {
      stderr += error instanceof Error ? error.message : String(error);
      finish(null, null);
    });
    child.once("close", (exitCode, signal) => finish(exitCode, signal));

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
  });
}

async function runPiCommand(
  cwd: string,
  env: NodeJS.ProcessEnv,
  sessionDir: string,
  commandText: string,
  timeoutMs: number,
): Promise<PiBbBackedSmokeCommandResult> {
  return runPiArgs(cwd, env, ["--session-dir", sessionDir, "--provider", "smoke", "--model", "stub-model", "-p", commandText], timeoutMs);
}

async function runPiRpcStatus(
  cwd: string,
  env: NodeJS.ProcessEnv,
  sessionDir: string,
  goal: string,
  timeoutMs: number,
): Promise<PiBbBackedSmokeCommandResult> {
  return await new Promise((resolve) => {
    const child = spawn(
      "pi",
      ["--mode", "rpc", "--session-dir", sessionDir, "--provider", "smoke", "--model", "stub-model"],
      { cwd, env, stdio: ["pipe", "pipe", "pipe"] },
    );

    let stdout = "";
    let stderr = "";
    let buffered = "";
    let timedOut = false;
    let settled = false;
    let statusOutput = "";

    const messageHistory: Record<string, unknown>[] = [];
    const waiters: Array<{
      predicate: (message: Record<string, unknown>) => boolean;
      resolve: (message: Record<string, unknown>) => void;
      reject: (error: Error) => void;
    }> = [];

    const clear = () => {
      clearTimeout(timeout);
      child.stdout.removeAllListeners();
      child.stderr.removeAllListeners();
    };

    const finish = (exitCode: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return;
      settled = true;
      clear();
      resolve({
        exitCode,
        signal,
        timedOut,
        output: statusOutput || `${stdout}${stderr}`.trim(),
      });
    };

    const fail = (error: Error) => {
      stderr += error.message;
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
      finish(null, null);
    };

    const notifyWaiters = (message: Record<string, unknown>) => {
      for (let index = 0; index < waiters.length; index += 1) {
        const waiter = waiters[index];
        if (!waiter) continue;
        if (waiter.predicate(message)) {
          waiters.splice(index, 1);
          waiter.resolve(message);
          return;
        }
      }
    };

    const waitFor = (predicate: (message: Record<string, unknown>) => boolean): Promise<Record<string, unknown>> =>
      new Promise((resolveWaiter, rejectWaiter) => {
        const existing = messageHistory.find((message) => predicate(message));
        if (existing) {
          resolveWaiter(existing);
          return;
        }
        waiters.push({ predicate, resolve: resolveWaiter, reject: rejectWaiter });
      });

    const send = (message: Record<string, unknown>) => {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    };

    const waitForResponse = async (id: string) => {
      const response = await waitFor((message) => message.type === "response" && message.id === id);
      if (response.success !== true) {
        throw new Error(`RPC command ${id} failed`);
      }
    };

    child.stdout.on("data", (chunk) => {
      const text = String(chunk);
      stdout += text;
      buffered += text;

      while (true) {
        const newlineIndex = buffered.indexOf("\n");
        if (newlineIndex === -1) break;
        const line = buffered.slice(0, newlineIndex).replace(/\r$/u, "");
        buffered = buffered.slice(newlineIndex + 1);
        if (!line) continue;
        try {
          const parsed = JSON.parse(line) as Record<string, unknown>;
          messageHistory.push(parsed);
          if (
            parsed.type === "extension_ui_request" &&
            parsed.method === "notify" &&
            typeof parsed.message === "string" &&
            /mode: running/u.test(parsed.message)
          ) {
            statusOutput = parsed.message;
          }
          notifyWaiters(parsed);
        } catch {
          // ignore malformed lines
        }
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.once("error", (error) => fail(error instanceof Error ? error : new Error(String(error))));
    child.once("close", (exitCode, signal) => finish(exitCode, signal));

    const timeout = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore
      }
    }, timeoutMs);

    (async () => {
      try {
        send({ id: "run", type: "prompt", message: `/autopilot-run ${goal}` });
        await waitForResponse("run");
        await waitFor(
          (message) =>
            (message.type === "tool_execution_end" && message.toolName === "autopilot_report") ||
            (message.type === "turn_end" && JSON.stringify(message).includes("autopilot_report")),
        );
        send({ id: "status", type: "prompt", message: "/autopilot-status" });
        await waitForResponse("status");
        await waitFor(
          (message) =>
            message.type === "extension_ui_request" &&
            message.method === "notify" &&
            typeof message.message === "string" &&
            /mode: running/u.test(message.message) &&
            /phase: closeout/u.test(message.message) &&
            /substrate: bb/u.test(message.message),
        );
        finish(0, null);
        child.kill("SIGKILL");
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)));
      }
    })();
  });
}

export async function runPiBbBackedSmoke(input: RunPiBbBackedSmokeInput = {}): Promise<PiBbBackedSmokeResult> {
  const packageRoot = input.packageRoot ?? resolveAutopilotPackageRoot();
  const goal = input.goal ?? "prove bb-backed residual";
  const timeoutMs = input.timeoutMs ?? 10_000;
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "pi-sdk-bb-smoke-"));
  const projectRoot = path.join(tempRoot, "project");
  const agentDir = path.join(tempRoot, "agent");
  const sessionDir = path.join(tempRoot, "sessions");
  const providerPhases: string[] = [];
  const mcpToolCalls: string[] = [];
  const mcpResourceReads: string[] = [];

  mkdirSync(path.join(projectRoot, ".pi"), { recursive: true });
  mkdirSync(agentDir, { recursive: true });
  mkdirSync(sessionDir, { recursive: true });
  seedStubSkills(agentDir);
  writeFileSync(path.join(projectRoot, ".pi", "settings.json"), `${JSON.stringify({ packages: [packageRoot] }, null, 2)}\n`);

  const providerServer = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += String(chunk);
    });
    req.on("end", () => {
      if (req.method !== "POST" || req.url !== "/v1/chat/completions") {
        res.writeHead(404);
        res.end("not found");
        return;
      }

      const phase = extractPhase(body);
      const created = Math.floor(Date.now() / 1000);
      const id = `stub-${providerPhases.length + 1}`;
      res.writeHead(200, { "content-type": "text/event-stream" });

      if (requestHasToolResult(body)) {
        res.write(`data: ${JSON.stringify({
          id,
          object: "chat.completion.chunk",
          created,
          model: "stub-model",
          choices: [
            {
              index: 0,
              delta: { role: "assistant", content: `ack ${phase}` },
              finish_reason: null,
            },
          ],
        })}\n\n`);
        res.write(`data: ${JSON.stringify({
          id,
          object: "chat.completion.chunk",
          created,
          model: "stub-model",
          choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        })}\n\n`);
        res.end("data: [DONE]\n\n");
        return;
      }

      providerPhases.push(phase);
      const args = buildAutopilotReportArgs(phase);
      res.write(`data: ${JSON.stringify({
        id,
        object: "chat.completion.chunk",
        created,
        model: "stub-model",
        choices: [
          {
            index: 0,
            delta: {
              role: "assistant",
              tool_calls: [
                {
                  index: 0,
                  id: `call_${providerPhases.length}`,
                  type: "function",
                  function: {
                    name: "autopilot_report",
                    arguments: "",
                  },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      })}\n\n`);
      res.write(`data: ${JSON.stringify({
        id,
        object: "chat.completion.chunk",
        created,
        model: "stub-model",
        choices: [
          {
            index: 0,
            delta: {
              tool_calls: [
                {
                  index: 0,
                  function: {
                    arguments: args,
                  },
                },
              ],
            },
            finish_reason: null,
          },
        ],
      })}\n\n`);
      res.write(`data: ${JSON.stringify({
        id,
        object: "chat.completion.chunk",
        created,
        model: "stub-model",
        choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      })}\n\n`);
      res.end("data: [DONE]\n\n");
    });
  });

  const mcpServer = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => {
      body += String(chunk);
    });
    req.on("end", () => {
      const payload = JSON.parse(body || "{}");
      const method = payload.method;
      const id = payload.id;
      const params = payload.params ?? {};

      res.writeHead(200, { "content-type": "application/json" });

      if (method === "tools/call") {
        const name = params.name;
        mcpToolCalls.push(String(name));

        if (name === "memory_recall") {
          res.end(createToolResult(id, { nodes: [], count: 0 }));
          return;
        }
        if (name === "memory_autopilot_status") {
          res.end(
            createToolResult(id, {
              objective_key: params.arguments?.objective_key ?? "objective:stub",
              head_freshness: "fresh",
              queue_drain_state: "idle",
              replay_health: "pass",
              canary_verdict: "hold",
              rollout_decision: "hold",
              strategy_feedback_candidate: false,
              heads: [],
              summary: ["stub bb status"],
            }),
          );
          return;
        }
        if (name === "workspace_scan") {
          const workspaces = Array.isArray(params.arguments?.workspaces) ? params.arguments.workspaces : [];
          res.end(
            createToolResult(id, [
              {
                path: String(workspaces[0] ?? projectRoot),
                name: "project",
                branch: "main",
                dirty_files: 0,
                status_summary: "clean",
                remote: "https://example.test/pi-sdk.git",
                recent_commits: [],
              },
            ]),
          );
          return;
        }
        if (name === "plan_sync") {
          res.end(
            createToolResult(id, [
              {
                file: "active_PLAN.md",
                title: "Active plan",
                checklist_items: 0,
                done: 0,
                in_progress: 0,
                pending: 0,
              },
            ]),
          );
          return;
        }
        if (name === "govern_policy") {
          res.end(createToolResult(id, { policy_mode: "stub" }));
          return;
        }
        if (name === "govern_evaluate") {
          res.end(createToolResult(id, { decision: "allow" }));
          return;
        }

        res.end(createToolResult(id, {}));
        return;
      }

      if (method === "resources/read") {
        const uri = String(params.uri ?? "");
        mcpResourceReads.push(uri);

        if (uri === "memory://autopilot/canary/reports/recent") {
          res.end(createResourceResult(id, { reports: [] }));
          return;
        }
        if (uri === "memory://autopilot/strategy-feedback/reports/recent") {
          res.end(createResourceResult(id, { reports: [] }));
          return;
        }
        if (uri.includes("memory://autopilot/decision-authority/current/")) {
          res.end(createResourceResult(id, {}));
          return;
        }
        if (uri.includes("memory://autopilot/learned-advisory/current/")) {
          res.end(createResourceResult(id, {}));
          return;
        }

        res.end(createResourceResult(id, {}));
        return;
      }

      res.end(JSON.stringify({ jsonrpc: "2.0", id, error: { message: `unsupported method: ${String(method)}` } }));
    });
  });

  let providerPort = 0;
  let mcpPort = 0;

  try {
    providerPort = await listen(providerServer);
    mcpPort = await listen(mcpServer);

    writeFileSync(
      path.join(agentDir, "models.json"),
      `${JSON.stringify(
        {
          providers: {
            smoke: {
              baseUrl: `http://127.0.0.1:${providerPort}/v1`,
              api: "openai-completions",
              apiKey: "stub-key",
              compat: {
                supportsDeveloperRole: false,
                supportsReasoningEffort: false,
              },
              models: [{ id: "stub-model", name: "stub-model", reasoning: false }],
            },
          },
        },
        null,
        2,
      )}\n`,
    );

    const env = buildSmokeEnv(agentDir, `http://127.0.0.1:${mcpPort}/mcp`);
    const run = await runPiCommand(projectRoot, env, sessionDir, `/autopilot-run ${goal}`, timeoutMs);
    const status = await runPiCommand(projectRoot, env, sessionDir, "/autopilot-status", timeoutMs);
    const sessionFiles = listSessionFiles(sessionDir);
    const sessionEntryTypes = sessionFiles[0] ? readSessionEntryTypes(sessionFiles[0]) : [];
    const rpcStatus = await runPiRpcStatus(projectRoot, env, sessionDir, goal, timeoutMs);
    const rpcSessionFiles = listSessionFiles(sessionDir);
    const rpcSessionEntryTypes = rpcSessionFiles[0] ? readSessionEntryTypes(rpcSessionFiles[0]) : [];

    return {
      ok:
        !run.timedOut &&
        run.exitCode === 0 &&
        !status.timedOut &&
        status.exitCode === 0 &&
        !rpcStatus.timedOut &&
        /mode: running/u.test(rpcStatus.output) &&
        /phase: closeout/u.test(rpcStatus.output) &&
        /substrate: bb/u.test(rpcStatus.output) &&
        providerPhases.length >= 2 &&
        providerPhases.every((phase) => phase === "master_plan") &&
        sessionFiles.length === 0 &&
        sessionEntryTypes.length === 0 &&
        rpcSessionFiles.length >= 1 &&
        rpcSessionEntryTypes.includes("autopilot-runtime-state") &&
        mcpToolCalls.includes("memory_recall") &&
        mcpToolCalls.includes("memory_autopilot_status") &&
        mcpToolCalls.includes("workspace_scan") &&
        mcpToolCalls.includes("plan_sync"),
      packageRoot,
      goal,
      run,
      status,
      rpcStatus,
      sessionFiles,
      sessionEntryTypes,
      rpcSessionFiles,
      rpcSessionEntryTypes,
      providerPhases,
      mcpToolCalls,
      mcpResourceReads,
    };
  } finally {
    await closeServer(providerServer);
    await closeServer(mcpServer);
    if (input.cleanup !== false) {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

export function formatPiBbBackedSmokeResult(result: PiBbBackedSmokeResult): string[] {
  return [
    `package-root: ${result.packageRoot}`,
    `goal: ${result.goal}`,
    `pi-bb-backed-smoke: ${result.ok ? "PASS" : "FAIL"}`,
    `- print-run exit=${result.run.exitCode ?? "null"} timedOut=${result.run.timedOut}`,
    `- print-status: ${result.status.output || "<empty>"}`,
    `- rpc-status: ${(result.rpcStatus.output || "<empty>").replace(/\n+/gu, " | ")}`,
    `- rpc-session-files: ${result.rpcSessionFiles.length}`,
    `- rpc-session-entry-types: ${result.rpcSessionEntryTypes.join(", ") || "<none>"}`,
    `- provider-phases: ${result.providerPhases.join(", ") || "<none>"}`,
    `- bb-tool-calls: ${result.mcpToolCalls.join(", ") || "<none>"}`,
    `- bb-resource-reads: ${result.mcpResourceReads.join(", ") || "<none>"}`,
  ];
}
