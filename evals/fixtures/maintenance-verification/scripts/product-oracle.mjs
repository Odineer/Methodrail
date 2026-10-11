import assert from "node:assert/strict";
import { checkout } from "../src/checkout.js";
import { refund } from "../src/refund.js";

assert.equal(checkout(10, 2), 20);
assert.equal(refund(10, 4), 6);
console.log("oracle ok");
