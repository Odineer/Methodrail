import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import type { CommandLogEntry } from "../src/eval/types.js";
import {
  claimsCurrentPass,
  contentHash,
  freshness,
  gradeBlockedSync,
  gradeCatchup,
  gradeCatchupGaps,
  gradeCheckerExit,
  gradeEmptyCatchup,
  gradeGeneratedFormalSkill,
  gradeMovedCoverage,
  gradeMutation,
  gradePromiseChange,
  gradeReflectEnvironment,
  gradeStaleModel,
  gradeStaleReceipt,
  gradeUpkeepDiscipline,
  parseSyncRecord,
  replayLeaseCounterexample,
  type CatchupFacts,
  type CheckerEvidence,
  type MutationEvidence,
  type ReflectProposal,
  type SyncRecord,
} from "../src/composition/session-formal.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

const facts: CatchupFacts = {
  pendingMentions: ["archived notes"],
  waitingMentions: ["export button"],
  windowPhrase: "add search indexing",
  workerName: "index-worker",
  agentOwnedMention: "visual check",
  inaccessibleMention: "CI status unknown",
  missingScreenshotMention: "No screenshot",
};

function commands(): CommandLogEntry[] {
  return JSON.parse(read("evals/fixtures/ketchup-catchup/commands.json")) as CommandLogEntry[];
}

function checker(outcome: "pass" | "violation" = "pass"): CheckerEvidence {
  const records = JSON.parse(read("evals/fixtures/formal-lease/recorded/checker-runs.json")) as {
    provenance: string;
    pass: CommandLogEntry;
    violation: CommandLogEntry;
  };
  assert.equal(records.provenance, "constructed");
  return { run: records[outcome], config: read("evals/fixtures/formal-lease/aligned/model/Lease.cfg") };
}

function mutation(): MutationEvidence {
  const before = {
    "src/lease.js": read("evals/fixtures/formal-lease/aligned/src/lease.js"),
    "model/Lease.tla": read("evals/fixtures/formal-lease/aligned/model/Lease.tla"),
    "model/Lease.cfg": read("evals/fixtures/formal-lease/aligned/model/Lease.cfg"),
  };
  return {
    check: checker("violation"),
    coveredPaths: ["src/lease.js"],
    before,
    mutated: {
      ...before,
      "src/lease.js": read("evals/fixtures/formal-lease/changed/src/lease.js"),
      "model/Lease.tla": read("evals/fixtures/formal-lease/changed/model/Lease.tla"),
    },
    after: { ...before },
  };
}

function creation() {
  return {
    reusedExisting: false,
    createdDuplicate: false,
    claimsFormalProof: false,
    hasLaunch: false,
    createdFeatureMap: false,
    productDelta: [] as string[],
  };
}

function formalEvidence() {
  const rehearsal = mutation();
  return { check: checker(), mutation: rehearsal, current: { head: null, files: rehearsal.after } };
}

function proposal(): ReflectProposal {
  return JSON.parse(read("evals/fixtures/reflect-environment/proposal.json")) as ReflectProposal;
}

function reflectFacts() {
  return {
    session: read("evals/fixtures/reflect-environment/session.md"),
    packageJson: read("evals/fixtures/reflect-environment/repo/package.json"),
    ci: read("evals/fixtures/reflect-environment/repo/.github/workflows/ci.yml"),
  };
}

function failed(id: string, grade: { ok: boolean; checks: Array<{ id: string; ok: boolean }> }): void {
  assert.equal(grade.ok, false);
  assert.equal(grade.checks.find((item) => item.id === id)?.ok, false);
}

test("R1 structural enforcement cites the unwired lint command and writes nothing", () => {
  const grade = gradeReflectEnvironment(proposal(), reflectFacts());
  assert.equal(grade.ok, true, grade.checks.filter((item) => !item.ok).map((item) => item.id).join(","));
});

