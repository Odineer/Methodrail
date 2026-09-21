#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { findMethodrailDirs } from "../../src/fs-walk.js";
import { evaluateFreshness } from "../../src/knowledge/freshness.js";
import { knowledgeIndexEntries, loadProjectMd } from "../../src/knowledge/load.js";
import { evaluateRepositoryKnowledge } from "../../src/knowledge/report.js";
import type { KnowledgeNote } from "../../src/knowledge/types.js";
import { repoKey } from "../../src/ledger/parse.js";

export interface KnowledgeSnapshot {
  repo_key: string;
  git_head: string | null;
  date: string;
  notes_total: number;
  by_kind: Record<string, number>;
  by_lifecycle: Record<string, number>;
  by_freshness: {
    "dependency-fresh": number;
    "review-required": number;
    unknown: number;
  };
  malformed: number;
  disputed: number;
  retired: number;
  indexed_in_project_md: number;
  broken_pointers: number;
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function projectRootOf(note: KnowledgeNote): string {
  const marker = `${sep}.methodrail${sep}`;
  const idx = note.absolutePath.lastIndexOf(marker);
  if (idx >= 0) return note.absolutePath.slice(0, idx);
  return dirname(dirname(note.absolutePath));
}

function gitHead(repoRoot: string): string | null {
  try {
    const toplevel = execFileSync("git", ["-C", repoRoot, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      timeout: 8000,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    let realRoot = repoRoot;
    let realTop = toplevel;
    try {
      realRoot = realpathSync(repoRoot);
      realTop = realpathSync(toplevel);
    } catch {
      // compare logical paths
    }
    if (realRoot !== realTop) return null;
    const head = execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], {
      encoding: "utf8",
      timeout: 8000,
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
    return /^[0-9a-f]{40}$/.test(head) ? head : null;
  } catch {
    return null;
  }
}

function countIndexed(repoRoot: string): number {
  let indexed = 0;
  const seen = new Set<string>();
  for (const methodrail of findMethodrailDirs(repoRoot)) {
    const projectRoot =
      methodrail.endsWith(`${sep}.methodrail`) || methodrail.endsWith("/.methodrail")
        ? methodrail.slice(0, -".methodrail".length - 1)
        : methodrail;
    if (seen.has(projectRoot)) continue;
    seen.add(projectRoot);
    const projectMd = loadProjectMd(projectRoot);
    if (!projectMd) continue;
    const methodrailRoot = resolve(projectRoot, ".methodrail");
    for (const entry of knowledgeIndexEntries(projectMd)) {
      let href: string;
      try {
        href = decodeURIComponent(entry.href);
      } catch {
        continue;
      }
      const target = resolve(methodrailRoot, href);
      try {
        if (existsSync(target) && statSync(target).isFile()) indexed += 1;
      } catch {
        // missing target is a broken pointer, counted separately
      }
    }
  }
  return indexed;
}

export function snapshotKnowledge(repoRoot: string, now = new Date()): KnowledgeSnapshot {
  const report = evaluateRepositoryKnowledge(repoRoot);
  const by_kind: Record<string, number> = {};
  const by_lifecycle: Record<string, number> = {};
  const by_freshness = {
    "dependency-fresh": 0,
    "review-required": 0,
    unknown: 0,
  };
  let malformed = 0;
  let disputed = 0;
  let retired = 0;

  for (const note of report.notes) {
    if (note.classification === "invalid-typed" || note.parseError) malformed += 1;
    if (note.classification === "typed" && note.frontmatter) {
      bump(by_kind, note.frontmatter.kind);
      bump(by_lifecycle, note.frontmatter.lifecycle);
      if (note.frontmatter.lifecycle === "disputed") disputed += 1;
      if (note.frontmatter.lifecycle === "retired") retired += 1;
      const freshness = evaluateFreshness(note, projectRootOf(note));
      if (freshness.state === "fresh") by_freshness["dependency-fresh"] += 1;
      else if (freshness.state === "review-required") by_freshness["review-required"] += 1;
      else by_freshness.unknown += 1;
    } else {
      by_freshness.unknown += 1;
    }
  }

  let broken_pointers = 0;
  for (const diagnostic of [...report.errors, ...report.warnings]) {
    if (
      /Knowledge index target does not exist/i.test(diagnostic.message) ||
      /Broken evidence or verification pointer/i.test(diagnostic.message)
    ) {
      broken_pointers += 1;
    }
  }

  return {
    repo_key: repoKey(repoRoot),
    git_head: gitHead(repoRoot),
    date: now.toISOString().slice(0, 10),
    notes_total: report.notes.length,
    by_kind,
    by_lifecycle,
    by_freshness,
    malformed,
    disputed,
    retired,
    indexed_in_project_md: countIndexed(repoRoot),
    broken_pointers,
  };
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function main(argv: string[]): void {
  const { values, positionals } = parseArgs({
    args: argv,
    options: { out: { type: "string" } },
    allowPositionals: true,
  });
  const repoRoot = resolve(positionals[0] ?? process.cwd());
  const snapshot = snapshotKnowledge(repoRoot);
  const json = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (values.out) {
    const out = resolve(values.out);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, json);
    console.log(out);
  } else {
    process.stdout.write(json);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    fail((error as Error).message);
  }
}
