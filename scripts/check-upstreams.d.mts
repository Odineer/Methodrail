export function recordFiles(upstreamsDir?: string): string[];

export function loadRecords(upstreamsDir?: string): {
  file: string;
  stem: string;
  name: string;
  repository: string;
  imported: string;
  path: string;
}[];

export function gitLsRemote(repository: string): string;

export function listChangedPaths(
  repository: string,
  imported: string,
  head: string,
): string[] | null;

export function run(
  argv?: string[],
  deps?: {
    loadRecords?: () => {
      file?: string;
      stem: string;
      name: string;
      repository: string;
      imported: string;
      path?: string;
    }[];
    loadSkillOrigins?: (root: string) => {
      name: string;
      originSource: string;
      originPath: string;
      sha: string;
    }[];
    loadMatrixRows?: (root: string) => {
      names: string[];
      decision: string;
      capability: string;
    }[];
    gitLsRemote?: (repository: string) => string;
    listChangedPaths?: (
      repository: string,
      imported: string,
      head: string,
    ) => string[] | null;
  },
): void;
