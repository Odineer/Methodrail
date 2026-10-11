import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { compareScores } from "../src/eval/compare.js";
import { loadExpectationFile, loadRunFile } from "../src/eval/load.js";
import { scoreRun } from "../src/eval/score.js";
import type { CommandLogEntry, EvalContext } from "../src/eval/types.js";
import { gradeMaintenanceCase, type MaintenanceCase } from "../src/composition/grade-maintenance-trace.js";
import { classifyCommands } from "../src/ledger/to-run.js";
import type { LedgerEvent } from "../src/ledger/types.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ctx: EvalContext = { repoRoot: root };

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

function commandLog(path: string): CommandLogEntry[] {
  const parsed: unknown = JSON.parse(read(path));
  return Array.isArray(parsed) ? (parsed as CommandLogEntry[]) : [];
}

function grade(kind: string, answer: string, log: CommandLogEntry[], overlayDir?: string) {
  const fixtureDir = join(root, "evals/fixtures", kind);
  const caseInput: MaintenanceCase = { fixtureDir, answer, commandLog: log };
  if (overlayDir) caseInput.overlayDir = overlayDir;
  const result = gradeMaintenanceCase(kind, fixtureDir, caseInput);
  return result;
}

function failures(kind: string, answer: string, log: CommandLogEntry[], overlayDir?: string): string {
  return grade(kind, answer, log, overlayDir).failures.join("\n");
}

function shellEvent(command: string, exit_code: number): LedgerEvent {
  return {
    v: 1,
    ts: "2026-01-01T00:00:00.000Z",
    conversation_id: "c",
    workspace_root: "/w",
    event: "tool",
    tool_name: "Shell",
    command,
    exit_code,
  };
}

function writeEvent(path: string): LedgerEvent {
  return {
    v: 1,
    ts: "2026-01-01T00:00:00.000Z",
    conversation_id: "c",
    workspace_root: "/w",
    event: "tool",
    tool_name: "Write",
    path,
  };
}

test("constructed maintenance pairs pass as specification and do not claim empirical help", () => {
  for (const id of ["maintenance-audit", "maintenance-repair", "maintenance-verification"] as const) {
    const expected = loadExpectationFile(join(root, "evals/fixtures", id, "expected.yaml"));
    const baseline = scoreRun(loadRunFile(join(root, "evals/runners/examples", `${id}.baseline.json`)), expected, ctx);
    const methodrail = scoreRun(loadRunFile(join(root, "evals/runners/examples", `${id}.methodrail.json`)), expected, ctx);
    assert.equal(baseline.outcome.incomplete, false, `${id} baseline incomplete: ${baseline.outcome.failures.join("; ")}`);
    assert.equal(methodrail.outcome.incomplete, false, `${id} methodrail incomplete: ${methodrail.outcome.failures.join("; ")}`);
    assert.equal(methodrail.outcome.passed, true, `${id} methodrail: ${methodrail.outcome.failures.join("; ")}`);
    assert.equal(baseline.outcome.passed, false, `${id} baseline unexpectedly passed`);
    const comparison = compareScores(baseline, methodrail);
    assert.equal(comparison.kind, "specification", id);
    assert.equal(comparison.specification, "passed", id);
    assert.equal(comparison.empirical, undefined, id);
    assert.equal(comparison.methodrail_helped, null, id);
  }
});

