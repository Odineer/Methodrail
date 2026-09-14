---
name: diagnosing-bugs
description: "Diagnosis loop for hard bugs and performance regressions. Use when something is broken, throwing, failing, flaking, or slow. Build a red-capable feedback loop before hypothesising. Do not use for feature work or pure how-questions."
---

# Diagnosing bugs

Canonical baseline diagnosis skill. `/debug` orchestrates; this skill owns the diagnosis loop. Skip phases only when explicitly justified.

When exploring the codebase, read `.methodrail/PROJECT.md` and the canonical domain glossary if they exist. Prefer documented start/doctor/drive commands over asking how the project runs.

## Redact

Show commands, outputs, and captured artifacts. **Redact every secret first.** Build loops against env vars so credentials stay in the environment. If the redacted output is not enough, say so and ask the user.

## Iron rules

```text
NO FIXES WITHOUT A RED-CAPABLE LOOP AND A FALSIFIABLE ROOT-CAUSE CLAIM
```

Never jump from symptom to speculative patch. If you catch yourself reading code to build a theory before the loop exists, stop.

After three failed fix attempts, stop and question the architecture. Do not attempt fix #4 without that discussion.

## Phase 1: Build a feedback loop

**This is the skill.** Everything else is mechanical. If you have a tight pass/fail signal for *this* bug, you will find the cause. If you don't, staring at code will not save you.

Spend disproportionate effort here. Be aggressive. Be creative. Refuse to give up.

### Ways to construct one, in roughly this order

1. Failing test at whatever seam reaches the bug
2. Curl / HTTP script against a running dev server
3. CLI invocation with a fixture input
4. Headless browser script that drives the UI
5. Replay a captured trace
6. Throwaway harness of a minimal subset
7. Property / fuzz loop
8. Bisection harness (`git bisect run`)
9. Differential loop (old vs new)
10. HITL bash script last resort — `scripts/hitl-loop.template.sh`

### Tighten the loop

- Faster (cache setup, skip unrelated init)
- Sharper (assert the specific symptom)
- More deterministic (pin time, seed RNG, isolate filesystem)

A 30-second flaky loop is barely better than no loop.

### Non-deterministic bugs

Raise the reproduction rate until it is debuggable. A 50% flake is workable; 1% is not.

### When you genuinely cannot build a loop

Stop. List what you tried. Ask for environment access, a redacted artifact, or permission to add temporary instrumentation. Do **not** proceed to hypothesise without a loop.

Phase 1 is done when you can name **one command** you have already run that is red-capable, deterministic (or high-rate), fast, and agent-runnable.

## Phase 2: Reproduce + minimise

Confirm the loop produces the failure the **user** described. Then shrink the repro until every remaining element is load-bearing.

## Phase 3: Hypothesise

Generate **3–5 ranked falsifiable hypotheses** before testing any of them.

> If X is the cause, then changing Y will make the bug disappear, or changing Z will make it worse.

Show the ranked list. Don't block on the user; proceed if they are away.

## Phase 4: Instrument

Each probe maps to a specific prediction. Change one variable at a time.

1. Debugger / REPL if the env supports it
2. Targeted logs at hypothesis boundaries, tagged `[DEBUG-<id>]`
3. Never "log everything and grep"

**Perf branch.** Establish a baseline measurement first. If live mechanism is unclear, escalate to `observe` or `runtime-forensics`. If a capture already exists, use `trace-forensics`. If the work is metric-driven iteration, use `performance` / `hillclimb`.

When the error is deep in a call stack, use [root-cause-tracing.md](references/root-cause-tracing.md).

## Phase 5: Fix + regression test

Write the regression test **before the fix** when a correct seam exists. Use `tdd` for that seam. If no correct seam exists, that itself is the finding.

1. Turn the minimised repro into a failing test
2. Watch it fail
3. Apply the minimal fix at the owner of the violated contract. Fix caller misuse at the caller; fix a defective shared implementation there even if only one caller exposes it. Verify the reported path and relevant shared behavior.
4. Watch it pass
5. Re-run the Phase 1 loop against the original scenario
6. Remove imports, variables, and private helpers this fix made unused. Leave unrelated dead code. Do not start another diagnosis cycle. See [change-created cleanup](../../references/simplicity.md#change-created-cleanup) when the remaining-use check is not obvious.
7. Complete the cleanup and final verification below before claiming the bug is fixed.

Do not shotgun-edit. No bundled refactoring. See [defense-in-depth.md](references/defense-in-depth.md) after the root cause is known, and [condition-based-waiting.md](references/condition-based-waiting.md) when the bug was a race against a timeout.

## Phase 6: Cleanup and final verification

- Remove all `[DEBUG-...]` instrumentation and throwaway prototypes.
- Use `verify-change` against the final tree: the original repro no longer reproduces and the regression test passes (or the missing seam is documented).
- If later edits change relevant state, rerun the affected verification before claiming completion.
- State the correct hypothesis in the commit / PR message.

## Pressure resistance

These are not reasons to skip the loop:

| Excuse | Reality |
|---|---|
| "Issue is simple" | Simple issues have root causes too |
| "Emergency, no time" | Systematic diagnosis is faster than thrashing |
| "Just try this first" | First fix sets the pattern |
| "I'll write the test after" | Untested fixes don't stick |
| "Multiple fixes at once" | Can't isolate what worked |
| "I see the problem" | Seeing symptoms ≠ understanding root cause |
| "One more fix" after 2+ failures | Question the architecture |

## Escalation

```text
ordinary bug → this skill → tdd / verify-change
live runtime mystery → observe / runtime-forensics
captured trace/profile → trace-forensics
metric-driven optimization → performance / hillclimb
```

## Neighbors

```text
Usually follows:              debug
Often produces:               red-capable loop; named root cause
Escalate to:                  observe, runtime-forensics, tdd, verify-change
Avoid combining automatically with: architect, wayfinder, arena
```

Reuse project control and known-failure knowledge when relevant. Prefer the project verification skill for reproduction.

A recurring failure mode may become a known-failure, regression test, lint, or type constraint. Do not auto-promote it.
