import assert from "node:assert/strict";
import test from "node:test";
import { summarizeLedgers } from "../src/ledger/summarize.js";
import type { LedgerEvent } from "../src/ledger/types.js";

const base = { v: 1 as const, workspace_root: "/w", ts: "2026-09-21T00:00:00Z" };

test("summarizeLedgers counts skill loads, verification, and unverified edits per session", () => {
  const verified: LedgerEvent[] = [
    { ...base, conversation_id: "verified", event: "session_start", session_id: "verified", plugin_root: "/plug" },
    { ...base, conversation_id: "verified", event: "tool", tool_name: "Read", path: "/plug/skills/develop/SKILL.md" },
    { ...base, conversation_id: "verified", event: "tool", tool_name: "Read", path: "/plug/skills/verify-change/SKILL.md" },
    { ...base, conversation_id: "verified", event: "tool", tool_name: "Read", path: "/plug/references/rigor.md" },
    { ...base, conversation_id: "verified", event: "tool", tool_name: "Shell", command: "npm test", exit_code: 0 },
    { ...base, conversation_id: "verified", event: "stop", status: "completed" },
  ];
  const unverified: LedgerEvent[] = [
    { ...base, conversation_id: "unverified", event: "session_start", session_id: "unverified", plugin_root: "/plug" },
    { ...base, conversation_id: "unverified", event: "tool", tool_name: "StrReplace", path: "/w/src/x.ts" },
    { ...base, conversation_id: "unverified", event: "stop", status: "completed" },
  ];
  const summary = summarizeLedgers(
    [
      { path: "verified.jsonl", text: verified.map((event) => JSON.stringify(event)).join("\n") },
      { path: "unverified.jsonl", text: unverified.map((event) => JSON.stringify(event)).join("\n") },
    ],
    "/plug",
  );
  assert.equal(summary.sessions, 2);
  assert.equal(summary.sessions_with_any_skill, 1);
  assert.deepEqual(summary.skill_loads, { develop: 1, "verify-change": 1 });
  assert.deepEqual(summary.reference_loads, { "references/rigor.md": 1 });
  assert.equal(summary.sessions_with_verification, 1);
  assert.equal(summary.sessions_ending_without_verification_after_edit, 1);
  assert.equal(summary.subagent_sessions, 0);
  assert.equal(summary.malformed_lines, 0);
});

test("verification before the last edit is not sufficient", () => {
  const events: LedgerEvent[] = [
    { ...base, conversation_id: "stale", event: "session_start", session_id: "stale", plugin_root: "/plug" },
    { ...base, conversation_id: "stale", event: "tool", tool_name: "Write", path: "/w/src/a.ts" },
    { ...base, conversation_id: "stale", event: "tool", tool_name: "Shell", command: "npm test", exit_code: 0 },
    { ...base, conversation_id: "stale", event: "tool", tool_name: "Write", path: "/w/src/a.ts" },
    { ...base, conversation_id: "stale", event: "stop", status: "completed" },
  ];
  const summary = summarizeLedgers(
    [{ path: "stale.jsonl", text: events.map((event) => JSON.stringify(event)).join("\n") }],
    "/plug",
  );
  assert.equal(summary.sessions_ending_without_verification_after_edit, 1);
  assert.equal(summary.post_edit_verification.none, 1);
  assert.equal(summary.post_edit_verification.passed, 0);
});

test("post-edit verification distinguishes passed, failed, and unknown results", () => {
  function session(id: string, command: LedgerEvent): LedgerEvent[] {
    return [
      { ...base, conversation_id: id, event: "session_start", session_id: id, plugin_root: "/plug" },
      { ...base, conversation_id: id, event: "tool", tool_name: "StrReplace", path: "/w/src/a.ts" },
      command,
      { ...base, conversation_id: id, event: "stop", status: "completed" },
    ];
  }
  const passed: LedgerEvent = { ...base, conversation_id: "passed", event: "tool", tool_name: "Shell", command: "npm test", exit_code: 0 };
  const failed: LedgerEvent = { ...base, conversation_id: "failed", event: "tool", tool_name: "Shell", command: "npm test", exit_code: 1 };
  const unknown: LedgerEvent = {
    ...base,
    conversation_id: "unknown",
    event: "tool_failure",
    tool_name: "Shell",
    command: "npm test",
    failure_type: "error",
  };
  const summary = summarizeLedgers(
    [
      { path: "passed.jsonl", text: session("passed", passed).map((event) => JSON.stringify(event)).join("\n") },
      { path: "failed.jsonl", text: session("failed", failed).map((event) => JSON.stringify(event)).join("\n") },
      { path: "unknown.jsonl", text: session("unknown", unknown).map((event) => JSON.stringify(event)).join("\n") },
    ],
    "/plug",
  );
  assert.equal(summary.post_edit_verification.passed, 1);
  assert.equal(summary.post_edit_verification.failed, 1);
  assert.equal(summary.post_edit_verification.unknown, 1);
  assert.equal(summary.sessions_ending_without_verification_after_edit, 2);
});
