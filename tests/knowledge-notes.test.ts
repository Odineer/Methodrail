import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { evaluateKnowledgeEligibility } from "../src/knowledge/eligibility.js";
import { evaluateFreshness } from "../src/knowledge/freshness.js";
import { loadKnowledgeNotes, parseNote } from "../src/knowledge/load.js";
import { evaluateProjectKnowledge } from "../src/knowledge/report.js";
import { validateNote } from "../src/knowledge/validate.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const templatePath = join(root, "templates/project/knowledge/note.md");

function tempProject(): string {
  const dir = mkdtempSync(join(tmpdir(), "methodrail-knowledge-"));
  mkdirSync(join(dir, ".methodrail", "knowledge"), { recursive: true });
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src", "webhooks.js"), "module.exports = {}\n");
  return dir;
}

const TYPED = `---
kind: invariant
status: verified
validated_at: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
relevant_paths:
  - src/webhooks.js
---

# Webhook credit idempotency

## Claim

Every webhook path that can produce a ledger credit must use the provider event ID as its idempotency key.

## Evidence

- The direct provider handler passes the event ID to the keyed ledger write.
- Replaying the same provider event produces one credit in the regression test.

## Reuse guidance

When adding another credit-producing webhook, trace the handler to the ledger boundary and preserve this key.

## Refresh triggers

- A credit-producing webhook path changes.
- The ledger idempotency boundary changes.
`;

function writeNote(dir: string, name: string, source: string, indexTitle = "webhook credit"): void {
  writeFileSync(join(dir, ".methodrail", "knowledge", name), source);
  writeFileSync(
    join(dir, ".methodrail", "PROJECT.md"),
    `# Project\n\n## Knowledge index\n\n- [${indexTitle}](knowledge/${name}) — durable invariant\n`,
  );
}

test("the canonical template parses as a typed note", () => {
  const source = readFileSync(templatePath, "utf8");
  const note = parseNote(templatePath, source, dirname(templatePath));
  assert.equal(note.classification, "typed");
  assert.equal(note.frontmatter?.kind, "invariant");
  assert.equal(note.frontmatter?.status, "verified");
  assert.equal(note.frontmatter?.lifecycle, "active");
  assert.equal(note.frontmatter?.scope, undefined);
  assert.match(note.claim, /later agent/i);
  assert.ok(note.evidence.length > 0);
});

