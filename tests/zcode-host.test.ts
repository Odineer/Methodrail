import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { CLAUDE_BUNDLED_SKILL_NAMES } from "../src/family-invariant.js";
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
  assert.match(JSON.stringify(zcode), /session-start\.sh/);
});

function hookEnv(extra: Record<string, string>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra };
  for (const name of ["CLAUDE_PLUGIN_ROOT", "ZCODE_PLUGIN_ROOT"]) if (!(name in extra)) delete env[name];
  return env;
}

function hookCommand(): string {
  const config = JSON.parse(readFileSync(join(root, "hooks/hooks.json"), "utf8")) as {
    hooks: { SessionStart: Array<{ hooks: Array<{ command: string }> }> };
  };
  const command = config.hooks.SessionStart[0]?.hooks[0]?.command;
  assert.ok(command, "hooks.json must declare a SessionStart command");
  return command;
}

function runHook(env: NodeJS.ProcessEnv, command = hookCommand()) {
  const result = spawnSync("sh", ["-c", command], {
    input: `${JSON.stringify({ hook_event_name: "SessionStart" })}\n`,
    encoding: "utf8",
    env,
  });
  assert.equal(result.status, 0, result.stderr);
  return (JSON.parse(result.stdout) as { hookSpecificOutput: { additionalContext: string } }).hookSpecificOutput
    .additionalContext;
}

test("the shared hook command injects each host's projection", () => {
  const zcode = runHook(hookEnv({ ZCODE_PLUGIN_ROOT: root }));
  assert.equal(zcode, readFileSync(join(root, "adapters/zcode/AGENTS.md"), "utf8").trim());
  const claude = runHook(hookEnv({ CLAUDE_PLUGIN_ROOT: root }));
  assert.equal(claude, readFileSync(join(root, "adapters/claude/CLAUDE.md"), "utf8").trim());
  // A host that substitutes ${ZCODE_PLUGIN_ROOT} into the text instead of exporting it.
  const substituted = runHook(hookEnv({}), hookCommand().replace("${ZCODE_PLUGIN_ROOT}", root));
  assert.equal(substituted, zcode);
});

test("Claude projection covers every bundled-name clash with a shipped skill", () => {
  const claude = readFileSync(join(root, "adapters/claude/CLAUDE.md"), "utf8");
  for (const name of CLAUDE_BUNDLED_SKILL_NAMES) {
    assert.ok(existsSync(join(root, "skills", name, "SKILL.md")), `${name} is no longer a shipped skill; drop it`);
    assert.match(claude, new RegExp(`\`${name}\``));
  }
  assert.match(claude, /methodrail:<name>/);
  assert.match(claude, /disable-model-invocation/);
});

test("session hook injects the projected invariant and fails open", () => {
  const script = join(root, "scripts/hooks/session-start.sh");
  const ok = spawnSync(script, [], {
    input: `${JSON.stringify({ hook_event_name: "SessionStart" })}\n`,
    encoding: "utf8",
    env: hookEnv({}),
  });
  assert.equal(ok.status, 0, ok.stderr);
  const payload = JSON.parse(ok.stdout) as {
    hookSpecificOutput: { hookEventName: string; additionalContext: string };
  };
  assert.equal(payload.hookSpecificOutput.hookEventName, "SessionStart");
  assert.match(payload.hookSpecificOutput.additionalContext, /Use Methodrail proportionally/);
  assert.match(payload.hookSpecificOutput.additionalContext, /descriptions match the task/);

  const bad = spawnSync(script, [], { input: "not-json", encoding: "utf8", env: hookEnv({}) });
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
