import type {
  AutopilotSubstrate,
  AutopilotSubstrateConfig,
  MemoryRecallPayload,
  MemoryStorePayload,
  GovernEvaluatePayload,
  GovernPolicyPayload,
  PlanSyncEntry,
  WorkspaceScanEntry,
} from "./types.js";

function ok<TData>(summary: string, data: TData, rawText = ""): { ok: true; summary: string; data: TData; rawText: string } {
  return {
    ok: true,
    summary,
    data,
    rawText,
  };
}

export function createLocalSubstrate(config: AutopilotSubstrateConfig): AutopilotSubstrate {
  return {
    mode: "local",
    config,
    memory: {
      async recall() {
        return ok<MemoryRecallPayload>("local memory port: no recall configured", { items: [], count: 0 });
      },
      async store() {
        return ok<MemoryStorePayload>("local memory port: writeback skipped", { stored: false, response: null });
      },
    },
    govern: {
      async policy() {
        return ok<GovernPolicyPayload>("local govern port: no policy source configured", { policy: null });
      },
      async evaluate() {
        return ok<GovernEvaluatePayload>("local govern port: preflight bypassed", { decision: "allow" });
      },
    },
    workspace: {
      async scan() {
        return ok<WorkspaceScanEntry[]>("local workspace port: no remote workspace snapshot configured", []);
      },
      async planSync() {
        return ok<PlanSyncEntry[]>("local workspace port: no remote plan sync configured", []);
      },
    },
    autopilot: {
      async status() {
        return ok("local autopilot status projection unavailable", null);
      },
      async history() {
        return ok("local autopilot history projection unavailable", null);
      },
      async authority() {
        return ok("local autopilot decision authority projection unavailable", null);
      },
      async decisionAuthority() {
        return ok("local autopilot decision authority tool unavailable", null);
      },
      async decisionIntent() {
        return ok("local autopilot decision intent tool unavailable", null);
      },
      async decisionReconcilePlan() {
        return ok("local autopilot decision reconcile tool unavailable", null);
      },
      async learnedArtifactSummary() {
        return ok("local autopilot learned artifact summary projection unavailable", null);
      },
    },
  };
}
