import assert from "node:assert/strict";
import test from "node:test";
import { extractCompletionReport } from "../src/eval/completion-report.js";

test("extractCompletionReport reads the last methodrail_completion yaml fence", () => {
  const answer = [
    "```yaml",
    "methodrail_completion:",
    "  claim: first",
    "```",
    "prose",
    "```yaml",
    "methodrail_completion:",
    "  claim: expired sessions now land on /login",
    "  verification:",
    "    - command: node --test src/session.test.js",
    "      result: pass",
    "  decisions:",
    "    - subject: orderIntake",
    "      disposition: deepen",
    "      approval: not-needed",
    "```",
  ].join("\n");
  const report = extractCompletionReport(answer);
  assert.equal(report?.claim, "expired sessions now land on /login");
  assert.deepEqual(report?.verification, [{ command: "node --test src/session.test.js", result: "pass" }]);
  assert.deepEqual(report?.decisions, [{ subject: "orderIntake", disposition: "deepen", approval: "not-needed" }]);
});

test("extractCompletionReport returns null when the block is absent or invalid", () => {
  assert.equal(extractCompletionReport("Done. Tests pass."), null);
  assert.equal(extractCompletionReport("```yaml\nnot: a completion\n```"), null);
  assert.equal(extractCompletionReport("```yaml\nmethodrail_completion: [\n```"), null);
});
