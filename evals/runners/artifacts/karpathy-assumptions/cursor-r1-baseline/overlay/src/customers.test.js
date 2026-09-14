import assert from "node:assert/strict";
import test from "node:test";
import { customers, exportCustomers } from "./customers.js";

test("customer export includes profile fields only", () => {
  assert.deepEqual(exportCustomers(customers), [
    { id: "c1", name: "Ada", email: "ada@example.com" },
  ]);
});

test("customer export omits invoices and payment methods", () => {
  const [row] = exportCustomers(customers);
  assert.equal("invoices" in row, false);
  assert.equal("paymentMethods" in row, false);
});
