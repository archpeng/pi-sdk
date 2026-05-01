import type {
  ActiveControlPlanePackPaths,
  ActiveControlPlaneSnapshot,
  ControlPlaneProgressTransition,
  ControlPlaneProgressTransitionInput,
  ControlPlaneWritebackInput,
  ControlPlaneWritebackPayload,
  PlanControlPlaneReadmeSnapshot,
  WorksetActiveStageSnapshot,
} from "./types.js";
import { readFileSync } from "node:fs";
import path from "node:path";

function normalizeLines(markdown: string): string[] {
  return markdown.replace(/\r\n/g, "\n").split("\n");
}

function getSection(markdown: string, heading: string): string {
  const lines = normalizeLines(markdown);
  const header = `## ${heading}`;
  const start = lines.findIndex((line) => line.trim() === header);
  if (start < 0) {
    throw new Error(`Missing required section: ${heading}`);
  }

  const body: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const raw = lines[index];
    if (raw === undefined) break;
    if (raw.trim().startsWith("## ")) break;
    body.push(raw);
  }

  return body.join("\n").trim();
}

function stripCodeTicks(value: string): string {
  return value.trim().replace(/^`/, "").replace(/`$/, "");
}

function parseInlineBulletValue(sectionBody: string): string {
  const line = normalizeLines(sectionBody).find((candidate) => candidate.trim().startsWith("- "));
  if (!line) {
    throw new Error("Expected a bullet value inside section");
  }
  return stripCodeTicks(line.trim().slice(2).trim());
}

function parseActivePackPaths(sectionBody: string): ActiveControlPlanePackPaths {
  const values = normalizeLines(sectionBody)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => stripCodeTicks(line.slice(2).trim()));

  if (values.length !== 3) {
    throw new Error(`Expected exactly three active pack paths, received ${values.length}`);
  }

  const [planPath, statusPath, worksetPath] = values;
  if (!planPath || !statusPath || !worksetPath) {
    throw new Error("Active pack paths must be non-empty");
  }

  return {
    planPath,
    statusPath,
    worksetPath,
  };
}

function collectListItems(sectionBody: string, label: string): string[] {
  const lines = normalizeLines(sectionBody);
  const start = lines.findIndex((line) => line.trim() === label);
  if (start < 0) return [];

  const items: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const raw = lines[index];
    if (raw === undefined) break;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (/^[^#\-\d].*[:：]$/.test(trimmed)) break;
    if (/^###\s/.test(trimmed) || /^##\s/.test(trimmed)) break;
    if (trimmed.startsWith("- ")) {
      items.push(trimmed.slice(2).trim());
      continue;
    }
    const numbered = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numbered?.[1]) {
      items.push(numbered[1].trim());
      continue;
    }
  }
  return items;
}

function parseStageOrder(worksetMarkdown: string): string[] {
  const sectionBody = getSection(worksetMarkdown, "Stage Order");
  return normalizeLines(sectionBody)
    .map((line) => line.trim().match(/^- \[[ x]\] `([^`]+)`/)?.[1] ?? null)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

function parsePlanSliceDefinitions(planMarkdown: string): Record<string, WorksetActiveStageSnapshot> {
  const lines = normalizeLines(planMarkdown);
  const slices: Record<string, WorksetActiveStageSnapshot> = {};

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line?.match(/^#### `([^`]+)`/);
    if (!match?.[1]) continue;

    const stageId = match[1];
    const body: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const current = lines[cursor];
      if (current?.startsWith("#### ")) break;
      if (current?.startsWith("### ")) break;
      body.push(current ?? "");
    }
    const sectionBody = body.join("\n").trim();
    slices[stageId] = {
      stageId,
      owner: parseMetadataValue(sectionBody, "Owner"),
      state: parseMetadataValue(sectionBody, "State"),
      priority: parseMetadataValue(sectionBody, "Priority"),
      objectives: collectListItems(sectionBody, "目标："),
      requiredDeliverables: collectListItems(sectionBody, "交付物："),
      doneWhen: collectListItems(sectionBody, "done_when:"),
      stopBoundary: collectListItems(sectionBody, "stop_boundary:"),
      avoid: collectListItems(sectionBody, "必须避免："),
    };
  }

  return slices;
}

function parseMetadataValue(sectionBody: string, key: string): string {
  const pattern = new RegExp(`^- ${key}:\\s+(.+)$`, "m");
  const match = sectionBody.match(pattern);
  if (!match?.[1]) {
    throw new Error(`Missing required metadata field: ${key}`);
  }
  return stripCodeTicks(match[1]);
}

