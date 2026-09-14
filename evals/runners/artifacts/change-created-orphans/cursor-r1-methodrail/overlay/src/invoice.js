import { formatDate } from "./dates.js";

export function leftoverTaxLabel() {
  return "legacy-tax";
}

export function invoiceDueLabel(due) {
  return `Due ${formatDate(due)}`;
}