test("audit mutations reject edits, speculative rewrites, and duplicate repairs", () => {
  const answer = read("evals/runners/artifacts/maintenance-audit/methodrail/answer.md");
  const log = commandLog("evals/runners/artifacts/maintenance-audit/methodrail/command.log.json");
  assert.equal(grade("maintenance-audit", answer, log).passed, true);

  const edited = failures(
    "maintenance-audit",
    answer,
    log,
    join(root, "evals/runners/artifacts/maintenance-audit/baseline/overlay"),
  );
  assert.match(edited, /audit-edited/);

  const deletion = mkdtempSync(join(tmpdir(), "maint-delete-"));
  try {
    writeFileSync(join(deletion, ".methodrail-overlay.json"), JSON.stringify({ deletions: ["src/quiet/format.js"] }));
    assert.match(failures("maintenance-audit", answer, log, deletion), /audit-edited/);
  } finally {
    rmSync(deletion, { recursive: true, force: true });
  }

  const speculative = answer
    .replace("disposition: rejected\n      reason: speculative", "disposition: confirmed\n      reason: speculative")
    .replace("ranking: [T1, V1, A1]", "ranking: [T1, V1, A1, A3]");
  assert.match(failures("maintenance-audit", speculative, log), /unjustified-rewrite/);

  const duplicates = answer.replace("ranking: [T1, V1, A1]", "ranking: [T1, T2, V1, A1]").replace(
    "    - id: A1",
    `    - id: T2
      lane: tooling
      target: .github/workflows/ci.yml
      disposition: confirmed
      cause: broken-canonical-command
      failure_class: harness-defect
      evidence: [.github/workflows/ci.yml]
    - id: A1`,
  );
  assert.match(failures("maintenance-audit", duplicates, log), /duplicate-ranked/);

  const skill = mkdtempSync(join(tmpdir(), "maint-skill-"));
  try {
    mkdirSync(join(skill, "skills/verify-shop"), { recursive: true });
    writeFileSync(join(skill, "skills/verify-shop/SKILL.md"), "# generated\n");
    assert.match(failures("maintenance-audit", answer, log, skill), /generated-verify-skill/);
  } finally {
    rmSync(skill, { recursive: true, force: true });
  }

  assert.equal(grade("maintenance-audit", answer, []).incomplete, true);

  const restored = [
    ...log,
    { command: "edit src/quiet/format.js", phase: "edit" as const, exit_status: 0 },
    { command: "git checkout -- src/quiet/format.js", phase: "other" as const, exit_status: 0 },
  ];
  const restoredResult = failures("maintenance-audit", answer, restored);
  assert.match(restoredResult, /audit-mutated/);
  assert.doesNotMatch(restoredResult, /audit-edited/);

  const nativeAudit = classifyCommands([
    shellEvent("npm test", 1),
    shellEvent("node scripts/tests.mjs", 0),
    shellEvent("node scripts/drive.mjs checkout", 1),
    shellEvent("node scripts/drive.mjs --flow checkout", 0),
    writeEvent("src/quiet/format.js"),
    writeEvent("src/quiet/format.js"),
  ]);
  assert.deepEqual(
    nativeAudit.map((entry) => entry.phase),
    ["repro", "repro", "repro", "repro", "edit", "edit"],
  );
  const nativeAuditResult = failures("maintenance-audit", answer, nativeAudit);
  assert.match(nativeAuditResult, /audit-mutated/);
  assert.equal(grade("maintenance-audit", answer, nativeAudit).passed, false);
});

