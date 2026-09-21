import { classifyReadPath, parseLedger } from "./parse.js";
import { classifyCommands } from "./to-run.js";
import type { LedgerEvent } from "./types.js";

export interface LedgerSummary {
  sessions: number;
  sessions_with_any_skill: number;
  skill_loads: Record<string, number>;
  reference_loads: Record<string, number>;
  harness_reads: Record<string, number>;
  sessions_with_verification: number;
  sessions_ending_without_verification_after_edit: number;
  subagent_sessions: number;
  malformed_lines: number;
}

const EDIT_TOOLS = new Set(["Write", "StrReplace", "Delete", "Edit"]);
const VERIFY_AFTER = new Set(["regression", "verify"]);

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function pluginRootOf(events: LedgerEvent[], fallback: string | null): string | null {
  const start = events.find((event): event is Extract<LedgerEvent, { event: "session_start" }> => event.event === "session_start");
  return start?.plugin_root ?? fallback;
}

export function summarizeLedgers(
  files: { path: string; text: string }[],
  pluginRoot: string | null,
): LedgerSummary {
  const summary: LedgerSummary = {
    sessions: 0,
    sessions_with_any_skill: 0,
    skill_loads: {},
    reference_loads: {},
    harness_reads: {},
    sessions_with_verification: 0,
    sessions_ending_without_verification_after_edit: 0,
    subagent_sessions: 0,
    malformed_lines: 0,
  };
  for (const file of files) {
    const { events, malformed } = parseLedger(file.text);
    summary.malformed_lines += malformed;
    if (events.length === 0) continue;
    summary.sessions += 1;
    const root = pluginRootOf(events, pluginRoot);
    const workspaceRoot = events[0]?.workspace_root ?? "";
    const skills = new Set<string>();
    const references = new Set<string>();
    const harness = new Set<string>();
    for (const event of events) {
      if (event.event !== "tool" || event.tool_name !== "Read" || !event.path) continue;
      const classified = classifyReadPath(event.path, { pluginRoot: root, workspaceRoot });
      if (classified.kind === "skill") skills.add(classified.name);
      if (classified.kind === "reference") references.add(classified.rel);
      if (classified.kind === "harness") harness.add(classified.rel);
    }
    if (skills.size > 0) summary.sessions_with_any_skill += 1;
    for (const name of skills) bump(summary.skill_loads, name);
    for (const rel of references) bump(summary.reference_loads, rel);
    for (const rel of harness) bump(summary.harness_reads, rel);
    const commands = classifyCommands(events);
    if (commands.some((entry) => entry.phase === "repro" || entry.phase === "regression" || entry.phase === "verify")) {
      summary.sessions_with_verification += 1;
    }
    const edited = events.some((event) => event.event === "tool" && EDIT_TOOLS.has(event.tool_name));
    if (edited && !commands.some((entry) => typeof entry.phase === "string" && VERIFY_AFTER.has(entry.phase))) {
      summary.sessions_ending_without_verification_after_edit += 1;
    }
    if (events.some((event) => event.event === "subagent_stop")) summary.subagent_sessions += 1;
  }
  return summary;
}

function table(title: string, counts: Record<string, number>): string[] {
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (rows.length === 0) return [`### ${title}`, "", "_none_", ""];
  return [`### ${title}`, "", "| name | sessions |", "| --- | ---: |", ...rows.map(([name, n]) => `| ${name} | ${n} |`), ""];
}

export function formatSummary(summary: LedgerSummary): string {
  const skillRatio = summary.sessions === 0 ? "0/0" : `${summary.sessions_with_any_skill}/${summary.sessions}`;
  const unverified = summary.sessions === 0 ? "0/0" : `${summary.sessions_ending_without_verification_after_edit}/${summary.sessions}`;
  return [
    `# Ledger summary`,
    "",
    `- sessions: ${summary.sessions}`,
    `- sessions with any skill: ${skillRatio}`,
    `- sessions with verification: ${summary.sessions_with_verification}/${summary.sessions}`,
    `- sessions without verification after edit: ${unverified}`,
    `- subagent sessions: ${summary.subagent_sessions}`,
    `- malformed lines: ${summary.malformed_lines}`,
    "",
    ...table("Skill loads", summary.skill_loads),
    ...table("Reference loads", summary.reference_loads),
    ...table("Harness reads", summary.harness_reads),
  ].join("\n");
}
