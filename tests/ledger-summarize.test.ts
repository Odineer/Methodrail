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
