export const EXPENSIVE_SKILLS = [
  "wayfinder",
  "architect",
  "arena",
  "swarm",
  "interrogate",
] as const;

export type EvalCondition = "baseline" | "methodrail";
export type Provenance = "live" | "constructed" | "synthetic";
export type CaptureQuality = "runner_captured" | "hook_captured" | "operator_summary";
export type RoutingAssessment = "appropriate" | "miss" | "violation";
export type OperationalQuality = "clean" | "wasteful" | "violating";
export type EmpiricalResult = "helped" | "neutral" | "harmed" | "incomplete";
export type SpecificationResult = "passed" | "failed";
export type GuardrailResult = "caught" | "missed";
export type ComparisonKind = "empirical" | "specification" | "guardrail";

export interface VerificationRecord {
  command: string;
  phase?: "repro" | "regression" | "verify" | "other";
  exit_status: number | null;
  artifact?: string;
}

export type VerificationStep = string | VerificationRecord;

export interface RunArtifacts {
  transcript?: string;
  patch?: string;
  command_log?: string;
  answer?: string;
  overlay?: string;
  worktree?: string;
  ledger?: string;
}

export interface CommandLogEntry {
  command: string;
  phase?: string;
  exit_status: number | null;
  stdout?: string;
  stderr?: string;
}

export interface EvalRun {
  fixture_id: string;
  condition: EvalCondition;
  provenance: Provenance;
  capture: CaptureQuality;
  host?: string;
  model?: string;
  repeat?: number;
  started_at?: string;
  ended_at?: string;
  latency_ms?: number | null;
  skills_invoked: string[];
  references_loaded: string[];
  tools_used: string[];
  subagents_used: number;
  verification_steps: VerificationStep[];
  evidence: string[];
  outcome: string;
  failure_modes: string[];
  behaviors_observed?: string[];
  notes?: string;
  artifacts?: RunArtifacts;
}

export interface FixtureExpectation {
  id: string;
  required_skills?: string[];
  forbidden_skills: string[];
  expected_behaviors: string[];
  max_subagents?: number;
  max_expensive_skills?: number;
  expensive_skills?: string[];
}

export interface OutcomeCheck {
  id: string;
  passed: boolean;
  detail: string;
}

export interface OutcomeGrade {
  passed: boolean;
  incomplete: boolean;
  checks: OutcomeCheck[];
  failures: string[];
}

export interface RoutingGrade {
  assessment: RoutingAssessment;
  skill_hits: string[];
  skill_misses: string[];
  forbidden_hits: string[];
  notes: string[];
}

export interface ScoreResult {
  fixture_id: string;
  condition: EvalCondition;
  provenance: Provenance;
  capture: CaptureQuality;
  /** Outcome layer only. Routing violations do not clear this. */
  passed: boolean;
  outcome: OutcomeGrade;
  routing: RoutingGrade;
  operational_quality: OperationalQuality;
  skill_hits: string[];
  skill_misses: string[];
  forbidden_hits: string[];
  behavior_hits: string[];
  behavior_misses: string[];
  metrics: {
    skill_count: number;
    reference_count: number;
    subagents_used: number;
    verification_steps: number;
    expensive_skill_count: number;
    latency_ms: number | null;
  };
  failures: string[];
}

export interface ComparisonReport {
  fixture_id: string;
  kind: ComparisonKind;
  baseline: ScoreResult;
  methodrail: ScoreResult;
  methodrail_helped: boolean | null;
  where: string[];
  cost: string[];
  extra_complexity: string[];
  empirical?: EmpiricalResult;
  specification?: SpecificationResult;
  guardrail?: GuardrailResult;
  capture: CaptureQuality;
}

export interface EvalContext {
  repoRoot: string;
}
