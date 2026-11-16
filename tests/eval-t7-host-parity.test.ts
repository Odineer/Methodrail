import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { compareScores } from "../src/eval/compare.js";
import { loadExpectationFile, loadRunFile } from "../src/eval/load.js";
import { scoreRun } from "../src/eval/score.js";
import type { EvalContext, EvalRun } from "../src/eval/types.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ctx: EvalContext = { repoRoot: root };
const examplesDir = join(root, "evals/runners/examples");

function example(name: string): EvalRun {
  return loadRunFile(join(examplesDir, name));
}

function tracesDiffer(a: EvalRun, b: EvalRun): boolean {
  return (
    a.model !== b.model ||
    a.latency_ms !== b.latency_ms ||
    JSON.stringify(a.tools_used) !== JSON.stringify(b.tools_used)
  );
}

test("simple-change: Cursor and Codex both outcome-pass; both compares are empirical neutral", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/simple-change/expected.yaml"));

  const cursorBaseline = example("simple-change.baseline.json");
  const cursorMethodrail = example("simple-change.methodrail.json");
  const codexBaseline = example("simple-change.codex-baseline.json");
  const codexMethodrail = example("simple-change.codex-methodrail.json");

  assert.equal(cursorBaseline.host, "cursor");
  assert.equal(codexBaseline.host, "codex");
  assert.equal(cursorBaseline.capture, "operator_summary");

  const cursorCompare = compareScores(
    scoreRun(cursorBaseline, expected, ctx),
    scoreRun(cursorMethodrail, expected, ctx),
  );
  const codexCompare = compareScores(
    scoreRun(codexBaseline, expected, ctx),
    scoreRun(codexMethodrail, expected, ctx),
  );
  assert.equal(cursorCompare.kind, "empirical");
  assert.equal(codexCompare.kind, "empirical");
  assert.equal(cursorCompare.empirical, "neutral");
  assert.equal(codexCompare.empirical, "neutral");
});

test("runtime-bug: Cursor empirical helped from outcome; Codex extras outcome-neutral with Methodrail routing hits", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/runtime-bug/expected.yaml"));
  const required = expected.required_skills ?? [];
  assert.deepEqual(required, ["debug", "diagnosing-bugs", "verify-change"]);

  const cursorCompare = compareScores(
    scoreRun(example("runtime-bug.baseline.json"), expected, ctx),
    scoreRun(example("runtime-bug.methodrail.json"), expected, ctx),
  );
  assert.equal(cursorCompare.kind, "empirical");
  assert.equal(cursorCompare.empirical, "helped");
  assert.equal(cursorCompare.baseline.passed, false);
  assert.equal(cursorCompare.methodrail.passed, true);

  const codexBaseline = scoreRun(example("runtime-bug.codex-baseline.json"), expected, ctx);
  const codexMethodrail = scoreRun(example("runtime-bug.codex-methodrail.json"), expected, ctx);
  assert.equal(codexBaseline.passed, true);
  assert.equal(codexMethodrail.passed, true);
  assert.equal(compareScores(codexBaseline, codexMethodrail).empirical, "neutral");
  for (const skill of required) {
    assert.ok(codexMethodrail.skill_hits.includes(skill), `codex methodrail missing ${skill}`);
  }
});

test("host traces are not copied blobs", () => {
  const pairs: Array<[string, string, string]> = [
    ["simple-change.baseline.json", "simple-change.codex-baseline.json", "simple-change baseline"],
    ["simple-change.methodrail.json", "simple-change.codex-methodrail.json", "simple-change methodrail"],
    ["runtime-bug.baseline.json", "runtime-bug.codex-baseline.json", "runtime-bug baseline"],
    ["runtime-bug.methodrail.json", "runtime-bug.codex-methodrail.json", "runtime-bug methodrail"],
  ];
  for (const [cursorName, codexName, label] of pairs) {
    const cursor = example(cursorName);
    const codex = example(codexName);
    assert.ok(
      tracesDiffer(cursor, codex),
      `${label}: Cursor and Codex traces must differ in model, tools_used, or latency_ms`,
    );
  }
});

function claudeCode(fixture: string, repeat: number, condition: "baseline" | "methodrail"): EvalRun {
  return example(`${fixture}.claude-code-r${repeat}-${condition}.json`);
}

interface LoadEvidence {
  session_start_hook: { exit_code: number | null; additional_context_matches_adapter: boolean } | null;
  skill_load: { requested: string; command_name: string | null; expanded_body_matches_skill_file: boolean } | null;
}

