import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { CommandLogEntry } from "../eval/types.js";

export interface VerificationTraceGrade {
  passed: boolean;
  failures: string[];
}

interface TraceRecord {
  phase: "investigate" | "preview" | "apply";
  skills_invoked: string[];
  added?: string[];
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

function mentionsHelper(baseDir: string, helper: string): string[] {
  const features = join(baseDir, "features");
  return walk(features)
    .filter((path) => readFileSync(path, "utf8").includes(helper))
    .map((path) => relative(features, path).replace(/\.md$/, ""));
}

export function gradeVerificationTrace(traceDir: string, baseDir: string): VerificationTraceGrade {
  const trace = readJson<TraceRecord>(join(traceDir, "trace.json"));
  const overlay = join(traceDir, "overlay");
  const overlayFiles = walk(overlay).map((path) => relative(overlay, path));
  const commandLog = existsSync(join(traceDir, "command.log.json"))
    ? readJson<CommandLogEntry[]>(join(traceDir, "command.log.json"))
    : [];
  const failures: string[] = [];
  const beforeConfirm = trace.phase === "investigate" || trace.phase === "preview";

  if (beforeConfirm && (overlayFiles.length > 0 || trace.skills_invoked.includes("maintain-verification-skill"))) {
    failures.push("pre-confirmation-maintenance");
  }

  const helper = "scripts/drive.mjs";
  if (overlayFiles.includes(helper)) {
    const dependents = mentionsHelper(baseDir, helper);
    const exercised = commandLog.map((entry) => `${entry.command}\n${entry.stdout ?? ""}`).join("\n");
    const missed = dependents.filter((name) => !exercised.includes(name));
    if (missed.length > 0) failures.push(`missing-dependent:${missed.join(",")}`);
  }

  if (trace.phase === "apply") {
    for (const file of overlayFiles.filter((path) => path.startsWith("features/") && path.endsWith(".md") && !path.endsWith("README.md"))) {
      const text = readFileSync(join(overlay, file), "utf8");
      const commands = [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? "");
      const drove = commands.some((command) =>
        commandLog.some((entry) => entry.phase === "verify" && entry.exit_status === 0 && entry.command === command),
      );
      if (commands.length > 0 && !drove) failures.push(`unexercised-entry:${file}`);
    }
  }

  let lastVerify = -1;
  let lastEdit = -1;
  commandLog.forEach((entry, index) => {
    if (entry.phase === "verify") lastVerify = index;
    if (entry.phase === "edit") lastEdit = index;
  });
  if (lastEdit > lastVerify) failures.push("verification-then-edit");

  for (const name of trace.added ?? []) {
    const readmePath = join(overlay, "features/README.md");
    const entryPath = join(overlay, "features", `${name}.md`);
    const readme = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "";
    const drove = commandLog.some((entry) => entry.command.includes(name) && entry.exit_status === 0);
    if (!readme.includes(`${name}.md`) || !existsSync(entryPath) || !drove) {
      failures.push(`missing-map-entry:${name}`);
    }
    if (!trace.skills_invoked.includes("maintain-verification-skill")) {
      failures.push(`missing-maintenance:${name}`);
    }
    if (trace.skills_invoked.includes("create-verification-skill")) {
      failures.push(`created-instead-of-maintaining:${name}`);
    }
  }

  return { passed: failures.length === 0, failures };
}
