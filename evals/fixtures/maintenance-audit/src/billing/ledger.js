export function charge({ amount, currency, id }) {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error("amount");
  if (currency !== "USD") throw new Error("currency");
  if (!id) throw new Error("id");
  return { id, amount, currency, status: "recorded" };
}
