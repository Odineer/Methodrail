#!/usr/bin/env node
import { readFileSync, readdirSync, mkdtempSync, rmSync } from "node:fs";
import { join, dirname, basename, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { parse } from "yaml";
import {
  buildPreflight,
  loadMatrixRows,
  loadSkillOrigins,
  parseCliArgs,
  resolveRecord,
} from "./upstream-preflight.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function recordFiles(upstreamsDir = join(root, "upstreams")) {
  return readdirSync(upstreamsDir)
    .filter((name) => name.endsWith(".yaml"))
    .map((name) => join(upstreamsDir, name));
}

export function loadRecords(upstreamsDir = join(root, "upstreams")) {
  return recordFiles(upstreamsDir).map((path) => {
    const value = parse(readFileSync(path, "utf8"));
    return {
      file: path,
      stem: basename(path, ".yaml"),
      name: String(value.name ?? ""),
      repository: String(value.repository ?? ""),
      imported: String(value.last_reviewed_commit ?? ""),
      path: String(value.path ?? ""),
    };
  });
}

export function gitLsRemote(repository) {
  try {
    const out = execFileSync("git", ["ls-remote", repository, "HEAD"], {
      encoding: "utf8",
      timeout: 20000,
    });
    return out.trim().split(/\s+/, 1)[0] ?? "";
  } catch {
    return "";
  }
}

export function listChangedPaths(repository, imported, head) {
  if (!repository || !imported || !head || imported === head) return [];
  const dir = mkdtempSync(join(tmpdir(), "methodrail-upstream-"));
  try {
    execFileSync("git", ["init", "--bare", dir], { stdio: "ignore" });
    fetchCommit(dir, repository, imported);
    fetchCommit(dir, repository, head);
    const out = execFileSync("git", ["--git-dir", dir, "diff", "--name-only", imported, head], {
      encoding: "utf8",
      timeout: 20000,
    });
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function fetchCommit(dir, repository, sha) {
  execFileSync("git", ["--git-dir", dir, "fetch", "--filter=blob:none", "--depth", "1", repository, sha], {
    stdio: "ignore",
    timeout: 60000,
  });
}

function printText(records, skills) {
  for (const record of records) {
    const head = record.repository ? gitLsRemote(record.repository) : "";
    const status = !head ? "unreachable" : head === record.imported ? "current" : "changed";
    console.log(`${record.name}:`);
    console.log(`  imported: ${record.imported || "(missing)"}`);
    console.log(`  upstream: ${head || "(network unavailable)"}`);
    console.log(`  status: ${status}`);
    console.log("");
  }

  console.log("Tracked skills:");
  for (const skill of skills) {
    console.log(`  ${skill.name}: ${skill.originSource} / ${skill.originPath} @ ${skill.sha || "(unrecorded)"}`);
  }
}

export function run(argv = process.argv.slice(2), deps = {}) {
  const args = parseCliArgs(argv);
  const records = (deps.loadRecords ?? loadRecords)();
  const skills = (deps.loadSkillOrigins ?? loadSkillOrigins)(root);
  const selected = args.upstream
    ? [resolveRecord(records, args.upstream)].filter(Boolean)
    : records;

  if (args.upstream && selected.length === 0) {
    throw new Error(`Unknown upstream: ${args.upstream}`);
  }

  if (args.format === "text") {
    printText(selected, skills);
    return;
  }

  const record = selected[0];
  const gitLs = deps.gitLsRemote ?? gitLsRemote;
  const listPaths = deps.listChangedPaths ?? listChangedPaths;
  const head = record.repository ? gitLs(record.repository) : "";
  let changedPaths = [];
  let diffError;
  if (head && head !== record.imported) {
    const listed = listPaths(record.repository, record.imported, head);
    if (listed == null) diffError = "could not list changed paths";
    else changedPaths = listed;
  }
  const payload = buildPreflight({
    record,
    head,
    changedPaths,
    skills,
    matrixRows: (deps.loadMatrixRows ?? loadMatrixRows)(root),
    diffError,
  });
  console.log(JSON.stringify(payload, null, 2));
}

function isCli() {
  const invoked = process.argv[1];
  return Boolean(invoked) && import.meta.url === pathToFileURL(resolve(invoked)).href;
}

if (isCli()) {
  try {
    run();
  } catch (error) {
    console.error((error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
