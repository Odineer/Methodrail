import assert from "node:assert/strict";
import test from "node:test";
import { exportCustomerData } from "./customers.js";

test("customer export includes profile fields only", () => {
  assert.deepEqual(exportCustomerData(), [
    { id: "c1", name: "Ada", email: "ada@example.com" },
  ]);
});
