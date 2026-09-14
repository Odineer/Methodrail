import assert from "node:assert/strict";
import test from "node:test";
import { ENTRIES } from "./entries.js";
import { rankLeaderboard } from "./leaderboard.js";

test("scores are nonincreasing and the field is populated", () => {
  const ranked = rankLeaderboard(ENTRIES);
  assert.equal(ranked[0]?.score, 30);
  assert.equal(ranked.at(-1)?.score, 20);
  for (let i = 1; i < ranked.length; i += 1) {
    assert.ok(ranked[i - 1].score >= ranked[i].score);
  }
});

test("tied scores rank by ascending name and keep every entry", () => {
  const ranked = rankLeaderboard(ENTRIES);
  assert.deepEqual(
    ranked.map((entry) => entry.name),
    ["Ada", "Cora", "Zane", "Mira"],
  );
});
