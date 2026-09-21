import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { compareScores } from "../src/eval/compare.js";
import { loadExpectationFile, loadRunFile, parseRun } from "../src/eval/load.js";
import { scoreRun } from "../src/eval/score.js";
import type { EvalContext } from "../src/eval/types.js";
import { discoverProjectArtifacts } from "../src/artifacts.js";
import { evaluateProjectKnowledge } from "../src/knowledge/report.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ctx: EvalContext = { repoRoot: root };
const examples = join(root, "evals/runners/examples");
const V09 = [
  "artifact-interoperability",
  "decision-ladder",
  "knowledge-reconciliation-v0.9",
  "architecture-deepening",
] as const;

function scoreFixture(id: string, condition: "baseline" | "methodrail") {
  const expected = loadExpectationFile(join(root, "evals/fixtures", id, "expected.yaml"));
  return scoreRun(loadRunFile(join(examples, `${id}.${condition}.json`)), expected, ctx);
}

function synthetic(
  fixture_id: string,
  extras: {
    outcome: string;
    overlay?: string;
    command_log: string;
    answer: string;
    behaviors?: string[];
  },
) {
  const artifacts: Record<string, string> = {
    command_log: extras.command_log,
    answer: extras.answer,
  };
  if (extras.overlay) artifacts.overlay = extras.overlay;
  return parseRun({
    fixture_id,
    condition: "methodrail",
    provenance: "synthetic",
    capture: "operator_summary",
    skills_invoked: [],
    references_loaded: [],
    tools_used: [],
    subagents_used: 0,
    verification_steps: [],
    evidence: [],
    outcome: extras.outcome,
    failure_modes: [],
    behaviors_observed: extras.behaviors ?? [],
    artifacts,
  });
}

test("v0.9 constructed pairs are specifications", () => {
  for (const id of V09) {
    const expected = loadExpectationFile(join(root, "evals/fixtures", id, "expected.yaml"));
    const baseline = scoreFixture(id, "baseline");
    const methodrail = scoreFixture(id, "methodrail");
    assert.equal(baseline.passed, false, `${id} baseline should fail: ${baseline.outcome.failures.join("; ")}`);
    assert.equal(methodrail.passed, true, `${id} methodrail should pass: ${methodrail.outcome.failures.join("; ")}`);
    const comparison = compareScores(baseline, methodrail);
    assert.equal(comparison.kind, "specification", id);
    assert.equal(comparison.specification, "passed", id);
    assert.equal(comparison.methodrail_helped, null, id);
  }
});

test("artifact-interoperability Task A preview is read-only", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/artifact-interoperability/expected.yaml"));
  const preview = scoreRun(
    synthetic("artifact-interoperability", {
      outcome: "preview",
      command_log: "evals/runners/artifacts/artifact-interoperability/preview/command.log.json",
      answer: "evals/runners/artifacts/artifact-interoperability/preview/answer.md",
    }),
    expected,
    ctx,
  );
  assert.equal(preview.passed, true, preview.outcome.failures.join("; "));

  const claimed = scoreRun(
    synthetic("artifact-interoperability", {
      outcome: "preview with writes",
      overlay: "evals/runners/artifacts/artifact-interoperability/guardrail-write/overlay",
      command_log: "evals/runners/artifacts/artifact-interoperability/guardrail-write/command.log.json",
      answer: "evals/runners/artifacts/artifact-interoperability/guardrail-write/answer.md",
      behaviors: expected.expected_behaviors,
    }),
    expected,
    ctx,
  );
  assert.equal(claimed.passed, false);
  assert.ok(claimed.outcome.failures.some((line) => /preview-readonly|curated|bounded/i.test(line)));
});

test("artifact-interoperability fixture has a glossary conflict and mixed roles", () => {
  const fixture = join(root, "evals/fixtures/artifact-interoperability");
  const report = discoverProjectArtifacts(fixture);
  assert.ok(report.conflicts.some((item) => item.role === "glossary"));
  const roles = new Set(report.artifacts.map((item) => item.role));
  assert.ok(roles.has("decision-log"));
  assert.ok(roles.has("adr"));
  assert.ok(roles.has("spec"));
  const knowledge = evaluateProjectKnowledge(fixture);
  assert.equal(knowledge.errors.length, 0, knowledge.errors.map((item) => item.message).join("\n"));
});

