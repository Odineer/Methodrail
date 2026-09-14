export function rankLeaderboard(entries) {
  entries.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  for (const row of entries) row.score = -999;
  return entries;
}
