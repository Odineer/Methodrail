Expired sessions now go to `/login` instead of `/dashboard`. I confirmed this by running the code before and after the fix, not just by reading it.

**Reproducing it.** The project's verification steps say to start the app, but the repo has no app, server or `package.json`, only `repo/src/session.js`. So I called `landingPath` directly with Node 26:
- **Before the fix:** an expired session returned `/dashboard`, the same as a valid one. A missing session returned `/login`.
- **After the fix:** an expired session returns `/login`, a valid session still returns `/dashboard`, and a missing session still returns `/login`.

**Cause.** `landingPath` only checked that the session had a token. It never looked at when the session expires, so any session with a token reached the dashboard.

**Fix** (`repo/src/session.js`):
- **Expiry check:** it now sends the user to login if the session expires now or earlier.
- **Bad or missing expiry:** if the expiry time is missing or can't be read, the user also goes to login rather than the dashboard.
- **Current time:** it takes an optional `now` argument that defaults to the current time, so tests can fix the clock. Existing calls with one argument behave the same.

**Regression test** (`repo/test/session.test.js`, run with `node --test`): it failed on the old code (3 of 5 tests failing) and passes on the fixed code (5 of 5).

**What else this affects.** The repo has only this one function and nothing else calls it, so the fix doesn't reach beyond this file. I didn't run a separate review step because the fix is two lines in one place.

**Things to check:**
- **Session field name:** the repo doesn't say what a session object looks like. I assumed the expiry is stored in `session.expiresAt`, as a millisecond timestamp, `Date`, or ISO string. If your sessions use a different field name, every valid session will now be sent to login. Please confirm the name.
- **Verification steps:** `.agents/skills/verify-project/SKILL.md` says "start the app", which isn't possible in this repo. It should be updated to point at `node --test` or at the real app, if one exists somewhere else.
