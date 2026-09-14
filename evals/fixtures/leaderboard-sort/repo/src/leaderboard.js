/** Score-only ranking. Tied names keep input order. */
export function rankLeaderboard(entries) {
  return [...entries].sort((left, right) => right.score - left.score);
}
