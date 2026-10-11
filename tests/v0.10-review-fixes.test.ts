import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { usageCost } from "../src/eval/compare.js";
import { gradeOutcome } from "../src/eval/grade-outcome.js";
import { loadExpectationFile, loadRunFile, parseUsage } from "../src/eval/load.js";
import { scoreRun } from "../src/eval/score.js";
import type { CommandLogEntry, EvalContext, EvalRun } from "../src/eval/types.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function withCandidate(
  id: string,
  edit: (overlay: string, artifacts: string, fixture: string) => void,
  verify: (run: EvalRun, ctx: EvalContext) => void,
): void {
  const scratch = mkdtempSync(join(tmpdir(), "methodrail-review-fix-"));
  try {
    const fixture = join(scratch, "evals", "fixtures", id);
    mkdirSync(dirname(fixture), { recursive: true });
    cpSync(join(root, "evals", "fixtures", id), fixture, { recursive: true });
    const artifacts = join(scratch, "evals", "runners", "artifacts", id, "methodrail");
    mkdirSync(dirname(artifacts), { recursive: true });
    cpSync(join(root, "evals", "runners", "artifacts", id, "methodrail"), artifacts, { recursive: true });
    const run = loadRunFile(join(root, "evals", "runners", "examples", `${id}.methodrail.json`));
    edit(join(artifacts, "overlay"), artifacts, fixture);
    verify(run, { repoRoot: scratch });
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

function put(overlay: string, path: string, source: string): void {
  const target = join(overlay, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, source);
}

const poisonedOracles = [
  { id: "w2-settled-policy", script: "check-export.mjs", check: "export" },
  { id: "w3-weak-tests", script: "hidden-greet.mjs", check: "behavior" },
  { id: "w4-weakened-oracle", script: "hidden-oracle.mjs", check: "oracle" },
  { id: "w7-refactor-benefit", script: "pack-check.mjs", check: "pack" },
];

for (const { id, script, check } of poisonedOracles) {
  test(`${id} cannot pass broken behavior by replacing its verification script`, () => {
    withCandidate(
      id,
      (overlay, _artifacts, fixture) => {
        put(overlay, `repo/scripts/${script}`, "process.exit(0);\n");
        if (id === "w2-settled-policy") {
          put(overlay, "repo/src/export.js", 'export function header() { return "invoices"; }\nexport function row(customer) { return customer.invoices; }\n');
        } else if (id === "w3-weak-tests") {
          put(overlay, "repo/src/greet.js", 'export function greet() { return "hello"; }\n');
        } else if (id === "w4-weakened-oracle") {
          put(overlay, "repo/src/limit.js", "export function limit() { return 0; }\n");
        } else {
          const index = readFileSync(join(fixture, "repo/src/index.js"), "utf8");
          put(overlay, "repo/src/index.js", `${index}\n// PACK_FAIL\n`);
        }
      },
      (run, ctx) => {
        const grade = gradeOutcome(run, ctx);
        assert.equal(grade.passed, false);
        assert.equal(grade.checks.find((item) => item.id === check)?.passed, false);
      },
    );
  });
}

test("a candidate module exiting successfully before the probe does not prove its behavior", () => {
  withCandidate(
    "w3-weak-tests",
    (overlay) => put(overlay, "repo/src/greet.js", 'process.exit(0);\nexport function greet() { return "hello"; }\n'),
    (run, ctx) => assert.equal(gradeOutcome(run, ctx).passed, false),
  );
});

test("silencing verification is rejected even if the implementation happens to be correct", () => {
  withCandidate(
    "w3-weak-tests",
    (overlay) => put(overlay, "repo/scripts/hidden-greet.mjs", "process.exit(0);\n"),
    (run, ctx) => {
      const grade = gradeOutcome(run, ctx);
      assert.equal(grade.checks.find((item) => item.id === "behavior")?.passed, true);
      assert.equal(grade.passed, false);
    },
  );
});

test("mechanical correctness stays separate from reviewer and skill routing", () => {
  withCandidate(
    "w5-mechanical-edit",
    (overlay) => put(overlay, "repo/src/button.js", "export function buttonLabel() { return 'Create'; }\n"),
    (run, ctx) => {
      run.skills_invoked.push("code-review");
      run.subagents_used = 1;
      const expected = loadExpectationFile(join(root, "evals/fixtures/w5-mechanical-edit/expected.yaml"));
      const score = scoreRun(run, expected, ctx);
      assert.equal(score.outcome.passed, true);
      assert.equal(score.routing.assessment, "violation");
      assert.equal(score.operational_quality, "violating");
    },
  );
});

function rewriteTrace(artifacts: string, rewrite: (log: CommandLogEntry[]) => CommandLogEntry[]): void {
  const file = join(artifacts, "command.log.json");
  const log: CommandLogEntry[] = JSON.parse(readFileSync(file, "utf8"));
  writeFileSync(file, JSON.stringify(rewrite(log)));
}

const invalidFixSequences: [string, (log: CommandLogEntry[]) => CommandLogEntry[]][] = [
  ["reassessment before the three failures", (log) => [
    ...log.filter((entry) => entry.phase === "reassess"),
    ...log.filter((entry) => entry.phase !== "reassess"),
  ]],
  ["a fourth fix before reassessment", (log) => {
    const fixes = log.filter((entry) => entry.phase === "fix");
    const fourth = fixes[3]!;
    const rest = log.filter((entry) => entry !== fourth);
    const at = rest.findIndex((entry) => entry.phase === "reassess");
    rest.splice(at, 0, fourth);
    return rest;
  }],
  ["a causal claim without a new probe", (log) => log.filter((entry) => entry.phase !== "probe")],
  ["verification only before the final fix", (log) => [
    ...log.filter((entry) => entry.phase === "verify"),
    ...log.filter((entry) => entry.phase !== "verify"),
  ]],
  ["a fifth fix after another failure without new reassessment", (log) => {
    const fixes = log.filter((entry) => entry.phase === "fix");
    const fourth = fixes[3]!;
    fourth.exit_status = 1;
    const next: CommandLogEntry = { command: "edit attempt 5", phase: "fix", exit_status: 0, stdout: "causal: new guess" };
    log.splice(log.indexOf(fourth) + 1, 0, next);
    return log;
  }],
];

for (const [name, rewrite] of invalidFixSequences) {
  test(`fourth-fix gate rejects ${name}`, () => {
    withCandidate(
      "w9-fix-reassessment",
      (_overlay, artifacts) => rewriteTrace(artifacts, rewrite),
      (run, ctx) => assert.equal(gradeOutcome(run, ctx).passed, false),
    );
  });
}

test("the recorded causal reassessment and fresh verification still pass", () => {
  const run = loadRunFile(join(root, "evals/runners/examples/w9-fix-reassessment.methodrail.json"));
  assert.equal(gradeOutcome(run, { repoRoot: root }).passed, true);
});

test("native token comparisons require known host and model identities on both sides", () => {
  const run = loadRunFile(join(root, "evals/runners/examples/w15-native-usage.methodrail.json"));
  const expected = loadExpectationFile(join(root, "evals/fixtures/w15-native-usage/expected.yaml"));
  const known = scoreRun(run, expected, { repoRoot: root });
  assert.match(usageCost(known, known), /^tokens complete-run/);
  for (const field of ["host", "model"] as const) {
    const unknown = { ...known };
    delete unknown[field];
    assert.equal(usageCost(unknown, unknown), "token usage incompatible");
    assert.equal(usageCost(unknown, known), "token usage incompatible");
    const blank = { ...known, [field]: "  " };
    assert.equal(usageCost(blank, blank), "token usage incompatible");
    const different = { ...known, [field]: "different" };
    assert.equal(usageCost(known, different), "token usage incompatible");
  }
});

test("normalized native totals agree with inclusive input and output without adding cache again", () => {
  const report = { source: "native-report", scope: "complete-run", input_tokens: 100, output_tokens: 10, cached_input_tokens: 0, total_tokens: 110 };
  assert.equal(parseUsage(report)?.total_tokens, 110);
  assert.equal(parseUsage({ ...report, cached_input_tokens: 40 })?.total_tokens, 110);
  assert.equal(parseUsage({ ...report, total_tokens: null })?.total_tokens, null);
  for (const total of [1, 109, 999]) {
    assert.throws(() => parseUsage({ ...report, total_tokens: total }), /total_tokens/);
    assert.throws(() => parseUsage({ ...report, cached_input_tokens: null, total_tokens: total }), /total_tokens/);
  }
  assert.throws(() => parseUsage({ ...report, input_tokens: Number.MAX_SAFE_INTEGER, output_tokens: 1, total_tokens: Number.MAX_SAFE_INTEGER }), /total_tokens/);
});
