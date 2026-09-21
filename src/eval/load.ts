import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { CaptureQuality, EvalRun, FixtureExpectation, Provenance, RunArtifacts, VerificationStep } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

function inferProvenance(value: Record<string, unknown>): Provenance {
  if (value.provenance === "live" || value.provenance === "constructed" || value.provenance === "synthetic") {
    return value.provenance;
  }
  if (value.host === "constructed" || (typeof value.notes === "string" && /constructed/i.test(value.notes))) {
    return "constructed";
  }
  if (value.host === "cursor" || value.host === "codex" || value.host === "claude") return "live";
  return "constructed";
}

function inferCapture(value: Record<string, unknown>): CaptureQuality {
  if (value.capture === "runner_captured" || value.capture === "hook_captured" || value.capture === "operator_summary") {
    return value.capture;
  }
  return "operator_summary";
}

function parseVerification(value: unknown): VerificationStep[] {
  if (!Array.isArray(value)) return [];
  const steps: VerificationStep[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      steps.push(item);
      continue;
    }
    if (isRecord(item) && typeof item.command === "string") {
      const record: import("./types.js").VerificationRecord = {
        command: item.command,
        exit_status: typeof item.exit_status === "number" ? item.exit_status : null,
      };
      if (item.phase === "repro" || item.phase === "regression" || item.phase === "verify" || item.phase === "other") {
        record.phase = item.phase;
      }
      if (typeof item.artifact === "string") record.artifact = item.artifact;
      steps.push(record);
    }
  }
  return steps;
}

function parseArtifacts(value: unknown): RunArtifacts | undefined {
  if (!isRecord(value)) return undefined;
  const artifacts: RunArtifacts = {};
  if (typeof value.transcript === "string") artifacts.transcript = value.transcript;
  if (typeof value.patch === "string") artifacts.patch = value.patch;
  if (typeof value.command_log === "string") artifacts.command_log = value.command_log;
  if (typeof value.answer === "string") artifacts.answer = value.answer;
  if (typeof value.overlay === "string") artifacts.overlay = value.overlay;
  if (typeof value.worktree === "string") artifacts.worktree = value.worktree;
  if (typeof value.ledger === "string") artifacts.ledger = value.ledger;
  return artifacts;
}

export function parseExpectation(value: unknown): FixtureExpectation {
  if (!isRecord(value) || typeof value.id !== "string") {
    throw new Error("Fixture expectation requires a string id");
  }
  const expected: FixtureExpectation = {
    id: value.id,
    required_skills: strings(value.required_skills),
    forbidden_skills: strings(value.forbidden_skills),
    expected_behaviors: strings(value.expected_behaviors),
  };
  if (typeof value.max_subagents === "number") expected.max_subagents = value.max_subagents;
  if (typeof value.max_expensive_skills === "number") {
    expected.max_expensive_skills = value.max_expensive_skills;
  }
  const expensive = strings(value.expensive_skills);
  if (expensive.length > 0) expected.expensive_skills = expensive;
  return expected;
}

export function parseRun(value: unknown): EvalRun {
  if (!isRecord(value) || typeof value.fixture_id !== "string") {
    throw new Error("Eval run requires fixture_id");
  }
  if (value.condition !== "baseline" && value.condition !== "methodrail") {
    throw new Error("Eval run condition must be baseline or methodrail");
  }
  const provenance = inferProvenance(value);
  const run: EvalRun = {
    fixture_id: value.fixture_id,
    condition: value.condition,
    provenance,
    capture: inferCapture(value),
    skills_invoked: strings(value.skills_invoked),
    references_loaded: strings(value.references_loaded),
    tools_used: strings(value.tools_used),
    subagents_used: typeof value.subagents_used === "number" ? value.subagents_used : 0,
    verification_steps: parseVerification(value.verification_steps),
    evidence: strings(value.evidence),
    outcome: typeof value.outcome === "string" ? value.outcome : "",
    failure_modes: strings(value.failure_modes),
    behaviors_observed: strings(value.behaviors_observed),
  };
  if (typeof value.host === "string") run.host = value.host;
  if (typeof value.model === "string") run.model = value.model;
  if (typeof value.repeat === "number") run.repeat = value.repeat;
  if (typeof value.started_at === "string") run.started_at = value.started_at;
  if (typeof value.ended_at === "string") run.ended_at = value.ended_at;
  if (typeof value.latency_ms === "number") run.latency_ms = value.latency_ms;
  if (typeof value.notes === "string") run.notes = value.notes;
  const artifacts = parseArtifacts(value.artifacts);
  if (artifacts) run.artifacts = artifacts;
  return run;
}

export function loadExpectationFile(path: string): FixtureExpectation {
  return parseExpectation(parse(readFileSync(path, "utf8")));
}

export function loadRunFile(path: string): EvalRun {
  return parseRun(JSON.parse(readFileSync(path, "utf8")));
}

export const REQUIRED_COMPOSITION_FIXTURES = [
  "simple-change",
  "medium-feature",
  "runtime-bug",
  "architecture-decision",
  "review-risk",
  "project-init",
  "init-value",
  "knowledge-freshness",
  "knowledge-accumulation",
  "partial-knowledge",
  "human-decision",
  "knowledge-reuse",
  "knowledge-refresh",
  "knowledge-applicability",
  "knowledge-dispute",
  "knowledge-retired",
  "artifact-interoperability",
  "decision-ladder",
  "knowledge-reconciliation-v0.9",
  "architecture-deepening",
] as const;

/** Canonical example names: `<fixture>.baseline.json` / `<fixture>.methodrail.json` for required fixtures only. Host extras and Task A traces (e.g. `knowledge-accumulation-discover.methodrail.json`) are not loaded by `npm run eval`. */
export function isCanonicalExampleFile(name: string): boolean {
  return (REQUIRED_COMPOSITION_FIXTURES as readonly string[]).some(
    (id) => name === `${id}.baseline.json` || name === `${id}.methodrail.json`,
  );
}

export function listFixtureDirs(evalsRoot: string): string[] {
  const root = join(evalsRoot, "fixtures");
  if (!existsSync(root)) return [];
  return readdirSync(root).filter((name) => statSync(join(root, name)).isDirectory());
}
