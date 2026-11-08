import assert from "node:assert/strict";
import test from "node:test";
import { normalizeJob } from "./job.mjs";

test("an omitted delay defaults to 60 seconds", () => {
  assert.deepEqual(normalizeJob({ id: "current" }), { id: "current", retryDelay: 60 });
});

test("version 1 payloads remain supported", () => {
  assert.deepEqual(normalizeJob({ task_id: "legacy" }), { id: "legacy", retryDelay: 60 });
});
