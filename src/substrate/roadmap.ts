import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { RoadmapBootstrapSnapshot } from "./types.js";

function normalizeLines(markdown: string): string[] {
  return markdown.replace(/\r\n/g, "\n").split("\n");
}

function getSection(markdown: string, heading: string): string | null {
  const lines = normalizeLines(markdown);
  const header = `## ${heading}`;
  const start = lines.findIndex((line) => line.trim() === header);
  if (start < 0) return null;

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

function sectionBulletValues(markdown: string, heading: string): string[] {
  const section = getSection(markdown, heading);
  if (!section) return [];
  return normalizeLines(section)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => stripCodeTicks(line.slice(2).trim()))
    .filter((value) => value.length > 0);
}

function firstSectionBullet(markdown: string, heading: string): string | undefined {
  return sectionBulletValues(markdown, heading)[0];
}

function sectionValue(markdown: string, heading: string, label: string): string | undefined {
  const section = getSection(markdown, heading);
  if (!section) return undefined;
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = section.match(new RegExp(`^-\\s*${escaped}:\\s*(.+)$`, "m"));
  const value = match?.[1]?.trim();
  return value ? stripCodeTicks(value) : undefined;
}

function listMarkdownFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function discoverRoadmapFiles(repoRoot: string): string[] {
  const roadmapDir = path.join(repoRoot, "docs", "roadmap");
  const stat = statSync(roadmapDir, { throwIfNoEntry: false });
  if (!stat?.isDirectory()) return [];
  return listMarkdownFiles(roadmapDir).filter((candidate) => path.basename(candidate) !== "README.md");
}

function summarizeRoadmapFiles(repoRoot: string, files: string[]): string[] {
  return files.slice(0, 3).map((file) => {
    const relative = path.relative(repoRoot, file).replace(/\\/g, "/");
    const title = normalizeLines(readFileSync(file, "utf8"))
      .map((line) => line.trim())
      .find((line) => line.startsWith("# "))
      ?.replace(/^#\s+/, "")
      .trim();
    return title ? `roadmap: ${relative} — ${title}` : `roadmap: ${relative}`;
  });
}

export function loadRoadmapBootstrapSnapshot(repoRoot: string, planDocsPath: string): RoadmapBootstrapSnapshot | null {
  const readmePath = path.join(planDocsPath, "README.md");
  const readmeStat = statSync(readmePath, { throwIfNoEntry: false });
  if (!readmeStat?.isFile()) return null;

  const readme = readFileSync(readmePath, "utf8");
  const activePackValues = sectionBulletValues(readme, "Active Pack");
  const activeSlice = firstSectionBullet(readme, "Current Active Slice")?.toLowerCase();
  const intendedHandoff = firstSectionBullet(readme, "Intended Handoff")?.toLowerCase();
  const planReadmeIdle =
    activePackValues.length === 1 &&
    activePackValues[0]?.toLowerCase() === "none" &&
    activeSlice === "none" &&
    intendedHandoff === "none";

  const roadmapFiles = discoverRoadmapFiles(repoRoot);
  const selectedSuccessor = firstSectionBullet(readme, "Successor Pack") ?? undefined;
  const latestClosedPack = sectionValue(readme, "Status", "Latest closed pack") ?? undefined;
  const summaryLines = [
    `roadmap-bootstrap: docs/plan idle=${planReadmeIdle ? "yes" : "no"}`,
    ...summarizeRoadmapFiles(repoRoot, roadmapFiles),
    ...(latestClosedPack ? [`latest-closed-pack: ${latestClosedPack}`] : []),
    ...(selectedSuccessor ? [`selected-successor-pack: ${selectedSuccessor}`] : []),
  ];

  if (!planReadmeIdle && roadmapFiles.length === 0 && !selectedSuccessor && !latestClosedPack) {
    return null;
  }

  return {
    planReadmeIdle,
    roadmapFiles: roadmapFiles.map((file) => path.relative(repoRoot, file).replace(/\\/g, "/")),
    ...(selectedSuccessor ? { selectedSuccessor } : {}),
    ...(latestClosedPack ? { latestClosedPack } : {}),
    summaryLines,
  };
}
