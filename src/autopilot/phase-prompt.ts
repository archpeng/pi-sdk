import {
  AUTOPILOT_PROTOCOL_HEADER,
  formatAutopilotCurrentPhaseRouteLines,
  type AutopilotPhase,
  type AutopilotPromptContext,
  type AutopilotReport,
} from "./protocol.js";

function formatRecentReports(reports: AutopilotReport[]): string {
  if (reports.length === 0) return "(none yet)";
  return reports
    .map((report) => {
      const suffix = report.nextAction ? ` | next: ${report.nextAction}` : "";
      const wave = report.waveId ? ` | wave: ${report.waveId}` : "";
      return `- ${report.phase}/${report.status}${wave} :: ${report.summary}${suffix}`;
    })
    .join("\n");
}

function protocol(phase: AutopilotPhase): string {
  const common = [
    "Mandatory protocol:",
    "- You MUST call the tool `autopilot_report` exactly once before ending this prompt.",
    `- In that tool call, set \`phase\` to \`${phase}\`.`,
    "- Keep `summary` concrete and short.",
    "- Keep `evidence`, `artifacts`, and `risks` concise arrays of strings.",
    "- Set `nextAction` to what the outer orchestrator should ask you to do next.",
    "- Do not ask the user whether to continue.",
    "- Assume the extension scheduler will continue automatically while autopilot mode is running.",
    "- Only ask the user a question when you are truly blocked on missing external input or a real approval boundary.",
    "- When multiple viable routes exist, choose the route that gets closest to the overall objective with the least risk of invalidating verified progress.",
    "- Record that decision in `decisionMode`, `decisionBasis`, and `candidateRoutes` when multiple viable routes exist.",
  ];

  switch (phase) {
    case "master_plan":
    case "wave_plan":
      common.push("- Use status `continue` unless the repository already satisfies the objective, in which case use `done`.");
      break;
    case "execute":
      common.push(
        "- Use status `continue` for more work in the same wave, `completed` for wave finished, `needs_replan` for strategy adjustment, `blocked`/`failed` for hard stop, or `done` if the full objective is complete.",
        "- If execution requires a meaningful route choice, switch to goal-directed reasoning before acting and explain the winning route briefly in the report fields.",
      );
      break;
    case "review":
      common.push(
        "- Use status `completed` when the wave passes review, `continue` when more execution is needed in the same wave, `needs_replan` when the plan itself must change, `done` when the overall objective is complete, or `blocked`/`failed` if you cannot proceed safely.",
        "- Review must decide which next route best advances the overall objective, not merely whether more work exists.",
      );
      break;
    case "replan":
      common.push(
        "- Use status `continue` when execution should resume with a new plan, `done` if the objective is already complete, or `blocked`/`failed` if the workflow should stop.",
        "- Replan must compare candidate routes and choose the one that most directly advances the final objective while preserving verified progress.",
      );
      break;
    case "closeout":
      common.push("- Use status `done` when closeout is complete, or `failed` if you cannot produce a trustworthy closeout.");
      break;
  }

  return common.join("\n");
}

