import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { discoverProjectArtifacts, previewWrites, TSV_HEADER } from "../src/artifacts.js";
import { KNOWLEDGE_HEALTH_CAVEAT, summarizeKnowledgeHealth } from "../src/knowledge/health.js";
import { evaluateProjectKnowledge } from "../src/knowledge/report.js";
import { evaluateProjectMd, evaluateProjectMdFile, evaluateProjectMdLinks } from "../src/project-md.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix));
}

function write(dir: string, rel: string, body: string): void {
  const path = join(dir, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function mixedRepo(options?: { secondGlossary?: boolean; harness?: boolean; linkedPointers?: boolean }): string {
  const dir = tempDir("methodrail-artifacts-");
  write(
    dir,
    "AGENTS.md",
    "# Shop agents\n\nKeep checkout fees in the existing billing module. Do not invent a second payment owner.\n",
  );
  write(
    dir,
    "CONTEXT.md",
    "# Context\n\n## Glossary\n\n**Order** is a paid checkout, not a draft cart.\n",
  );
  write(dir, "docs/adr/0001-sqlite.md", "# ADR-0001\n\nWe will keep order storage on SQLite for the single-node shop.\n");
  write(dir, "decisions.tsv", `${TSV_HEADER}\n2026-09-01T00:00:00Z\tsetup\tuse working tsv\ttrail\tfile:decisions.tsv\topen\n`);
  write(dir, "docs/superpowers/specs/checkout.md", "# Checkout spec\n\nUser can pay with a saved card.\n");
  write(dir, "docs/superpowers/plans/checkout.md", "# Checkout plan\n\n1. Drive pay.\n");
  write(
    dir,
    ".agents/skills/verify-shop/SKILL.md",
    "---\nname: verify-shop\ndescription: Verify shop checkout.\n---\n\n# Verify shop\n\n## Launch\n\n`npm start`\n",
  );
  write(
    dir,
    ".agents/skills/verify-shop/features/pay.md",
    "# Pay\n\nPay for an order.\n\n## Sub-features\n\n- `pay-card` charges the saved card.\n",
  );
  if (options?.secondGlossary) {
    write(dir, "docs/glossary.md", "# Glossary\n\n**Order** means something else here.\n");
  }
  if (options?.harness) {
    const pointers = options.linkedPointers
      ? `- [Context](../CONTEXT.md) — glossary\n- [ADR-0001](../docs/adr/0001-sqlite.md) — ADR\n`
      : "";
    write(
      dir,
      ".methodrail/PROJECT.md",
      `# Project\n\nTiny shop.\n\n## Domain vocabulary\n\n${pointers}\n## Knowledge index\n\n- [fees](knowledge/fees.md) — checkout fees\n`,
    );
    write(
      dir,
      ".methodrail/knowledge/fees.md",
      `---
kind: invariant
status: verified
validated_at: unversioned:fixture
relevant_paths:
  - src/fees.js
---

# Checkout fees

## Claim

Checkout fees stay in billing.

## Evidence

- src/fees.js computes the fee.

## Reuse guidance

Keep fees in billing.

## Refresh triggers

- Fee formula changes.
`,
    );
    write(dir, "src/fees.js", "export const fee = 30\n");
  }
  return dir;
}

test("empty repository proposes create PROJECT.md and reports unavailable verification", () => {
  const dir = tempDir("methodrail-empty-");
  try {
    const report = discoverProjectArtifacts(dir);
    assert.equal(report.conflicts.length, 0);
    assert.ok(report.preview.some((item) => item.path === ".methodrail/PROJECT.md" && item.op === "create"));
    assert.ok(report.preview.some((item) => item.op === "unavailable"));
    assert.ok(previewWrites(report).some((item) => item.op === "create"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("mixed pstack, Matt, and Superpowers artifacts are adopted by pointer", () => {
  const dir = mixedRepo({ harness: true });
  try {
    const report = discoverProjectArtifacts(dir);
    const roles = new Set(report.artifacts.map((item) => item.role));
    assert.ok(roles.has("glossary"));
    assert.ok(roles.has("adr"));
    assert.ok(roles.has("decision-log"));
    assert.ok(roles.has("spec"));
    assert.ok(roles.has("plan"));
    assert.ok(roles.has("verification-skill"));
    assert.ok(roles.has("host-instruction"));
    assert.equal(report.conflicts.length, 0);
    assert.ok(report.preview.some((item) => item.path === "decisions.tsv" && item.op === "adopt"));
    assert.ok(report.preview.some((item) => item.path === "AGENTS.md" && item.op === "unchanged"));
    assert.ok(report.preview.every((item) => item.op !== "conflict"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("upstream GLOSSARY.md and GLOSSARY-MAP.md are glossary layout", () => {
  const glossary = tempDir("methodrail-glossary-");
  const map = tempDir("methodrail-glossary-map-");
  try {
    write(glossary, "GLOSSARY.md", "# Glossary\n\n**Order** is a paid checkout.\n");
    const glossaryReport = discoverProjectArtifacts(glossary);
    assert.ok(glossaryReport.artifacts.some((item) => item.path === "GLOSSARY.md" && item.role === "glossary"));

    write(
      map,
      "GLOSSARY-MAP.md",
      "# Glossary Map\n\n## Contexts\n\n- [Ordering](./src/ordering/GLOSSARY.md): orders\n",
    );
    const mapReport = discoverProjectArtifacts(map);
    assert.ok(mapReport.artifacts.some((item) => item.path === "GLOSSARY-MAP.md" && item.role === "glossary"));
  } finally {
    rmSync(glossary, { recursive: true, force: true });
    rmSync(map, { recursive: true, force: true });
  }
});

test("two competing glossary roots are conflict, not a guessed winner", () => {
  const dir = mixedRepo({ harness: true, secondGlossary: true });
  try {
    const report = discoverProjectArtifacts(dir);
    assert.ok(report.conflicts.some((item) => item.role === "glossary"));
    assert.ok(report.preview.some((item) => item.role === "glossary" && item.op === "conflict"));
    assert.equal(readFileSync(join(dir, "CONTEXT.md"), "utf8").includes("paid checkout"), true);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("already-linked artifacts stay unchanged", () => {
  const dir = mixedRepo({ harness: true, linkedPointers: true });
  try {
    const report = discoverProjectArtifacts(dir);
    assert.ok(report.preview.some((item) => item.path === "CONTEXT.md" && item.op === "unchanged"));
    assert.ok(report.preview.some((item) => item.path === "docs/adr/0001-sqlite.md" && item.op === "unchanged"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("PROJECT.md link checks catch broken, duplicate, and escaping targets", () => {
  const dir = tempDir("methodrail-projectmd-");
  try {
    write(dir, "README.md", "# Shop\n");
    write(dir, ".methodrail/PROJECT.md", `# Project\n\nSee [README](../README.md).\n`);
    const ok = evaluateProjectMdFile(join(dir, ".methodrail/PROJECT.md"), dir);
    assert.equal(ok.ok, true, ok.issues.join("\n"));

    const broken = evaluateProjectMdLinks(
      `# Project\n\nSee [missing](../nope.md).\n`,
      join(dir, ".methodrail/PROJECT.md"),
      dir,
    );
    assert.ok(broken.issues.some((item) => /Broken/.test(item)));

    const dup = evaluateProjectMdLinks(
      `# Project\n\n## Knowledge index\n\n- [a](knowledge/fees.md)\n- [b](knowledge/fees.md)\n`,
      join(dir, ".methodrail/PROJECT.md"),
      dir,
    );
    assert.ok(dup.issues.some((item) => /Duplicate/.test(item)));

    const escape = evaluateProjectMdLinks(
      `# Project\n\nSee [out](../../secret.md).\n`,
      join(dir, ".methodrail/PROJECT.md"),
      dir,
    );
    assert.ok(escape.issues.some((item) => /escapes/.test(item)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("PROJECT.md size limits and unmatched Methodrail markers still fail", () => {
  const quality = evaluateProjectMd("# P\n\nSee [x](knowledge/x.md).\n<!-- methodrail:start -->\n");
  assert.equal(quality.ok, false);
  assert.ok(quality.issues.some((item) => /unmatched/.test(item)));
});

test("knowledge health reports dependency-fresh without claiming semantic truth", () => {
  const dir = mixedRepo({ harness: true });
  try {
    const report = evaluateProjectKnowledge(dir);
    const projectMd = readFileSync(join(dir, ".methodrail/PROJECT.md"), "utf8");
    const health = summarizeKnowledgeHealth(report, projectMd, dir);
    assert.equal(health.caveat, KNOWLEDGE_HEALTH_CAVEAT);
    assert.match(health.caveat, /does not prove the claim is still right/);
    assert.ok(health.items.some((item) => item.label === "unknown" || item.label === "dependency-fresh"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("methodrail-init skill requires preview confirmation and the freshness caveat", () => {
  const skill = readFileSync(join(root, "skills/methodrail-init/SKILL.md"), "utf8");
  const interop = readFileSync(join(root, "skills/methodrail-init/references/artifact-interoperability.md"), "utf8");
  assert.match(skill, /confirm non-empty writes/);
  assert.match(skill, /Inspect Methodrail setup/);
  assert.match(interop, /`create`/);
  assert.match(interop, /`conflict`/);
  assert.match(interop, /`unavailable`/);
  assert.match(interop, /fails harness binding/);
  assert.match(interop, /does not prove the claim is still right/);
  assert.match(interop, /Do not write `setup.yaml`/);
});

test("decision ladder keeps TSV columns and requires approval for ADRs", () => {
  const record = readFileSync(join(root, "references/protocols/decision-record.md"), "utf8");
  const template = readFileSync(
    join(root, "skills/show-me-your-work/references/decision-log-template.tsv"),
    "utf8",
  );
  assert.match(record, /hard to reverse/);
  assert.match(record, /Wait for approval/);
  assert.match(record, /cannot override an active ADR/);
  assert.match(record, /Do not add IDs, significance columns, or `promoted_to`/);
  assert.equal(template.trim().split("\n")[0], TSV_HEADER);
});

test("log.sh still hardens spreadsheet formulas and keeps six columns", () => {
  const dir = tempDir("methodrail-tsv-");
  try {
    const log = join(dir, "decisions.tsv");
    execFileSync("bash", [join(root, "skills/show-me-your-work/scripts/log.sh"), log, "p", "d", "w", "=cmd|true", "open"], {
      encoding: "utf8",
    });
    const text = readFileSync(log, "utf8");
    assert.match(text, /^ts\tphase\tdecision\twhy\tevidence\tresult\n/m);
    assert.match(text, /'=cmd\|true/);
    assert.equal(text.trim().split("\n").length, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("feature maps allow optional related knowledge after Sub-features", () => {
  const readme = readFileSync(
    join(root, "skills/create-verification-skill/references/feature-map-example/README.md"),
    "utf8",
  );
  const create = readFileSync(
    join(root, "skills/create-verification-skill/references/feature-map-example/create-note.md"),
    "utf8",
  );
  const search = readFileSync(
    join(root, "skills/create-verification-skill/references/feature-map-example/search.md"),
    "utf8",
  );
  assert.match(readme, /Related project knowledge/);
  assert.match(create, /## Related project knowledge/);
  assert.doesNotMatch(search, /## Related project knowledge/);
  const maintain = readFileSync(join(root, "skills/maintain-verification-skill/SKILL.md"), "utf8");
  assert.match(maintain, /project-knowledge contradiction/);
  assert.match(maintain, /Never edit product code, glossaries, specs, ADRs, or typed notes/);
  assert.match(maintain, /\.claude\/skills\/verify-\*/);
});

test("architecture survey distinguishes delete, deepen, preserve, and reject", () => {
  const skill = readFileSync(join(root, "skills/improve-codebase-architecture/SKILL.md"), "utf8");
  const html = readFileSync(join(root, "skills/improve-codebase-architecture/references/HTML-REPORT.md"), "utf8");
  assert.match(skill, /delete\/consolidate/);
  assert.match(skill, /already deep/);
  assert.match(skill, /Default presentation is Markdown in the conversation/);
  assert.match(skill, /Do not edit source during the survey/);
  assert.match(html, /not self-contained/);
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com/);
});

test("Cursor and Claude verify skills are verification roles, not host-instruction", () => {
  const dir = tempDir("methodrail-host-verify-");
  try {
    const skill = "---\nname: verify-app\ndescription: Verify the app.\n---\n\n# Verify app\n\n## Launch\n\n`npm start`\n";
    const feature = "# Pay\n\nPay for an order.\n\n## Sub-features\n\n- `pay-card` charges the saved card.\n";
    write(dir, ".cursor/skills/verify-app/SKILL.md", skill);
    write(dir, ".cursor/skills/verify-app/features/pay.md", feature);
    write(dir, ".claude/skills/verify-app/SKILL.md", skill);
    write(dir, ".claude/skills/verify-app/features/pay.md", feature);
    const report = discoverProjectArtifacts(dir);
    const byPath = new Map(report.artifacts.map((item) => [item.path, item.role]));
    assert.equal(byPath.get(".cursor/skills/verify-app/SKILL.md"), "verification-skill");
    assert.equal(byPath.get(".claude/skills/verify-app/SKILL.md"), "verification-skill");
    assert.equal(byPath.get(".cursor/skills/verify-app/features/pay.md"), "verification-map");
    assert.equal(byPath.get(".claude/skills/verify-app/features/pay.md"), "verification-map");
    assert.ok(!report.artifacts.some((item) => item.path.includes("verify-app") && item.role === "host-instruction"));
    assert.ok(!report.preview.some((item) => item.op === "unavailable"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("linked-external harness artifacts remain discoverable", () => {
  const base = tempDir("methodrail-linked-disc-");
  const repository = join(base, "my-app");
  const storage = join(base, "my-app-methodrail");
  try {
    write(repository, "src/app.js", "module.exports = { version: 1 };\n");
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
    write(
      repository,
      ".methodrail/PROJECT.md",
      "# Project\n\nSee [app](../src/app.js).\n\n## Knowledge index\n\n- [app](knowledge/app.md) — ownership\n",
    );
    write(repository, ".methodrail/knowledge/app.md", "# Application version\n\nOwned by src/app.js.\n");
    write(repository, ".methodrail/control/CONTROL.md", "# Control\n\nRun the application checks from source.\n");
    const report = discoverProjectArtifacts(repository);
    const roles = new Map(report.artifacts.map((item) => [item.path, item.role]));
    assert.equal(roles.get(".methodrail/PROJECT.md"), "methodrail-project");
    assert.equal(roles.get(".methodrail/knowledge/app.md"), "typed-knowledge");
    assert.equal(roles.get(".methodrail/control/CONTROL.md"), "control");
    assert.ok(!report.preview.some((item) => item.op === "unavailable"));
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a broken linked harness is unavailable, not a PROJECT.md create", () => {
  const dir = tempDir("methodrail-broken-link-");
  try {
    write(dir, "README.md", "# App\n");
    symlinkSync(join(dir, "missing-harness"), join(dir, ".methodrail"));
    const report = discoverProjectArtifacts(dir);
    assert.equal(report.artifacts.length, 0);
    assert.ok(!report.preview.some((item) => item.path === ".methodrail/PROJECT.md" && item.op === "create"));
    assert.ok(
      report.preview.some(
        (item) => item.path === ".methodrail" && item.op === "unavailable" && /does not exist/i.test(item.why),
      ),
    );
    assert.equal(previewWrites(report).length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("malformed PROJECT.md encoding is a validation issue, not a throw", () => {
  const dir = tempDir("methodrail-projectmd-encoding-");
  try {
    write(dir, ".methodrail/PROJECT.md", "# Project\n");
    const malformed = evaluateProjectMdLinks(
      `# Project\n\nSee [bad](%E0%A4%A.md).\n`,
      join(dir, ".methodrail/PROJECT.md"),
      dir,
    );
    assert.equal(malformed.ok, false);
    assert.ok(malformed.issues.some((item) => /not valid URL-encoded/i.test(item)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("broken evidence links become broken-pointer health labels", () => {
  const dir = mixedRepo({ harness: true });
  try {
    write(
      dir,
      ".methodrail/knowledge/fees.md",
      `---
kind: invariant
status: verified
validated_at: unversioned:fixture
relevant_paths:
  - src/fees.js
---

# Checkout fees

## Claim

Checkout fees stay in billing.

## Evidence

- src/fees.js computes the fee from the billing module path.
- See also [missing proof](../does-not-exist.md).

## Reuse guidance

Keep fees in billing.

## Refresh triggers

- Fee formula changes.
`,
    );
    const report = evaluateProjectKnowledge(dir);
    assert.ok(report.warnings.some((item) => /Broken evidence or verification pointer/i.test(item.message)));
    const projectMd = readFileSync(join(dir, ".methodrail/PROJECT.md"), "utf8");
    const health = summarizeKnowledgeHealth(report, projectMd, dir);
    assert.ok(health.items.some((item) => item.label === "broken-pointer"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("nested eval and overlay decoys are not project artifacts", () => {
  const dir = mixedRepo({ harness: true });
  try {
    write(dir, "evals/fixtures/shop/decisions.tsv", `${TSV_HEADER}\n2026-09-01T00:00:00Z\tsetup\tdecoy\tx\tfile:x\topen\n`);
    write(
      dir,
      "evals/fixtures/shop/.agents/skills/verify-decoy/SKILL.md",
      "---\nname: verify-decoy\n---\n\n# Decoy\n\n## Launch\n\n`true`\n",
    );
    write(
      dir,
      "evals/runners/artifacts/shop/overlay/decisions.tsv",
      `${TSV_HEADER}\n2026-09-01T00:00:00Z\tsetup\tdecoy overlay\tx\tfile:x\topen\n`,
    );
    write(dir, "evals/fixtures/shop/.scratch/notes.md", "# Decoy scratch\n");
    write(dir, "evals/fixtures/shop/docs/glossary.md", "# Glossary\n\n**Decoy** is not the shop glossary.\n");
    write(dir, ".scratch/notes.md", "# Project scratch\n");
    const report = discoverProjectArtifacts(dir);
    assert.equal(
      report.artifacts.some((item) => item.path.startsWith("evals/")),
      false,
    );
    assert.equal(report.conflicts.some((item) => item.role === "glossary"), false);
    assert.equal(
      previewWrites(report).some((item) => item.path.startsWith("evals/")),
      false,
    );
    assert.ok(report.artifacts.some((item) => item.path === "decisions.tsv"));
    assert.ok(report.artifacts.some((item) => item.path === "CONTEXT.md"));
    assert.ok(report.artifacts.some((item) => item.path === ".scratch/notes.md" && item.role === "scratch"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("discovery on Methodrail itself does not adopt eval fixture artifacts", () => {
  const report = discoverProjectArtifacts(root);
  const leaked = [...report.artifacts, ...previewWrites(report)].filter(
    (item) => item.path.startsWith("evals/fixtures/") || item.path.startsWith("evals/runners/artifacts/"),
  );
  assert.deepEqual(leaked, []);
});

test("PROJECT.md pointers match resolved hrefs, not substrings", () => {
  const dir = tempDir("methodrail-pointers-");
  try {
    write(dir, "docs/adr/0001.md", "# ADR\n\nSQLite.\n");
    write(dir, "decisions.tsv", `${TSV_HEADER}\n`);
    write(
      dir,
      ".agents/skills/verify-shop/SKILL.md",
      "---\nname: verify-shop\n---\n\n# Verify\n\n## Launch\n\n`true`\n",
    );
    write(
      dir,
      ".agents/skills/verify-shop/features/pay.md",
      "# Pay\n\n## Sub-features\n\n- pay\n",
    );
    write(
      dir,
      ".methodrail/PROJECT.md",
      `# Project

- [fees](knowledge/fees.md#formula)
- [control](control/CONTROL.md)
- [adr](../docs/adr/0001.md)
- [verify](../.agents/skills/verify-shop/SKILL.md)
- [pay](../.agents/skills/verify-shop/features/pay.md)
- [encoded](knowledge/fee%73.md)
`,
    );
    write(dir, ".methodrail/knowledge/fees.md", "# Fees\n");
    write(dir, ".methodrail/knowledge/fees-extra.md", "# Extra\n");
    write(dir, ".methodrail/control/CONTROL.md", "# Control\n");
    const report = discoverProjectArtifacts(dir);
    const byPath = new Map(report.preview.map((item) => [item.path, item.op]));
    assert.equal(byPath.get(".methodrail/knowledge/fees.md"), "unchanged");
    assert.equal(byPath.get(".methodrail/control/CONTROL.md"), "unchanged");
    assert.equal(byPath.get("docs/adr/0001.md"), "unchanged");
    assert.equal(byPath.get(".agents/skills/verify-shop/SKILL.md"), "unchanged");
    assert.equal(byPath.get(".agents/skills/verify-shop/features/pay.md"), "unchanged");
    assert.equal(byPath.get(".methodrail/knowledge/fees-extra.md"), "adopt");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("an approved pointer apply is a no-op on the next discovery", () => {
  const dir = mixedRepo({ harness: true, linkedPointers: true });
  try {
    const first = discoverProjectArtifacts(dir);
    const projectMdPath = join(dir, ".methodrail/PROJECT.md");
    let body = readFileSync(projectMdPath, "utf8");
    for (const item of previewWrites(first)) {
      body += `\n- [${item.path}](${item.path.startsWith(".methodrail/") ? item.path.slice(".methodrail/".length) : `../${item.path}`})\n`;
    }
    writeFileSync(projectMdPath, body);
    const second = discoverProjectArtifacts(dir);
    assert.equal(previewWrites(second).length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a broken linked harness with recognizable artifacts still proposes zero writes", () => {
  const dir = tempDir("methodrail-broken-bind-");
  try {
    write(dir, "decisions.tsv", `${TSV_HEADER}\n`);
    write(
      dir,
      ".agents/skills/verify-shop/SKILL.md",
      "---\nname: verify-shop\n---\n\n# Verify\n\n## Launch\n\n`true`\n",
    );
    write(dir, "CONTEXT.md", "# Context\n\n## Glossary\n\n**Order** is paid.\n");
    symlinkSync(join(dir, "missing-harness"), join(dir, ".methodrail"));
    const report = discoverProjectArtifacts(dir);
    assert.ok(report.artifacts.some((item) => item.path === "decisions.tsv"));
    assert.ok(report.preview.some((item) => item.path === ".methodrail" && item.op === "unavailable"));
    assert.equal(previewWrites(report).length, 0);
    assert.ok(!report.preview.some((item) => item.op === "create" || item.op === "adopt" || item.op === "update"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("in-repository PROJECT.md create is git visible; linked-external writes are not", () => {
  const empty = tempDir("methodrail-gitvis-empty-");
  try {
    const report = discoverProjectArtifacts(empty);
    const create = report.preview.find((item) => item.path === ".methodrail/PROJECT.md" && item.op === "create");
    assert.equal(create?.gitVisible, true);
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }

  const base = tempDir("methodrail-gitvis-linked-");
  const repository = join(base, "my-app");
  const storage = join(base, "my-app-methodrail");
  try {
    write(repository, "src/app.js", "module.exports = { version: 1 };\n");
    write(repository, "decisions.tsv", `${TSV_HEADER}\n`);
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
    write(
      repository,
      ".methodrail/PROJECT.md",
      "# Project\n\nSee [app](../src/app.js).\n",
    );
    const report = discoverProjectArtifacts(repository);
    assert.ok(previewWrites(report).every((item) => item.gitVisible === false));
    write(repository, ".methodrail/PROJECT.md", "# Project\n\nSee [app](../src/app.js).\n\n- [tsv](../decisions.tsv)\n");
    const refresh = discoverProjectArtifacts(repository);
    assert.equal(previewWrites(refresh).some((item) => item.path === "decisions.tsv"), false);
    const status = execFileSync("git", ["status", "--short"], { cwd: repository, encoding: "utf8" }).trim();
    assert.equal(status, "");
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
