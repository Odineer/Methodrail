import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { EXPLICIT_SKILLS, WORKFLOW_SKILLS } from "../src/validate.js";
import { staticVerificationContract } from "../src/composition/verification-lifecycle.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

test("maintain-project is a native explicit workflow with audit and repair branches", () => {
  const skill = read("skills/maintain-project/SKILL.md");
  assert.equal(EXPLICIT_SKILLS.has("maintain-project"), true);
  assert.equal(WORKFLOW_SKILLS.includes("maintain-project"), true);
  assert.match(skill, /^disable-model-invocation:\s*true\s*$/m);
  assert.match(skill, /Read-only audit and ranked report/);
  assert.match(skill, /Revalidate those findings, then repair that batch/);
  assert.match(skill, /Add no consumer runtime/);
  assert.match(skill, /no mandatory debt ledger/);
  assert.equal(skill.split(/\r?\n/).length < 500, true);
  assert.match(read("references/capability-map.md"), /Evidence-backed project maintenance \| `maintain-project` \| Methodrail-native/);
});

test("standalone architecture and verification defaults stay compatible", () => {
  assert.deepEqual(staticVerificationContract(root), []);
  const architecture = read("skills/improve-codebase-architecture/SKILL.md");
  const maintain = read("skills/maintain-verification-skill/SKILL.md");
  const develop = read("skills/develop/SKILL.md");
  assert.match(architecture, /survey-only/);
  assert.match(architecture, /### 3\. Grilling loop/);
  assert.match(architecture, /Ask which candidate to explore\. Do not propose/);
  assert.match(maintain, /selects \*\*full audit\*\* and \*\*apply\*\*/);
  assert.match(maintain, /task-scoped\*\* and \*\*apply\*\*/);
  assert.match(maintain, /Inspect never reports \*\*changed\*\*/);
  assert.match(develop, /task-scoped/);
  assert.doesNotMatch(develop, /survey-only/);
});

test("ordinary tiny work forbids maintain-project", () => {
  for (const path of [
    "evals/complexity/button-text.yaml",
    "evals/complexity/tiny-edit-no-model-research.yaml",
    "evals/complexity/local-edit-no-survey.yaml",
    "evals/complexity/rename-usr.yaml",
    "evals/complexity/retry-count.yaml",
    "evals/complexity/verification-overtrigger.yaml",
    "evals/complexity/maintain-project-overtrigger.yaml",
    "skills/maintain-project/evals/routing-negative.yaml",
  ]) {
    assert.match(read(path), /maintain-project/, path);
  }
});
