import assert from "node:assert/strict";
import test from "node:test";
import { classifyReadPath, parseLedger } from "../src/ledger/parse.js";

const base = { v: 1, ts: "2026-09-21T00:00:00Z", conversation_id: "c1", workspace_root: "/w" };

test("parseLedger keeps well-formed events and counts malformed lines", () => {
  const text = [
    JSON.stringify({ ...base, event: "session_start", session_id: "c1" }),
    "not json",
    JSON.stringify({ ...base, event: "tool", tool_name: "Shell", command: "npm test", exit_code: 0 }),
    JSON.stringify({ ...base, event: "unknown_thing" }),
    "",
  ].join("\n");
  const { events, malformed } = parseLedger(text);
  assert.equal(events.length, 2);
  assert.equal(malformed, 2);
  assert.equal(events[1]?.event, "tool");
});

test("classifyReadPath recognizes plugin skills, project skills, references, and harness files", () => {
  const ctx = { pluginRoot: "/plug", workspaceRoot: "/w" };
  assert.deepEqual(classifyReadPath("/plug/skills/how/SKILL.md", ctx), { kind: "skill", name: "how", origin: "plugin" });
  assert.deepEqual(classifyReadPath("/w/.cursor/skills/verify-shop/SKILL.md", ctx), {
    kind: "skill",
    name: "verify-shop",
    origin: "project",
  });
  assert.deepEqual(classifyReadPath("/w/.agents/skills/verify-shop/SKILL.md", ctx), {
    kind: "skill",
    name: "verify-shop",
    origin: "project",
  });
  assert.deepEqual(classifyReadPath("/plug/references/rigor.md", ctx), { kind: "reference", rel: "references/rigor.md" });
  assert.deepEqual(classifyReadPath("/plug/skills/how/references/critique.md", ctx), {
    kind: "reference",
    rel: "skills/how/references/critique.md",
  });
  assert.deepEqual(classifyReadPath("/plug/rules/methodrail.mdc", ctx), { kind: "reference", rel: "rules/methodrail.mdc" });
  assert.deepEqual(classifyReadPath("/w/.methodrail/knowledge/fees.md", ctx), {
    kind: "harness",
    rel: ".methodrail/knowledge/fees.md",
  });
  assert.deepEqual(classifyReadPath("/w/src/app.ts", ctx), { kind: "other" });
  assert.deepEqual(classifyReadPath("/w/src/app.ts", { pluginRoot: null, workspaceRoot: "/w" }), { kind: "other" });
});
