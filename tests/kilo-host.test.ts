import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { EXPLICIT_SKILLS, SUGGEST_ONLY_SKILLS } from "../src/skill-invocation.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

// Kilo Code ignores disable-model-invocation and when_to_use, so its projected
// rule is the only place the explicit-invocation guard reaches the model.
test("Kilo projection names every explicit skill and the suggest-only guard", () => {
  const rule = readFileSync(join(root, "adapters/kilo/methodrail.md"), "utf8");
  const guard = rule.split("\n").find((line) => line.startsWith("Kilo Code ignores")) ?? "";
  assert.match(guard, /disable-model-invocation/);
  const [loadOnly, suggest] = guard.split("Suggest ");
  for (const name of EXPLICIT_SKILLS) {
    const target = (SUGGEST_ONLY_SKILLS as readonly string[]).includes(name) ? suggest : loadOnly;
    assert.match(target ?? "", new RegExp(`\`${name}\``), name);
  }
});
