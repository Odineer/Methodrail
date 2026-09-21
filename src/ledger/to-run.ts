import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { classifyReadPath } from "./parse.js";
import type { LedgerEvent } from "./types.js";
import type { CommandLogEntry, EvalRun, VerificationRecord } from "../eval/types.js";

export interface LedgerRunOptions {
  fixtureId: string;
  condition: "baseline" | "methodrail";
  host: string;
  repeat?: number;
  pluginRoot: string | null;
  workspaceRoot: string;
}

export interface LedgerRunOutput {
  run: EvalRun;
  commandLog: CommandLogEntry[];
  answer: string | null;
}

const VERIFY_RE = /test|node |npm run|pytest|cargo|go test|make/;
const EDIT_TOOLS = new Set(["Write", "StrReplace", "Delete", "Edit"]);
const VERIFY_PHASES = new Set(["repro", "regression", "verify"]);

function unique(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

export function classifyCommands(events: LedgerEvent[]): CommandLogEntry[] {
  const firstEdit = events.findIndex((event) => event.event === "tool" && EDIT_TOOLS.has(event.tool_name));
  let postEditVerify = 0;
  const log: CommandLogEntry[] = [];
  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    if (!event || (event.event !== "tool" && event.event !== "tool_failure")) continue;
    if (event.tool_name !== "Shell") continue;
    const command = event.command ?? "";
    const isVerifyish = VERIFY_RE.test(command);
    let phase: string;
    if (!isVerifyish) phase = "other";
    else if (firstEdit === -1 || i < firstEdit) phase = "repro";
    else {
      postEditVerify += 1;
      phase = postEditVerify === 1 ? "regression" : "verify";
    }
    const entry: CommandLogEntry = {
      command,
      exit_status: event.event === "tool" ? (event.exit_code ?? null) : null,
      phase,
    };
    if (event.event === "tool" && event.output_tail) entry.stdout = event.output_tail;
    log.push(entry);
  }
  return log;
}

export function ledgerToRun(events: LedgerEvent[], responsesDir: string, opts: LedgerRunOptions): LedgerRunOutput {
  const pluginRoot =
    opts.pluginRoot ??
    events.find((event): event is Extract<LedgerEvent, { event: "session_start" }> => event.event === "session_start")
      ?.plugin_root ??
    null;
  const ctx = { pluginRoot, workspaceRoot: opts.workspaceRoot };
  const skills: string[] = [];
  const references: string[] = [];
  const tools: string[] = [];
  for (const event of events) {
    if (event.event !== "tool") continue;
    tools.push(event.tool_name.toLowerCase());
    if (event.tool_name !== "Read" || !event.path) continue;
    const classified = classifyReadPath(event.path, ctx);
    if (classified.kind === "skill") skills.push(classified.name);
    if (classified.kind === "reference" || classified.kind === "harness") references.push(classified.rel);
  }
  const commandLog = classifyCommands(events);
  const verification_steps: VerificationRecord[] = commandLog
    .filter((entry) => typeof entry.phase === "string" && VERIFY_PHASES.has(entry.phase))
    .map((entry) => {
      const record: VerificationRecord = { command: entry.command, exit_status: entry.exit_status };
      if (entry.phase === "repro" || entry.phase === "regression" || entry.phase === "verify") {
        record.phase = entry.phase;
      }
      return record;
    });
  const responses = events.filter((event): event is Extract<LedgerEvent, { event: "response" }> => event.event === "response");
  const lastResponse = responses[responses.length - 1];
  let answer: string | null = null;
  if (lastResponse) {
    const path = join(responsesDir, lastResponse.text_path);
    if (existsSync(path)) answer = readFileSync(path, "utf8");
  }
  const started = events[0]?.ts;
  const stop = [...events].reverse().find((event) => event.event === "stop") ?? events[events.length - 1];
  const ended = stop?.ts;
  const latency_ms =
    started && ended ? Math.max(0, Date.parse(ended) - Date.parse(started)) : null;
  const run: EvalRun = {
    fixture_id: opts.fixtureId,
    condition: opts.condition,
    provenance: "live",
    capture: "hook_captured",
    host: opts.host,
    skills_invoked: unique(skills),
    references_loaded: unique(references),
    tools_used: unique(tools),
    subagents_used: events.filter((event) => event.event === "subagent_stop").length,
    verification_steps,
    evidence: [],
    outcome: (answer ?? "").slice(0, 300),
    failure_modes: [],
  };
  const model = events.find((event) => event.model)?.model;
  if (model) run.model = model;
  if (opts.repeat !== undefined) run.repeat = opts.repeat;
  if (started) run.started_at = started;
  if (ended) run.ended_at = ended;
  if (latency_ms != null && !Number.isNaN(latency_ms)) run.latency_ms = latency_ms;
  return { run, commandLog, answer };
}

export function responsesDirOf(ledgerPath: string): string {
  return dirname(ledgerPath);
}
