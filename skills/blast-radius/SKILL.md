---
name: blast-radius
description: "Find what a change could break somewhere else before it ships, beyond the diff, and prove the one fact it's safe because of by running real code when practical. Use for 'blast radius of X', 'what could this break', or reviewing a small diff you don't trust. Do not use for purely local mechanical edits."
---

# Blast radius

Find what a change breaks somewhere else, before it ships.

Companion to `how` and `why`. Listing the callers is not the job. Grep can do that in a second. The job is the breakage grep won't show you.

This is not generic code review. Do not collapse it into `code-review` or `/review`.

## Don't trust your own writeup

A blast-radius writeup that sounds right is worthless. Find the one or two facts the whole thing depends on and prove them by running code when that is cheap. Words are where you start, not what you ship.

### How sure are you

For each fact the change's safety depends on, get it as far down this list as is cheap, and say where it stopped.

1. You said so. Worthless on its own.
2. You pointed at the line. A real `file:line`, or the library's own source.
3. You showed the bad case can't happen. You walked the failure step by step and it doesn't reach.
4. You ran it. A script or test that calls the real code and fails loud if you're wrong.
5. You reproduced it in the running app.

Any safety fact you can't get to step 4, say so. Don't write it up as settled.

## Steps

1. Read the change. The diff, the symbols it adds, changes, and deletes, and what it now does differently, including the part the diff doesn't spell out.
2. Find the one fact it's safe because of. Most changes that look risky are safe because of a single fact. If it holds, most risky cases are cleared at once.
3. Look where grep stops. Read the source of the library you call, and check its pinned version and any local patch. Follow what a symbol search misses: the JSON an API returns, a DB column, a wire format, another language reading the same bytes, a feature flag, code three hops downstream.
4. Be honest about each risk. Give it a real chance of happening and a real cost if it does. Cite a real `file:line`. A search that finds nothing is still an answer. Never make up a caller or an API.
5. Prove the one fact.
   - **Read-only parent** (`/review`, `/investigate`, or the user said not to edit): run an existing test or script first. If you need a new probe, run it from a temp file outside the repository (or an equivalent one-shot command) and leave the worktree unchanged. Do not add tests, scripts, or product files.
   - **Write parent** (`/develop`, `/debug`, `/refactor`, or a direct request that may edit): prefer a real test or script in the repo that calls the real code and fails loud if you're wrong.
   If you can't prove it cheaply, mark it unproven. Don't overstate.
6. For a big or wide change, run `arena` only when the parent may edit and the host supports competing candidates. Under a read-only parent, obtain a second independent pass in this context or state the limitation. See [host capabilities](../../references/host-capabilities.md).

## What to hand back

- **What it does.** What changed, including the part that isn't obvious.
- **The one fact it's safe because of.** State it, say which step you got it to, and show the proof. If you couldn't prove it, write unproven.
- **Risks.** Only the real ones. Each names how it breaks, the `file:line`, how likely and how bad, and how to check.
- **Cleared.** What you checked and why it's fine.
- **Before you merge.** The cheapest test or repro that catches the real bug.

Silent "nothing else is affected" is forbidden without evidence.

## Neighbors

```text
Need current system           → how
Need competing safety proofs  → arena (write parent only)
Read-only parent              → existing checks or temp probes
```
