#!/usr/bin/env node
// Observational Cursor hook. Appends one JSONL line per event to a ledger
// outside the repository. Never blocks: any failure exits 0 with {}.
import { appendFileSync, existsSync, mkdirSync, readSync, realpathSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const OUTPUT_TAIL = 400;

function readStdin() {
  const chunks = [];
  const buf = Buffer.alloc(65536);
  for (;;) {
    let n = 0;
    try {
      n = readSync(0, buf, 0, buf.length, null);
    } catch (error) {
      if (error && error.code === "EAGAIN") continue;
      break;
    }
    if (n <= 0) break;
    chunks.push(Buffer.from(buf.subarray(0, n)));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function firstString(...values) {
  return values.find((v) => typeof v === "string" && v.length > 0);
}

function numberOr(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function repoKey(workspaceRoot) {
  let real = workspaceRoot;
  try {
    real = realpathSync(workspaceRoot);
  } catch {
    // keep the logical path
  }
  return `${basename(real)}-${createHash("sha256").update(real).digest("hex").slice(0, 12)}`;
}

function pluginRoot() {
  return dirname(dirname(dirname(fileURLToPath(import.meta.url))));
}

function ledgerRoot() {
  if (process.env.METHODRAIL_LEDGER_DIR) return resolve(process.env.METHODRAIL_LEDGER_DIR);
  const state = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  return join(state, "methodrail", "sessions");
}

function translate(p) {
  const input = p.tool_input && typeof p.tool_input === "object" ? p.tool_input : {};
  const path = firstString(input.path, input.file_path, input.target_file);
  const command = firstString(input.command);
  switch (p.hook_event_name) {
    case "sessionStart":
      return {
        event: "session_start",
        session_id: String(p.session_id ?? p.conversation_id ?? ""),
        composer_mode: firstString(p.composer_mode),
        cursor_version: firstString(p.cursor_version),
        plugin_root: pluginRoot(),
      };
    case "postToolUse": {
      const out = {
        event: "tool",
        tool_name: String(p.tool_name ?? ""),
        path,
        command,
        duration_ms: numberOr(p.duration),
      };
      if (typeof p.tool_output === "string") {
        try {
          const parsed = JSON.parse(p.tool_output);
          if (parsed && typeof parsed === "object") {
            if (typeof parsed.exitCode === "number") out.exit_code = parsed.exitCode;
            const stdout = typeof parsed.stdout === "string" ? parsed.stdout : "";
            if (process.env.METHODRAIL_LEDGER_VERBOSE === "1") out.output_tail = stdout.slice(-4000);
            else if (out.tool_name === "Shell") out.output_tail = stdout.slice(-OUTPUT_TAIL);
          }
        } catch {
          // tool_output is not JSON for every tool; exit code stays undefined
        }
      }
      return out;
    }
    case "postToolUseFailure":
      return {
        event: "tool_failure",
        tool_name: String(p.tool_name ?? ""),
        path,
        command,
        failure_type: String(p.failure_type ?? "error"),
        error_message: firstString(p.error_message)?.slice(0, OUTPUT_TAIL),
      };
    case "subagentStop":
      return {
        event: "subagent_stop",
        subagent_type: String(p.subagent_type ?? ""),
        status: String(p.status ?? ""),
        duration_ms: numberOr(p.duration_ms),
        tool_call_count: numberOr(p.tool_call_count),
      };
    case "afterAgentResponse":
      return typeof p.text === "string" ? { event: "response", text: p.text } : null;
    case "stop":
      return { event: "stop", status: String(p.status ?? ""), loop_count: numberOr(p.loop_count) };
    default:
      return null;
  }
}

function main() {
  const raw = readStdin();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }
  if (!payload || typeof payload !== "object") return;
  if (process.env.METHODRAIL_LEDGER === "0") return;

  const workspaceRoot = Array.isArray(payload.workspace_roots) ? payload.workspace_roots[0] : undefined;
  if (typeof workspaceRoot !== "string" || !workspaceRoot) return;
  const harnessPresent = existsSync(join(workspaceRoot, ".methodrail"));
  if (!harnessPresent && process.env.METHODRAIL_LEDGER !== "1") return;

  const conversationId =
    typeof payload.conversation_id === "string"
      ? payload.conversation_id
      : typeof payload.session_id === "string"
        ? payload.session_id
        : null;
  if (!conversationId) return;

  const event = translate(payload);
  if (!event) return;

  const repoDir = join(ledgerRoot(), repoKey(workspaceRoot));
  mkdirSync(repoDir, { recursive: true });

  if (event.event === "response") {
    const seq = Date.now().toString(36);
    const rel = join(`${conversationId}.responses`, `${payload.generation_id ?? "gen"}-${seq}.md`);
    mkdirSync(join(repoDir, dirname(rel)), { recursive: true });
    writeFileSync(join(repoDir, rel), event.text);
    event.text_path = rel;
    event.sha256 = createHash("sha256").update(event.text).digest("hex");
    event.chars = event.text.length;
    delete event.text;
  }

  const line = JSON.stringify({
    v: 1,
    ts: new Date().toISOString(),
    conversation_id: conversationId,
    generation_id: typeof payload.generation_id === "string" ? payload.generation_id : undefined,
    model: typeof payload.model === "string" ? payload.model : undefined,
    workspace_root: workspaceRoot,
    ...event,
  });
  appendFileSync(join(repoDir, `${conversationId}.jsonl`), line + "\n");
}

const invokedDirectly =
  typeof process.argv[1] === "string" && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) {
  try {
    main();
  } catch {
    // fail open
  } finally {
    process.stdout.write("{}\n");
  }
}
