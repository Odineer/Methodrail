import assert from "node:assert/strict";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { architectHandoff, initVerificationHandoff } from "../src/composition/handoff.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test("init investigation stops before verification generation", () => {
  const effects = initVerificationHandoff(root, "investigate");
  assert.equal(effects.includes("write"), false);
  assert.equal(effects.includes("execute"), false);
});

test("init apply invokes verification generation only after confirmation", () => {
  const effects = initVerificationHandoff(root, "apply");
  assert.equal(effects.includes("write"), true);
  assert.equal(effects.includes("execute"), true);
});

test("architect composed under develop returns a design and does not implement", () => {
  const result = architectHandoff(root, "develop");
  assert.equal(result.stopped, true);
  assert.equal(result.effects.includes("implement"), false);
  assert.deepEqual(result.returns, ["alternatives", "recommendation", "unresolved"]);
});

test("standalone architect can implement when that was requested", () => {
  const result = architectHandoff(root, "standalone");
  assert.equal(result.effects.includes("implement"), true);
});
