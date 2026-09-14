function formatDue(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
}

export function leftoverTaxLabel() {
  return "legacy-tax";
}

export function invoiceDueLabel(due) {
  return `Due ${formatDue(due)}`;
}
