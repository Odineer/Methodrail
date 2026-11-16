import { existsSync, lstatSync, readdirSync, realpathSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const DEFAULT_SKIP = new Set([".git", "dist", "node_modules"]);

export function pathInside(parent: string, child: string): boolean {
  const root = resolve(parent);
  const target = resolve(child);
  return target === root || target.startsWith(root + sep);
}

function realpathOrNull(path: string): string | null {
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}

/**
 * List files under `root`. Directory and file symlinks that escape `root`'s
 * realpath, or that revisit a realpath already seen, are skipped.
 * `followSymlinks: false` skips every symlink, so an alias that sorts first
 * cannot claim a canonical path's realpath.
 */
export function walkFiles(
  root: string,
  predicate: (path: string) => boolean,
  options?: { skipNames?: Iterable<string>; followSymlinks?: boolean },
): string[] {
  if (!existsSync(root)) return [];
  const rootReal = realpathOrNull(root);
  if (!rootReal) return [];
  const skip = new Set(options?.skipNames ?? DEFAULT_SKIP);
  const followSymlinks = options?.followSymlinks ?? true;
  const files: string[] = [];
  const visited = new Set<string>();

  const visit = (logicalDir: string): void => {
    const dirReal = realpathOrNull(logicalDir);
    if (!dirReal || !pathInside(rootReal, dirReal) || visited.has(dirReal)) return;
    visited.add(dirReal);
    let entries: string[];
    try {
      entries = readdirSync(logicalDir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skip.has(entry)) continue;
      const path = join(logicalDir, entry);
      let lstat;
      try {
        lstat = lstatSync(path);
      } catch {
        continue;
      }
      if (lstat.isSymbolicLink()) {
        if (!followSymlinks) continue;
        const real = realpathOrNull(path);
        if (!real || !pathInside(rootReal, real) || visited.has(real)) continue;
        let followed;
        try {
          followed = statSync(path);
        } catch {
          continue;
        }
        if (followed.isDirectory()) visit(path);
        else if (predicate(path)) files.push(path);
        continue;
      }
      if (lstat.isDirectory()) visit(path);
      else if (predicate(path)) files.push(path);
    }
  };

  visit(root);
  return files;
}

/**
 * Find `.methodrail` directories under a repository. The `.methodrail` entry
 * itself may be a linked-external symlink and is recorded, not entered.
 * Other directory symlinks that escape the repository or cycle are skipped.
 */
export function findMethodrailDirs(repoRoot: string): string[] {
  if (!existsSync(repoRoot)) return [];
  const repoReal = realpathOrNull(repoRoot);
  if (!repoReal) return [];
  const found: string[] = [];
  const visited = new Set<string>();
  const skip = new Set(DEFAULT_SKIP);

  const visit = (logicalDir: string): void => {
    const dirReal = realpathOrNull(logicalDir);
    if (!dirReal || !pathInside(repoReal, dirReal) || visited.has(dirReal)) return;
    visited.add(dirReal);
    let entries: string[];
    try {
      entries = readdirSync(logicalDir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (skip.has(entry)) continue;
      const path = join(logicalDir, entry);
      const rel = relative(repoRoot, path).split(sep).join("/");
      if (rel.startsWith("evals/runners/artifacts/")) continue;
      let lstat;
      try {
        lstat = lstatSync(path);
      } catch {
        continue;
      }
      if (entry === ".methodrail" && (lstat.isDirectory() || lstat.isSymbolicLink())) {
        found.push(path);
        continue;
      }
      if (lstat.isSymbolicLink()) {
        const real = realpathOrNull(path);
        if (!real || !pathInside(repoReal, real) || visited.has(real)) continue;
        let followed;
        try {
          followed = statSync(path);
        } catch {
          continue;
        }
        if (followed.isDirectory()) visit(path);
        continue;
      }
      if (lstat.isDirectory()) visit(path);
    }
  };

  visit(repoRoot);
  return found;
}
