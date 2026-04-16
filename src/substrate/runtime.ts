import type { AutopilotSubstrate } from "./types.js";

let runtimeSubstrate: AutopilotSubstrate | undefined;

export function setRuntimeSubstrate(substrate: AutopilotSubstrate | undefined): void {
  runtimeSubstrate = substrate;
}

export function getRuntimeSubstrate(): AutopilotSubstrate | undefined {
  return runtimeSubstrate;
}
