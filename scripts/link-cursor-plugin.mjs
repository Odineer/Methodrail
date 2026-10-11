#!/usr/bin/env node
// Copy the Cursor plugin surfaces into ~/.cursor/plugins/local. The checkout stays put.
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Directories the local plugin must expose. `scripts/hooks` is the ledger command path. */
export const PLUGIN_SURFACES = [
  ".cursor-plugin",
  "skills",
  "rules",
  "references",
  "templates",
  "hooks",
  "assets",
  "scripts/hooks",
];

const ALLOWED_ENTRIES = new Set([
  ".cursor-plugin",
  "skills",
  "rules",
  "references",
  "templates",
  "hooks",
  "assets",
  "scripts",
]);

function realpathOrNull(path) {
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}

export function defaultPluginDir(env = process.env) {
  return env.METHODRAIL_PLUGIN_DIR || join(homedir(), ".cursor", "plugins", "local", "methodrail");
}

function inside(parent, child) {
  const root = resolve(parent);
  const target = resolve(child);
  return target === root || target.startsWith(root + sep);
}

function replaceWithCopy(source, dest, pluginRoot) {
  let stat = null;
  try {
    stat = lstatSync(dest);
  } catch {
    stat = null;
  }
  if (stat?.isSymbolicLink()) {
    rmSync(dest);
  } else if (stat) {
    const destReal = realpathSync(dest);
    const sourceReal = realpathSync(source);
    const pluginReal = realpathSync(pluginRoot);
    if (destReal === sourceReal || !inside(pluginReal, destReal)) {
      throw new Error(`Refusing to replace ${dest}`);
    }
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(source, dest, { recursive: true, dereference: true });
}

/**
 * Copy this checkout's plugin surfaces into `pluginDir`.
 * Cursor reads only real files inside the plugin directory. A symlink whose
 * target sits outside that directory is skipped, so the skills never appear.
 */
export function linkCursorPlugin(repoRoot, pluginDir) {
  const repo = resolve(repoRoot);
  const dest = resolve(pluginDir);
  const repoReal = realpathOrNull(repo);
  const destReal = realpathOrNull(dest);
  if (repoReal && destReal && repoReal === destReal) {
    throw new Error(`Refusing to copy: ${dest} is the checkout. Move the repository out of the plugin directory first.`);
  }

  let rootStat = null;
  try {
    rootStat = lstatSync(dest);
  } catch {
    rootStat = null;
  }
  if (rootStat?.isSymbolicLink()) {
    rmSync(dest);
    rootStat = null;
  }
  if (rootStat && !rootStat.isDirectory()) {
    throw new Error(`Refusing to replace ${dest}`);
  }
  if (rootStat?.isDirectory()) {
    if (existsSync(join(dest, ".git"))) {
      throw new Error(`Refusing to modify a git checkout at ${dest}`);
    }
    for (const name of readdirSync(dest)) {
      if (!ALLOWED_ENTRIES.has(name)) {
        throw new Error(`Refusing to modify ${dest}: unexpected entry ${name}`);
      }
    }
    const scriptsPath = join(dest, "scripts");
    let scriptsStat = null;
    try {
      scriptsStat = lstatSync(scriptsPath);
    } catch {
      scriptsStat = null;
    }
    if (scriptsStat?.isSymbolicLink()) rmSync(scriptsPath);
  }

  mkdirSync(dest, { recursive: true });
  mkdirSync(join(dest, "scripts"), { recursive: true });

  for (const surface of PLUGIN_SURFACES) {
    const source = join(repo, surface);
    if (!existsSync(source)) throw new Error(`Missing ${source}`);
    replaceWithCopy(source, join(dest, surface), dest);
  }

  return { repoRoot: repo, pluginDir: dest, surfaces: [...PLUGIN_SURFACES] };
}

function main() {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const linked = linkCursorPlugin(repoRoot, defaultPluginDir());
  console.log(`plugin:     ${linked.pluginDir}`);
  console.log(`repository: ${linked.repoRoot}`);
  console.log(`copied:     ${linked.surfaces.join(", ")}`);
  console.log("Reload the Cursor window. Skills appear in a new chat.");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
