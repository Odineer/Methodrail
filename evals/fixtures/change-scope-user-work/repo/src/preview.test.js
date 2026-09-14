import assert from "node:assert/strict";
import test from "node:test";
import { previewLine } from "./preview.js";

test("preview line uses the renamed local", () => {
  assert.equal(previewLine(12), "Total 12.00");
});
