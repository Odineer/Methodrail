import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const FROZEN = [
  ["src/eval/grade-outcome.ts", "926bf51b7d3526cdf4efae7ae87d1f6ee4a86c27576e366e2fbc67567db568c4"],
  ["evals/release-policy.yaml", "6284bf5c651f91fe93efc79bfe6a23b985521c3f1075e58d8445b2d765b0a765"],
  ["evals/pilot-v0.9-project-artifact-interoperability.yaml", "c5c52983bc2b1786108ca6edc7c75f4f40de86db80a58c9870c228438451c2c3"],
  ["evals/fixtures/decision-ladder/task.md", "f39430740932809fcdc78c434cdadc4a3180f667b3543baaf18f895327ee9c6e"],
  ["evals/fixtures/knowledge-reconciliation-v0.9/task.md", "b8ddecca02810afecf4c8dd5fc983c08d904166b2d7bbdd304f2a9bc88256de3"],
  ["evals/fixtures/architecture-deepening/task.md", "2b429dca8431581f0effb289ac38f77e0acd7abdb8e02b1688e1732a28c74f4c"],
] as const;

test("v0.9 declared freeze SHA-256 values still match", () => {
  for (const [rel, expected] of FROZEN) {
    const actual = createHash("sha256").update(readFileSync(join(root, rel))).digest("hex");
    assert.equal(actual, expected, rel);
  }
});
