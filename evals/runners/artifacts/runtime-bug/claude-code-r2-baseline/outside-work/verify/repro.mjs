const { landingPath } = await import(process.argv[2]);
const now = Date.now();
const cases = {
  none: [undefined, "/login"],
  noToken: [{}, "/login"],
  valid: [{ token: "t", expiresAt: now + 60_000 }, "/dashboard"],
  expired: [{ token: "t", expiresAt: now - 60_000 }, "/login"],
  expiredIso: [{ token: "t", expiresAt: new Date(now - 60_000).toISOString() }, "/login"],
  noExpiry: [{ token: "t" }, "/dashboard"],
};
let fail = 0;
for (const [name, [s, want]] of Object.entries(cases)) {
  const got = landingPath(s);
  const ok = got === want; if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${got}, want ${want}`);
}
process.exit(fail ? 1 : 0);
