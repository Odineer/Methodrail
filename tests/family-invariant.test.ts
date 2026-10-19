import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { hostProjections, readCanonicalInvariant } from "../src/family-invariant.js";
import { evaluateProjectMd } from "../src/project-md.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test("Cursor, Claude, Codex, and Z Code projections match the canonical family invariant", () => {
  const body = readCanonicalInvariant(root);
  const projections = hostProjections(body);
  assert.ok(body.length > 200 && body.length < 2500);
  for (const [relativePath, expected] of Object.entries(projections)) {
    assert.equal(readFileSync(join(root, relativePath), "utf8"), expected, relativePath);
    assert.ok(expected.includes(body), relativePath);
  }
});

test("this repository's PROJECT.md stays a pointer index", () => {
  const source = readFileSync(join(root, ".methodrail/PROJECT.md"), "utf8");
  const quality = evaluateProjectMd(source);
  assert.deepEqual(quality.issues, []);
  assert.equal(quality.ok, true);
});
