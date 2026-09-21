import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { parseLedger } from "../src/ledger/parse.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const script = join(root, "scripts/hooks/session-ledger.mjs");

function fire(event: string, payload: Record<string, unknown>, env: Record<string, string>) {
  const input = JSON.stringify({
    conversation_id: "conv-1",
    generation_id: "gen-1",
    model: "test-model",
    cursor_version: "9.9",
    hook_event_name: event,
    workspace_roots: [env.WORKSPACE],
    ...payload,
  });
  const result = spawnSync(process.execPath, [script], {
    input,
    encoding: "utf8",
    env: { ...process.env, METHODRAIL_LEDGER: "", ...env },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), "{}");
  return result;
}

function setup(withHarness: boolean) {
  const workspace = mkdtempSync(join(tmpdir(), "methodrail-hook-ws-"));
  const ledgerDir = mkdtempSync(join(tmpdir(), "methodrail-hook-ledger-"));
  if (withHarness) mkdirSync(join(workspace, ".methodrail"));
  return { workspace, ledgerDir, env: { WORKSPACE: workspace, METHODRAIL_LEDGER_DIR: ledgerDir } };
}

test("hook is silent and writes nothing when the workspace has no .methodrail", () => {
  const { workspace, ledgerDir, env } = setup(false);
  try {
    fire("postToolUse", { tool_name: "Read", tool_input: { path: "/x" } }, env);
    assert.deepEqual(readdirSync(ledgerDir), []);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
    rmSync(ledgerDir, { recursive: true, force: true });
  }
});

test("hook appends one JSONL event per Cursor event and stores response bodies", () => {
  const { workspace, ledgerDir, env } = setup(true);
  try {
    fire("sessionStart", { session_id: "conv-1", composer_mode: "agent" }, env);
    fire(
      "postToolUse",
      { tool_name: "Read", tool_input: { path: `${workspace}/.methodrail/PROJECT.md` }, duration: 12 },
      env,
    );
    fire(
      "postToolUse",
      {
        tool_name: "Shell",
        tool_input: { command: "npm test" },
        tool_output: JSON.stringify({ exitCode: 0, stdout: "ok" }),
        duration: 800,
      },
      env,
    );
    fire(
      "postToolUseFailure",
      {
        tool_name: "Shell",
        tool_input: { command: "npm run nope" },
        failure_type: "error",
        error_message: "missing script",
      },
      env,
    );
    fire(
      "subagentStop",
      { subagent_type: "explore", status: "completed", duration_ms: 500, tool_call_count: 3 },
      env,
    );
    fire("afterAgentResponse", { text: "Done. Tests pass." }, env);
    fire("stop", { status: "completed", loop_count: 0 }, env);

    const repoDirs = readdirSync(ledgerDir);
    assert.equal(repoDirs.length, 1);
    const ledgerPath = join(ledgerDir, repoDirs[0]!, "conv-1.jsonl");
    assert.ok(existsSync(ledgerPath));
    const { events, malformed } = parseLedger(readFileSync(ledgerPath, "utf8"));
    assert.equal(malformed, 0);
    assert.deepEqual(
      events.map((e) => e.event),
      ["session_start", "tool", "tool", "tool_failure", "subagent_stop", "response", "stop"],
    );
    const shell = events[2];
    assert.ok(shell && shell.event === "tool");
    assert.equal(shell.command, "npm test");
    assert.equal(shell.exit_code, 0);
    const response = events[5];
    assert.ok(response && response.event === "response");
    assert.equal(readFileSync(join(ledgerDir, repoDirs[0]!, response.text_path), "utf8"), "Done. Tests pass.");
  } finally {
    rmSync(workspace, { recursive: true, force: true });
    rmSync(ledgerDir, { recursive: true, force: true });
  }
});

test("hook exits 0 with {} on garbage input", () => {
  const result = spawnSync(process.execPath, [script], { input: "not json", encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "{}");
});

test("METHODRAIL_LEDGER=0 disables writing even with a harness", () => {
  const { workspace, ledgerDir, env } = setup(true);
  try {
    fire("stop", { status: "completed" }, { ...env, METHODRAIL_LEDGER: "0" });
    assert.deepEqual(readdirSync(ledgerDir), []);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
    rmSync(ledgerDir, { recursive: true, force: true });
  }
});
