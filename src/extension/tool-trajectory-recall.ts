export const MAX_RECALLED_MEMORY_REFS = 5;

const RECALL_TOOL_NAMES = new Set(["memory_recall", "functions.memory_recall"]);

export type RecalledMemoryRef = {
  memory_id: string;
  link_kind: "pre_task_recall";
  memory_class?: string | undefined;
  tool_name?: string | undefined;
  rank: number;
};

export type RecallToolResultLike = {
  toolName: string;
  details?: unknown;
  content?: unknown;
};

export function appendRecalledMemoryRefs(
  existing: RecalledMemoryRef[],
  event: RecallToolResultLike,
): RecalledMemoryRef[] {
  if (!RECALL_TOOL_NAMES.has(event.toolName)) return existing;
  const refs = extractRecalledMemoryRefs(event);
  if (refs.length === 0) return existing;

  const seen = new Set(existing.map((ref) => ref.memory_id));
  const next = [...existing];
  for (const ref of refs) {
    if (seen.has(ref.memory_id)) continue;
    seen.add(ref.memory_id);
    next.push(ref);
    if (next.length >= MAX_RECALLED_MEMORY_REFS) break;
  }
  return next;
}

export function extractRecalledMemoryRefs(event: RecallToolResultLike): RecalledMemoryRef[] {
  const candidates = [
    ...recordsAt(event.details, ["nodes"]),
    ...recordsAt(event.details, ["items"]),
    ...recordsAt(event.details, ["data", "items"]),
    ...recordsAt(event.details, ["data", "nodes"]),
    ...recordsFromContent(event.content),
  ];
  const refs: RecalledMemoryRef[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const ref = refFromRecord(candidate, refs.length + 1);
    if (!ref || seen.has(ref.memory_id)) continue;
    refs.push(ref);
    seen.add(ref.memory_id);
    if (refs.length >= MAX_RECALLED_MEMORY_REFS) break;
  }
  return refs;
}

function recordsFromContent(value: unknown): Record<string, unknown>[] {
  const texts = Array.isArray(value)
    ? value.flatMap((entry) => textFromContentEntry(entry))
    : textFromContentEntry(value);
  return texts.flatMap((text) => {
    try {
      const parsed = JSON.parse(text) as unknown;
      return [...recordsAt(parsed, ["nodes"]), ...recordsAt(parsed, ["items"])];
    } catch {
      return [];
    }
  });
}

function textFromContentEntry(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (!isRecord(value)) return [];
  return typeof value.text === "string" ? [value.text] : [];
}

function recordsAt(value: unknown, path: string[]): Record<string, unknown>[] {
  const target = path.reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), value);
  if (!Array.isArray(target)) return [];
  return target.filter(isRecord);
}

function refFromRecord(record: Record<string, unknown>, rank: number): RecalledMemoryRef | null {
  const metadata = isRecord(record.metadata) ? record.metadata : {};
  const memoryId = firstString(metadata.memory_id, record.source_id, stripNodePrefix(record.id));
  if (!memoryId) return null;
  return {
    memory_id: memoryId,
    link_kind: "pre_task_recall",
    rank,
    ...(firstString(record.memory_class, metadata.memory_class) ? { memory_class: firstString(record.memory_class, metadata.memory_class) } : {}),
    ...(firstString(record.tool_name, metadata.tool_name) ? { tool_name: firstString(record.tool_name, metadata.tool_name) } : {}),
  };
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function stripNodePrefix(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.includes(":") ? value.slice(value.lastIndexOf(":") + 1) : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
