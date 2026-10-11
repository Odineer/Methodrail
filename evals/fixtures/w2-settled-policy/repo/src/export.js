export function header(customer) {
  return Object.keys(customer).join(",");
}

export function row(customer) {
  return Object.values(customer).join(",");
}
