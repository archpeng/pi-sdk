import test from "node:test";
import assert from "node:assert/strict";
import { createMcpHttpClient } from "../src/substrate/http-mcp-client.ts";

test("MCP HTTP client parses JSON tool payloads from text content", async () => {
  const calls: Array<{ url: string; body: string | null }> = [];
  const client = createMcpHttpClient({
    baseUrl: "http://bb-memory.test/mcp",
    fetchImpl: async (input, init) => {
      calls.push({
        url: String(input),
        body: typeof init?.body === "string" ? init.body : null,
      });
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [{ type: "text", text: JSON.stringify({ nodes: [{ content: "hit" }], count: 1 }) }],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    },
  });

  const result = await client.callTool("memory_recall", { query: "goal", limit: 1 });

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, "http://bb-memory.test/mcp");
  assert.match(calls[0]?.body ?? "", /"memory_recall"/);
  assert.equal(result.ok, true);
  assert.equal(result.isToolError, false);
  assert.equal(result.rawText.includes("count"), true);
  assert.deepEqual(result.parsed, { nodes: [{ content: "hit" }], count: 1 });
});

test("MCP HTTP client surfaces MCP tool errors without throwing", async () => {
  const client = createMcpHttpClient({
    baseUrl: "http://bb-govern.test/mcp",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            isError: true,
            content: [{ type: "text", text: "Error: backend unavailable" }],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });

  const result = await client.callTool("govern_policy", {});

  assert.equal(result.ok, false);
  assert.equal(result.isToolError, true);
  assert.equal(result.error, "Error: backend unavailable");
  assert.equal(result.rawText, "Error: backend unavailable");
  assert.equal(result.parsed, null);
});

test("MCP HTTP client parses streamable-http SSE envelopes", async () => {
  const client = createMcpHttpClient({
    baseUrl: "http://bb-tools.test/mcp",
    fetchImpl: async () =>
      new Response(
        'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"[1,2,3]"}]}}\n\n',
        { status: 200, headers: { "content-type": "text/event-stream" } },
      ),
  });

  const result = await client.callTool("plan_sync", { docs_path: "/repo/docs/plan" });

  assert.equal(result.ok, true);
  assert.deepEqual(result.parsed, [1, 2, 3]);
  assert.equal(result.rawText, "[1,2,3]");
});

test("MCP HTTP client keeps plain-text successful payloads when JSON parsing is not possible", async () => {
  const client = createMcpHttpClient({
    baseUrl: "http://bb-tools.test/mcp",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            content: [{ type: "text", text: "No active plans found in docs/plan." }],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });

  const result = await client.callTool("plan_sync", { docs_path: "/repo/docs/plan" });

  assert.equal(result.ok, true);
  assert.equal(result.parsed, null);
  assert.equal(result.rawText, "No active plans found in docs/plan.");
});

test("MCP HTTP client parses resources/read contents payloads", async () => {
  const client = createMcpHttpClient({
    baseUrl: "http://bb-memory.test/mcp",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          result: {
            contents: [
              {
                uri: "memory://autopilot/canary/reports/recent",
                text: JSON.stringify({ reports: [{ report_id: "canary-1" }] }),
              },
            ],
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
  });

  const result = await client.readResource("memory://autopilot/canary/reports/recent");

  assert.equal(result.ok, true);
  assert.deepEqual(result.parsed, { reports: [{ report_id: "canary-1" }] });
  assert.equal(result.rawText, '{"reports":[{"report_id":"canary-1"}]}');
});
