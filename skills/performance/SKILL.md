---
name: performance
description: "Measured performance investigation. Tie every fix to a baseline and a post-change measurement. Use for slow / expensive / high-latency issues. Use hillclimb for iterative optimization against a target."
when_to_use: Explicit request only, or an active workflow names it. Measured investigation of slow or expensive behavior; iterative optimization against a target is hillclimb.
disable-model-invocation: true
---

# Performance

You own the measurement story. Don't read source instead of measuring.

Follow [playbook.md](references/playbook.md). Summary:

1. Capture a baseline trace or timing via the project control/verification skill.
2. Use `how` to ground hypotheses. Try these mantras in order, cheapest first; a mantra earns an attempt only when the trace shows its signal; when an earlier mantra meets the target, stop: don't do it (elimination), don't do it again (caching), do it less (divide and conquer; batching is less overhead), do it later (lazy evaluation), do it when they're not looking (scheduling), do it concurrently (redundancy), do it cheaper (indirection).
3. Plan the fix from the trace. If it changes a public contract, module boundary, or ownership, `architect` first. Crossing a function is not enough. Capture a post-fix trace. Verify each attempt before the next (`verify-change`).
4. "Inconclusive" or wrong-surface is not a pass.
5. Cite the measurement: baseline, post-fix, delta, artifact path.

For sustained improvement against a metric rather than a one-off fix, use `hillclimb`.

## Neighbors

```text
Need a diagnosis loop         → diagnosing-bugs
Iterative optimization        → hillclimb
Architecture bound            → architect
Must finish with              → verify-change
```
