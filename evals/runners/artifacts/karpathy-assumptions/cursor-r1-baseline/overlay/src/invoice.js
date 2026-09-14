import { formatDate } from "./dates.js";

export function invoiceSummary(id, amount, due) {
  return { id, amount, dueDate: formatDate(due) };
}
