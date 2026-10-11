import { header, row } from "../src/export.js";

const customer = { name: "Ada", email: "a@x.test", invoices: "9", paymentMethods: "card" };
const line = row(customer);
if (header() !== "name,email") {
  console.error("header", header());
  process.exit(1);
}
if (line !== "Ada,a@x.test" || /9|card/.test(line)) {
  console.error(line);
  process.exit(1);
}