export function parsePlanControlPlaneReadme(markdown: string): PlanControlPlaneReadmeSnapshot {
  const activePack = parseActivePackPaths(getSection(markdown, "Active Pack"));
  const activeSlice = parseInlineBulletValue(getSection(markdown, "Current Active Slice"));
  const intendedHandoff = parseInlineBulletValue(getSection(markdown, "Intended Handoff"));

  return {
    activePack,
    activeSlice,
    intendedHandoff,
  };
}

export function parseWorksetActiveStage(markdown: string): WorksetActiveStageSnapshot {
  const sectionBody = getSection(markdown, "Active Stage");
  const stageIdMatch = sectionBody.match(/^###\s+`([^`]+)`/m);
  if (!stageIdMatch?.[1]) {
    throw new Error("Missing active stage heading");
  }

  return {
    stageId: stageIdMatch[1],
    owner: parseMetadataValue(sectionBody, "Owner"),
    state: parseMetadataValue(sectionBody, "State"),
    priority: parseMetadataValue(sectionBody, "Priority"),
    objectives: collectListItems(sectionBody, "目标："),
    requiredDeliverables: collectListItems(sectionBody, "必须交付："),
    doneWhen: collectListItems(sectionBody, "done_when:"),
    stopBoundary: collectListItems(sectionBody, "stop_boundary:"),
    avoid: collectListItems(sectionBody, "必须避免："),
  };
}

function inferRepoRootFromDocsPath(docsPath: string): string {
  return path.resolve(docsPath, "..", "..");
}

function resolvePackPath(repoRoot: string, candidatePath: string): string {
  return path.isAbsolute(candidatePath) ? candidatePath : path.join(repoRoot, candidatePath);
}

export function loadLocalControlPlaneSnapshot(
  docsPath: string,
  repoRoot: string = inferRepoRootFromDocsPath(docsPath),
): ActiveControlPlaneSnapshot {
  const readmePath = path.join(docsPath, "README.md");
  const readme = parsePlanControlPlaneReadme(readFileSync(readmePath, "utf8"));
  const planPath = resolvePackPath(repoRoot, readme.activePack.planPath);
  const worksetPath = resolvePackPath(repoRoot, readme.activePack.worksetPath);
  const worksetMarkdown = readFileSync(worksetPath, "utf8");
  const stageOrder = parseStageOrder(worksetMarkdown);
  const workset = parseWorksetActiveStage(readFileSync(worksetPath, "utf8"));
  const sliceDefinitions = parsePlanSliceDefinitions(readFileSync(planPath, "utf8"));

  return {
    readme,
    activeStage: workset,
    stageOrder,
    sliceDefinitions,
  };
}

export function resolveNextStageFromStageOrder(
  stageOrder: string[],
  sliceDefinitions: Record<string, WorksetActiveStageSnapshot>,
  completedSlice: string,
): WorksetActiveStageSnapshot | null {
  const index = stageOrder.findIndex((stageId) => stageId === completedSlice);
  if (index < 0) {
    throw new Error(`completedSlice not present in stage order: ${completedSlice}`);
  }

  for (let cursor = index + 1; cursor < stageOrder.length; cursor += 1) {
    const candidateId = stageOrder[cursor];
    if (!candidateId) continue;
    const candidate = sliceDefinitions[candidateId];
    if (candidate) return candidate;
  }

  return null;
}

function replaceSection(markdown: string, heading: string, body: string): string {
  const lines = normalizeLines(markdown);
  const header = `## ${heading}`;
  const start = lines.findIndex((line) => line.trim() === header);
  if (start < 0) {
    const trimmed = markdown.trimEnd();
    return `${trimmed}\n\n${header}\n\n${body.trim()}\n`;
  }

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index]?.trim().startsWith("## ")) {
      end = index;
      break;
    }
  }

  const replacement = [header, "", ...normalizeLines(body.trim())];
  const nextLines = [...lines.slice(0, start), ...replacement, ...lines.slice(end)];
  return nextLines.join("\n").replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "\n");
}

function replaceFirstBulletValue(markdown: string, heading: string, value: string): string {
  const sectionBody = getSection(markdown, heading);
  const replacedBody = sectionBody.replace(/^- .*$/m, `- \`${value}\``);
  return replaceSection(markdown, heading, replacedBody);
}

function markChecklistEntry(markdown: string, sliceId: string): string {
  const escapedSlice = sliceId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return markdown.replace(new RegExp(`- \\[[ x]\\] \`${escapedSlice}\``, "g"), `- [x] \`${sliceId}\``);
}

export const CONTROL_PLANE_PACK_COMPLETE_STAGE_ID = "PACK_COMPLETE";

