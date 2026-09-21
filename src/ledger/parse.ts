import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { basename, relative, resolve, sep } from "node:path";
import { LEDGER_EVENTS, type LedgerEvent, type ReadClass } from "./types.js";

export function parseLedger(text: string): { events: LedgerEvent[]; malformed: number } {
  const events: LedgerEvent[] = [];
  let malformed = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const value = JSON.parse(line) as Partial<LedgerEvent>;
      if (
        value &&
        typeof value === "object" &&
        typeof value.event === "string" &&
        LEDGER_EVENTS.has(value.event) &&
        typeof value.conversation_id === "string"
      ) {
        events.push(value as LedgerEvent);
      } else {
        malformed += 1;
      }
    } catch {
      malformed += 1;
    }
  }
  return { events, malformed };
}

const SKILL_RE = /^skills\/([a-z0-9][a-z0-9-]*)\/SKILL\.md$/;
const PROJECT_SKILL_RE = /^(?:\.cursor|\.agents|\.claude)\/skills\/([a-z0-9][a-z0-9-]*)\/SKILL\.md$/;

function relInside(root: string | null, path: string): string | null {
  if (!root) return null;
  const rel = relative(resolve(root), resolve(path));
  if (!rel || rel.startsWith("..") || rel.startsWith(sep)) return null;
  return rel.split(sep).join("/");
}

export function classifyReadPath(
  path: string,
  ctx: { pluginRoot: string | null; workspaceRoot: string },
): ReadClass {
  const inPlugin = relInside(ctx.pluginRoot, path);
  if (inPlugin) {
    const skill = SKILL_RE.exec(inPlugin);
    if (skill) return { kind: "skill", name: skill[1]!, origin: "plugin" };
    if (
      inPlugin.startsWith("references/") ||
      inPlugin.startsWith("rules/") ||
      /^skills\/[^/]+\/references\//.test(inPlugin) ||
      /^skills\/[^/]+\/[^/]+\.md$/.test(inPlugin)
    ) {
      return { kind: "reference", rel: inPlugin };
    }
  }
  const inWorkspace = relInside(ctx.workspaceRoot, path);
  if (inWorkspace) {
    const skill = PROJECT_SKILL_RE.exec(inWorkspace);
    if (skill) return { kind: "skill", name: skill[1]!, origin: "project" };
    if (inWorkspace.startsWith(".methodrail/")) return { kind: "harness", rel: inWorkspace };
  }
  return { kind: "other" };
}

export function repoKey(workspaceRoot: string): string {
  let real = workspaceRoot;
  try {
    real = realpathSync(workspaceRoot);
  } catch {
    // keep the logical path
  }
  return `${basename(real)}-${createHash("sha256").update(real).digest("hex").slice(0, 12)}`;
}
