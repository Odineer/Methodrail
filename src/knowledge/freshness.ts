import { existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { isGitSha } from "./validate.js";
import type { FreshnessResult, KnowledgeNote } from "./types.js";

function git(projectRoot: string, args: string[]): string | null {
  if (!existsSync(join(projectRoot, ".git"))) return null;
  try {
    return execFileSync("git", args, {
      cwd: projectRoot,
      encoding: "utf8",
      timeout: 8000,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

export function evaluateFreshness(note: KnowledgeNote, projectRoot: string): FreshnessResult {
  if (note.classification !== "typed" || !note.frontmatter) {
    return { state: "unknown", evidence: "Note has no typed provenance" };
  }
  const { validated_at, relevant_paths } = note.frontmatter;
  if (!isGitSha(validated_at)) {
    return { state: "unknown", evidence: `validated_at is not a resolvable Git revision (${validated_at})` };
  }
  const resolved = git(projectRoot, ["rev-parse", "--verify", `${validated_at}^{commit}`]);
  if (!resolved) {
    return { state: "unknown", evidence: `Git revision ${validated_at} is not available in this repository` };
  }
  const ignored = relevant_paths.filter((path) => git(projectRoot, ["check-ignore", "-q", "--", path]) !== null);
  if (ignored.length > 0) {
    return {
      state: "unknown",
      evidence: `Relevant path is ignored by Git, so freshness cannot be proven: ${ignored.join(", ")}`,
    };
  }
  const directories = relevant_paths.filter((path) => {
    try {
      return statSync(join(projectRoot, path)).isDirectory();
    } catch {
      return false;
    }
  });
  if (directories.length > 0) {
    const hidden = git(projectRoot, ["ls-files", "--others", "-i", "--exclude-standard", "--", ...directories]);
    const hiddenPaths = (hidden ?? "").split(/\r?\n/).filter(Boolean);
    if (hidden === null || hiddenPaths.length > 0) {
      return {
        state: "unknown",
        evidence: `Ignored descendants of a relevant path prevent freshness verification: ${hiddenPaths.join(", ") || directories.join(", ")}`,
      };
    }
  }
  const changedTracked = git(projectRoot, ["diff", "--name-only", validated_at, "--", ...relevant_paths]);
  const changedUntracked = git(projectRoot, ["ls-files", "--others", "--exclude-standard", "--", ...relevant_paths]);
  if (changedTracked === null || changedUntracked === null) {
    return { state: "unknown", evidence: "Could not compare relevant_paths against the current worktree" };
  }
  const changed = [...changedTracked.split(/\r?\n/), ...changedUntracked.split(/\r?\n/)]
    .filter(Boolean)
    .filter((path, index, paths) => paths.indexOf(path) === index)
    .sort();
  if (changed.length > 0) {
    return {
      state: "review-required",
      evidence: `Relevant paths changed since ${validated_at}: ${changed.join(", ")}`,
    };
  }
  return { state: "fresh", evidence: `No relevant_paths changes since ${validated_at}` };
}
