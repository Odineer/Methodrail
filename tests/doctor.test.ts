import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { defaultPluginDir, diagnoseInstall, formatDoctor } from "../src/doctor.js";

function fakeRepo(version = "1.2.3"): string {
  const root = mkdtempSync(join(tmpdir(), "methodrail-doctor-repo-"));
  mkdirSync(join(root, ".cursor-plugin"));
  writeFileSync(join(root, ".cursor-plugin", "plugin.json"), JSON.stringify({ name: "methodrail", version }));
  mkdirSync(join(root, "skills", "how"), { recursive: true });
  writeFileSync(join(root, "skills", "how", "SKILL.md"), "# how\n");
  mkdirSync(join(root, "rules"));
  writeFileSync(join(root, "rules", "methodrail.mdc"), "rule\n");
  mkdirSync(join(root, "node_modules", "dep"), { recursive: true });
  writeFileSync(join(root, "node_modules", "dep", "index.js"), "ignored\n");
  return root;
}

test("doctor reports missing when no plugin is installed", () => {
  const repo = fakeRepo();
  try {
    const report = diagnoseInstall(repo, join(repo, "not-there"));
    assert.equal(report.status, "missing");
    assert.match(formatDoctor(report), /ln -s/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("doctor reports linked when the plugin dir resolves to the checkout", () => {
  const repo = fakeRepo();
  const plugins = mkdtempSync(join(tmpdir(), "methodrail-doctor-plugins-"));
  try {
    const link = join(plugins, "methodrail");
    symlinkSync(repo, link);
    const report = diagnoseInstall(repo, link);
    assert.equal(report.status, "linked");
    assert.deepEqual(report.differing, []);
  } finally {
    rmSync(plugins, { recursive: true, force: true });
    rmSync(repo, { recursive: true, force: true });
  }
});

test("doctor distinguishes an identical copy from a stale copy", () => {
  const repo = fakeRepo();
  const copy = mkdtempSync(join(tmpdir(), "methodrail-doctor-copy-"));
  try {
    for (const tree of [".cursor-plugin", "skills", "rules"]) {
      cpSync(join(repo, tree), join(copy, tree), { recursive: true });
    }
    assert.equal(diagnoseInstall(repo, copy).status, "identical");

    writeFileSync(join(repo, "skills", "how", "SKILL.md"), "# how v2\n");
    mkdirSync(join(repo, "skills", "why"));
    writeFileSync(join(repo, "skills", "why", "SKILL.md"), "# why\n");
    writeFileSync(join(copy, "skills", "how", "stale-only.md"), "old\n");
    const stale = diagnoseInstall(repo, copy);
    assert.equal(stale.status, "stale");
    assert.deepEqual(stale.differing, ["skills/how/SKILL.md", "skills/how/stale-only.md", "skills/why/SKILL.md"]);
    assert.equal(stale.installedVersion, "1.2.3");
    assert.match(formatDoctor(stale), /3 shipped file\(s\) differ/);
  } finally {
    rmSync(copy, { recursive: true, force: true });
    rmSync(repo, { recursive: true, force: true });
  }
});

test("doctor flags a version-only mismatch as stale", () => {
  const repo = fakeRepo("2.0.0");
  const copy = mkdtempSync(join(tmpdir(), "methodrail-doctor-version-"));
  try {
    cpSync(join(repo, "skills"), join(copy, "skills"), { recursive: true });
    cpSync(join(repo, "rules"), join(copy, "rules"), { recursive: true });
    mkdirSync(join(copy, ".cursor-plugin"));
    writeFileSync(join(copy, ".cursor-plugin", "plugin.json"), JSON.stringify({ name: "methodrail", version: "1.9.9" }));
    const report = diagnoseInstall(repo, copy);
    assert.equal(report.status, "stale");
    assert.equal(report.installedVersion, "1.9.9");
    assert.equal(report.repoVersion, "2.0.0");
  } finally {
    rmSync(copy, { recursive: true, force: true });
    rmSync(repo, { recursive: true, force: true });
  }
});

test("defaultPluginDir honors METHODRAIL_PLUGIN_DIR", () => {
  assert.equal(defaultPluginDir({ METHODRAIL_PLUGIN_DIR: "/tmp/x" }), "/tmp/x");
  assert.match(defaultPluginDir({}), /\.cursor[\\/]plugins[\\/]local[\\/]methodrail$/);
});
