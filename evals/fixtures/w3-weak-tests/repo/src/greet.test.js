import assert from "node:assert/strict";
import test from "node:test";
import { greet } from "./greet.js";

test("greet returns a string", () => {
  assert.equal(typeof greet("Ada", true), "string");
});
