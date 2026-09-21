import assert from "node:assert/strict";
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateRepository } from "../src/validate.js";

const here = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = dirname(here);
const fixture = join(here, "fixtures", "repository");

function files(root: string, current = root): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of readdirSync(current)) {
    const path = join(current, entry);
    if (statSync(path).isDirectory()) Object.assign(result, files(root, path));
    else result[relative(root, path)] = readFileSync(path, "utf8");
  }
  return result;
}

function mergeExpected(root: string): void {
  const expected = join(fixture, "expected");
  for (const [path, contents] of Object.entries(files(expected))) {
    const destination = join(root, path);
    if (statExists(destination)) continue;
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, contents);
  }
}

function statExists(path: string): boolean {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

test("the Methodrail repository satisfies native plugin contracts", () => {
  const result = validateRepository(repositoryRoot);
  assert.equal(
    result.ok,
    true,
    result.issues.map(({ path, message }) => `${relative(repositoryRoot, path)}: ${message}`).join("\n"),
  );
});

test("the realistic generated repository fixture is valid", () => {
  const result = validateRepository(join(fixture, "expected"));
  assert.deepEqual(result, { ok: true, issues: [] });
});

test("fixture merge preserves AGENTS.md and is structurally idempotent", (t) => {
  const root = mkdtempSync(join(tmpdir(), "methodrail-fixture-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(join(fixture, "input"), root, { recursive: true });

  const originalAgents = readFileSync(join(root, "AGENTS.md"), "utf8");
  const originalClaude = readFileSync(join(root, "CLAUDE.md"), "utf8");
  const originalCursorRule = readFileSync(join(root, ".cursor", "rules", "existing.mdc"), "utf8");
  mergeExpected(root);
  const first = files(root);
  mergeExpected(root);

  assert.equal(readFileSync(join(root, "AGENTS.md"), "utf8"), originalAgents);
  assert.equal(readFileSync(join(root, "CLAUDE.md"), "utf8"), originalClaude);
  assert.equal(
    readFileSync(join(root, ".cursor", "rules", "existing.mdc"), "utf8"),
    originalCursorRule,
  );
  assert.deepEqual(files(root), first);
  assert.deepEqual(files(root), files(join(fixture, "expected")));
  assert.equal(validateRepository(root).ok, true);
});

test("fixture merge preserves ambiguous curated Methodrail content", (t) => {
  const root = mkdtempSync(join(tmpdir(), "methodrail-curated-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  cpSync(join(fixture, "input"), root, { recursive: true });
  const projectPath = join(root, ".methodrail", "PROJECT.md");
  mkdirSync(dirname(projectPath), { recursive: true });
  writeFileSync(projectPath, "# Curated project knowledge\n\nDo not replace this text.\n");

  mergeExpected(root);

  assert.equal(
    readFileSync(projectPath, "utf8"),
    "# Curated project knowledge\n\nDo not replace this text.\n",
  );
});

test("validator reports native skill, link, legacy file, plugin, and rule errors", (t) => {
  const root = mkdtempSync(join(tmpdir(), "methodrail-invalid-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, "package.json"), '{"name":"methodrail","version":"0.2.0"}');
  writeFileSync(
    join(root, "package-lock.json"),
    '{"name":"methodrail","version":"0.1.0","packages":{"":{"name":"methodrail","version":"0.1.0"}}}',
  );

  const skill = join(root, ".agents", "skills", "right-name");
  mkdirSync(skill, { recursive: true });
  writeFileSync(
    join(skill, "SKILL.md"),
    [
      "---",
      "name: wrong-name",
      "description: ''",
      "disable-model-invocation: explicit",
      "---",
      "[missing](missing.md)",
      ...Array.from({ length: 494 }, () => ""),
    ].join("\n"),
  );
  writeFileSync(join(skill, "skill.yaml"), "legacy: true\n");

  mkdirSync(join(root, ".cursor-plugin"), { recursive: true });
  writeFileSync(join(root, ".cursor-plugin", "plugin.json"), '{"name":"fixture","version":"nope"}');
  mkdirSync(join(root, ".cursor", "rules"), { recursive: true });
  writeFileSync(join(root, ".cursor", "rules", "global.mdc"), "---\ndescription: ''\n---\nRule\n");

  const messages = validateRepository(root).issues.map(({ message }) => message);
  assert.ok(messages.some((message) => message.includes("Legacy skill.yaml")));
  assert.ok(messages.some((message) => message.includes("must match folder")));
  assert.ok(messages.some((message) => message.includes("non-empty description")));
  assert.ok(messages.some((message) => message.includes("must be a boolean")));
  assert.ok(messages.some((message) => message.includes("under 500 lines")));
  assert.ok(messages.some((message) => message.includes("does not exist")));
  assert.ok(messages.some((message) => message.includes("plugin.json requires")));
  assert.ok(messages.some((message) => message.includes("semantic version")));
  assert.ok(messages.some((message) => message.includes("alwaysApply")));
  assert.ok(messages.some((message) => message.includes("Missing required Methodrail skill")));
  assert.ok(messages.some((message) => message.includes("Package lock and package versions must agree")));
});

test("validator rejects permission hooks and missing hook scripts", (t) => {
  const root = mkdtempSync(join(tmpdir(), "methodrail-hooks-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, ".cursor-plugin"));
  writeFileSync(
    join(root, ".cursor-plugin/plugin.json"),
    JSON.stringify({ name: "x", version: "1.0.0", description: "d", hooks: "./hooks/hooks.json" }),
  );
  mkdirSync(join(root, "hooks"));
  writeFileSync(
    join(root, "hooks/hooks.json"),
    JSON.stringify({
      version: 1,
      hooks: {
        beforeShellExecution: [{ command: "./scripts/hooks/gate.sh" }],
        postToolUse: [{ command: "./scripts/hooks/missing.sh" }],
        stop: [{ command: "./scripts/hooks/ok.sh", timeout: 5 }],
      },
    }),
  );
  mkdirSync(join(root, "scripts/hooks"), { recursive: true });
  writeFileSync(join(root, "scripts/hooks/ok.sh"), "#!/bin/sh\nprintf '{}'\n");
  const messages = validateRepository(root).issues.map((i) => i.message);
  assert.ok(
    messages.some((m) => /beforeShellExecution.*observational/.test(m)),
    messages.join("\n"),
  );
  assert.ok(
    messages.some((m) => /missing\.sh.*does not exist/.test(m)),
    messages.join("\n"),
  );
  assert.ok(!messages.some((m) => /stop/.test(m) && /observational/.test(m)));
});
