import { realVerificationCount } from "./commands.js";
import { gradeOutcome, loadCommandLog } from "./grade-outcome.js";
import { EXPENSIVE_SKILLS, type EvalContext, type EvalRun, type FixtureExpectation, type OperationalQuality, type RoutingGrade, type ScoreResult } from "./types.js";

function includesAll(haystack: string[], needles: string[]): { hits: string[]; misses: string[] } {
  const set = new Set(haystack);
  const hits = needles.filter((item) => set.has(item));
  const misses = needles.filter((item) => !set.has(item));
  return { hits, misses };
}

export function gradeRouting(run: EvalRun, expected: FixtureExpectation): RoutingGrade {
  const required = expected.required_skills ?? [];
  const { hits: skillHits, misses: allMisses } = includesAll(run.skills_invoked, required);
  const skillMisses = run.condition === "methodrail" ? allMisses : [];
  const forbiddenHits = run.skills_invoked.filter((skill) => expected.forbidden_skills.includes(skill));
  const expensive = expected.expensive_skills ?? [...EXPENSIVE_SKILLS];
  const expensiveCount = run.skills_invoked.filter((skill) => expensive.includes(skill)).length;
  const notes: string[] = [];
  if (forbiddenHits.length > 0) notes.push(`forbidden skills invoked: ${forbiddenHits.join(", ")}`);
  if (skillMisses.length > 0) notes.push(`missing required skills: ${skillMisses.join(", ")}`);
  if (expected.max_subagents !== undefined && run.subagents_used > expected.max_subagents) {
    notes.push(`subagents ${run.subagents_used} exceed max ${expected.max_subagents}`);
  }
  if (expected.max_expensive_skills !== undefined && expensiveCount > expected.max_expensive_skills) {
    notes.push(`expensive skills ${expensiveCount} exceed max ${expected.max_expensive_skills}`);
  }
  const capViolation =
    (expected.max_subagents !== undefined && run.subagents_used > expected.max_subagents) ||
    (expected.max_expensive_skills !== undefined && expensiveCount > expected.max_expensive_skills);
  const assessment =
    forbiddenHits.length > 0 || capViolation ? "violation" : skillMisses.length > 0 ? "miss" : "appropriate";
  return { assessment, skill_hits: skillHits, skill_misses: skillMisses, forbidden_hits: forbiddenHits, notes };
}

function operationalQuality(
  routing: RoutingGrade,
  expensiveCount: number,
  expected: FixtureExpectation,
): OperationalQuality {
  if (routing.assessment === "violation") return "violating";
  if (expensiveCount > 0 && (expected.max_expensive_skills === undefined || expected.max_expensive_skills > 0)) {
    return "wasteful";
  }
  return "clean";
}

export function scoreRun(run: EvalRun, expected: FixtureExpectation, ctx: EvalContext): ScoreResult {
  const observed = run.behaviors_observed ?? [];
  const { hits: behaviorHits, misses: behaviorMisses } = includesAll(observed, expected.expected_behaviors);
  const expensive = expected.expensive_skills ?? [...EXPENSIVE_SKILLS];
  const expensiveCount = run.skills_invoked.filter((skill) => expensive.includes(skill)).length;
  const routing = gradeRouting(run, expected);
  const outcome = gradeOutcome(run, ctx);
  const commandLog = loadCommandLog(run, ctx.repoRoot);
  const verificationCount = realVerificationCount(run.verification_steps, commandLog);
  const quality = operationalQuality(routing, expensiveCount, expected);
  const failures = [...outcome.failures, ...routing.notes];

  return {
    fixture_id: expected.id,
    condition: run.condition,
    provenance: run.provenance,
    capture: run.capture,
    passed: outcome.passed,
    outcome,
    routing,
    operational_quality: quality,
    skill_hits: routing.skill_hits,
    skill_misses: routing.skill_misses,
    forbidden_hits: routing.forbidden_hits,
    behavior_hits: behaviorHits,
    behavior_misses: behaviorMisses,
    metrics: {
      skill_count: run.skills_invoked.length,
      reference_count: run.references_loaded.length,
      subagents_used: run.subagents_used,
      verification_steps: verificationCount,
      expensive_skill_count: expensiveCount,
      latency_ms: run.latency_ms ?? null,
      input_tokens: run.usage?.input_tokens ?? null,
      output_tokens: run.usage?.output_tokens ?? null,
      cached_input_tokens: run.usage?.cached_input_tokens ?? null,
      total_tokens: run.usage?.total_tokens ?? null,
      usage_scope: run.usage?.scope ?? null,
    },
    ...(run.host ? { host: run.host } : {}),
    ...(run.model ? { model: run.model } : {}),
    ...(run.usage ? { usage: run.usage } : {}),
    failures,
  };
}

export function guardrailResult(score: ScoreResult): "caught" | "missed" {
  return score.routing.assessment === "violation" ? "caught" : "missed";
}
