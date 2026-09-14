#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { ENTRIES } from "./repo/src/entries.js";

const EXPECTED_IDS = ["ada", "cora", "zane", "mira"];

export async function gradeLeaderboardModule(modulePath) {
  const mod = await import(pathToFileURL(modulePath).href);
  const ranked = mod.rankLeaderboard(ENTRIES);
  const ids = Array.isArray(ranked) ? ranked.map((row) => row?.id) : [];
  const expectedSet = new Set(ENTRIES.map((entry) => entry.id));
  const actualSet = new Set(ids);
  const orderOk = ids.length === EXPECTED_IDS.length && ids.every((id, i) => id === EXPECTED_IDS[i]);
  const preserved = expectedSet.size === actualSet.size && [...expectedSet].every((id) => actualSet.has(id));
  return {
    passed: orderOk && preserved,
    ids,
    expected: EXPECTED_IDS,
    preserved,
    detail: orderOk && preserved
      ? "identity order is score desc, name asc, all entries kept"
      : `wanted ${EXPECTED_IDS.join(",")} and every entry; got ${ids.join(",")}`,
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
