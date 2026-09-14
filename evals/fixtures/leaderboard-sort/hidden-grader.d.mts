export function gradeLeaderboardModule(modulePath: string): Promise<{
  passed: boolean;
  ids: string[];
  expected: string[];
  preserved: boolean;
  detail: string;
}>;