test("repair mutations keep user work, reject stale authority, and reject a dirty rerun", () => {
  const answer = read("evals/runners/artifacts/maintenance-repair/methodrail/answer.md");
  const log = commandLog("evals/runners/artifacts/maintenance-repair/methodrail/command.log.json");
  const overlay = join(root, "evals/runners/artifacts/maintenance-repair/methodrail/overlay");
  assert.equal(grade("maintenance-repair", answer, log, overlay).passed, true, failures("maintenance-repair", answer, log, overlay));

  assert.match(
    failures("maintenance-repair", answer, log, join(root, "evals/runners/artifacts/maintenance-repair/baseline/overlay")),
    /unselected-edit/,
  );

  const skill = mkdtempSync(join(tmpdir(), "maint-repair-skill-"));
  try {
    cpSync(overlay, skill, { recursive: true });
    mkdirSync(join(skill, "skills/verify-shop"), { recursive: true });
    writeFileSync(join(skill, "skills/verify-shop/SKILL.md"), "# generated\n");
    assert.match(failures("maintenance-repair", answer, log, skill), /generated-verify-skill/);
  } finally {
    rmSync(skill, { recursive: true, force: true });
  }

  const stale = answer.replace("evidence_current: true", "evidence_current: false");
  assert.match(failures("maintenance-repair", stale, log, overlay), /stale-evidence/);

  const lateEdit = [...log, { command: "edit notes/USER_WIP.md", phase: "edit", exit_status: 0 }];
  assert.match(failures("maintenance-repair", answer, lateEdit, overlay), /verification-then-edit/);

  const ledgerLog: CommandLogEntry[] = [
    { command: "npm test", phase: "repro", exit_status: 1, stderr: "Cannot find module scripts/run-tests.mjs" },
    { command: "npm test", phase: "regression", exit_status: 0, stdout: "product ok" },
    { command: "node scripts/tests.mjs", phase: "verify", exit_status: 0, stdout: "product ok" },
  ];
  assert.equal(
    grade("maintenance-repair", answer, ledgerLog, overlay).passed,
    true,
    failures("maintenance-repair", answer, ledgerLog, overlay),
  );

  const failedFinal = [
    ...log,
    { command: "edit package.json", phase: "edit" as const, exit_status: 0 },
    { command: "npm test", phase: "verify" as const, exit_status: 1 },
  ];
  assert.match(failures("maintenance-repair", answer, failedFinal, overlay), /verification-then-edit/);

  const nativeSecondEdit = classifyCommands([
    shellEvent("npm test", 1),
    writeEvent("package.json"),
    shellEvent("npm test", 0),
    shellEvent("node scripts/tests.mjs", 0),
    writeEvent("package.json"),
  ]);
  assert.equal(nativeSecondEdit.at(-1)?.phase, "edit");
  assert.match(failures("maintenance-repair", answer, nativeSecondEdit, overlay), /verification-then-edit/);

  const rerunAnswer = answer.replace("mode: repair", "mode: repaired-rerun");
  const rerunLog: CommandLogEntry[] = [{ command: "npm test", phase: "verify", exit_status: 0, stdout: "product ok" }];
  assert.equal(grade("maintenance-repair", rerunAnswer, rerunLog, overlay).passed, true);

  const dirty = mkdtempSync(join(tmpdir(), "maint-rerun-"));
  try {
    cpSync(overlay, dirty, { recursive: true });
    mkdirSync(join(dirty, "src/quiet"), { recursive: true });
    writeFileSync(join(dirty, "src/quiet/format.js"), "export function formatCents() { return ''; }\n");
    assert.match(failures("maintenance-repair", rerunAnswer, rerunLog, dirty), /rerun-extra-edit/);
  } finally {
    rmSync(dirty, { recursive: true, force: true });
  }

  const extraField = mkdtempSync(join(tmpdir(), "maint-rerun-pkg-"));
  try {
    cpSync(overlay, extraField, { recursive: true });
    const packagePath = join(extraField, "package.json");
    const parsed: unknown = JSON.parse(readFileSync(packagePath, "utf8"));
    const record = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
    record.unrelated = true;
    writeFileSync(packagePath, `${JSON.stringify(record, null, 2)}\n`);
    assert.match(failures("maintenance-repair", rerunAnswer, rerunLog, extraField), /rerun-extra-edit/);
  } finally {
    rmSync(extraField, { recursive: true, force: true });
  }
});

