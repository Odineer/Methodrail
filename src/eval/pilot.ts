import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { compareScores } from "./compare.js";
import { loadExpectationFile, loadRunFile } from "./load.js";
import { scoreRun } from "./score.js";
import type { ComparisonReport, EvalContext, EvalRun } from "./types.js";

export interface PilotPairSpec {
  fixture: string;
  host: string;
  repeat: number;
}

export interface PilotManifest {
  id: string;
  pairs: PilotPairSpec[];
}

export interface PilotPairResult extends PilotPairSpec {
  baseline_path: string;
  methodrail_path: string;
  report: ComparisonReport;
}

export interface PilotGrade {
  manifest: PilotManifest;
  pairs: PilotPairResult[];
  integrity_errors: string[];
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function loadPilotManifest(path: string): PilotManifest {
  const value = record(parse(readFileSync(path, "utf8")));
  if (!value || typeof value.id !== "string" || !Array.isArray(value.pairs)) {
    throw new Error("Pilot manifest requires string id and pairs array");
  }
  const pairs = value.pairs.map((item, index) => {
    const pair = record(item);
    if (
      !pair ||
      typeof pair.fixture !== "string" ||
      typeof pair.host !== "string" ||
      typeof pair.repeat !== "number"
    ) {
      throw new Error(`Pilot pair ${index} requires fixture, host, and numeric repeat`);
    }
    return { fixture: pair.fixture, host: pair.host, repeat: pair.repeat };
  });
  return { id: value.id, pairs };
}

function artifactErrors(run: EvalRun, repoRoot: string): string[] {
  const errors: string[] = [];
  const artifacts = run.artifacts;
  const label = `${run.fixture_id} ${run.host ?? "unknown"} r${run.repeat ?? "?"} ${run.condition}`;
  if (!artifacts) return [`${label}: missing artifacts`];
  for (const field of ["answer", "command_log", "overlay"] as const) {
    const path = artifacts[field];
    if (!path || !existsSync(join(repoRoot, path))) errors.push(`${label}: missing ${field} artifact`);
  }
  if (run.capture === "runner_captured") {
    const transcript = artifacts.transcript;
    if (!transcript || !existsSync(join(repoRoot, transcript))) {
      errors.push(`${label}: runner_captured requires a transcript artifact`);
    }
  }
  if (run.capture === "hook_captured") {
    const ledger = artifacts.ledger;
    if (!ledger || !existsSync(join(repoRoot, ledger))) {
      errors.push(`${label}: hook_captured requires a ledger artifact`);
    }
  }
  return errors;
}

function runErrors(run: EvalRun, spec: PilotPairSpec, condition: "baseline" | "methodrail"): string[] {
  const errors: string[] = [];
  const label = `${spec.fixture} ${spec.host} r${spec.repeat} ${condition}`;
  if (run.fixture_id !== spec.fixture) errors.push(`${label}: fixture_id mismatch`);
  if (run.condition !== condition) errors.push(`${label}: condition mismatch`);
  if (run.host !== spec.host) errors.push(`${label}: host mismatch`);
  if (run.repeat !== spec.repeat) errors.push(`${label}: repeat mismatch`);
  if (run.provenance !== "live") errors.push(`${label}: pilot traces must have live provenance`);
  return errors;
}

export function gradePilotManifest(path: string, ctx: EvalContext): PilotGrade {
  const manifest = loadPilotManifest(path);
  const examples = join(ctx.repoRoot, "evals/runners/examples");
  const seen = new Set<string>();
  const integrityErrors: string[] = [];
  const pairs: PilotPairResult[] = [];

  for (const spec of manifest.pairs) {
    const key = `${spec.fixture}:${spec.host}:${spec.repeat}`;
    if (seen.has(key)) {
      integrityErrors.push(`${key}: duplicate pilot pair`);
      continue;
    }
    seen.add(key);
    const stem = `${spec.fixture}.${spec.host}-r${spec.repeat}`;
    const baselinePath = join(examples, `${stem}-baseline.json`);
    const methodrailPath = join(examples, `${stem}-methodrail.json`);
    if (!existsSync(baselinePath) || !existsSync(methodrailPath)) {
      integrityErrors.push(`${key}: missing live pair`);
      continue;
    }
    const baselineRun = loadRunFile(baselinePath);
    const methodrailRun = loadRunFile(methodrailPath);
    integrityErrors.push(
      ...runErrors(baselineRun, spec, "baseline"),
      ...runErrors(methodrailRun, spec, "methodrail"),
      ...artifactErrors(baselineRun, ctx.repoRoot),
      ...artifactErrors(methodrailRun, ctx.repoRoot),
    );
    const expectation = loadExpectationFile(
      join(ctx.repoRoot, "evals/fixtures", spec.fixture, "expected.yaml"),
    );
    const report = compareScores(
      scoreRun(baselineRun, expectation, ctx),
      scoreRun(methodrailRun, expectation, ctx),
    );
    pairs.push({
      ...spec,
      baseline_path: baselinePath,
      methodrail_path: methodrailPath,
      report,
    });
  }
  return { manifest, pairs, integrity_errors: integrityErrors };
}
