export function rankLeaderboard(entries) {
  return [...entries].sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return left.name.localeCompare(right.name);
  });
}