test("verification mutations preserve the oracle, dependents, inspect, and blocked coverage", () => {
  const answer = read("evals/runners/artifacts/maintenance-verification/methodrail/answer.md");
  const log = commandLog("evals/runners/artifacts/maintenance-verification/methodrail/command.log.json");
  const overlay = join(root, "evals/runners/artifacts/maintenance-verification/methodrail/overlay");
  assert.equal(
    grade("maintenance-verification", answer, log, overlay).passed,
    true,
    failures("maintenance-verification", answer, log, overlay),
  );

  assert.match(
    failures(
      "maintenance-verification",
      read("evals/runners/artifacts/maintenance-verification/baseline/answer.md"),
      commandLog("evals/runners/artifacts/maintenance-verification/baseline/command.log.json"),
      join(root, "evals/runners/artifacts/maintenance-verification/baseline/overlay"),
    ),
    /oracle-weakened/,
  );

  const skipped = log.filter((entry) => !entry.command.includes("refund") || entry.phase !== "verify");
  assert.match(failures("maintenance-verification", answer, skipped, overlay), /missing-dependent/);

  const lateEdit = [...log, { command: "edit features/refund.md", phase: "edit", exit_status: 0 }];
  assert.match(failures("maintenance-verification", answer, lateEdit, overlay), /verification-then-edit/);

  const inspectAnswer = `Inspect only.

\`\`\`yaml
maintenance_report:
  mode: repair
  action: inspect
  coverage: task-scoped
  outcome: findings
  product_defects:
    - target: src/refund.js
  proposals:
    - scripts/drive.mjs
    - features/checkout.md
\`\`\`
`;
  const inspectLog: CommandLogEntry[] = [{ command: "node scripts/product-oracle.mjs", phase: "repro", exit_status: 1 }];
  assert.equal(grade("maintenance-verification", inspectAnswer, inspectLog).passed, true, failures("maintenance-verification", inspectAnswer, inspectLog));

  const wrote = mkdtempSync(join(tmpdir(), "maint-inspect-"));
  try {
    mkdirSync(join(wrote, "features"), { recursive: true });
    writeFileSync(join(wrote, "features/checkout.md"), "# Checkout\n\nDrive: `node scripts/drive.mjs --flow checkout`\n");
    assert.match(failures("maintenance-verification", inspectAnswer, inspectLog, wrote), /inspect-wrote/);
  } finally {
    rmSync(wrote, { recursive: true, force: true });
  }

  const reportedChanged = inspectAnswer.replace("outcome: findings", "outcome: changed");
  assert.match(failures("maintenance-verification", reportedChanged, inspectLog), /inspect-reported-changed/);

  const blocked = `Blocked.

\`\`\`yaml
maintenance_report:
  mode: repair
  action: inspect
  coverage: full-audit
  outcome: blocked
  blocked_prerequisite: tools/export-bin
  narrower_evidence: [checkout, refund]
  product_defects:
    - target: src/refund.js
\`\`\`
`;
  const blockedLog: CommandLogEntry[] = [
    { command: "node scripts/drive.mjs --flow checkout", phase: "repro", exit_status: 1 },
    { command: "node scripts/drive.mjs --flow refund", phase: "repro", exit_status: 1 },
  ];
  assert.equal(grade("maintenance-verification", blocked, blockedLog).passed, true, failures("maintenance-verification", blocked, blockedLog));

  const restoredInspect = [
    ...inspectLog,
    { command: "edit features/checkout.md", phase: "edit" as const, exit_status: 0 },
    { command: "restore features/checkout.md", phase: "edit" as const, exit_status: 0 },
  ];
  assert.match(failures("maintenance-verification", inspectAnswer, restoredInspect), /inspect-wrote/);

  const restoredBlocked = [
    ...blockedLog,
    { command: "edit features/checkout.md", phase: "edit" as const, exit_status: 0 },
    { command: "git checkout -- features/checkout.md", phase: "other" as const, exit_status: 0 },
  ];
  assert.match(failures("maintenance-verification", blocked, restoredBlocked), /inspect-wrote/);

  const blockedApply = blocked.replace("action: inspect", "action: apply");
  const bypass = mkdtempSync(join(tmpdir(), "maint-blocked-"));
  try {
    mkdirSync(join(bypass, "docs"), { recursive: true });
    mkdirSync(join(bypass, "skills/verify-shop"), { recursive: true });
    writeFileSync(join(bypass, "docs/glossary.md"), "# glossary\n");
    writeFileSync(join(bypass, "skills/verify-shop/SKILL.md"), "# generated\n");
    const bypassResult = failures("maintenance-verification", blockedApply, inspectLog, bypass);
    assert.match(bypassResult, /generated-verify-skill/);
    assert.match(bypassResult, /unowned-edit/);
    assert.match(bypassResult, /missing-drive-evidence/);
  } finally {
    rmSync(bypass, { recursive: true, force: true });
  }

  const ledgerLog: CommandLogEntry[] = [
    { command: "node scripts/drive.mjs checkout", phase: "repro", exit_status: 1 },
    { command: "node scripts/drive.mjs --flow refund", phase: "repro", exit_status: 1 },
    { command: "node scripts/product-oracle.mjs", phase: "repro", exit_status: 1 },
    { command: "node scripts/drive.mjs --flow checkout", phase: "regression", exit_status: 0, stdout: "checkout ok" },
    { command: "node scripts/drive.mjs --flow refund", phase: "verify", exit_status: 0, stdout: "refund ok" },
    { command: "node scripts/product-oracle.mjs", phase: "verify", exit_status: 1 },
  ];
  assert.equal(
    grade("maintenance-verification", answer, ledgerLog, overlay).passed,
    true,
    failures("maintenance-verification", answer, ledgerLog, overlay),
  );

  const masked = [
    ...log,
    { command: "node scripts/drive.mjs --flow checkout", phase: "verify" as const, exit_status: 1 },
    { command: "node scripts/drive.mjs --flow refund", phase: "verify" as const, exit_status: 0 },
  ];
  assert.match(failures("maintenance-verification", answer, masked, overlay), /missing-dependent:checkout/);

  const falseClean = blocked.replace("outcome: blocked", "outcome: clean").replace("narrower_evidence: [checkout, refund]", "project_clean: true\n  narrower_evidence: []");
  const cleanResult = failures("maintenance-verification", falseClean, inspectLog);
  assert.match(cleanResult, /false-clean/);
  assert.match(cleanResult, /blocked-prerequisite/);
});
