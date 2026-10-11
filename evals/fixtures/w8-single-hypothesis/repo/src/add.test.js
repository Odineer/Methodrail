import assert from "node:assert/strict";
import test from "node:test";
import { add } from "./add.js";

test("one plus one", () => {
  assert.equal(add(1, 1), 2);
});
