import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parse as parseYaml } from "yaml";
import { inspectHarnessBinding } from "../src/harness.js";
import { evaluateFreshness } from "../src/knowledge/freshness.js";
import { loadKnowledgeNotes, loadProjectMd } from "../src/knowledge/load.js";
import { evaluateProjectKnowledge } from "../src/knowledge/report.js";
import { parseLinkedHarnessManifest } from "../skills/methodrail-init/scripts/harness-manifest.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const script = join(root, "skills/methodrail-init/scripts/linked-harness.mjs");

function git(repository: string, args: string[]): string {
  return execFileSync("git", args, { cwd: repository, encoding: "utf8" }).trim();
}

function fixture(): { base: string; repository: string; storage: string; revision: string } {
  const base = mkdtempSync(join(tmpdir(), "methodrail-linked-harness-"));
  const repository = join(base, "my-app");
  const storage = join(base, "my-app-methodrail");
  mkdirSync(join(repository, "src"), { recursive: true });
  writeFileSync(join(repository, "src", "app.js"), "module.exports = { version: 1 };\n");
  git(repository, ["init"]);
  git(repository, ["config", "user.email", "eval@example.com"]);
  git(repository, ["config", "user.name", "Methodrail Eval"]);
  git(repository, ["add", "."]);
  git(repository, ["-c", "commit.gpgsign=false", "commit", "-m", "base"]);
  return { base, repository, storage, revision: git(repository, ["rev-parse", "HEAD"]) };
}

function create(repository: string, storage: string): Record<string, string> {
  return JSON.parse(
    execFileSync("node", [script, "create", "--repo", repository, "--storage", storage], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }),
  ) as Record<string, string>;
}

function typedNote(revision: string): string {
  return `---
kind: invariant
status: verified
validated_at: ${revision}
relevant_paths:
  - src/app.js
---

# Application version boundary

## Claim

Application version behavior is owned by the exported source module.

## Evidence

- The committed source module exports the current application version.

## Reuse guidance

Read this before changing application version behavior.

## Refresh triggers

- The application source module changes.
`;
}

test("linked external harness remains repository-addressable and out of Git status", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));

  const created = create(item.repository, item.storage);
  assert.equal(lstatSync(join(item.repository, ".methodrail")).isSymbolicLink(), true);
  assert.match(readFileSync(created.manifestPath!, "utf8"), /placement: linked-external/);
  assert.match(readFileSync(created.exclude!, "utf8"), /^\/\.methodrail$/m);
  assert.equal(git(item.repository, ["status", "--short"]), "");

  const binding = inspectHarnessBinding(item.repository);
  assert.deepEqual(binding.diagnostics, []);
  assert.equal(binding.binding?.placement, "linked-external");
  assert.equal(binding.binding?.storageHarnessRoot, created.storageHarnessRoot);

  mkdirSync(join(item.repository, ".methodrail", "knowledge"), { recursive: true });
  writeFileSync(
    join(item.repository, ".methodrail", "PROJECT.md"),
    "# Project\n\n## Knowledge index\n\n- [application version](knowledge/app.md) — source ownership\n",
  );
  writeFileSync(join(item.repository, ".methodrail", "knowledge", "app.md"), typedNote(item.revision));
  assert.match(loadProjectMd(item.repository) ?? "", /Knowledge index/);
  const report = evaluateProjectKnowledge(item.repository);
  assert.equal(report.errors.length, 0, report.errors.map((entry) => entry.message).join("\n"));
  const note = loadKnowledgeNotes(item.repository)[0];
  assert.ok(note);
  assert.equal(note.frontmatter?.lifecycle, "active");
  assert.equal(note.frontmatter?.scope, undefined);
  assert.equal(evaluateFreshness(note, item.repository).state, "fresh");

  const manifestBefore = readFileSync(created.manifestPath!, "utf8");
  const excludeBefore = readFileSync(created.exclude!, "utf8");
  execFileSync("node", [script, "create", "--repo", item.repository], { encoding: "utf8" });
  assert.equal(readFileSync(created.manifestPath!, "utf8"), manifestBefore);
  assert.equal(readFileSync(created.exclude!, "utf8"), excludeBefore);

  writeFileSync(join(item.repository, "src", "app.js"), "module.exports = { version: 2 };\n");
  assert.equal(evaluateFreshness(note, item.repository).state, "review-required");
  assert.doesNotMatch(git(item.repository, ["status", "--short"]), /\.methodrail/);
});

