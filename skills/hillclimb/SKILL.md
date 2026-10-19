---
name: hillclimb
description: "Iterative measurable optimization: baseline → one change → measure → retain or revert → repeat. Use for sustained improvement against a target. Do not use for a one-off perf fix."
when_to_use: Explicit request only, or an active workflow names it. Sustained iterative optimization against a measured target; a one-off measured fix is performance.
disable-model-invocation: true
---

# Hillclimb

You own the metric and the experiment's integrity. Core discipline:

```text
baseline → one change → measure → retain or revert → repeat
```

Never stack untested changes. Never claim a win from code inspection.

Follow [playbook.md](references/playbook.md). Summary:

1. Ground the workload with `how`. Fix one metric, the better direction, and a checkable stop predicate.
2. Build the measurement harness, prove its sensitivity, freeze it. Record the baseline and a green regression gate before any change.
3. Open a decision log via `show-me-your-work`. One row per attempt.
4. Each hypothesis names a specific mechanism.
5. Loop: one change, measure, keep only if the metric moves past noise and the gate stays green; otherwise revert in full.
6. Push past the first plateau. Don't relax the predicate to declare victory.
7. Stop when the predicate is met or remaining ideas are genuinely marginal.

## Neighbors

```text
Trail                         → show-me-your-work
Must not                      → optimize without a metric
```
