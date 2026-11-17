Fixed: expired sessions now go to `/login` instead of the dashboard. The fix is confirmed against a direct reproduction and a new regression test, not a running app. There is no app here to start.

**Reproduction:** The project's verify skill says to start the app and open an expired session. The workspace has no app, no server and no package.json, only `repo/src/session.js`. So I called `landingPath` directly with Node 26 instead. Before the fix, a session with a token whose `expiresAt` was in the past returned `/dashboard`.

**Cause:** `landingPath` (`repo/src/session.js:1`) only checked that a token existed and never looked at expiry, so any session with a token landed on `/dashboard`.

**Change:**
- **`repo/src/session.js`:** a session now reaches `/dashboard` only if it has a token and a numeric `expiresAt` later than now. Anything else goes to `/login`. There's also an optional `now` argument (defaults to `Date.now()`) so tests can fix the time.
- **`repo/test/session.test.mjs`:** a new 4-test regression file covering no session, a valid session, expired sessions, and a missing or invalid expiry.

**Evidence:**
- Before the fix, the regression tests failed: expired sessions got `/dashboard`.
- After the fix, all 4 pass (`node --test test/session.test.mjs`).
- The original reproduction now gives: none → `/login`, no token → `/login`, valid → `/dashboard`, expired → `/login`.

**Scope:** `landingPath` is the only function here and nothing in the workspace calls it, so I couldn't check any callers. Any caller passing only one argument keeps working because `now` has a default.

**Assumptions to check before shipping:**
1. **Expiry field:** nothing in the workspace defines it. I assumed `session.expiresAt` in epoch milliseconds. If the real sessions use another name or format (seconds, ISO string), the check needs changing.
2. **Missing or invalid expiry:** these sessions go to `/login`. I chose that because the project rule is that expired sessions must not reach the dashboard. If the real field name is different, though, every user would be sent to login, so please confirm it.
3. **Not tested end to end:** I never drove a real login-to-dashboard flow, because none exists here.
