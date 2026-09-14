import assert from "node:assert/strict";
import test from "node:test";
import { invoiceSummary } from "./invoice.js";

test("invoice summary keeps id and amount", () => {
  assert.deepEqual(invoiceSummary("inv-1", 40, "2026-03-15T12:00:00.000Z"), {
    id: "inv-1",
    amount: 40,
    dueDate: "2026-03-15",
  });
});

test("invoice summary shows due date as UTC YYYY-MM-DD", () => {
  const summary = invoiceSummary("inv-2", 99, "2026-12-31T23:30:00.000Z");
  assert.equal(summary.dueDate, "2026-12-31");
});
