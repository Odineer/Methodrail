import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { discoverProjectArtifacts, previewWrites } from "../src/artifacts.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function write(dir: string, rel: string, body: string): void {
  const path = join(dir, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function formalSkill(name: string): string {
  return `---
name: ${name}
description: Check the lease invariant.
when_to_use: When lease holders change.
---

Verification method: formal

## Properties

A protected use cannot proceed for two valid holders.

## Covered code

src/lease.js

## Run

node --check src/lease.js
`;
}

test("formal skills are recognized in all four native roots without Launch", () => {
  const dir = tempDir("methodrail-formal-roots-");
  try {
    const roots = [
      ".agents/skills/lease-check/SKILL.md",
      ".cursor/skills/lease-mutex/SKILL.md",
      ".claude/skills/lease-proof/SKILL.md",
      ".zcode/skills/lease-model/SKILL.md",
    ];
    for (const rel of roots) write(dir, rel, formalSkill(rel.split("/")[2] ?? "lease"));
    const report = discoverProjectArtifacts(dir);
    for (const rel of roots) {
      assert.equal(
        report.artifacts.find((item) => item.path === rel)?.role,
        "formal-verification-skill",
        rel,
      );
    }
    assert.equal(report.artifacts.some((item) => item.role === "verification-skill"), false);
    assert.equal(report.conflicts.length, 0);
    assert.equal(
      report.preview.some((item) => item.op === "unavailable" && item.path === "project-local verification"),
      false,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("app and formal procedures coexist, and prose or property testing is not formal", () => {
  const dir = tempDir("methodrail-formal-coexist-");
  try {
    write(
      dir,
      ".agents/skills/verify-shop/SKILL.md",
      "---\nname: verify-shop\ndescription: Drive the shop.\n---\n\n# Shop\n\n## Launch\n\n`npm start`\n",
    );
    write(dir, ".agents/skills/lease-check/SKILL.md", formalSkill("lease-check"));
    write(
      dir,
      ".agents/skills/lease-notes/SKILL.md",
      "---\nname: lease-notes\ndescription: Notes.\n---\n\nTLA+ and formal verification are mentioned here.\n",
    );
    write(
      dir,
      ".agents/skills/lease-props/SKILL.md",
      formalSkill("lease-props").replace("Verification method: formal", "Verification method: property-testing"),
    );
    write(
      dir,
      "evals/fixtures/decoy/.agents/skills/lease-decoy/SKILL.md",
      formalSkill("lease-decoy"),
    );
    const report = discoverProjectArtifacts(dir);
    assert.ok(report.artifacts.some((item) => item.role === "verification-skill"));
    assert.ok(report.artifacts.some((item) => item.path === ".agents/skills/lease-check/SKILL.md" && item.role === "formal-verification-skill"));
    assert.equal(
      report.artifacts.find((item) => item.path === ".agents/skills/lease-notes/SKILL.md")?.role,
      "host-instruction",
    );
    assert.equal(
      report.artifacts.find((item) => item.path === ".agents/skills/lease-props/SKILL.md")?.role,
      "host-instruction",
    );
    assert.equal(report.artifacts.some((item) => item.path.includes("lease-decoy")), false);
    assert.equal(report.conflicts.length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("pointer adoption is idempotent and leaves formal skill bytes unchanged", () => {
  const dir = tempDir("methodrail-formal-pointer-");
  const rel = ".agents/skills/lease-check/SKILL.md";
  try {
    const body = formalSkill("lease-check");
    write(dir, rel, body);
    write(dir, ".methodrail/PROJECT.md", "# Project\n\nLease library.\n");
    const first = discoverProjectArtifacts(dir);
    assert.equal(first.preview.find((item) => item.path === rel)?.op, "adopt");
    const project = join(dir, ".methodrail/PROJECT.md");
    writeFileSync(project, `${readFileSync(project, "utf8")}\n- [lease](../${rel})\n`);
    const second = discoverProjectArtifacts(dir);
    assert.equal(second.preview.find((item) => item.path === rel)?.op, "unchanged");
    assert.equal(readFileSync(join(dir, rel), "utf8"), body);
    assert.equal(previewWrites(second).some((item) => item.path === rel), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a linked-external formal procedure stays control and a broken harness writes nothing", () => {
  const broken = tempDir("methodrail-formal-broken-");
  try {
    write(broken, ".agents/skills/lease-check/SKILL.md", formalSkill("lease-check"));
    symlinkSync(join(broken, "missing-harness"), join(broken, ".methodrail"));
    const report = discoverProjectArtifacts(broken);
    assert.ok(report.artifacts.some((item) => item.role === "formal-verification-skill"));
    assert.equal(previewWrites(report).length, 0);
  } finally {
    rmSync(broken, { recursive: true, force: true });
  }

  const base = tempDir("methodrail-formal-linked-");
  const repository = join(base, "my-app");
  const storage = join(base, "my-app-methodrail");
  try {
    write(repository, "src/lease.js", "export const holders = []\n");
    execFileSync("git", ["init"], { cwd: repository, encoding: "utf8" });
    execFileSync("git", ["config", "user.email", "eval@example.com"], { cwd: repository, encoding: "utf8" });
    execFileSync("git", ["config", "user.name", "Methodrail Eval"], { cwd: repository, encoding: "utf8" });
    execFileSync("git", ["add", "."], { cwd: repository, encoding: "utf8" });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "base"], { cwd: repository, encoding: "utf8" });
    execFileSync(
      "node",
      [join(root, "skills/methodrail-init/scripts/linked-harness.mjs"), "create", "--repo", repository, "--storage", storage],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    const body = formalSkill("verify-lease-formal");
    write(repository, ".methodrail/control/verify-lease-formal/SKILL.md", body);
    write(repository, ".methodrail/PROJECT.md", "# Project\n\nLease library.\n");
    const before = readFileSync(join(repository, ".methodrail/control/verify-lease-formal/SKILL.md"), "utf8");
    const report = discoverProjectArtifacts(repository);
    assert.equal(
      report.artifacts.find((item) => item.path === ".methodrail/control/verify-lease-formal/SKILL.md")?.role,
      "control",
    );
    assert.equal(report.artifacts.some((item) => item.role === "formal-verification-skill"), false);
    assert.equal(readFileSync(join(repository, ".methodrail/control/verify-lease-formal/SKILL.md"), "utf8"), before);
    const status = execFileSync("git", ["status", "--short"], { cwd: repository, encoding: "utf8" }).trim();
    assert.equal(status, "");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
