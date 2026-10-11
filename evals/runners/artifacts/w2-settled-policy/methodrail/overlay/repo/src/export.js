const FIELDS = ["name", "email"];

export function header() {
  return FIELDS.join(",");
}

export function row(customer) {
  return FIELDS.map((field) => customer[field] ?? "").join(",");
}
