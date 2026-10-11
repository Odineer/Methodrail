import { join } from "node:path";
import { inspectHarnessBinding } from "./harness.js";
import {
  planModelRefresh,
  type ModelRefreshPlan,
} from "../skills/refresh-model-routing/scripts/models-policy.mjs";

export interface ModelPolicyPlacement {
  status: "uninitialized" | "unavailable" | "ready";
  placement?: "in-repository" | "linked-external";
  policyPath: string;
  writeAllowed: boolean;
  reason: string;
}

export function inspectModelPolicyPlacement(projectRoot: string): ModelPolicyPlacement {
  const policyPath = join(projectRoot, ".methodrail", "MODELS.yaml");
  const harness = inspectHarnessBinding(projectRoot);
  const error = harness.diagnostics.find((item) => item.level === "error");
  if (error) {
    return {
      status: "unavailable",
      policyPath,
      writeAllowed: false,
      reason: error.message,
    };
  }
  if (!harness.binding) {
    return {
      status: "uninitialized",
      policyPath,
      writeAllowed: false,
      reason: "No Methodrail harness is present. Set placement through methodrail-init before writing model policy.",
    };
  }
  return {
    status: "ready",
    placement: harness.binding.placement,
    policyPath,
    writeAllowed: true,
    reason:
      harness.binding.placement === "linked-external"
        ? "Policy writes stay in the linked harness. Do not add tracked native projections."
        : "Policy writes use the in-repository harness.",
  };
}

export function planProjectModelRefresh(
  projectRoot: string,
  currentSource: string,
  proposedSource: string,
  options?: { applyPreference?: boolean },
): ModelRefreshPlan {
  const placement = inspectModelPolicyPlacement(projectRoot);
  if (!placement.writeAllowed) {
    return {
      write: false,
      next: currentSource,
      conflicts: [placement.reason],
      preservedPins: [],
      blocked: true,
    };
  }
  return planModelRefresh(currentSource, proposedSource, options);
}
