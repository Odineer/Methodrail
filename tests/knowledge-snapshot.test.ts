import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { snapshotKnowledge } from "../evals/runners/knowledge-snapshot.js";
import { repoKey as hookRepoKey } from "../scripts/hooks/session-ledger.mjs";
import { repoKey as parseRepoKey } from "../src/ledger/parse.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function assertSnapshotShape(snapshot: ReturnType<typeof snapshotKnowledge>): void {
  assert.equal(typeof snapshot.repo_key, "string");
  assert.match(snapshot.repo_key, /^.+-[0-9a-f]{12}$/);
  assert.ok(snapshot.git_head === null || /^[0-9a-f]{40}$/.test(snapshot.git_head));
  assert.match(snapshot.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof snapshot.notes_total, "number");
  assert.equal(typeof snapshot.by_kind, "object");
  assert.equal(typeof snapshot.by_lifecycle, "object");
  assert.deepEqual(Object.keys(snapshot.by_freshness).sort(), ["dependency-fresh", "review-required", "unknown"]);
  for (const key of ["malformed", "disputed", "retired", "indexed_in_project_md", "broken_pointers"] as const) {
    assert.equal(typeof snapshot[key], "number");
    assert.ok(snapshot[key] >= 0);
  }
}

test("knowledge-freshness fixture snapshots one indexed legacy note", () => {
  const fixture = join(root, "evals/fixtures/knowledge-freshness");
  const snapshot = snapshotKnowledge(fixture);
  assertSnapshotShape(snapshot);
  assert.equal(snapshot.repo_key, parseRepoKey(fixture));
  assert.equal(snapshot.git_head, null);
  assert.equal(snapshot.notes_total, 1);
  assert.deepEqual(snapshot.by_kind, {});
  assert.deepEqual(snapshot.by_lifecycle, {});
  assert.deepEqual(snapshot.by_freshness, {
    "dependency-fresh": 0,
    "review-required": 0,
    unknown: 1,
  });
  assert.equal(snapshot.malformed, 0);
  assert.equal(snapshot.disputed, 0);
  assert.equal(snapshot.retired, 0);
  assert.equal(snapshot.indexed_in_project_md, 1);
  assert.equal(snapshot.broken_pointers, 0);
});

test("tests/fixtures/repository snapshots the initialized expected harness with no notes", () => {
  const fixture = join(root, "tests/fixtures/repository");
  const snapshot = snapshotKnowledge(fixture);
  assertSnapshotShape(snapshot);
  assert.equal(snapshot.repo_key, parseRepoKey(fixture));
  assert.equal(snapshot.git_head, null);
  assert.equal(snapshot.notes_total, 0);
  assert.deepEqual(snapshot.by_kind, {});
  assert.deepEqual(snapshot.by_lifecycle, {});
  assert.deepEqual(snapshot.by_freshness, {
    "dependency-fresh": 0,
    "review-required": 0,
    unknown: 0,
  });
  assert.equal(snapshot.malformed, 0);
  assert.equal(snapshot.disputed, 0);
  assert.equal(snapshot.retired, 0);
  assert.equal(snapshot.indexed_in_project_md, 0);
  assert.equal(snapshot.broken_pointers, 0);
});

test("hook and parser repoKey match for the same directory", () => {
  const dir = mkdtempSync(join(tmpdir(), "methodrail-repokey-"));
  try {
    assert.equal(hookRepoKey(dir), parseRepoKey(dir));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("git_head is the repository HEAD when repoRoot is a git toplevel", () => {
  const dir = mkdtempSync(join(tmpdir(), "methodrail-snapshot-git-"));
  try {
    mkdirSync(join(dir, ".methodrail", "knowledge"), { recursive: true });
    writeFileSync(join(dir, ".methodrail", "PROJECT.md"), "# Project\n\n## Knowledge index\n\n");
    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "eval@example.com"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["config", "user.name", "Eval"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "init"], { cwd: dir, stdio: "ignore" });
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
    const snapshot = snapshotKnowledge(dir);
    assert.equal(snapshot.git_head, sha);
    assert.equal(snapshot.notes_total, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI writes snapshot JSON to --out", () => {
  const outDir = mkdtempSync(join(tmpdir(), "methodrail-snapshot-out-"));
  const out = join(outDir, "snap.json");
  try {
    const fixture = join(root, "evals/fixtures/knowledge-freshness");
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", "evals/runners/knowledge-snapshot.ts", fixture, "--out", out],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    const written = JSON.parse(readFileSync(out, "utf8")) as ReturnType<typeof snapshotKnowledge>;
    assert.equal(written.notes_total, 1);
    assert.equal(written.indexed_in_project_md, 1);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
});
