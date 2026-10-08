import { charge } from "./billing/wrap.js";

export function pay(input) {
  return charge(input);
}