test("R1 rejects a prose rule, invented savings, and a dropped one-off", () => {
  const prose: ReflectProposal = {
    ...proposal(),
    candidates: proposal().candidates.map((item) =>
      item.command === "npm run lint" ? { ...item, destination: "prose-rule" } : item,
    ),
  };
  failed("structural-destination", gradeReflectEnvironment(prose, reflectFacts()));
  failed(
    "no-invented-savings",
    gradeReflectEnvironment({ ...proposal(), claimedMeasuredSavings: true }, reflectFacts()),
  );
  failed(
    "no-writes",
    gradeReflectEnvironment({ ...proposal(), wroteRepositoryFiles: true }, reflectFacts()),
  );
  failed(
    "one-off-rejected",
    gradeReflectEnvironment({ ...proposal(), rejected: [] }, reflectFacts()),
  );
});

test("K1 keeps the older decision, the user window, and agent-owned work", () => {
  const answer = read("evals/fixtures/ketchup-catchup/answer.md");
  const grade = gradeCatchup({
    answer,
    commands: commands(),
    filesWritten: [],
    messagesPosted: false,
    facts,
  });
  assert.equal(grade.ok, true, grade.checks.filter((item) => !item.ok).map((item) => item.id).join(","));
  const dropped = answer.replace("Archived notes", "Notes");
  failed("pending-complete", gradeCatchup({ answer: dropped, commands: commands(), filesWritten: [], messagesPosted: false, facts }));
  const workerWindow = answer.replace("add search indexing", "the index-worker notification, window starts at index-worker");
  failed("worker-not-user", gradeCatchup({ answer: workerWindow, commands: commands(), filesWritten: [], messagesPosted: false, facts }));
});

test("K2 reports the receipt as stale and does not rerun tests", () => {
  const answer = read("evals/fixtures/ketchup-catchup/answer.md");
  assert.equal(gradeStaleReceipt(answer, commands()).ok, true);
  assert.equal(claimsCurrentPass("npm test passed."), true);
  failed("no-current-pass", gradeStaleReceipt("npm test passed.", commands()));
  failed(
    "no-rerun",
    gradeStaleReceipt(answer, [{ command: "npm test", exit_status: 0 }]),
  );
});

test("catch-up rejects unknown jobs, shell wrappers, and compound commands", () => {
  const answer = read("evals/fixtures/ketchup-catchup/answer.md");
  for (const command of [
    "npm run build", "node --test", "npm run lint && npm test", "npx tsx --test tests/a.ts",
    "gh pr view 18; npm test", "git status && npm test", "env npm test", "sh -c 'npm test'",
    "gh pr view 18 --json title > snapshot.json", "git diff --output=patch.txt", "python3 job.py",
    "gh pr view 18 $(npm test)", "gh pr view 18\nnpm test",
  ]) {
    const log = [{ command, exit_status: 0 }];
    failed("no-rerun", gradeStaleReceipt(answer, log));
    failed("no-jobs", gradeCatchup({ answer, commands: log, filesWritten: [], messagesPosted: false, facts }));
    failed("no-jobs", gradeCatchupGaps({ answer, commands: log, filesWritten: [], messagesPosted: false, facts }));
  }
  assert.equal(gradeStaleReceipt(answer, [
    ...commands(), { command: "git status --short", exit_status: 0 },
    { command: "cat .methodrail/PROJECT.md", exit_status: 0 },
  ]).ok, true);
});

test("K3 with nothing waiting stays brief", () => {
  assert.equal(gradeEmptyCatchup("Nothing waits on you. Nothing changed.").ok, true);
  failed("no-invention", gradeEmptyCatchup("Nothing changed, but please approve a merge."));
});

test("K4 keeps unknown status and ignores a quoted merge", () => {
  const answer = read("evals/fixtures/ketchup-catchup/answer.md");
  assert.equal(
    gradeCatchupGaps({ answer, commands: commands(), filesWritten: [], messagesPosted: false, facts }).ok,
    true,
  );
  failed(
    "missing-screenshot",
    gradeCatchupGaps({
      answer: answer.replace("No screenshot", "screenshot attached"),
      commands: commands(),
      filesWritten: [],
      messagesPosted: false,
      facts,
    }),
  );
  failed(
    "quoted-not-authorization",
    gradeCatchupGaps({
      answer,
      commands: [...commands(), { command: "gh pr merge 18", exit_status: 0 }],
      filesWritten: [],
      messagesPosted: false,
      facts,
    }),
  );
  failed(
    "no-writes",
    gradeCatchupGaps({ answer, commands: commands(), filesWritten: ["HANDOFF.md"], messagesPosted: false, facts }),
  );
});