function renderActiveStageBody(stage: WorksetActiveStageSnapshot | null): string {
  if (!stage) {
    return [
      `### \`${CONTROL_PLANE_PACK_COMPLETE_STAGE_ID}\``,
      "",
      "- Owner: `closeout`",
      "- State: `DONE`",
      "- Priority: `terminal`",
      "",
      "目标：",
      "",
      "- close the pack through the repo-local closeout prompt surface",
      "",
      "必须交付：",
      "",
      "1. final closeout summary and residual handoff",
      "",
      "必须避免：",
      "",
      "1. dispatching another execute/review phase from terminal parser truth",
    ].join("\n");
  }

  const lines = [
    `### \`${stage.stageId}\``,
    "",
    `- Owner: \`${stage.owner}\``,
    `- State: \`${stage.state}\``,
    `- Priority: \`${stage.priority}\``,
    "",
    "目标：",
    "",
    ...stage.objectives.map((objective) => `- ${objective}`),
    "",
    "必须交付：",
    "",
    ...stage.requiredDeliverables.map((item, index) => `${index + 1}. ${item}`),
  ];

  if ((stage.doneWhen ?? []).length > 0) {
    lines.push("", "done_when:", "", ...(stage.doneWhen ?? []).map((item, index) => `${index + 1}. ${item}`));
  }

  if ((stage.stopBoundary ?? []).length > 0) {
    lines.push("", "stop_boundary:", "", ...(stage.stopBoundary ?? []).map((item, index) => `${index + 1}. ${item}`));
  }

  if (stage.avoid.length > 0) {
    lines.push("", "必须避免：", "", ...stage.avoid.map((item, index) => `${index + 1}. ${item}`));
  }

  return lines.join("\n");
}

function renderMachineStateBody(
  transition: ControlPlaneProgressTransition,
  nextStage: WorksetActiveStageSnapshot | null,
): string {
  const nextSlice = nextStage?.stageId ?? CONTROL_PLANE_PACK_COMPLETE_STAGE_ID;
  const lines = [
    `- active_step: \`${nextSlice}\``,
    `- latest_completed_step: \`${transition.completedSlice}\``,
    `- intended_handoff: \`${transition.intendedHandoff}\``,
    `- latest_closeout_summary: ${transition.closeoutSummary}`,
    "- latest_verification:",
    ...transition.verificationEvidence.map((item) => `  - \`${item}\``),
  ];

  if (transition.terminal) {
    lines.push("- terminal: `true`");
  }

  return lines.join("\n");
}

export function applyControlPlaneProgressWriteback(
  input: ControlPlaneWritebackInput,
): ControlPlaneWritebackPayload {
  const nextSlice = input.nextStage?.stageId ?? CONTROL_PLANE_PACK_COMPLETE_STAGE_ID;

  let readmeMarkdown = replaceFirstBulletValue(input.readmeMarkdown, "Current Active Slice", nextSlice);
  readmeMarkdown = replaceFirstBulletValue(readmeMarkdown, "Intended Handoff", input.transition.intendedHandoff);

  let statusMarkdown = input.statusMarkdown.replace(
    /^- active_step:\s+`[^`]+`$/m,
    `- active_step: \`${nextSlice}\``,
  );
  statusMarkdown = markChecklistEntry(statusMarkdown, input.transition.completedSlice);
  statusMarkdown = replaceSection(statusMarkdown, "Immediate Focus", renderActiveStageBody(input.nextStage));
  statusMarkdown = replaceSection(
    statusMarkdown,
    "Machine State",
    renderMachineStateBody(input.transition, input.nextStage),
  );

  let worksetMarkdown = markChecklistEntry(input.worksetMarkdown, input.transition.completedSlice);
  worksetMarkdown = replaceSection(worksetMarkdown, "Active Stage", renderActiveStageBody(input.nextStage));
  worksetMarkdown = replaceSection(
    worksetMarkdown,
    "Machine Queue",
    renderMachineStateBody(input.transition, input.nextStage),
  );

  return {
    readmeMarkdown,
    statusMarkdown,
    worksetMarkdown,
  };
}

export function buildControlPlaneProgressTransition(
  input: ControlPlaneProgressTransitionInput,
): ControlPlaneProgressTransition {
  const completedSlice = input.completedSlice.trim();
  const intendedHandoff = input.intendedHandoff.trim();
  const closeoutSummary = input.closeoutSummary.trim();
  const nextActiveSlice = input.nextActiveSlice?.trim() || null;
  const verificationEvidence = input.verificationEvidence
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (!completedSlice) {
    throw new Error("completedSlice must be non-empty");
  }
  if (!intendedHandoff) {
    throw new Error("intendedHandoff must be non-empty");
  }
  if (!closeoutSummary) {
    throw new Error("closeoutSummary must be non-empty");
  }
  if (verificationEvidence.length === 0) {
    throw new Error("verificationEvidence must contain at least one item");
  }

  return {
    completedSlice,
    nextActiveSlice,
    intendedHandoff,
    closeoutSummary,
    verificationEvidence,
    terminal: nextActiveSlice === null,
  };
}