export function buildPhasePrompt(phase: AutopilotPhase, context: AutopilotPromptContext): string {
  const shared = [
    AUTOPILOT_PROTOCOL_HEADER,
    `Objective: ${context.goal}`,
    `Current wave: ${context.currentWave}/${context.maxWaves}`,
    `Current cycle: ${context.currentCycle}/${context.maxExecutionCyclesPerWave}`,
    ...(context.activeSlice
      ? [
          `Current active slice: ${context.activeSlice.stepId}`,
          `Current active slice owner/state: ${context.activeSlice.owner} / ${context.activeSlice.state}`,
          ...(context.activeSlice.objectives[0] ? [`Current active slice objective: ${context.activeSlice.objectives[0]}`] : []),
          ...(context.activeSlice.requiredDeliverables[0]
            ? [`Current active slice deliverables: ${context.activeSlice.requiredDeliverables.join(" | ")}`]
            : []),
          ...((context.activeSlice.doneWhen ?? [])[0]
            ? [`Current active slice done_when: ${(context.activeSlice.doneWhen ?? []).join(" | ")}`]
            : []),
          ...((context.activeSlice.stopBoundary ?? [])[0]
            ? [`Current active slice stop_boundary: ${(context.activeSlice.stopBoundary ?? []).join(" | ")}`]
            : []),
          ...(context.activeSlice.avoid[0]
            ? [`Current active slice avoid list: ${context.activeSlice.avoid.join(" | ")}`]
            : []),
        ]
      : []),
    "Recent autopilot reports:",
    formatRecentReports(context.recentReports),
    ...(context.phaseRoutingMatrix && context.phaseRoutingMatrix.length > 0
      ? ["", "Deterministic phase routing matrix:", ...context.phaseRoutingMatrix]
      : []),
    ...(context.phaseRoute
      ? ["", "Current phase route:", ...formatAutopilotCurrentPhaseRouteLines(context.phaseRoute)]
      : []),
    ...(context.substrateContext && context.substrateContext.length > 0 ? ["", ...context.substrateContext] : []),
    "",
    protocol(phase),
    ...(context.activeSlice ? [`- Set \`stepId\` to \`${context.activeSlice.stepId}\` in \`autopilot_report\`.`] : []),
    ...(context.activeSlice
      ? [
          "- Do not claim slice completion unless the current active slice deliverables are actually satisfied and reflected in evidence/artifacts.",
          "- Populate `doneWhenMet` with the exact active-slice `done_when` items satisfied in this turn.",
          "- Populate `stopBoundaryHit` with the exact active-slice `stop_boundary` items that forced replan/stop; leave it empty otherwise.",
          "- Expect runtime progression to use `doneWhenMet` / `stopBoundaryHit`, not only the requested status string.",
        ]
      : []),
    "",
  ];

  switch (phase) {
    case "master_plan":
      return [
        ...shared,
        "Build the large推进纲领 for this repository.",
        "Expectations:",
        "1. Inspect the repo and identify constraints, missing pieces, and realistic validation paths.",
        "2. Produce a master plan broken into numbered waves.",
        "3. Make each wave bounded and execution-oriented.",
        "4. Nominate the best first wave to execute now.",
        "5. Do not claim work is done unless the codebase already satisfies the objective.",
      ].join("\n");
    case "wave_plan":
      return [
        ...shared,
        "Create or refine the plan for the current wave.",
        "Expectations:",
        "1. Select the next highest-leverage bounded slice.",
        "2. Break it into linear execution steps with clear validation.",
        "3. Name likely files or surfaces that will change.",
        "4. State exit criteria for this wave before execution starts.",
      ].join("\n");
    case "execute":
      return [
        ...shared,
        "Execute the current wave.",
        "Expectations:",
        "1. Think deeply, inspect the current code, and make the necessary edits.",
        "2. Run the smallest meaningful verification available.",
        "3. Stop only when the wave is complete, blocked, or clearly needs replan.",
        "4. Summarize concrete changes and validation evidence.",
      ].join("\n");
    case "review":
      return [
        ...shared,
        "Review the just-executed wave with a cold, critical mindset.",
        "Expectations:",
        "1. Re-read the changed surfaces and relevant surrounding code.",
        "2. Run targeted validation or inspect prior validation output.",
        "3. Decide whether the wave is complete, more execution is needed, or replan is required.",
        "4. Highlight concrete risks, regressions, or missing follow-up.",
      ].join("\n");
    case "replan":
      return [
        ...shared,
        "Replan based on the latest execution and review evidence.",
        "Expectations:",
        "1. Recalibrate the current wave and, when needed, the master roadmap.",
        "2. Keep the next slice bounded and linear.",
        "3. Explain what changed in the plan and why.",
        "4. Point the orchestrator at the next concrete action.",
      ].join("\n");
    case "closeout":
      return [
        ...shared,
        "Produce closeout for the whole objective.",
        "Expectations:",
        "1. Summarize the completed waves and the final code state.",
        "2. List validation evidence actually gathered.",
        "3. Call out known gaps or follow-up work that remains.",
        "4. Make the closeout trustworthy and auditable.",
      ].join("\n");
  }
}
