import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { EXPLICIT_SKILLS, SUGGEST_ONLY_SKILLS } from "../src/validate.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test("Cursor and Z Code hooks stay on separate files", () => {
  const cursor = JSON.parse(readFileSync(join(root, ".cursor-plugin/plugin.json"), "utf8")) as { hooks: string };
  assert.equal(cursor.hooks, "./hooks/cursor.json");
  const cursorHooks = JSON.parse(readFileSync(join(root, "hooks/cursor.json"), "utf8")) as {
    hooks: Record<string, unknown>;
  };
  assert.ok(cursorHooks.hooks.sessionStart);
  const zcode = JSON.parse(readFileSync(join(root, "hooks/hooks.json"), "utf8")) as {
    hooks: Record<string, unknown>;
  };
  assert.deepEqual(Object.keys(zcode.hooks), ["SessionStart"]);
  assert.match(JSON.stringify(zcode), /zcode-session-start\.sh/);
});

test("Z Code session hook injects the projected invariant and fails open", () => {
  const script = join(root, "scripts/hooks/zcode-session-start.mjs");
  const ok = spawnSync(process.execPath, [script], {
    input: `${JSON.stringify({ hook_event_name: "SessionStart" })}\n`,
    encoding: "utf8",
  });
  assert.equal(ok.status, 0, ok.stderr);
  const payload = JSON.parse(ok.stdout) as {
    hookSpecificOutput: { hookEventName: string; additionalContext: string };
  };
  assert.equal(payload.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(payload.hookSpecificOutput.additionalContext, /Use Methodrail proportionally/);
  assert.match(payload.hookSpecificOutput.additionalContext, /descriptions match the task/);

  const bad = spawnSync(process.execPath, [script], { input: "not-json", encoding: "utf8" });
  assert.equal(bad.status, 0, bad.stderr);
  const fallback = JSON.parse(bad.stdout) as { hookSpecificOutput: { hookEventName: string } };
  assert.equal(fallback.hookSpecificOutput.hookEventName, "SessionStart");
});

test("every shipped skill carries a Z Code-readable when_to_use trigger", () => {
  for (const entry of readdirSync(join(root, "skills"))) {
    const skillPath = join(root, "skills", entry, "SKILL.md");
    if (!existsSync(skillPath)) continue;
    const source = readFileSync(skillPath, "utf8");
    const match = /^when_to_use:[ \t]*(\S[^\n]*)$/m.exec(source);
    assert.ok(match, `${entry} must declare when_to_use`);
    const value = match?.[1] ?? "";
    assert.ok(value.length <= 280, `${entry} when_to_use is ${value.length} characters; keep it under 280`);
    assert.doesNotMatch(value, /:\s/, `${entry} when_to_use must avoid ': ' for flat frontmatter parsers`);

    if (EXPLICIT_SKILLS.has(entry)) {
      const prefix = (SUGGEST_ONLY_SKILLS as readonly string[]).includes(entry)
        ? "Suggest-only"
        : "Explicit request only";
      assert.ok(
        value.startsWith(prefix),
        `${entry} is explicit on Cursor but Z Code ignores disable-model-invocation; its when_to_use must open with "${prefix}"`,
      );
    } else {
      assert.ok(
        !value.startsWith("Explicit request only"),
        `${entry} is model-invoked; its when_to_use must state trigger branches, not the explicit guard`,
      );
    }
  }
});
