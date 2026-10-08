import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { PLUGIN_SURFACES } from "../scripts/link-cursor-plugin.mjs";
import { walkFiles } from "./fs-walk.js";

/** Trees compared against the checkout. Cursor only reads real files inside the plugin directory. */
export const SHIPPED_TREES = PLUGIN_SURFACES;

export type InstallStatus = "linked" | "identical" | "stale" | "missing" | "rejected";

export interface DoctorReport {
  repoRoot: string;
  pluginDir: string;
  status: InstallStatus;
  repoVersion: string | null;
  installedVersion: string | null;
  differing: string[];
}

export function defaultPluginDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.METHODRAIL_PLUGIN_DIR || join(homedir(), ".cursor", "plugins", "local", "methodrail");
}

function realpathOrNull(path: string): string | null {
  try {
    return realpathSync(path);
  } catch {
    return null;
  }
}

function pluginVersion(root: string): string | null {
  const manifest = join(root, ".cursor-plugin", "plugin.json");
  if (!existsSync(manifest)) return null;
  try {
    const parsed = JSON.parse(readFileSync(manifest, "utf8")) as { version?: unknown };
    return typeof parsed.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}

function pluginSymlinkEscapesLocalRoot(pluginDir: string): boolean {
  let stat;
  try {
    stat = lstatSync(pluginDir);
  } catch {
    return false;
  }
  if (!stat.isSymbolicLink()) return false;
  const real = realpathOrNull(pluginDir);
  const localRoot = resolve(pluginDir, "..");
  if (!real) return true;
  return real !== localRoot && !real.startsWith(localRoot + sep);
}

function shippedHashes(root: string): Map<string, string> {
  const hashes = new Map<string, string>();
  for (const tree of SHIPPED_TREES) {
    for (const file of walkFiles(join(root, tree), () => true)) {
      const rel = relative(root, file).split(sep).join("/");
      hashes.set(rel, createHash("sha256").update(readFileSync(file)).digest("hex"));
    }
  }
  return hashes;
}

export function diagnoseInstall(repoRoot: string, pluginDir: string): DoctorReport {
  const base = {
    repoRoot: resolve(repoRoot),
    pluginDir: resolve(pluginDir),
    repoVersion: pluginVersion(repoRoot),
  };
  if (!existsSync(pluginDir)) {
    return { ...base, status: "missing", installedVersion: null, differing: [] };
  }
  if (pluginSymlinkEscapesLocalRoot(pluginDir)) {
    return { ...base, status: "rejected", installedVersion: pluginVersion(pluginDir), differing: [] };
  }
  const repoReal = realpathOrNull(repoRoot);
  const pluginReal = realpathOrNull(pluginDir);
  if (repoReal && pluginReal && repoReal === pluginReal) {
    return { ...base, status: "linked", installedVersion: base.repoVersion, differing: [] };
  }

  const expected = shippedHashes(repoRoot);
  const installed = shippedHashes(pluginDir);
  const differing = [...new Set([...expected.keys(), ...installed.keys()])]
    .filter((rel) => expected.get(rel) !== installed.get(rel))
    .sort();
  const installedVersion = pluginVersion(pluginDir);
  const status: InstallStatus =
    differing.length === 0 && installedVersion === base.repoVersion ? "identical" : "stale";
  return { ...base, status, installedVersion, differing };
}

export function formatDoctor(report: DoctorReport): string {
  const lines = [
    `installed plugin: ${report.pluginDir}`,
    `repository:       ${report.repoRoot}`,
    `status:           ${report.status}`,
  ];
  switch (report.status) {
    case "linked":
      lines.push("This checkout is the plugin directory. Cursor can read it. To keep the rest of the repository elsewhere, move the checkout and run npm run link-plugin.");
      break;
    case "identical":
      lines.push(
        `Installed copy matches HEAD (version ${report.repoVersion ?? "unknown"}). Cursor reads these real files after a window reload.`,
      );
      lines.push("The copy drifts after the next edit. Refresh it with: npm run link-plugin");
      break;
    case "stale": {
      lines.push(
        `Installed version ${report.installedVersion ?? "unknown"} differs from repository version ${report.repoVersion ?? "unknown"}; ${report.differing.length} shipped file(s) differ.`,
      );
      const shown = report.differing.slice(0, 15);
      for (const rel of shown) lines.push(`  - ${rel}`);
      if (report.differing.length > shown.length) lines.push(`  … ${report.differing.length - shown.length} more`);
      lines.push("Cursor skips plugin files that are symlinks to the checkout, so those skills do not appear.");
      lines.push("Refresh the copy: npm run link-plugin");
      break;
    }
    case "missing":
      lines.push("Methodrail is not installed as a local Cursor plugin.");
      lines.push("Install: npm run link-plugin");
      break;
    case "rejected":
      lines.push("Cursor does not load a plugin directory that is a symlink to a checkout outside the local plugins folder.");
      lines.push("Remove that symlink and run: npm run link-plugin");
      break;
  }
  return lines.join("\n");
}

function main(): void {
  const repoRoot = resolve(process.argv[2] ?? process.cwd());
  const report = diagnoseInstall(repoRoot, defaultPluginDir());
  console.log(formatDoctor(report));
  if (report.status === "stale" || report.status === "missing" || report.status === "rejected") process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