test("valid verified invariant and provisional hypothesis load", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "webhooks.md", TYPED);
    writeFileSync(
      join(dir, ".methodrail", "knowledge", "retry.md"),
      `---
kind: hypothesis
status: provisional
validated_at: unversioned:no-git
relevant_paths:
  - src/webhooks.js
---

# Retry hypothesis

## Claim

Four retries may explain duplicate charges until we observe production.

## Evidence

- Chat speculation only; not yet confirmed against logs.

## Reuse guidance

Treat as uncertainty, not an invariant.

## Refresh triggers

- Runtime observation of retry counts.
`,
    );
    writeFileSync(
      join(dir, ".methodrail", "PROJECT.md"),
      `# Project\n\n- [webhook credit](knowledge/webhooks.md)\n- [retry hypothesis](knowledge/retry.md)\n`,
    );
    const report = evaluateProjectKnowledge(dir);
    const kinds = report.notes.map((note) => `${note.frontmatter?.kind}:${note.frontmatter?.status}`);
    assert.ok(kinds.includes("invariant:verified"));
    assert.ok(kinds.includes("hypothesis:provisional"));
    assert.equal(report.errors.length, 0, report.errors.map((item) => item.message).join("\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verified note without evidence fails", () => {
  const dir = tempProject();
  try {
    writeNote(
      dir,
      "empty.md",
      TYPED.replace(/## Evidence[\s\S]*?## Reuse/, "## Evidence\n\n## Reuse"),
      "empty",
    );
    const report = evaluateProjectKnowledge(dir);
    assert.ok(report.errors.some((item) => /meaningful evidence/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("verified hypothesis fails", () => {
  const dir = tempProject();
  try {
    writeNote(
      dir,
      "bad.md",
      TYPED.replace("kind: invariant", "kind: hypothesis"),
      "bad",
    );
    const report = evaluateProjectKnowledge(dir);
    const hypo = report.errors.filter((item) => /hypothesis/i.test(item.message));
    assert.equal(hypo.length, 1, hypo.map((item) => item.message).join("\n"));
    assert.match(hypo[0]!.message, /must be provisional/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("typed frontmatter missing kind is invalid rather than legacy", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "missing-kind.md", TYPED.replace("kind: invariant\n", ""), "missing kind");
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.notes[0]?.classification, "invalid-typed");
    assert.ok(report.errors.some((item) => /requires kind/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("unknown kind and status are invalid", () => {
  const dir = tempProject();
  try {
    writeNote(
      dir,
      "unknown.md",
      TYPED.replace("kind: invariant", "kind: rumor").replace("status: verified", "status: trusted"),
      "unknown",
    );
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.notes[0]?.classification, "invalid-typed");
    assert.ok(report.errors.some((item) => /requires kind/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("missing project index entry fails", () => {
  const dir = tempProject();
  try {
    writeFileSync(join(dir, ".methodrail", "knowledge", "webhooks.md"), TYPED);
    writeFileSync(join(dir, ".methodrail", "PROJECT.md"), "# Project\n\nNo knowledge pointers.\n");
    const report = evaluateProjectKnowledge(dir);
    assert.ok(report.errors.some((item) => /not indexed/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a dangling project knowledge pointer fails", () => {
  const dir = tempProject();
  try {
    writeFileSync(
      join(dir, ".methodrail", "PROJECT.md"),
      "# Project\n\n- [missing knowledge](knowledge/missing.md)\n",
    );
    const report = evaluateProjectKnowledge(dir);
    assert.ok(report.errors.some((item) => /target does not exist/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a project knowledge pointer cannot escape .methodrail", () => {
  const dir = tempProject();
  try {
    writeFileSync(
      join(dir, ".methodrail", "PROJECT.md"),
      "# Project\n\n- [outside knowledge](../outside/knowledge/escape.md)\n",
    );
    const report = evaluateProjectKnowledge(dir);
    assert.ok(report.errors.some((item) => /escapes \.methodrail/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("legacy note remains compatible with a warning", () => {
  const dir = tempProject();
  try {
    writeFileSync(
      join(dir, ".methodrail", "knowledge", "webhooks.md"),
      "# Webhooks\n\nLedger credits are idempotent on eventId.\n",
    );
    writeFileSync(join(dir, ".methodrail", "PROJECT.md"), "# Project\n");
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.notes[0]?.classification, "legacy");
    assert.equal(report.errors.length, 0);
    assert.ok(report.warnings.some((item) => /legacy/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("git-less unversioned fallback is accepted with reduced confidence", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "webhooks.md", TYPED.replace("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "unversioned:no-git"));
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.errors.length, 0, report.errors.map((item) => item.message).join("\n"));
    assert.ok(report.warnings.some((item) => /reduced confidence|unversioned/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("path traversal is rejected", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "webhooks.md", TYPED.replace("- src/webhooks.js", "- ../secret"));
    const report = evaluateProjectKnowledge(dir);
    assert.ok(report.errors.some((item) => /escapes/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a temporarily missing relevant path does not invalidate the repository", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "webhooks.md", TYPED.replace("- src/webhooks.js", "- src/missing.js"));
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.errors.length, 0, report.errors.map((item) => item.message).join("\n"));
    assert.ok(report.warnings.some((item) => /missing/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("duplicate typed titles are rejected", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "one.md", TYPED, "one");
    writeFileSync(join(dir, ".methodrail", "knowledge", "two.md"), TYPED.replace("webhooks.md", "two.md"));
    writeFileSync(
      join(dir, ".methodrail", "PROJECT.md"),
      `# Project\n\n- [one](knowledge/one.md)\n- [two](knowledge/two.md)\n`,
    );
    const report = evaluateProjectKnowledge(dir);
    assert.ok(report.errors.some((item) => /duplicate typed note title/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a second validation run is deterministic", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "webhooks.md", TYPED);
    const first = evaluateProjectKnowledge(dir);
    const second = evaluateProjectKnowledge(dir);
    assert.deepEqual(
      first.errors.map((item) => item.message),
      second.errors.map((item) => item.message),
    );
    assert.deepEqual(
      first.warnings.map((item) => item.message),
      second.warnings.map((item) => item.message),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("relevant-path changes produce a freshness warning", () => {
  const dir = tempProject();
  try {
    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "eval@example.com"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["config", "user.name", "Eval"], { cwd: dir, stdio: "ignore" });
    writeFileSync(join(dir, "src", "webhooks.js"), "module.exports = { v: 1 }\n");
    execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "base"], { cwd: dir, stdio: "ignore" });
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
    writeNote(dir, "webhooks.md", TYPED.replace("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", sha));
    execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "note"], { cwd: dir, stdio: "ignore" });
    const note = loadKnowledgeNotes(dir)[0];
    assert.ok(note);
    const fresh = evaluateFreshness(note, dir);
    assert.equal(fresh.state, "fresh");
    writeFileSync(join(dir, "src", "webhooks.js"), "module.exports = { v: 2 }\n");
    const unstaged = evaluateFreshness(note, dir);
    assert.equal(unstaged.state, "review-required");
    execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
    const staged = evaluateFreshness(note, dir);
    assert.equal(staged.state, "review-required");
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "change"], { cwd: dir, stdio: "ignore" });
    const stale = evaluateFreshness(note, dir);
    assert.equal(stale.state, "review-required");
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.errors.length, 0);
    assert.ok(report.warnings.some((item) => /review-required/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an untracked relevant path requires freshness review", () => {
  const dir = tempProject();
  try {
    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "eval@example.com"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["config", "user.name", "Eval"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "base"], { cwd: dir, stdio: "ignore" });
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
    writeNote(
      dir,
      "webhooks.md",
      TYPED.replace("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", sha).replace("src/webhooks.js", "src/new-webhook.js"),
    );
    execFileSync("git", ["add", ".methodrail"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "note"], { cwd: dir, stdio: "ignore" });
    const note = loadKnowledgeNotes(dir)[0];
    assert.ok(note);
    assert.equal(evaluateFreshness(note, dir).state, "fresh");
    writeFileSync(join(dir, "src", "new-webhook.js"), "module.exports = { routed: true }\n");
    assert.equal(evaluateFreshness(note, dir).state, "review-required");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("decision records are not typed-note errors", () => {
  const dir = tempProject();
  try {
    mkdirSync(join(dir, ".methodrail", "knowledge", "decisions"), { recursive: true });
    writeFileSync(
      join(dir, ".methodrail", "knowledge", "decisions", "0001.md"),
      "# Decision\n\nQuestion: who owns sessions?\n",
    );
    writeFileSync(join(dir, ".methodrail", "PROJECT.md"), "# Project\n");
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.notes[0]?.classification, "decision");
    assert.equal(report.errors.length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("malformed note YAML is a per-note error instead of a crash", () => {
  const dir = tempProject();
  try {
    writeNote(
      dir,
      "broken.md",
      `---
kind: [
---

# Broken

## Claim

This note has malformed frontmatter and must not abort validation.

## Evidence

- Placeholder evidence so the body is not empty of headings.

## Reuse guidance

Do not reuse this note.

## Refresh triggers

- Frontmatter is repaired.
`,
      "broken",
    );
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.notes[0]?.classification, "invalid-typed");
    assert.ok(report.errors.some((item) => /not valid YAML/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("ignored descendants of a declared directory are unknown rather than fresh", () => {
  const dir = tempProject();
  try {
    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "eval@example.com"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["config", "user.name", "Eval"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "base"], { cwd: dir, stdio: "ignore" });
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
    writeNote(
      dir,
      "webhooks.md",
      TYPED.replace("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", sha).replace("src/webhooks.js", "src"),
    );
    execFileSync("git", ["add", ".methodrail"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "note"], { cwd: dir, stdio: "ignore" });
    const note = loadKnowledgeNotes(dir)[0];
    assert.ok(note);
    assert.equal(evaluateFreshness(note, dir).state, "fresh");
    writeFileSync(join(dir, ".gitignore"), "src/generated/\n");
    mkdirSync(join(dir, "src", "generated"));
    writeFileSync(join(dir, "src", "generated", "config.json"), "{}\n");
    const freshness = evaluateFreshness(note, dir);
    assert.equal(freshness.state, "unknown");
    assert.match(freshness.evidence, /ignored/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an ignored relevant path is unknown rather than fresh", () => {
  const dir = tempProject();
  try {
    execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["config", "user.email", "eval@example.com"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["config", "user.name", "Eval"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["add", "."], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "base"], { cwd: dir, stdio: "ignore" });
    const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
    writeNote(
      dir,
      "webhooks.md",
      TYPED.replace("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", sha).replace("src/webhooks.js", "src/secret.js"),
    );
    execFileSync("git", ["add", ".methodrail"], { cwd: dir, stdio: "ignore" });
    execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "note"], { cwd: dir, stdio: "ignore" });
    const note = loadKnowledgeNotes(dir)[0];
    assert.ok(note);
    writeFileSync(join(dir, ".gitignore"), "src/secret.js\n");
    writeFileSync(join(dir, "src", "secret.js"), "module.exports = { secret: true }\n");
    const freshness = evaluateFreshness(note, dir);
    assert.equal(freshness.state, "unknown");
    assert.match(freshness.evidence, /ignored/i);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("knowledge loading does not follow escaping or cyclic directory symlinks", () => {
  const dir = tempProject();
  const outside = mkdtempSync(join(tmpdir(), "methodrail-knowledge-outside-"));
  try {
    writeFileSync(join(outside, "secret.md"), "# Secret\n\nShould not be loaded.\n");
    symlinkSync(join(outside, "secret.md"), join(dir, ".methodrail", "knowledge", "escape.md"));
    mkdirSync(join(dir, ".methodrail", "knowledge", "loop"));
    symlinkSync(join(dir, ".methodrail", "knowledge"), join(dir, ".methodrail", "knowledge", "loop", "back"));
    writeNote(dir, "webhooks.md", TYPED);
    const notes = loadKnowledgeNotes(dir);
    assert.equal(
      notes.some((note) => note.relativePath.endsWith("escape.md") || /Secret/.test(note.source)),
      false,
    );
    assert.ok(notes.some((note) => note.relativePath.endsWith("webhooks.md")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test("validateNote reports no errors for a well-formed typed note", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "webhooks.md", TYPED);
    const notes = loadKnowledgeNotes(dir);
    const projectMd = readFileSync(join(dir, ".methodrail", "PROJECT.md"), "utf8");
    const diagnostics = validateNote(notes[0]!, dir, projectMd, notes);
    assert.equal(
      diagnostics.filter((item) => item.level === "error").length,
      0,
      diagnostics.map((item) => item.message).join("\n"),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function withGovernance(extra: string, extraBody = ""): string {
  return TYPED.replace(
    "relevant_paths:\n  - src/webhooks.js\n",
    `relevant_paths:\n  - src/webhooks.js\n${extra}`,
  ) + extraBody;
}

function writeNotes(
  dir: string,
  entries: { name: string; source: string; title: string }[],
): void {
  for (const entry of entries) {
    writeFileSync(join(dir, ".methodrail", "knowledge", entry.name), entry.source);
  }
  writeFileSync(
    join(dir, ".methodrail", "PROJECT.md"),
    `# Project\n\n${entries.map((entry) => `- [${entry.title}](knowledge/${entry.name})`).join("\n")}\n`,
  );
}

test("a v0.7 typed note parses as active and unbounded", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "webhooks.md", TYPED);
    const note = loadKnowledgeNotes(dir)[0];
    assert.equal(note?.frontmatter?.lifecycle, "active");
    assert.equal(note?.frontmatter?.scope, undefined);
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.errors.length, 0, report.errors.map((item) => item.message).join("\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a governance-only note is invalid-typed rather than legacy", () => {
  const dir = tempProject();
  try {
    writeNote(
      dir,
      "only-life.md",
      `---
lifecycle: active
---

# Only lifecycle
`,
      "only lifecycle",
    );
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.notes[0]?.classification, "invalid-typed");
    assert.ok(report.errors.some((item) => /requires kind/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("valid include, exclude, and include-plus-exclude scope parse", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "webhooks.md", withGovernance(`scope:\n  include_paths:\n    - src\n`));
    assert.deepEqual(loadKnowledgeNotes(dir)[0]?.frontmatter?.scope, { include_paths: ["src"] });
    writeNote(dir, "webhooks.md", withGovernance(`scope:\n  exclude_paths:\n    - src/webhooks.js\n`));
    assert.deepEqual(loadKnowledgeNotes(dir)[0]?.frontmatter?.scope, { exclude_paths: ["src/webhooks.js"] });
    writeNote(
      dir,
      "webhooks.md",
      withGovernance(`scope:
  include_paths:
    - src/webhooks.js
  exclude_paths:
    - src/webhooks.js
`),
    );
    assert.deepEqual(loadKnowledgeNotes(dir)[0]?.frontmatter?.scope, {
      include_paths: ["src/webhooks.js"],
      exclude_paths: ["src/webhooks.js"],
    });
    assert.equal(evaluateProjectKnowledge(dir).errors.length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("unknown lifecycle and malformed scope arrays fail", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "webhooks.md", withGovernance("lifecycle: maybe\nscope:\n  include_paths: []\n"));
    const report = evaluateProjectKnowledge(dir);
    assert.ok(report.errors.some((item) => /lifecycle must be active/i.test(item.message)));
    assert.ok(report.errors.some((item) => /include_paths must be a non-empty array/i.test(item.message)));
    assert.equal(report.notes[0]?.classification, "invalid-typed");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("malformed lifecycle or empty scope is invalid-typed and not eligible", () => {
  const dir = tempProject();
  try {
    writeNote(dir, "webhooks.md", withGovernance("lifecycle: retiredd\n"));
    const retiredTypo = loadKnowledgeNotes(dir)[0];
    assert.equal(retiredTypo?.classification, "invalid-typed");
    assert.ok(retiredTypo?.governanceErrors?.some((item) => /lifecycle must be active/i.test(item)));
    assert.equal(
      evaluateKnowledgeEligibility(retiredTypo!, ["src/webhooks.js"], {
        state: "fresh",
        evidence: "No relevant_paths changes",
      }).disposition,
      "unknown",
    );

    writeNote(dir, "webhooks.md", withGovernance("scope:\n  include_paths: []\n"));
    const emptyScope = loadKnowledgeNotes(dir)[0];
    assert.equal(emptyScope?.classification, "invalid-typed");
    assert.ok(emptyScope?.governanceErrors?.some((item) => /include_paths must be a non-empty array/i.test(item)));
    assert.equal(
      evaluateKnowledgeEligibility(emptyScope!, ["src/webhooks.js"], {
        state: "fresh",
        evidence: "No relevant_paths changes",
      }).disposition,
      "unknown",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("absolute, traversal, root-only, and glob-like scope entries fail", () => {
  const dir = tempProject();
  try {
    for (const entry of ["/etc/passwd", "../secret", ".", "src/*", "src/foo?", "src/foo[ab]"]) {
      writeNote(
        dir,
        "webhooks.md",
        withGovernance(`scope:\n  include_paths:\n    - ${JSON.stringify(entry)}\n`),
      );
      const report = evaluateProjectKnowledge(dir);
      assert.ok(
        report.errors.some((item) => /invalid include_paths entry/i.test(item.message)),
        `${entry}: ${report.errors.map((item) => item.message).join("; ")}`,
      );
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("reciprocal disputed notes with a Dispute section are valid", () => {
  const dir = tempProject();
  try {
    const dispute = `

## Dispute

Both notes claim exclusive ownership of webhook idempotency keys.
`;
    writeNotes(dir, [
      {
        name: "alpha.md",
        title: "alpha credit",
        source: withGovernance(
          "lifecycle: disputed\nconflicts_with:\n  - knowledge/beta.md\n",
          dispute,
        ).replace("Webhook credit idempotency", "Alpha credit"),
      },
      {
        name: "beta.md",
        title: "beta credit",
        source: withGovernance(
          "lifecycle: disputed\nconflicts_with:\n  - knowledge/alpha.md\n",
          dispute,
        ).replace("Webhook credit idempotency", "Beta credit"),
      },
    ]);
    const report = evaluateProjectKnowledge(dir);
    assert.equal(report.errors.length, 0, report.errors.map((item) => item.message).join("\n"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("non-reciprocal and self-referential disputes fail", () => {
  const dir = tempProject();
  try {
    writeNote(
      dir,
      "alpha.md",
      withGovernance(
        "lifecycle: disputed\nconflicts_with:\n  - knowledge/alpha.md\n",
        "\n## Dispute\n\nThis note disputes itself rather than a sibling claim.\n",
      ),
      "alpha credit",
    );
    const self = evaluateProjectKnowledge(dir);
    assert.ok(self.errors.some((item) => /same note/i.test(item.message)));
    writeNotes(dir, [
      {
        name: "alpha.md",
        title: "alpha credit",
        source: withGovernance(
          "lifecycle: disputed\nconflicts_with:\n  - knowledge/beta.md\n",
          "\n## Dispute\n\nAlpha claims the event-id key is required on every path.\n",
        ).replace("Webhook credit idempotency", "Alpha credit"),
      },
      {
        name: "beta.md",
        title: "beta credit",
        source: TYPED.replace("Webhook credit idempotency", "Beta credit"),
      },
    ]);
    const oneSided = evaluateProjectKnowledge(dir);
    assert.ok(oneSided.errors.some((item) => /not disputed|not reciprocal|not an existing typed note/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("retired notes require a live successor or a Retirement section", () => {
  const dir = tempProject();
  try {
    writeNotes(dir, [
      {
        name: "old.md",
        title: "old credit",
        source: withGovernance("lifecycle: retired\nsuperseded_by: knowledge/webhooks.md\n").replace(
          "Webhook credit idempotency",
          "Old credit",
        ),
      },
      {
        name: "webhooks.md",
        title: "webhook credit",
        source: TYPED,
      },
    ]);
    assert.equal(evaluateProjectKnowledge(dir).errors.length, 0);
    unlinkSync(join(dir, ".methodrail", "knowledge", "webhooks.md"));
    writeNote(
      dir,
      "old.md",
      withGovernance(
        "lifecycle: retired\n",
        "\n## Retirement\n\nThe event-id key moved to the successor after the provider migration.\n",
      ),
      "old credit",
    );
    assert.equal(evaluateProjectKnowledge(dir).errors.length, 0);
    writeNote(dir, "old.md", withGovernance("lifecycle: retired\n"), "old credit");
    assert.ok(
      evaluateProjectKnowledge(dir).errors.some((item) => /Retirement section/i.test(item.message)),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("self and cyclic supersession fail", () => {
  const dir = tempProject();
  try {
    writeNote(
      dir,
      "old.md",
      withGovernance("lifecycle: retired\nsuperseded_by: knowledge/old.md\n"),
      "old credit",
    );
    assert.ok(evaluateProjectKnowledge(dir).errors.some((item) => /same note/i.test(item.message)));
    writeNotes(dir, [
      {
        name: "a.md",
        title: "note a",
        source: withGovernance("lifecycle: retired\nsuperseded_by: knowledge/b.md\n").replace(
          "Webhook credit idempotency",
          "Note a",
        ),
      },
      {
        name: "b.md",
        title: "note b",
        source: withGovernance("lifecycle: retired\nsuperseded_by: knowledge/a.md\n").replace(
          "Webhook credit idempotency",
          "Note b",
        ),
      },
    ]);
    const cyclic = evaluateProjectKnowledge(dir);
    assert.ok(cyclic.errors.some((item) => /cycle|non-retired/i.test(item.message)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

