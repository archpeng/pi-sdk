import type {
  AutopilotPhase,
  AutopilotPhaseRequest,
  AutopilotReport,
  AutopilotStatus,
  AutopilotWorkflowSummary,
} from "./protocol.js";

export type ReviewDecision = "next_wave" | "continue_execution" | "replan" | "closeout" | "stop";

export interface RunAutopilotWorkflowInput {
  maxWaves: number;
  maxExecutionCyclesPerWave: number;
  runPhase(request: AutopilotPhaseRequest): Promise<AutopilotReport>;
}

function isHardStop(status: AutopilotStatus): boolean {
  return status === "blocked" || status === "failed";
}

async function executePhase(
  input: RunAutopilotWorkflowInput,
  reports: AutopilotReport[],
  phase: AutopilotPhase,
  currentWave: number,
  currentCycle: number,
): Promise<AutopilotReport> {
  const report = await input.runPhase({ phase, currentWave, currentCycle });
  if (report.phase !== phase) {
    throw new Error(`Expected report phase ${phase}, received ${report.phase}`);
  }
  reports.push(report);
  return report;
}

export function decidePostReviewAction(status: AutopilotStatus): ReviewDecision {
  switch (status) {
    case "completed":
      return "next_wave";
    case "continue":
      return "continue_execution";
    case "needs_replan":
      return "replan";
    case "done":
      return "closeout";
    case "blocked":
    case "failed":
      return "stop";
  }
}

export function isTerminalStatus(status: AutopilotStatus): boolean {
  return status === "done" || status === "blocked" || status === "failed";
}

export async function runAutopilotWorkflow(input: RunAutopilotWorkflowInput): Promise<AutopilotWorkflowSummary> {
  const reports: AutopilotReport[] = [];
  let overallDone = false;
  let wavesAttempted = 0;

  const masterPlan = await executePhase(input, reports, "master_plan", 1, 1);
  if (masterPlan.status === "done") {
    overallDone = true;
  }
  if (isHardStop(masterPlan.status)) {
    throw new Error(`Master plan stopped with status ${masterPlan.status}`);
  }

  for (let wave = 1; wave <= input.maxWaves && !overallDone; wave += 1) {
    wavesAttempted = wave;

    const wavePlan = await executePhase(input, reports, "wave_plan", wave, 1);
    if (wavePlan.status === "done") {
      overallDone = true;
      break;
    }
    if (isHardStop(wavePlan.status)) {
      throw new Error(`Wave plan stopped with status ${wavePlan.status}`);
    }

    let waveCompleted = false;

    for (let cycle = 1; cycle <= input.maxExecutionCyclesPerWave && !overallDone; cycle += 1) {
      const execution = await executePhase(input, reports, "execute", wave, cycle);
      if (execution.status === "done") {
        overallDone = true;
        break;
      }
      if (isHardStop(execution.status)) {
        throw new Error(`Execution stopped with status ${execution.status}`);
      }

      const review = await executePhase(input, reports, "review", wave, cycle);
      const action = decidePostReviewAction(review.status);

      if (action === "closeout") {
        overallDone = true;
        break;
      }
      if (action === "stop") {
        throw new Error(`Review stopped with status ${review.status}`);
      }
      if (action === "next_wave") {
        waveCompleted = true;
        break;
      }
      if (action === "replan") {
        const replan = await executePhase(input, reports, "replan", wave, cycle);
        if (replan.status === "done") {
          overallDone = true;
          break;
        }
        if (isHardStop(replan.status)) {
          throw new Error(`Replan stopped with status ${replan.status}`);
        }
      }
    }

    if (overallDone) break;

    if (!waveCompleted) {
      const recalibration = await executePhase(
        input,
        reports,
        "replan",
        wave,
        input.maxExecutionCyclesPerWave,
      );
      if (recalibration.status === "done") {
        overallDone = true;
        break;
      }
      if (isHardStop(recalibration.status)) {
        throw new Error(`Wave recalibration stopped with status ${recalibration.status}`);
      }
    } else if (wave < input.maxWaves) {
      const roadmapReplan = await executePhase(input, reports, "replan", wave + 1, 1);
      if (roadmapReplan.status === "done") {
        overallDone = true;
        break;
      }
      if (isHardStop(roadmapReplan.status)) {
        throw new Error(`Roadmap recalibration stopped with status ${roadmapReplan.status}`);
      }
    }
  }

  const closeout = await executePhase(
    input,
    reports,
    "closeout",
    Math.max(1, wavesAttempted || 1),
    input.maxExecutionCyclesPerWave,
  );
  overallDone = overallDone || closeout.status === "done";

  return {
    done: overallDone,
    reports,
    wavesAttempted,
  };
}
