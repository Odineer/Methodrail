import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { usageCost } from "../src/eval/compare.js";
import { gradeOutcome } from "../src/eval/grade-outcome.js";
import { loadRunFile, parseRun, parseUsage } from "../src/eval/load.js";
import { scoreRun } from "../src/eval/score.js";
import type { EvalContext, EvalRun } from "../src/eval/types.js";
import { EXPLICIT_SKILLS } from "../src/validate.js";
import { classifyChangedPaths, loadMatrixRows, loadSkillOrigins, parseMatrix } from "../scripts/upstream-preflight.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ctx: EvalContext = { repoRoot: root };

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function minimalRun(usage: unknown): EvalRun {
  return parseRun({
    fixture_id: "w15-native-usage",
    condition: "methodrail",
    provenance: "constructed",
    capture: "operator_summary",
    skills_invoked: [],
    references_loaded: [],
    tools_used: [],
    subagents_used: 0,
    verification_steps: [],
    evidence: [],
    outcome: "",
    failure_modes: [],
    usage,
  });
}

test("public catalog stays 40 skills and 28 explicit", () => {
  const skills = readdirSync(join(root, "skills")).filter((name) => {
    try {
      readFileSync(join(root, "skills", name, "SKILL.md"));
      return true;
    } catch {
      return false;
    }
  });
  assert.equal(skills.length, 40);
  assert.equal(EXPLICIT_SKILLS.size, 28);
});

test("workflow instructions keep the v0.10 boundaries", () => {
  const develop = read("skills/develop/SKILL.md");
  const wayfinder = read("skills/wayfinder/SKILL.md");
  const diagnosis = read("skills/diagnosing-bugs/SKILL.md");
  const tickets = read("skills/to-tickets/SKILL.md");
  const review = read("skills/code-review/SKILL.md");
  const refactor = read("skills/refactor/SKILL.md");
  assert.match(develop, /run `code-review` on the task-owned delta/);
  assert.match(develop, /Tiny bounded change/);
  assert.doesNotMatch(wayfinder, /at most one non-research ticket/);
  assert.doesNotMatch(wayfinder, /Never resolve more than one ticket per session/);
  assert.doesNotMatch(diagnosis, /3–5 ranked/);
  assert.match(diagnosis, /three unsuccessful fixes/);
  assert.doesNotMatch(tickets, /Quiz the user/);
  assert.match(tickets, /existing procedure/);
  assert.doesNotMatch(review, /parallel sub-agents/);
  assert.match(review, /unjustified weakening/);
  assert.match(refactor, /demonstrated benefit/);
  assert.doesNotMatch(refactor, /Stop if the target is quiet/);
});

test("historical eval JSON without usage still parses", () => {
  const run = loadRunFile(join(root, "evals/runners/examples/simple-change.methodrail.json"));
  assert.equal(run.usage, undefined);
  const scored = scoreRun(
    run,
    {
      id: "fixture.simple-change",
      forbidden_skills: [],
      expected_behaviors: [],
    },
    ctx,
  );
  assert.equal(scored.metrics.input_tokens, null);
  assert.equal(scored.metrics.usage_scope, null);
});

test("native usage rejects malformed records and keeps documented splits", () => {
  assert.throws(() => parseUsage({ source: "guess", scope: "complete-run" }), /native-report/);
  assert.throws(
    () =>
      minimalRun({
        source: "native-report",
        scope: "complete-run",
        input_tokens: -1,
        output_tokens: null,
        cached_input_tokens: null,
        total_tokens: null,
      }),
    /nonnegative/,
  );
  assert.throws(
    () =>
      parseUsage({
        source: "native-report",
        scope: "complete-run",
        input_tokens: 100,
        output_tokens: 10,
        cached_input_tokens: 40,
        total_tokens: 150,
      }),
    /double-counts/,
  );
  const split = parseUsage({
    source: "native-report",
    scope: "parent-only",
    input_semantics: "split-cached-excluded",
    uncached_input_tokens: 800,
    cached_input_tokens: 400,
    input_tokens: null,
    output_tokens: 10,
    total_tokens: null,
  });
  assert.equal(split?.input_tokens, 1200);
  assert.equal(split?.scope, "parent-only");
});

test("token comparisons do not invent a zero cost", () => {
  const bare = scoreRun(
    loadRunFile(join(root, "evals/runners/examples/simple-change.baseline.json")),
    { id: "fixture.simple-change", forbidden_skills: [], expected_behaviors: [] },
    ctx,
  );
  const other = scoreRun(
    loadRunFile(join(root, "evals/runners/examples/simple-change.methodrail.json")),
    { id: "fixture.simple-change", forbidden_skills: [], expected_behaviors: [] },
    ctx,
  );
  const missing = usageCost(bare, other);
  assert.equal(missing, "token usage unavailable");
  assert.doesNotMatch(missing, /input 0/);

  const partial = loadRunFile(join(root, "evals/runners/examples/w15-native-usage.baseline.json"));
  const complete = loadRunFile(join(root, "evals/runners/examples/w15-native-usage.methodrail.json"));
  const expected = { id: "fixture.w15-native-usage", forbidden_skills: [], expected_behaviors: [] };
  const line = usageCost(scoreRun(partial, expected, ctx), scoreRun(complete, expected, ctx));
  assert.match(line, /incompatible/);
});

test("guardrail traces that claim success while weakening or editing early fail", () => {
  const weakened = loadRunFile(join(root, "evals/runners/examples/w4-weakened-oracle.baseline.json"));
  weakened.outcome = "All tests passed. Ship it.";
  const early = loadRunFile(join(root, "evals/runners/examples/w1-batch-decision.baseline.json"));
  early.outcome = "Implemented the export successfully.";
  assert.equal(gradeOutcome(weakened, ctx).passed, false);
  assert.equal(gradeOutcome(early, ctx).passed, false);
});

test("Addy COMPOSE and SKIP paths are report-only discoveries", () => {
  const matrix = read( "references/upstream-skill-matrix.md");
  const rows = parseMatrix(matrix);
  const addy = rows.filter((row: { names: string[] }) =>
    ["spec-driven-development", "using-agent-skills", "code-review-and-quality"].includes(row.names[0] ?? ""),
  );
  assert.equal(addy.length, 3);
  const result = classifyChangedPaths({
    changedPaths: [
      "skills/spec-driven-development/SKILL.md",
      "skills/using-agent-skills/SKILL.md",
      "skills/code-review-and-quality/SKILL.md",
      "README.md",
    ],
    skills: loadSkillOrigins(root),
    record: {
      stem: "addy-osmani",
      name: "addyosmani/agent-skills",
      repository: "https://github.com/addyosmani/agent-skills",
      imported: "6ca0cd7db39b41b1c37e26d335c507ee92382c6d",
      path: "",
    },
    matrixRows: loadMatrixRows(root),
  });
  assert.deepEqual(result.mapped, []);
  assert.deepEqual(
    result.discoveries.map((row: { upstream_path: string; matrix_decision: string }) => row.matrix_decision).sort(),
    ["COMPOSE", "COMPOSE", "SKIP"],
  );
});
