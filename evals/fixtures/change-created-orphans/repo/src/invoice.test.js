import assert from "node:assert/strict";
import test from "node:test";
import { invoiceDueLabel } from "./invoice.js";

test("invoice due label uses YYYY-MM-DD", () => {
  assert.equal(invoiceDueLabel("2026-09-13T12:00:00.000Z"), "Due 2026-09-13");
});
