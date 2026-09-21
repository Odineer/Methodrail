export function parseCliArgs(argv: string[]): { format: "text" | "json"; upstream: string | null };

export function parseOrigin(line: string): { source: string; originPath: string } | null;

export function parseSkillOrigin(
  name: string,
  source: string,
): { name: string; originSource: string; originPath: string; sha: string } | null;

export function githubSlug(repository: string): string;

export function recordAliases(record: {
  stem?: string;
  name?: string;
  repository?: string;
}): string[];

export function originBelongsToRecord(
  originSource: string,
  record: { stem?: string; name?: string; repository?: string },
): boolean;

export function parseMatrix(markdown: string): {
  names: string[];
  decision: string;
  capability: string;
}[];

export function loadSkillOrigins(root: string): {
  name: string;
  originSource: string;
  originPath: string;
  sha: string;
}[];

export function loadMatrixRows(root: string): {
  names: string[];
  decision: string;
  capability: string;
}[];

export function classifyChangedPaths(input: {
  changedPaths: string[];
  skills: { name: string; originSource: string; originPath: string; sha: string }[];
  record: { stem: string; name: string; repository: string; imported: string; path?: string };
  matrixRows: { names: string[]; decision: string; capability: string }[];
}): {
  mapped: {
    methodrail_skill: string;
    origin_path: string;
    decision: string;
    upstream_sha_recorded: string;
    changed_paths: string[];
    action_hint: string;
  }[];
  discoveries: { upstream_path: string; matrix_decision: string; note: string }[];
  unmapped_changes: string[];
};

export function buildPreflight(input: {
  record: { stem: string; name: string; repository: string; imported: string; path?: string };
  head: string;
  changedPaths?: string[] | null;
  skills: { name: string; originSource: string; originPath: string; sha: string }[];
  matrixRows: { names: string[]; decision: string; capability: string }[];
  diffError?: string;
}): {
  upstream: string;
  repository: string;
  imported: string;
  head: string | null;
  status: string;
  mapped: {
    methodrail_skill: string;
    origin_path: string;
    decision: string;
    upstream_sha_recorded: string;
    changed_paths: string[];
    action_hint: string;
  }[];
  discoveries: { upstream_path: string; matrix_decision: string; note: string }[];
  unmapped_changes: string[];
  relevance?: "mapped" | "discoveries-only" | "unrelated";
  diff_error?: string;
};

export function relevanceOf(classified: {
  mapped: unknown[];
  discoveries: unknown[];
}): "mapped" | "discoveries-only" | "unrelated";

export function describeRelevance(payload: {
  status: string;
  relevance?: string;
  diff_error?: string;
  mapped: { methodrail_skill: string }[];
  discoveries: unknown[];
  unmapped_changes: string[];
}): string;

export function resolveRecord<T extends { stem: string; name: string; repository: string }>(
  records: T[],
  name: string,
): T | undefined;