test("linked harness validation fails when the local Git exclusion is removed", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));
  const created = create(item.repository, item.storage);
  writeFileSync(created.exclude!, "");
  const binding = inspectHarnessBinding(item.repository);
  assert.equal(binding.binding, undefined);
  assert.ok(binding.diagnostics.some((entry) => /local exclude/i.test(entry.message)));
});

test("linked harness inspect accepts a Git worktree that shares the common exclude file", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));
  const worktree = join(item.base, "wt");
  git(item.repository, ["worktree", "add", "--detach", worktree]);
  const storage = join(item.base, "wt-methodrail");
  create(worktree, storage);
  const binding = inspectHarnessBinding(worktree);
  assert.deepEqual(binding.diagnostics, [], binding.diagnostics.map((entry) => entry.message).join("\n"));
  assert.equal(binding.binding?.placement, "linked-external");
});

test("invalid linked storage does not return notes from the target", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));
  const storage = join(item.base, "foreign-methodrail", ".methodrail");
  mkdirSync(join(storage, "knowledge"), { recursive: true });
  writeFileSync(join(storage, "PROJECT.md"), "# Foreign\n\n- [foreign](knowledge/foreign.md)\n");
  writeFileSync(
    join(storage, "knowledge", "foreign.md"),
    typedNote(item.revision).replace("Application version boundary", "Foreign claim"),
  );
  symlinkSync(storage, join(item.repository, ".methodrail"));
  const report = evaluateProjectKnowledge(item.repository);
  assert.ok(report.errors.some((entry) => /HARNESS.yaml/i.test(entry.message)));
  assert.equal(report.notes.length, 0);
});

test("linked harness fails closed when its manifest names another repository", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));
  const created = create(item.repository, item.storage);
  const other = join(item.base, "other-app");
  mkdirSync(other);
  writeFileSync(
    created.manifestPath!,
    "schema_version: 1\nplacement: linked-external\nrepository:\n  path: \"../../other-app\"\n",
  );
  const binding = inspectHarnessBinding(item.repository);
  assert.equal(binding.binding, undefined);
  assert.ok(binding.diagnostics.some((entry) => /different repository/i.test(entry.message)));
  const report = evaluateProjectKnowledge(item.repository);
  assert.ok(report.errors.some((entry) => /different repository/i.test(entry.message)));
  assert.equal(report.notes.length, 0);
});

test("an unrelated sibling harness is never discovered without the repository link", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));
  mkdirSync(join(item.storage, ".methodrail"), { recursive: true });
  writeFileSync(join(item.storage, ".methodrail", "PROJECT.md"), "# Wrong project\n");
  assert.equal(loadProjectMd(item.repository), null);
  assert.equal(inspectHarnessBinding(item.repository).binding, undefined);
});

test("linked external creation refuses storage inside the repository", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));
  assert.throws(
    () => create(item.repository, join(item.repository, "private-methodrail")),
    /outside the repository/i,
  );
});

test("linked external creation refuses a storage .methodrail symlink into the repository", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));
  const escaped = join(item.repository, "escaped-harness");
  mkdirSync(escaped);
  mkdirSync(item.storage);
  symlinkSync(escaped, join(item.storage, ".methodrail"));
  assert.throws(() => create(item.repository, item.storage), /outside the repository/i);
  assert.equal(existsSync(join(escaped, "HARNESS.yaml")), false);
  assert.equal(existsSync(join(item.repository, ".methodrail")), false);
});