test("decision-ladder guardrail: ADR before approval fails", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/decision-ladder/expected.yaml"));
  const unapproved = scoreRun(
    synthetic("decision-ladder", {
      outcome: "wrote adr",
      overlay: "evals/runners/artifacts/decision-ladder/guardrail-unapproved/overlay",
      command_log: "evals/runners/artifacts/decision-ladder/guardrail-unapproved/command.log.json",
      answer: "evals/runners/artifacts/decision-ladder/guardrail-unapproved/answer.md",
    }),
    expected,
    ctx,
  );
  assert.equal(unapproved.passed, false);
  assert.ok(unapproved.outcome.failures.some((line) => /adr-approval/i.test(line)));
});

test("knowledge-reconciliation-v0.9 guardrail: rewrite fails even with claimed behaviors", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/knowledge-reconciliation-v0.9/expected.yaml"));
  const rewrite = scoreRun(
    synthetic("knowledge-reconciliation-v0.9", {
      outcome: "updated the note",
      overlay: "evals/runners/artifacts/knowledge-reconciliation-v0.9/guardrail-rewrite/overlay",
      command_log: "evals/runners/artifacts/knowledge-reconciliation-v0.9/guardrail-rewrite/command.log.json",
      answer: "evals/runners/artifacts/knowledge-reconciliation-v0.9/methodrail/answer.md",
      behaviors: expected.expected_behaviors,
    }),
    expected,
    ctx,
  );
  assert.equal(rewrite.passed, false);
  assert.ok(rewrite.outcome.failures.some((line) => /note-untouched/i.test(line)));
});

test("decision-ladder guardrail: explicit non-approval fails", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/decision-ladder/expected.yaml"));
  const denied = scoreRun(
    synthetic("decision-ladder", {
      outcome: "wrote adr",
      overlay: "evals/runners/artifacts/decision-ladder/methodrail/overlay",
      command_log: "evals/runners/artifacts/decision-ladder/methodrail/command.log.json",
      answer: "evals/runners/artifacts/decision-ladder/guardrail-not-approved/answer.md",
    }),
    expected,
    ctx,
  );
  assert.equal(denied.passed, false);
  assert.ok(denied.outcome.failures.some((line) => /adr-approval/i.test(line)));
});

test("decision-ladder accepts affirmative approval phrasing", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/decision-ladder/expected.yaml"));
  const approved = scoreRun(
    synthetic("decision-ladder", {
      outcome: "wrote adr",
      overlay: "evals/runners/artifacts/decision-ladder/methodrail/overlay",
      command_log: "evals/runners/artifacts/decision-ladder/methodrail/command.log.json",
      answer: "evals/runners/artifacts/decision-ladder/guardrail-got-approval/answer.md",
    }),
    expected,
    ctx,
  );
  assert.equal(approved.passed, true, approved.outcome.failures.join("; "));
  assert.ok(approved.outcome.checks.some((item) => item.id === "adr-approval" && item.passed));
});

test("architecture-deepening guardrail: source edit fails", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/architecture-deepening/expected.yaml"));
  const edited = scoreRun(
    synthetic("architecture-deepening", {
      outcome: "classified modules",
      overlay: "evals/runners/artifacts/architecture-deepening/guardrail-edit/overlay",
      command_log: "evals/runners/artifacts/architecture-deepening/guardrail-edit/command.log.json",
      answer: "evals/runners/artifacts/architecture-deepening/methodrail/answer.md",
      behaviors: expected.expected_behaviors,
    }),
    expected,
    ctx,
  );
  assert.equal(edited.passed, false);
  assert.ok(edited.outcome.failures.some((line) => /no-source-edit/i.test(line)));
});

