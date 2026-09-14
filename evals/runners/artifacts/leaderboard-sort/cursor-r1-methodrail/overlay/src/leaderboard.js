export function rankLeaderboard(entries) {
  return [...entries].sort((left, right) => {
    const byScore = right.score - left.score;
    if (byScore !== 0) return byScore;
    if (left.name < right.name) return -1;
    if (left.name > right.name) return 1;
    return 0;
  });
}
