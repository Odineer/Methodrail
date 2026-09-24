#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveBoundRepository } from "./harness-manifest.mjs";

const EXCLUDE_PATTERN = "/.methodrail";

function git(repositoryRoot, args) {
  return execFileSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function canonicalRepository(path) {
  const requested = realpathSync(resolve(path));
  const root = realpathSync(git(requested, ["rev-parse", "--show-toplevel"]));
  if (requested !== root) throw new Error(`--repo must be the Git root: ${root}`);
  return root;
}

function inside(parent, child) {
  return child === parent || child.startsWith(parent + sep);
}

function resolveWriteTarget(path) {
  const missing = [];
  let cursor = resolve(path);
  while (true) {
    let stat;
    try {
      stat = lstatSync(cursor);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      const parent = dirname(cursor);
      if (parent === cursor) throw new Error(`Cannot resolve storage path: ${path}`);
      missing.unshift(basename(cursor));
      cursor = parent;
      continue;
    }
    if (stat.isSymbolicLink()) {
      try {
        return join(realpathSync(cursor), ...missing);
      } catch {
        throw new Error("External harness storage must be outside the repository");
      }
    }
    return join(realpathSync(cursor), ...missing);
  }
}

function canonicalFuturePath(path) {
  let cursor = resolve(path);
  const missing = [];
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) throw new Error(`Cannot resolve storage path: ${path}`);
    missing.unshift(basename(cursor));
    cursor = parent;
  }
  return join(realpathSync(cursor), ...missing);
}

function manifestSource(storageHarnessRoot, repositoryRoot) {
  const repositoryPath = relative(storageHarnessRoot, repositoryRoot).split(sep).join("/");
  return [
    "schema_version: 1",
    "placement: linked-external",
    "repository:",
    `  path: ${JSON.stringify(repositoryPath)}`,
    "",
  ].join("\n");
}

function excludePath(repositoryRoot) {
  const path = git(repositoryRoot, ["rev-parse", "--git-path", "info/exclude"]);
  return isAbsolute(path) ? path : resolve(repositoryRoot, path);
}

function ensureExcluded(repositoryRoot) {
  const path = excludePath(repositoryRoot);
  mkdirSync(dirname(path), { recursive: true });
  const existed = existsSync(path);
  const source = existed ? readFileSync(path, "utf8") : "";
  const lines = source.split(/\r?\n/).map((line) => line.trim());
  if (lines.includes(EXCLUDE_PATTERN)) return { path, undo: null };
  const prefix = source.length === 0 || source.endsWith("\n") ? "" : "\n";
  appendFileSync(path, `${prefix}# Local Methodrail linked harness\n${EXCLUDE_PATTERN}\n`);
  return {
    path,
    undo: () => {
      if (!existed) rmSync(path, { force: true });
      else writeFileSync(path, source);
    },
  };
}

function linkTarget(repositoryRoot, storageHarnessRoot) {
  if (process.platform === "win32") return storageHarnessRoot;
  return relative(repositoryRoot, storageHarnessRoot) || ".";
}

function assertUntracked(repositoryRoot) {
  try {
    git(repositoryRoot, ["ls-files", "--error-unmatch", ".methodrail"]);
    throw new Error(".methodrail is already tracked by Git; refusing linked-external placement");
  } catch (error) {
    if ((error instanceof Error) && error.message.includes("already tracked")) throw error;
  }
}

