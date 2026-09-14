export const customers = [
  {
    id: "c1",
    name: "Ada",
    email: "ada@example.com",
    invoices: [{ id: "inv-1", amount: 40 }],
    paymentMethods: [{ brand: "visa", last4: "4242" }],
  },
];

export function exportCustomerData() {
  return customers.map(({ id, name, email }) => ({ id, name, email }));
}
