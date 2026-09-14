#!/usr/bin/env node
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import { ENTRIES } from "./repo/src/entries.js";

const INPUT = structuredClone(ENTRIES);
const EXPECTED_IDS = ["ada", "cora", "zane", "mira"];

export async function gradeLeaderboardModule(modulePath) {
  const mod = await import(pathToFileURL(modulePath).href);
  const original = structuredClone(INPUT);
  const ranked = mod.rankLeaderboard(structuredClone(original));
  const ids = Array.isArray(ranked) ? ranked.map((row) => row?.id) : [];
  const expectedEntries = new Map(original.map((entry) => [entry.id, entry]));
  const orderOk = ids.length === EXPECTED_IDS.length && ids.every((id, i) => id === EXPECTED_IDS[i]);
  const preserved = Array.isArray(ranked)
    && ranked.length === original.length
    && new Set(ids).size === original.length
    && ranked.every((row) => expectedEntries.has(row?.id)
      && isDeepStrictEqual(row, expectedEntries.get(row.id)));
  return {
    passed: orderOk && preserved,
    ids,
    expected: [...EXPECTED_IDS],
    preserved,
    detail: orderOk && preserved
      ? "identity order is score desc, name asc, all entries kept"
      : `wanted ${EXPECTED_IDS.join(",")} and unchanged entries; got ${ids.join(",")} (preserved=${preserved})`,
  };
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly && process.argv[2]) {
  const result = await gradeLeaderboardModule(process.argv[2]);
  if (!result.passed) {
    console.error(result.detail);
    process.exit(1);
  }
  console.log(result.detail);
}
