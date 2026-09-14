import assert from "node:assert/strict";
import test from "node:test";
import { invoiceSummary } from "./invoice.js";

test("invoice summary keeps id and amount", () => {
  assert.deepEqual(invoiceSummary("inv-1", 40), { id: "inv-1", amount: 40 });
});

test("invoice summary shows due date as UTC YYYY-MM-DD", () => {
  assert.deepEqual(
    invoiceSummary("inv-1", 40, "2026-03-16T00:30:00+05:30"),
    { id: "inv-1", amount: 40, dueDate: "2026-03-15" },
  );
});