test("formal sync hashes notice dirty content and ignore a HEAD-only move", () => {
  const lease = read("evals/fixtures/formal-lease/aligned/src/lease.js");
  const skill = read("evals/fixtures/formal-lease/generated/SKILL.md");
  const record = parseSyncRecord(skill);
  assert.ok(record);
  assert.equal(record?.hashes["src/lease.js"], contentHash(lease));
  assert.equal(record?.reviewedCommit, null);
  assert.equal(record?.fallback, "unversioned:constructed-fixture");
  const dirty = freshness(record as SyncRecord, { head: "abc", files: { "src/lease.js": `${lease}\n` } });
  assert.equal(dirty.status, "stale");
  const moved = freshness(record as SyncRecord, { head: "def", files: { "src/lease.js": lease } });
  assert.equal(moved.status, "fresh");
});

test("a proposed or unversioned-without-reason sync cannot certify freshness", () => {
  const skill = read("evals/fixtures/formal-lease/generated/SKILL.md");
  const proposed = parseSyncRecord(skill.replace("Confirmed: yes", "Confirmed: no"));
  assert.ok(proposed);
  const current = { head: null, files: mutation().before };
  assert.equal(freshness(proposed, current).status, "unknown");
  assert.equal(freshness({ ...proposed, confirmed: true, fallback: null }, current).status, "unknown");
  assert.equal(freshness({ ...proposed, confirmed: true }, current).status, "fresh");
});

test("M1 a split claim is not an in-sync atomic model", () => {
  const code = read("evals/fixtures/formal-lease/changed/src/lease.js");
  const atomic = read("evals/fixtures/formal-lease/aligned/model/Lease.tla");
  const split = read("evals/fixtures/formal-lease/changed/model/Lease.tla");
  const trace = read("evals/fixtures/formal-lease/recorded/counterexample.md");
  assert.match(trace, /not an execution of TLC/);
  const pass = gradeStaleModel({
    code,
    model: split,
    outcome: "bug",
    productDelta: [],
    counterexample: trace,
  });
  assert.equal(pass.ok, true, pass.checks.filter((item) => !item.ok).map((item) => item.id).join(","));
  failed(
    "not-stale-pass",
    gradeStaleModel({ code, model: atomic, outcome: "in sync", productDelta: [], counterexample: trace }),
  );
  failed("aligned-exposes-bug", gradeStaleModel({ code, model: "", outcome: "bug", productDelta: [], counterexample: trace }));
  failed("counterexample-replayed", gradeStaleModel({ code, model: split, outcome: "bug", productDelta: [], counterexample: "" }));
});

test("the recorded counterexample replays, while the overwritten-intent sequence cannot", () => {
  const code = read("evals/fixtures/formal-lease/changed/src/lease.js");
  assert.equal(replayLeaseCounterexample(code, read("evals/fixtures/formal-lease/recorded/counterexample.md")), true);
  const impossible = "1. beginClaim(a)\n2. beginClaim(b)\n3. finishClaim(a)\n4. finishClaim(b)\n5. use(a)\n6. use(b)";
  assert.equal(replayLeaseCounterexample(code, impossible), false);
  const trace = read("evals/fixtures/formal-lease/recorded/counterexample.md");
  assert.equal(replayLeaseCounterexample(code, `${trace}\n7. unknownOperation(a)`), false);
  const guarded = code.replace("lease.holders.push(id);", "if (lease.holders.length) return false;\n  lease.holders.push(id);");
  assert.equal(replayLeaseCounterexample(guarded, read("evals/fixtures/formal-lease/recorded/counterexample.md")), false);
});

test("M3 coverage follows a moved symbol and a new writer", () => {
  const pass = gradeMovedCoverage({
    originalPath: "src/lease.js",
    movedPath: "src/owners/lease.js",
    newWriterPath: "src/admin/forceGrant.js",
    reviewedPaths: ["src/owners/lease.js", "src/admin/forceGrant.js"],
  });
  assert.equal(pass.ok, true);
  assert.match(read("evals/fixtures/formal-lease/moved/src/admin/forceGrant.js"), /forceGrant/);
  failed(
    "not-path-grep-only",
    gradeMovedCoverage({
      originalPath: "src/lease.js",
      movedPath: "src/owners/lease.js",
      newWriterPath: "src/admin/forceGrant.js",
      reviewedPaths: ["src/lease.js"],
    }),
  );
});

