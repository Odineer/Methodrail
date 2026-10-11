import { readFileSync } from "node:fs";
import { label } from "../src/label.js";
import { limit } from "../src/limit.js";

const test = readFileSync(new URL("../src/limit.test.js", import.meta.url), "utf8");
if (limit() !== 10 || !test.includes("assert.equal(limit(), 10)")) {
  console.error("limit oracle");
  process.exit(1);
}
if (label() !== "Create") {
  console.error("label");
  process.exit(1);
}
