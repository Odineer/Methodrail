import { landingPath } from "../work/repo/src/session.js";
const now = Date.now();
const cases = {
  noSession: undefined,
  noToken: {},
  validMs: { token: "t", expiresAt: now + 60_000 },
  expiredMs: { token: "t", expiresAt: now - 60_000 },
  expiredIso: { token: "t", expiresAt: new Date(now - 60_000).toISOString() },
  expiredDate: { token: "t", expiresAt: new Date(now - 60_000) },
  validIso: { token: "t", expiresAt: new Date(now + 60_000).toISOString() },
  garbageExpiry: { token: "t", expiresAt: "not-a-date" },
  noExpiryField: { token: "t" },
};
const expected = { noSession:"/login", noToken:"/login", validMs:"/dashboard", expiredMs:"/login", expiredIso:"/login", expiredDate:"/login", validIso:"/dashboard", garbageExpiry:"/login", noExpiryField:"/dashboard" };
let fail = 0;
for (const [k, s] of Object.entries(cases)) {
  const got = landingPath(s); const ok = got === expected[k]; if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${k.padEnd(14)} -> ${got} (expected ${expected[k]})`);
}
process.exit(fail ? 1 : 0);
