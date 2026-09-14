export function rankLeaderboard(entries) {
  const best = new Map();
  for (const entry of entries) {
    const current = best.get(entry.score);
    if (!current) best.set(entry.score, entry);
  }
  return [...best.values()].sort((left, right) => right.score - left.score);
}