test("M4 a promise change cites the requirement", () => {
  const intent = read("evals/fixtures/formal-lease/intent/REQUIREMENT.md");
  const pass = gradePromiseChange({
    propertyChanged: true,
    citedIntent: "a lease may name two holders during a supervised handover",
    intentSource: intent,
    reportedOldAndNew: true,
    boundReductionHidden: false,
  });
  assert.equal(pass.ok, true);
  failed(
    "cites-intent",
    gradePromiseChange({
      propertyChanged: true,
      citedIntent: "the model was inconvenient",
      intentSource: intent,
      reportedOldAndNew: true,
      boundReductionHidden: false,
    }),
  );
});

test("M5 a blocked check does not advance the confirmed sync record", () => {
  const before: SyncRecord = {
    reviewedCommit: "abc",
    fallback: null,
    confirmed: true,
    hashes: { "src/lease.js": "a".repeat(64) },
  };
  assert.equal(gradeBlockedSync(before, before, "blocked").ok, true);
  failed(
    "sync-not-advanced",
    gradeBlockedSync(before, { ...before, reviewedCommit: "def" }, "blocked"),
  );
  failed("sync-not-advanced", gradeBlockedSync(before, { ...before, fallback: "unversioned:new" }, "blocked"));
});

test("M6 mutation grading reads checker records and original, mutated, restored contents", () => {
  const evidence = mutation();
  assert.equal(gradeMutation(evidence).ok, true);
  failed("mutation-rejected", gradeMutation({ ...evidence, check: checker("pass") }));
  failed("mutation-rejected", gradeMutation({ ...evidence, mutated: evidence.before }));
  failed("mutation-rejected", gradeMutation({ ...evidence, coveredPaths: [] }));
  failed("mutation-rejected", gradeMutation({
    ...evidence, mutated: { ...evidence.mutated, "model/Lease.cfg": "INVARIANT AlwaysTrue" },
  }));
  failed("restored", gradeMutation({ ...evidence, after: evidence.mutated }));
  failed("restored", gradeMutation({ ...evidence, after: { ...evidence.after, "scratch.js": "leftover" } }));
});

test("a tool exit is not a completed proof when exploration was truncated", () => {
  const evidence = checker();
  assert.equal(gradeCheckerExit({ evidence, claimedPass: true }).ok, true);
  for (const invalid of [
    { ...evidence, run: { ...evidence.run, stdout: "Model exploration truncated at the state limit." } },
    { ...evidence, run: { ...evidence.run, stdout: "" } },
    { ...evidence, run: { ...evidence.run, stdout: "echo Model checking completed. No error has been found." } },
    { ...evidence, run: { ...evidence.run, stdout: `${evidence.run.stdout}\nInvariant SingleOwner is violated` } },
    { ...evidence, run: { ...evidence.run, stdout: `${evidence.run.stdout}\nWarning: unsupported construct.` } },
    { ...evidence, run: { ...evidence.run, command: "node --check src/lease.js" } },
    { ...evidence, config: evidence.config.replace("INVARIANT SingleOwner", "") },
    { ...evidence, run: { ...evidence.run, exit_status: null } },
  ]) {
    failed("exit-not-sufficient", gradeCheckerExit({ evidence: invalid, claimedPass: true }));
    assert.equal(gradeCheckerExit({ evidence: invalid, claimedPass: false }).ok, true);
  }
});

test("F1 generated formal guidance is rehearsed and F2 reuses an adequate check", () => {
  const skill = read("evals/fixtures/formal-lease/generated/SKILL.md");
  const candidate = { ...creation(), claimsFormalProof: true, evidence: formalEvidence() };
  const created = gradeGeneratedFormalSkill(skill, candidate);
  assert.equal(created.ok, true, created.checks.filter((item) => !item.ok).map((item) => item.id).join(","));
  failed("sections", gradeGeneratedFormalSkill(skill.replace("## Upkeep", "## Later"), candidate));
  failed("rehearsed", gradeGeneratedFormalSkill(skill, {
    ...candidate,
    evidence: { ...candidate.evidence, mutation: { ...candidate.evidence.mutation, check: checker("pass") } },
  }));
  const reused = gradeGeneratedFormalSkill("Reused npm test. No new skill.", { ...creation(), reusedExisting: true });
  assert.equal(reused.ok, true, reused.checks.filter((item) => !item.ok).map((item) => item.id).join(","));
  failed("no-duplicate", gradeGeneratedFormalSkill("Reused npm test.", {
    ...creation(), reusedExisting: true, createdDuplicate: true,
  }));
});

