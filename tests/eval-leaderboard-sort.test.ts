import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { gradeLeaderboardModule } from "../evals/fixtures/leaderboard-sort/hidden-grader.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const fixture = join(root, "evals/fixtures/leaderboard-sort");
const repo = join(fixture, "repo");

test("leaderboard weak test passes the score-only implementation", () => {
  const output = execFileSync("node", ["--test", "src/leaderboard.test.js"], {
    cwd: repo,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "/usr/bin" },
  });
  assert.match(output, /pass 1/);
  assert.match(output, /fail 0/);
});

test("hidden grader fails score-only ranking", async () => {
  const result = await gradeLeaderboardModule(join(repo, "src/leaderboard.js"));
  assert.equal(result.passed, false);
  assert.deepEqual(result.ids, ["zane", "cora", "ada", "mira"]);
});

test("hidden grader passes score-desc then name-asc ranking", async () => {
  const result = await gradeLeaderboardModule(join(fixture, "cases/correct.js"));
  assert.equal(result.passed, true);
  assert.deepEqual(result.ids, ["ada", "cora", "zane", "mira"]);
});

test("hidden grader fails an implementation that drops tied names", async () => {
  const result = await gradeLeaderboardModule(join(fixture, "cases/drop-ties.js"));
  assert.equal(result.passed, false);
  assert.equal(result.preserved, false);
});