test("architecture-deepening guardrail: any src overlay or deletion fails", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/architecture-deepening/expected.yaml"));
  const extraFile = scoreRun(
    synthetic("architecture-deepening", {
      outcome: "classified modules",
      overlay: "evals/runners/artifacts/architecture-deepening/guardrail-src-overlay/overlay",
      command_log: "evals/runners/artifacts/architecture-deepening/guardrail-src-overlay/command.log.json",
      answer: "evals/runners/artifacts/architecture-deepening/methodrail/answer.md",
      behaviors: expected.expected_behaviors,
    }),
    expected,
    ctx,
  );
  assert.equal(extraFile.passed, false);
  assert.ok(extraFile.outcome.failures.some((line) => /no-source-edit/i.test(line)));

  const deleted = scoreRun(
    synthetic("architecture-deepening", {
      outcome: "classified modules",
      overlay: "evals/runners/artifacts/architecture-deepening/guardrail-src-delete/overlay",
      command_log: "evals/runners/artifacts/architecture-deepening/guardrail-src-delete/command.log.json",
      answer: "evals/runners/artifacts/architecture-deepening/methodrail/answer.md",
      behaviors: expected.expected_behaviors,
    }),
    expected,
    ctx,
  );
  assert.equal(deleted.passed, false);
  assert.ok(deleted.outcome.failures.some((line) => /no-source-edit/i.test(line)));

  const libOverlay = scoreRun(
    synthetic("architecture-deepening", {
      outcome: "classified modules",
      overlay: "evals/runners/artifacts/architecture-deepening/guardrail-lib-overlay/overlay",
      command_log: "evals/runners/artifacts/architecture-deepening/guardrail-lib-overlay/command.log.json",
      answer: "evals/runners/artifacts/architecture-deepening/methodrail/answer.md",
      behaviors: expected.expected_behaviors,
    }),
    expected,
    ctx,
  );
  assert.equal(libOverlay.passed, false);
  assert.ok(libOverlay.outcome.failures.some((line) => /no-source-edit/i.test(line)));

  const repoSrc = scoreRun(
    synthetic("architecture-deepening", {
      outcome: "classified modules",
      overlay: "evals/runners/artifacts/architecture-deepening/guardrail-repo-src-overlay/overlay",
      command_log: "evals/runners/artifacts/architecture-deepening/guardrail-repo-src-overlay/command.log.json",
      answer: "evals/runners/artifacts/architecture-deepening/methodrail/answer.md",
      behaviors: expected.expected_behaviors,
    }),
    expected,
    ctx,
  );
  assert.equal(repoSrc.passed, false);
  assert.ok(repoSrc.outcome.failures.some((line) => /no-source-edit/i.test(line)));
});

test("missing artifacts cannot pass a v0.9 grader", () => {
  const expected = loadExpectationFile(join(root, "evals/fixtures/architecture-deepening/expected.yaml"));
  const missing = scoreRun(
    parseRun({
      fixture_id: "architecture-deepening",
      condition: "methodrail",
      provenance: "constructed",
      capture: "operator_summary",
      skills_invoked: [],
      references_loaded: [],
      tools_used: [],
      subagents_used: 0,
      verification_steps: [],
      evidence: [],
      outcome: "success",
      failure_modes: [],
      behaviors_observed: expected.expected_behaviors,
    }),
    expected,
    ctx,
  );
  assert.equal(missing.passed, false);
});

