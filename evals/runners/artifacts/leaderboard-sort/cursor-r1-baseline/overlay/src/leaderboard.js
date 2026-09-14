export function rankLeaderboard(entries) {
  return [...entries].sort((left, right) => {
    const scoreDiff = right.score - left.score;
    if (scoreDiff !== 0) return scoreDiff;
    if (left.name < right.name) return -1;
    if (left.name > right.name) return 1;
    return 0;
  });
}
