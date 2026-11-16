Expired sessions now go to `/login` instead of the dashboard. I checked this by running the function before and after the fix, but not through the full app, because there isn't one to run.

**The bug:** `landingPath` in `repo/src/session.js` only checked whether a session had a token. It never looked at the expiry time, so any session with a token, expired or not, landed on `/dashboard`.

**The fix:** `landingPath` now sends a session to `/login` if it has no token or if it has expired. The expiry can be a timestamp, a date string or a `Date`. A session whose expiry can't be read is treated as expired. An optional `now` argument lets tests fix the current time.

**Evidence:** The project's verify skill says to start the app and open an expired session, but the repo contains only `session.js`: no server, no `package.json`, no tests. So I wrote a small script (`../verify/repro.mjs`, outside the repo) that calls `landingPath` directly with nine kinds of session:
- **Before the fix:** 4 of 9 failed. Expired sessions (as a timestamp, a date string or a `Date`) and an unreadable expiry all returned `/dashboard`.
- **After the fix:** all 9 pass. No session or no token still goes to `/login`, and a valid session still reaches `/dashboard`.

**Decision for you:** the codebase never shows the session's fields, so I guessed the expiry is stored as `expiresAt`. A session with no `expiresAt` at all still reaches the dashboard, which keeps the old behaviour for such sessions. If your sessions use a different field name, or should never be allowed in without an expiry, the check in `isExpired` needs adjusting.