function loadEvidence(run: EvalRun): LoadEvidence {
  const transcript = run.artifacts?.transcript;
  assert.ok(transcript, `${run.fixture_id} r${run.repeat} ${run.condition}: missing transcript`);
  return JSON.parse(readFileSync(join(root, dirname(transcript), "load-evidence.json"), "utf8")) as LoadEvidence;
}

test("Claude Code traces are live runner captures with the plugin only in the methodrail condition", () => {
  for (const fixture of ["simple-change", "runtime-bug"]) {
    for (const repeat of [1, 2]) {
      for (const condition of ["baseline", "methodrail"] as const) {
        const run = claudeCode(fixture, repeat, condition);
        assert.equal(run.host, "claude-code");
        assert.equal(run.provenance, "live");
        assert.equal(run.capture, "runner_captured");
        assert.equal(run.repeat, repeat);
        assert.equal(run.subagents_used, 0);
        const evidence = loadEvidence(run);
        if (condition === "baseline") {
          assert.equal(evidence.session_start_hook, null);
          assert.ok(!run.references_loaded.includes("adapters/claude/CLAUDE.md"));
          continue;
        }
        assert.equal(evidence.session_start_hook?.exit_code, 0);
        assert.equal(evidence.session_start_hook?.additional_context_matches_adapter, true);
      }
    }
  }
});

test("Claude Code r2 records the slash skill expanding from the plugin SKILL.md; r1 did not record it", () => {
  for (const [fixture, skill] of [["simple-change", "develop"], ["runtime-bug", "debug"]] as const) {
    const r2 = claudeCode(fixture, 2, "methodrail");
    assert.deepEqual(loadEvidence(r2).skill_load, {
      requested: `/methodrail:${skill}`,
      command_name: `/methodrail:${skill}`,
      base_directory: `<methodrail>/skills/${skill}`,
      expanded_body_matches_skill_file: true,
    });
    assert.deepEqual(r2.skills_invoked, [skill]);

    const r1 = claudeCode(fixture, 1, "methodrail");
    assert.equal(loadEvidence(r1).skill_load?.command_name, null);
    assert.deepEqual(r1.skills_invoked, []);
  }
});

test("simple-change: Claude Code stays inspect-edit-check in both repeats; compares are empirical neutral", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/simple-change/expected.yaml"));
  for (const repeat of [1, 2]) {
    const baseline = scoreRun(claudeCode("simple-change", repeat, "baseline"), expected, ctx);
    const methodrail = scoreRun(claudeCode("simple-change", repeat, "methodrail"), expected, ctx);
    const report = compareScores(baseline, methodrail);
    assert.equal(report.kind, "empirical");
    assert.equal(report.empirical, "neutral");
    assert.equal(methodrail.routing.assessment, "appropriate");
    assert.equal(methodrail.metrics.expensive_skill_count, 0);
  }
});

test("runtime-bug: Claude Code is mixed across repeats and never composes the required leaf skills", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/runtime-bug/expected.yaml"));

  const r1 = compareScores(
    scoreRun(claudeCode("runtime-bug", 1, "baseline"), expected, ctx),
    scoreRun(claudeCode("runtime-bug", 1, "methodrail"), expected, ctx),
  );
  assert.equal(r1.empirical, "helped");
  assert.equal(r1.baseline.passed, false);
  assert.equal(r1.methodrail.passed, true);

  const r2 = compareScores(
    scoreRun(claudeCode("runtime-bug", 2, "baseline"), expected, ctx),
    scoreRun(claudeCode("runtime-bug", 2, "methodrail"), expected, ctx),
  );
  assert.equal(r2.baseline.passed, false);
  assert.equal(r2.methodrail.passed, false);
  assert.equal(r2.empirical, "incomplete");

  for (const repeat of [1, 2]) {
    const methodrail = scoreRun(claudeCode("runtime-bug", repeat, "methodrail"), expected, ctx);
    assert.equal(methodrail.routing.assessment, "miss");
    assert.ok(methodrail.skill_misses.includes("diagnosing-bugs"));
    assert.ok(methodrail.skill_misses.includes("verify-change"));
    assert.ok(!claudeCode("runtime-bug", repeat, "methodrail").tools_used.includes("skill"));
  }
});

test("Claude Code traces are not copied from Cursor or Codex", () => {
  for (const fixture of ["simple-change", "runtime-bug"]) {
    for (const condition of ["baseline", "methodrail"] as const) {
      const claude = claudeCode(fixture, 2, condition);
      for (const other of [example(`${fixture}.${condition}.json`), example(`${fixture}.codex-${condition}.json`)]) {
        assert.ok(tracesDiffer(claude, other), `${fixture} ${condition}: Claude Code trace must differ from ${other.host}`);
      }
    }
  }
});
