Fixed. Expired sessions now go to `/login` instead of the dashboard.

**The bug:** `landingPath` in `repo/src/session.js` only checked whether a token existed and never checked whether it had expired.

**Evidence:** I wrote a small script, `../verify/repro.mjs`, that calls `landingPath` with six kinds of session: none, no token, valid, expired as a timestamp, expired as an ISO date, and no expiry field.
- **Before the fix:** both expired cases returned `/dashboard`. The other four were correct.
- **After the fix:** all six return the right path.

**The fix:** I added an `isExpired` check, so a session with a token but a past `expiresAt` now goes to `/login`. If the expiry date can't be read, the session is treated as expired. You can also pass in the current time, which makes it easy to test.

**Check before relying on this:**
- **The field name is my guess.** The repo doesn't say what a session looks like, so I assumed the expiry is stored as `expiresAt` (a timestamp or ISO date). If your sessions use another name, the check won't fire. Rename it in `isExpired`.
- **Sessions with no expiry still reach the dashboard**, same as before. If they should count as expired, that's a one-line change.
- **I didn't run the full `verify-project` check.** It says to start the app and open an expired session, but this repo has only `session.js`: no app, server or tests. My evidence comes from calling the function directly, not from the real login flow, so that end-to-end check still needs to happen where the app lives.