export function createLinkedHarness(repositoryPath, storagePath) {
  const repositoryRoot = canonicalRepository(repositoryPath);
  assertUntracked(repositoryRoot);
  const logicalHarnessRoot = join(repositoryRoot, ".methodrail");

  let logicalExists = false;
  try {
    logicalExists = Boolean(lstatSync(logicalHarnessRoot));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  let storageRoot;
  let storageHarnessRoot;
  if (logicalExists && lstatSync(logicalHarnessRoot).isSymbolicLink() && !storagePath) {
    storageHarnessRoot = realpathSync(logicalHarnessRoot);
    storageRoot = dirname(storageHarnessRoot);
  } else {
    storageRoot = canonicalFuturePath(
      storagePath ?? join(dirname(repositoryRoot), `${basename(repositoryRoot)}-methodrail`),
    );
    storageHarnessRoot = join(storageRoot, ".methodrail");
  }
  const resolvedHarness = resolveWriteTarget(storageHarnessRoot);
  if (inside(repositoryRoot, storageRoot) || inside(repositoryRoot, resolvedHarness)) {
    throw new Error("External harness storage must be outside the repository");
  }
  const manifestPath = join(storageHarnessRoot, "HARNESS.yaml");

  if (logicalExists) {
    const stat = lstatSync(logicalHarnessRoot);
    if (!stat.isSymbolicLink()) throw new Error("Repository already has a non-linked .methodrail directory");
    const existingTarget = realpathSync(logicalHarnessRoot);
    if (!existsSync(manifestPath) || existingTarget !== realpathSync(storageHarnessRoot)) {
      throw new Error("Repository .methodrail link points to a different harness");
    }
  } else {
    if (existsSync(storageHarnessRoot)) {
      const entries = readFileSafeDirectory(storageHarnessRoot);
      if (entries.length > 0 && !existsSync(manifestPath)) {
        throw new Error(`Refusing to adopt nonempty harness storage without HARNESS.yaml: ${storageHarnessRoot}`);
      }
    }
    const undo = [];
    try {
      const harnessExisted = existsSync(storageHarnessRoot);
      mkdirSync(storageHarnessRoot, { recursive: true });
      if (!harnessExisted) undo.push(() => rmSync(storageHarnessRoot, { recursive: true, force: true }));
      if (existsSync(manifestPath)) {
        const bound = resolveBoundRepository(manifestPath);
        if (bound !== realpathSync(repositoryRoot)) throw new Error("Existing HARNESS.yaml is bound to a different repository");
      } else {
        writeFileSync(manifestPath, manifestSource(storageHarnessRoot, repositoryRoot), { flag: "wx" });
        undo.push(() => rmSync(manifestPath, { force: true }));
      }
      const boundRepository = resolveBoundRepository(manifestPath);
      if (boundRepository !== realpathSync(repositoryRoot)) throw new Error("HARNESS.yaml binding does not match the repository");
      const exclude = ensureExcluded(repositoryRoot);
      if (exclude.undo) undo.push(exclude.undo);
      try {
        git(repositoryRoot, ["check-ignore", "-q", "--", ".methodrail"]);
      } catch {
        throw new Error(`Git does not ignore ${logicalHarnessRoot}; check ${exclude.path}`);
      }
      symlinkSync(linkTarget(repositoryRoot, storageHarnessRoot), logicalHarnessRoot, process.platform === "win32" ? "junction" : "dir");
      undo.push(() => unlinkSync(logicalHarnessRoot));
      return { repositoryRoot, storageRoot, storageHarnessRoot, logicalHarnessRoot, manifestPath, exclude: exclude.path };
    } catch (error) {
      for (const rollback of undo.reverse()) rollback();
      throw error;
    }
  }

  const boundRepository = resolveBoundRepository(manifestPath);
  if (boundRepository !== realpathSync(repositoryRoot)) throw new Error("HARNESS.yaml binding does not match the repository");
  const exclude = ensureExcluded(repositoryRoot);
  try {
    git(repositoryRoot, ["check-ignore", "-q", "--", ".methodrail"]);
  } catch {
    if (exclude.undo) exclude.undo();
    throw new Error(`Git does not ignore ${logicalHarnessRoot}; check ${exclude.path}`);
  }
  return { repositoryRoot, storageRoot, storageHarnessRoot, logicalHarnessRoot, manifestPath, exclude: exclude.path };
}

function readFileSafeDirectory(path) {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command !== "create") {
    console.error("usage: linked-harness.mjs create --repo <git-root> [--storage <external-folder>]");
    process.exit(2);
  }
  const repository = option(args, "--repo");
  if (!repository) throw new Error("--repo is required");
  const result = createLinkedHarness(repository, option(args, "--storage"));
  console.log(JSON.stringify(result, null, 2));
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`linked-harness: ${(error instanceof Error) ? error.message : String(error)}`);
    process.exit(1);
  }
}
