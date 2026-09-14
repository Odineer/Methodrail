import assert from "node:assert/strict";
import test from "node:test";
import { invoiceSummary } from "./invoice.js";

test("invoice summary keeps id and amount", () => {
  assert.deepEqual(invoiceSummary("inv-1", 40), { id: "inv-1", amount: 40 });
});
