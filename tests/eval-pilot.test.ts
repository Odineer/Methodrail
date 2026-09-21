import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gradePilotManifest } from "../src/eval/pilot.js";
import type { EvalContext } from "../src/eval/types.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ctx: EvalContext = { repoRoot: root };

test("live T5-T10 pilot is complete and rescored from its artifact manifest", () => {
  const grade = gradePilotManifest(join(root, "evals/pilot-t5-t10.yaml"), ctx);
  assert.deepEqual(grade.integrity_errors, []);
  assert.equal(grade.pairs.length, 15);

  const results = grade.pairs.map((pair) => ({
    key: `${pair.fixture}:${pair.host}:r${pair.repeat}`,
    result: pair.report.empirical,
  }));
  assert.equal(results.filter((item) => item.result === "neutral").length, 14);
  assert.deepEqual(results.filter((item) => item.result === "helped"), [
    { key: "human-decision:codex:r1", result: "helped" },
  ]);
  assert.equal(results.some((item) => item.result === "harmed" || item.result === "incomplete"), false);
});

test("live v0.7 knowledge pilot is complete and rescored from its artifact manifest", () => {
  const grade = gradePilotManifest(join(root, "evals/pilot-v0.7-knowledge.yaml"), ctx);
  assert.deepEqual(grade.integrity_errors, []);
  assert.equal(grade.pairs.length, 6);

  const results = Object.fromEntries(
    grade.pairs.map((pair) => [`${pair.fixture}:${pair.host}:r${pair.repeat}`, pair.report.empirical]),
  );
  assert.equal(results["knowledge-reuse:cursor:r1"], "neutral");
  assert.equal(results["knowledge-reuse:cursor:r2"], "neutral");
  assert.equal(results["knowledge-reuse:codex:r1"], "neutral");
  assert.equal(results["knowledge-refresh:cursor:r1"], "helped");
  assert.equal(results["knowledge-refresh:cursor:r2"], "helped");
  assert.equal(results["knowledge-refresh:codex:r1"], "helped");
});

test("live v0.8 knowledge-governance pilot is complete and rescored from its artifact manifest", () => {
  const manifestPath = join(root, "evals/pilot-v0.8-knowledge-governance.yaml");
  const grade = gradePilotManifest(manifestPath, ctx);
  assert.deepEqual(grade.integrity_errors, []);
  assert.equal(grade.pairs.length, 9);

  const results = Object.fromEntries(
    grade.pairs.map((pair) => [`${pair.fixture}:${pair.host}:r${pair.repeat}`, pair.report.empirical]),
  );
  assert.equal(results["knowledge-applicability:cursor:r1"], "neutral");
  assert.equal(results["knowledge-applicability:cursor:r2"], "neutral");
  assert.equal(results["knowledge-applicability:codex:r1"], "neutral");
  assert.equal(results["knowledge-dispute:cursor:r1"], "helped");
  assert.equal(results["knowledge-dispute:cursor:r2"], "helped");
  assert.equal(results["knowledge-dispute:codex:r1"], "incomplete");
  assert.equal(results["knowledge-retired:cursor:r1"], "neutral");
  assert.equal(results["knowledge-retired:cursor:r2"], "neutral");
  assert.equal(results["knowledge-retired:codex:r1"], "neutral");
  assert.equal(grade.pairs.some((pair) => pair.report.empirical === "harmed"), false);
});

test("live v0.9 project-artifact-interoperability pilot is complete and rescored from its artifact manifest", () => {
  const manifestPath = join(root, "evals/pilot-v0.9-project-artifact-interoperability.yaml");
  const grade = gradePilotManifest(manifestPath, ctx);
  assert.deepEqual(grade.integrity_errors, []);
  assert.equal(grade.pairs.length, 9);

  const results = Object.fromEntries(
    grade.pairs.map((pair) => [`${pair.fixture}:${pair.host}:r${pair.repeat}`, pair.report.empirical]),
  );
  assert.equal(results["decision-ladder:cursor:r1"], "helped");
  assert.equal(results["decision-ladder:cursor:r2"], "helped");
  assert.equal(results["decision-ladder:codex:r1"], "incomplete");
  assert.equal(results["knowledge-reconciliation-v0.9:cursor:r1"], "incomplete");
  assert.equal(results["knowledge-reconciliation-v0.9:cursor:r2"], "incomplete");
  assert.equal(results["knowledge-reconciliation-v0.9:codex:r1"], "incomplete");
  assert.equal(results["architecture-deepening:cursor:r1"], "helped");
  assert.equal(results["architecture-deepening:cursor:r2"], "helped");
  assert.equal(results["architecture-deepening:codex:r1"], "helped");
  assert.equal(grade.pairs.some((pair) => pair.report.empirical === "harmed"), false);
});
