import { greet } from "../src/greet.js";

if (greet("Ada", true) !== "hello, Ada") {
  console.error(greet("Ada", true));
  process.exit(1);
}
