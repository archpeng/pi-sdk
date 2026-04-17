export interface McpHttpClientResult {
  ok: boolean;
  isToolError: boolean;
  rawText: string;
  parsed: unknown | null;
  error?: string;
}

export interface McpHttpClient {
  callTool(name: string, args: Record<string, unknown>): Promise<McpHttpClientResult>;
  readResource(uri: string): Promise<McpHttpClientResult>;
}

export interface CreateMcpHttpClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

interface McpJsonRpcEnvelope {
  jsonrpc?: string;
  id?: string | number;
  result?: {
    isError?: boolean;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
    contents?: Array<{
      text?: string;
    }>;
  };
  error?: {
    message?: string;
  };
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseSseEnvelope(text: string): McpJsonRpcEnvelope | null {
  const events = text
    .split(/\n\n+/)
    .map((block) =>
      block
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n")
        .trim(),
    )
    .filter((payload) => payload.length > 0);

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const parsed = tryParseJson(events[index] ?? "");
    if (parsed && typeof parsed === "object") {
      return parsed as McpJsonRpcEnvelope;
    }
  }

  return null;
}

function parseEnvelope(text: string): McpJsonRpcEnvelope | null {
  const direct = tryParseJson(text);
  if (direct && typeof direct === "object") {
    return direct as McpJsonRpcEnvelope;
  }
  return parseSseEnvelope(text);
}

function extractRawText(envelope: McpJsonRpcEnvelope, fallback: string): string {
  const toolParts = envelope.result?.content
    ?.map((entry) => (entry.type === "text" ? entry.text ?? "" : ""))
    .filter((text) => text.trim().length > 0);

  if (toolParts && toolParts.length > 0) {
    return toolParts.join("\n").trim();
  }

  const resourceParts = envelope.result?.contents
    ?.map((entry) => entry.text ?? "")
    .filter((text) => text.trim().length > 0);

  if (resourceParts && resourceParts.length > 0) {
    return resourceParts.join("\n").trim();
  }

  return fallback.trim();
}

export function createMcpHttpClient(options: CreateMcpHttpClientOptions): McpHttpClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5_000;
  let nextId = 1;

  async function call(method: string, params: Record<string, unknown>, treatToolError: boolean): Promise<McpHttpClientResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(options.baseUrl, {
        method: "POST",
        headers: {
          accept: "application/json, text/event-stream",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: nextId++,
          method,
          params,
        }),
        signal: controller.signal,
      });

      const bodyText = await response.text();
      if (!response.ok) {
        return {
          ok: false,
          isToolError: false,
          rawText: bodyText,
          parsed: null,
          error: `HTTP ${response.status}: ${bodyText}`,
        };
      }

      const envelope = parseEnvelope(bodyText);
      if (!envelope || typeof envelope !== "object") {
        return {
          ok: false,
          isToolError: false,
          rawText: bodyText,
          parsed: null,
          error: `Invalid JSON-RPC response: ${bodyText}`,
        };
      }

      if (envelope.error?.message) {
        return {
          ok: false,
          isToolError: false,
          rawText: bodyText,
          parsed: null,
          error: envelope.error.message,
        };
      }

      const rawText = extractRawText(envelope, bodyText);
      const parsed = tryParseJson(rawText);
      const isToolError = treatToolError && envelope.result?.isError === true;

      if (isToolError) {
        return {
          ok: false,
          isToolError: true,
          rawText,
          parsed,
          error: rawText || "MCP tool returned an error",
        };
      }

      return {
        ok: true,
        isToolError: false,
        rawText,
        parsed,
      };
    } catch (error) {
      return {
        ok: false,
        isToolError: false,
        rawText: "",
        parsed: null,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async callTool(name, args) {
      return call(
        "tools/call",
        {
          name,
          arguments: args,
        },
        true,
      );
    },
    async readResource(uri) {
      return call("resources/read", { uri }, false);
    },
  };
}
