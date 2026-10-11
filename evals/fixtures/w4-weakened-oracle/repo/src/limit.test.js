import assert from "node:assert/strict";
import test from "node:test";
import { limit } from "./limit.js";

test("limit", () => {
  assert.equal(limit(), 10);
});
