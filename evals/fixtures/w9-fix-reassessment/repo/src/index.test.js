import assert from "node:assert/strict";
import test from "node:test";
import { first } from "./index.js";

test("first item", () => {
  assert.equal(first(["a", "b"]), "a");
});
