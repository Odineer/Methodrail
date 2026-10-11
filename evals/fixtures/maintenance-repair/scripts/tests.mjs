import assert from "node:assert/strict";
import { checkout } from "../src/checkout.js";

assert.equal(checkout({ price: 10, qty: 2 }), 20);
console.log("product ok");
