import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gradeVerificationTrace } from "../src/composition/grade-verification-trace.js";
import { initVerificationHandoff } from "../src/composition/handoff.js";
import { staticVerificationContract } from "../src/composition/verification-lifecycle.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const base = join(root, "evals/fixtures/verification-lifecycle");
const traces = join(root, "evals/runners/artifacts/verification-lifecycle");

function grade(name: string) {
  return gradeVerificationTrace(join(traces, name), base);
}

test("verification lifecycle prose is a static contract, not a proof", () => {
  const violations = staticVerificationContract(root);
  assert.deepEqual(violations, [], violations.join("; "));
});

test("init investigation does not invoke writing maintenance", () => {
  const effects = initVerificationHandoff(root, "investigate");
  assert.equal(effects.includes("write"), false);
  assert.equal(effects.includes("execute"), false);
});

test("confirmed apply may write verification maintenance", () => {
  const effects = initVerificationHandoff(root, "apply");
  assert.equal(effects.includes("write"), true);
});

test("a refresh proposal before confirmation has no overlay writes", () => {
  assert.equal(grade("refresh-proposal").passed, true);
});

test("writing maintenance before confirmation fails", () => {
  const result = grade("refresh-before-confirm");
  assert.equal(result.passed, false);
  assert.equal(result.failures.includes("pre-confirmation-maintenance"), true);
});

test("confirmed refresh grades the updated map entry and its command", () => {
  assert.equal(grade("refresh-apply").passed, true);
});

test("a changed helper that skips a dependent feature fails", () => {
  const result = grade("missing-dependents");
  assert.equal(result.passed, false);
  assert.match(result.failures.join(" "), /missing-dependent:refund/);
});

test("verification followed by another relevant edit fails", () => {
  const result = grade("verify-then-edit");
  assert.equal(result.passed, false);
  assert.equal(result.failures.includes("verification-then-edit"), true);
});

test("a new feature with an existing harness must gain a map entry", () => {
  assert.equal(grade("new-feature").passed, true);
  const skipped = grade("new-feature-skipped");
  assert.equal(skipped.passed, false);
  assert.equal(skipped.failures.includes("missing-map-entry:export"), true);
  assert.equal(skipped.failures.includes("missing-maintenance:export"), true);
});