test("failed private harness setup does not leave a Git-visible .methodrail link", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));
  writeFileSync(join(item.repository, ".gitignore"), "!.methodrail\n");
  git(item.repository, ["add", ".gitignore"]);
  git(item.repository, ["-c", "commit.gpgsign=false", "commit", "-m", "unignore methodrail"]);
  assert.throws(() => create(item.repository, item.storage), /ignore/i);
  assert.equal(existsSync(join(item.repository, ".methodrail")), false);
  assert.equal(existsSync(join(item.storage, ".methodrail")), false);
  assert.equal(git(item.repository, ["status", "--short"]), "");
});

const MANIFESTS = {
  scriptForm: `schema_version: 1
placement: linked-external
repository:
  path: "../../my-app"
`,
  decoyPath: `notes:
  path: "../../wrong-app"
schema_version: 1
placement: linked-external
repository:
  path: "../../my-app"
`,
  comment: `schema_version: 1 # comment
placement: linked-external
repository:
  path: "../../my-app"
`,
  floatVersion: `schema_version: 1.0
placement: linked-external
repository:
  path: "../../my-app"
`,
};

test("linked harness ignored only through .gitignore is not sufficient", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));
  const created = create(item.repository, item.storage);
  writeFileSync(created.exclude!, "");
  writeFileSync(join(item.repository, ".gitignore"), "/.methodrail\n");
  const binding = inspectHarnessBinding(item.repository);
  assert.equal(binding.binding, undefined);
  assert.ok(
    binding.diagnostics.some((entry) => /info\/exclude/i.test(entry.message) && /gitignore/i.test(entry.message)),
    binding.diagnostics.map((entry) => entry.message).join("\n"),
  );
});

test("duplicate HARNESS.yaml mapping keys are rejected", () => {
  assert.throws(
    () =>
      parseLinkedHarnessManifest(`schema_version: 1
placement: linked-external
repository:
  path: "../../my-app"
repository:
  path: "../../other-app"
`),
    /Duplicate YAML key 'repository'/,
  );
  assert.throws(
    () =>
      parseLinkedHarnessManifest(`schema_version: 1
placement: linked-external
repository:
  path: "../../my-app"
  path: "../../other-app"
`),
    /Duplicate YAML key 'path'/,
  );
});

test("create and inspect share one parser that reads repository.path", () => {
  for (const [name, source] of Object.entries(MANIFESTS)) {
    const yamlValue = parseYaml(source) as { schema_version: unknown; repository?: { path?: unknown } };
    const parsed = parseLinkedHarnessManifest(source);
    assert.equal(yamlValue.schema_version, 1, name);
    assert.equal(parsed.repositoryPath, yamlValue.repository?.path, name);
  }
});

test("a decoy path key does not rebind create or inspect", (t) => {
  const item = fixture();
  t.after(() => rmSync(item.base, { recursive: true, force: true }));
  const created = create(item.repository, item.storage);
  mkdirSync(join(item.base, "wrong-app"));
  writeFileSync(
    created.manifestPath!,
    `notes:
  path: "../../wrong-app"
schema_version: 1
placement: linked-external
repository:
  path: "../../my-app"
`,
  );

  const binding = inspectHarnessBinding(item.repository);
  assert.deepEqual(binding.diagnostics, []);
  assert.equal(binding.binding?.placement, "linked-external");
  assert.equal(binding.binding?.storageHarnessRoot, created.storageHarnessRoot);

  execFileSync("node", [script, "create", "--repo", item.repository], { encoding: "utf8" });
  const after = inspectHarnessBinding(item.repository);
  assert.deepEqual(after.diagnostics, []);
  assert.equal(after.binding?.storageHarnessRoot, created.storageHarnessRoot);
});