test("v0.9 graders fail adversarial wording without supporting artifacts", () => {
  const decision = loadExpectationFile(join(root, "evals/fixtures/decision-ladder/expected.yaml"));
  const knowledge = loadExpectationFile(join(root, "evals/fixtures/knowledge-reconciliation-v0.9/expected.yaml"));
  const architecture = loadExpectationFile(join(root, "evals/fixtures/architecture-deepening/expected.yaml"));

  const approvalNoAdr = scoreRun(
    synthetic("decision-ladder", {
      outcome: "approval without adr",
      overlay: "evals/runners/artifacts/decision-ladder/guardrail-unapproved/overlay",
      command_log: "evals/runners/artifacts/decision-ladder/guardrail-unapproved/command.log.json",
      answer: "evals/runners/artifacts/decision-ladder/guardrail-approval-without-adr/answer.md",
    }),
    decision,
    ctx,
  );
  assert.equal(approvalNoAdr.passed, false);
  assert.ok(approvalNoAdr.outcome.failures.some((line) => /adr-approval/i.test(line)));

  const adrNoApproval = scoreRun(
    synthetic("decision-ladder", {
      outcome: "adr without approval",
      overlay: "evals/runners/artifacts/decision-ladder/methodrail/overlay",
      command_log: "evals/runners/artifacts/decision-ladder/methodrail/command.log.json",
      answer: "evals/runners/artifacts/decision-ladder/guardrail-adr-without-approval/answer.md",
    }),
    decision,
    ctx,
  );
  assert.equal(adrNoApproval.passed, false);
  assert.ok(adrNoApproval.outcome.failures.some((line) => /adr-approval/i.test(line)));

  const storeOnly = scoreRun(
    synthetic("decision-ladder", {
      outcome: "store only",
      overlay: "evals/runners/artifacts/decision-ladder/codex-r1-baseline/overlay",
      command_log: "evals/runners/artifacts/decision-ladder/baseline/command.log.json",
      answer: "evals/runners/artifacts/decision-ladder/methodrail/answer.md",
    }),
    decision,
    ctx,
  );
  assert.equal(storeOnly.passed, false);
  assert.ok(storeOnly.outcome.failures.some((line) => /small-choice/i.test(line)));

  const trustWhole = scoreRun(
    synthetic("knowledge-reconciliation-v0.9", {
      outcome: "trusted note",
      overlay: "evals/runners/artifacts/knowledge-reconciliation-v0.9/methodrail/overlay",
      command_log: "evals/runners/artifacts/knowledge-reconciliation-v0.9/methodrail/command.log.json",
      answer: "evals/runners/artifacts/knowledge-reconciliation-v0.9/guardrail-trust-whole/answer.md",
    }),
    knowledge,
    ctx,
  );
  assert.equal(trustWhole.passed, false);
  assert.ok(trustWhole.outcome.failures.some((line) => /reconcile/i.test(line)));

  const rewrite = scoreRun(
    synthetic("knowledge-reconciliation-v0.9", {
      outcome: "rewrote",
      overlay: "evals/runners/artifacts/knowledge-reconciliation-v0.9/guardrail-rewrite/overlay",
      command_log: "evals/runners/artifacts/knowledge-reconciliation-v0.9/guardrail-rewrite/command.log.json",
      answer: "evals/runners/artifacts/knowledge-reconciliation-v0.9/cursor-r1-methodrail/answer.md",
    }),
    knowledge,
    ctx,
  );
  assert.equal(rewrite.passed, false);
  assert.ok(rewrite.outcome.failures.some((line) => /note-untouched/i.test(line)));

  const noBoundary = scoreRun(
    synthetic("knowledge-reconciliation-v0.9", {
      outcome: "no hedge",
      overlay: "evals/runners/artifacts/knowledge-reconciliation-v0.9/methodrail/overlay",
      command_log: "evals/runners/artifacts/knowledge-reconciliation-v0.9/methodrail/command.log.json",
      answer: "evals/runners/artifacts/knowledge-reconciliation-v0.9/guardrail-no-boundary/answer.md",
    }),
    knowledge,
    ctx,
  );
  assert.equal(noBoundary.passed, false);
  assert.ok(noBoundary.outcome.failures.some((line) => /evidence-boundary/i.test(line)));

  const topLedger = scoreRun(
    synthetic("architecture-deepening", {
      outcome: "ledger first",
      overlay: "evals/runners/artifacts/architecture-deepening/methodrail/overlay",
      command_log: "evals/runners/artifacts/architecture-deepening/methodrail/command.log.json",
      answer: "evals/runners/artifacts/architecture-deepening/guardrail-top-ledger/answer.md",
    }),
    architecture,
    ctx,
  );
  assert.equal(topLedger.passed, false);
  assert.ok(topLedger.outcome.failures.some((line) => /top/i.test(line)));

  const noTop = scoreRun(
    synthetic("architecture-deepening", {
      outcome: "no top marker",
      overlay: "evals/runners/artifacts/architecture-deepening/methodrail/overlay",
      command_log: "evals/runners/artifacts/architecture-deepening/methodrail/command.log.json",
      answer: "evals/runners/artifacts/architecture-deepening/guardrail-no-top/answer.md",
    }),
    architecture,
    ctx,
  );
  assert.equal(noTop.passed, false);
  assert.ok(noTop.outcome.failures.some((line) => /^top:/i.test(line) || /: recommended the already-deep/.test(line) || line.startsWith("top:")));
});