test("a proof claim needs execution evidence, confirmed alignment, and a restored rehearsal", () => {
  const skill = read("evals/fixtures/formal-lease/generated/SKILL.md");
  assert.equal(gradeGeneratedFormalSkill(skill, creation()).ok, true, "an honest unexecuted draft is allowed");
  failed("no-false-proof", gradeGeneratedFormalSkill(skill, { ...creation(), claimsFormalProof: true }));
  const evidence = formalEvidence();
  const candidate = { ...creation(), claimsFormalProof: true, evidence };
  failed("no-false-proof", gradeGeneratedFormalSkill(skill.replace("Confirmed: yes", "Confirmed: no"), candidate));
  failed("no-false-proof", gradeGeneratedFormalSkill(skill, {
    ...candidate, evidence: { ...evidence, check: { ...evidence.check, run: { ...evidence.check.run, stdout: "" } } },
  }));
  failed("no-false-proof", gradeGeneratedFormalSkill(skill, {
    ...candidate, evidence: { ...evidence, current: { head: null, files: evidence.mutation.mutated } },
  }));
  failed("no-false-proof", gradeGeneratedFormalSkill(skill, {
    ...candidate,
    evidence: { ...evidence, current: { head: null, files: { ...evidence.current.files, "model/Lease.cfg": "INVARIANT AlwaysTrue" } } },
  }));
  failed("rehearsed", gradeGeneratedFormalSkill(skill, {
    ...candidate, evidence: { ...evidence, mutation: { ...evidence.mutation, after: evidence.mutation.mutated } },
  }));
  const syntaxOnly = { ...evidence.check, run: { ...evidence.check.run, command: "node --check src/lease.js" } };
  failed("no-false-proof", gradeGeneratedFormalSkill(skill, { ...candidate, evidence: { ...evidence, check: syntaxOnly } }));
});

test("F3 and F4 do not require Launch or call testing a proof", () => {
  const skill = read("evals/fixtures/formal-lease/generated/SKILL.md");
  assert.doesNotMatch(skill, /^## Launch/m);
  const fallback = read("evals/fixtures/formal-lease/fallback/SKILL.md");
  const testing = gradeGeneratedFormalSkill(fallback, creation());
  assert.equal(testing.ok, true, testing.checks.filter((item) => !item.ok).map((item) => item.id).join(","));
  failed(
    "no-false-proof",
    gradeGeneratedFormalSkill(fallback, { ...creation(), claimsFormalProof: true }),
  );
  failed(
    "no-launch",
    gradeGeneratedFormalSkill(skill, { ...creation(), hasLaunch: true, createdFeatureMap: true }),
  );
});

test("P1 upkeep does not weaken a promise, hide a bound, or edit product code", () => {
  const property = "Cardinality(holders) <= 1";
  assert.equal(
    gradeUpkeepDiscipline({
      originalProperty: property,
      reportedProperty: property,
      intentCited: false,
      boundReduction: false,
      boundReductionDisclosed: false,
      productDelta: [],
    }).ok,
    true,
  );
  failed(
    "promise-kept",
    gradeUpkeepDiscipline({
      originalProperty: property,
      reportedProperty: "Cardinality(holders) <= 2",
      intentCited: false,
      boundReduction: false,
      boundReductionDisclosed: false,
      productDelta: [],
    }),
  );
  failed(
    "bound-disclosed",
    gradeUpkeepDiscipline({
      originalProperty: property,
      reportedProperty: property,
      intentCited: true,
      boundReduction: true,
      boundReductionDisclosed: false,
      productDelta: [],
    }),
  );
  failed(
    "no-product-edit",
    gradeUpkeepDiscipline({
      originalProperty: property,
      reportedProperty: property,
      intentCited: true,
      boundReduction: false,
      boundReductionDisclosed: false,
      productDelta: ["src/lease.js"],
    }),
  );
});
