import assert from "node:assert/strict";
import test from "node:test";
import { buttonLabel } from "./button.js";

test("button label", () => {
  assert.equal(buttonLabel(), "Create");
});
