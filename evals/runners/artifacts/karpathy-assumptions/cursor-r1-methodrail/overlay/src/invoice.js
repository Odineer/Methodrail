import { formatDate } from "./dates.js";

export function invoiceSummary(id, amount, dueDate) {
  const summary = { id, amount };
  if (dueDate != null) {
    summary.dueDate = formatDate(dueDate);
  }
  return summary;
}
