export class ModelPolicyError extends Error {}

export const MODEL_ROLES: readonly string[];

export interface ModelRoleSpec {
  tier: "fast" | "balanced" | "deep";
  diversity?: "families";
  capabilities?: string[];
}

export interface ModelTierBinding {
  selection: string;
  fallback: string;
  effort: string | null;
}

export interface ModelHostBinding {
  parent: string;
  router_mode: string | null;
  tiers: Record<"fast" | "balanced" | "deep", ModelTierBinding>;
  supported: string[];
  evidence: {
    host_version: string | null;
    provider: string | null;
    source: string;
    observed_at: string | null;
    availability: "observed" | "documented-only" | "unknown";
    rationale: string;
  };
}

export interface ModelPolicy {
  schema_version: 1;
  owner: "methodrail";
  preference: "cost" | "balanced" | "quality";
  freshness_days: number;
  roles: Record<string, ModelRoleSpec>;
  pins: Record<string, string>;
  hosts: Record<string, ModelHostBinding>;
}

export interface ModelPolicyValidation {
  ok: boolean;
  errors: string[];
  policy: ModelPolicy | null;
}

export interface ModelRefreshPlan {
  write: boolean;
  next: string;
  conflicts: string[];
  preservedPins: string[];
  blocked: boolean;
}

export function parseModelPolicyYaml(source: string): Record<string, unknown>;
export function validateModelPolicy(source: string): ModelPolicyValidation;
export function serializeModelPolicy(policy: ModelPolicy): string;
export function planModelRefresh(
  currentSource: string,
  proposedSource: string,
  options?: { applyPreference?: boolean },
): ModelRefreshPlan;
export function effectiveTier(policy: ModelPolicy, role: string): "fast" | "balanced" | "deep";
export function initialTier(work: "bounded" | "normal" | "architecture" | "critique"): "fast" | "balanced" | "deep";
export function escalateTier(
  tier: "fast" | "balanced" | "deep",
  signal: string,
): { tier: "fast" | "balanced" | "deep"; escalated: boolean; reason: string };
export function spawnMerelyToChangeModel(): boolean;
export function modelFamily(selection: string): string | null;
export function resolveSelection(
  policy: ModelPolicy,
  input: {
    role: string;
    host: string;
    rejected?: boolean;
    attempts?: number;
    rejectionClass?: string;
  },
): {
  tier: "fast" | "balanced" | "deep";
  selection: string;
  retries: number;
  substituted: boolean;
  stop: boolean;
  reason: string;
};
export function diversityReport(
  policy: ModelPolicy,
  host: string,
): { required: boolean; met: boolean; families: string[]; limitation: string | null };
export function bindingStatus(
  policy: ModelPolicy,
  host: string,
): {
  configured: boolean;
  live: "not-run";
  availability: "observed" | "documented-only" | "unknown";
  routingWorks: false;
  pickerAction: string | null;
};
export function reviewDue(
  policy: ModelPolicy,
  input?: { hostChanged?: boolean; rejected?: boolean; ageDays?: number },
): { due: boolean; reason: string };
export function proposeDocumentedBinding(
  host: string,
  preference?: "cost" | "balanced" | "quality",
): {
  parent: string;
  router_mode?: string;
  writes_settings: boolean;
  picker_action: string | null;
  tiers: Record<"fast" | "balanced" | "deep", ModelTierBinding>;
  supported: string[];
  evidence: ModelHostBinding["evidence"];
};
