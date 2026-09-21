import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ledgerToRun } from "../src/ledger/to-run.js";
import type { LedgerEvent } from "../src/ledger/types.js";

const base = { v: 1 as const, conversation_id: "c", workspace_root: "/w", model: "m" };
const t = (s: number) => new Date(1_700_000_000_000 + s * 1000).toISOString();

test("ledgerToRun derives skills, references, verification phases, subagents, and answer", () => {
  const dir = mkdtempSync(join(tmpdir(), "methodrail-ledger-run-"));
  try {
    mkdirSync(join(dir, "c.responses"));
    writeFileSync(join(dir, "c.responses/g-1.md"), "Fixed. Tests pass.");
    const events: LedgerEvent[] = [
      { ...base, ts: t(0), event: "session_start", session_id: "c", plugin_root: "/plug" },
      { ...base, ts: t(1), event: "tool", tool_name: "Read", path: "/w/.methodrail/PROJECT.md" },
      { ...base, ts: t(2), event: "tool", tool_name: "Read", path: "/plug/skills/debug/SKILL.md" },
      { ...base, ts: t(3), event: "tool", tool_name: "Read", path: "/plug/skills/debug/SKILL.md" },
      { ...base, ts: t(4), event: "tool", tool_name: "Read", path: "/plug/references/rigor.md" },
      { ...base, ts: t(5), event: "tool", tool_name: "Shell", command: "node --test src/x.test.js", exit_code: 1 },
      { ...base, ts: t(6), event: "tool", tool_name: "StrReplace", path: "/w/src/x.js" },
      { ...base, ts: t(7), event: "tool", tool_name: "Shell", command: "node --test src/x.test.js", exit_code: 0 },
      { ...base, ts: t(8), event: "tool", tool_name: "Shell", command: "npm test", exit_code: 0 },
      { ...base, ts: t(9), event: "tool", tool_name: "Shell", command: "ls", exit_code: 0 },
      { ...base, ts: t(10), event: "subagent_stop", subagent_type: "explore", status: "completed" },
      { ...base, ts: t(11), event: "response", text_path: "c.responses/g-1.md", sha256: "x", chars: 18 },
      { ...base, ts: t(12), event: "stop", status: "completed" },
    ];
    const { run, commandLog, answer } = ledgerToRun(events, dir, {
      fixtureId: "runtime-bug",
      condition: "methodrail",
      host: "cursor",
      repeat: 1,
      pluginRoot: "/plug",
      workspaceRoot: "/w",
    });
    assert.deepEqual(run.skills_invoked, ["debug"]);
    assert.deepEqual(run.references_loaded, [".methodrail/PROJECT.md", "references/rigor.md"]);
    assert.deepEqual(run.tools_used, ["read", "shell", "strreplace"]);
    assert.equal(run.subagents_used, 1);
    assert.equal(run.capture, "hook_captured");
    assert.equal(run.provenance, "live");
    assert.equal(run.latency_ms, 12000);
    assert.deepEqual(
      commandLog.map((c) => c.phase),
      ["repro", "regression", "verify", "other"],
    );
    assert.equal(run.verification_steps.length, 3);
    assert.equal(answer, "Fixed. Tests pass.");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
