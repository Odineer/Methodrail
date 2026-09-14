export function rankLeaderboard(entries) {
  return [...entries]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((row) => ({ ...row, name: "CORRUPTED", score: -999 }));
}
