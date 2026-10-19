---
name: runtime-forensics
description: "Instrument a live process to diagnose leaks, spins, idle-but-busy behavior, or intermittent glitches. Use when understanding live behavior requires runtime evidence. Do not use for ordinary source-level bugs or already-captured traces."
when_to_use: Explicit request only, or an active workflow names it. Instruments a live process for leaks, spins, or intermittent glitches; captured artifacts are trace-forensics.
disable-model-invocation: true
---

# Runtime forensics

You own the diagnosis. Instrument the live process; don't theorize from source. The deliverable is a cited diagnosis, not a fix.

Use when `/debug` or `diagnosing-bugs` cannot explain the mechanism from source and tests. Distinct from `trace-forensics` (the capture already exists) and `observe` (exercise a user path and record what happened).

If the host has no runtime/browser tooling, say so and stop at the best source-plus-test bound. Do not invent runtime evidence. See [host capabilities](../../references/host-capabilities.md).

Follow [playbook.md](references/playbook.md):

1. Capture the live signal on the matching surface via the project verification/control skill: CPU profile, heap snapshot, CDP trace. A real artifact, not a guess.
2. Reduce the artifact to the smoking gun. Parse large artifacts in a subagent when available; keep the reduced finding in the main thread.
3. Prove the mechanism before believing it. Inject cheap instrumentation on the running process when safe.
4. Map the finding back to source: file, symbol, the line that allocates or schedules.
5. Hand back the signal, the reduced finding, how you proved it, the source location, artifact paths. No fix unless asked.

## Neighbors

```text
Ordinary diagnosis            → diagnosing-bugs
Capture already exists        → trace-forensics
User-path observation         → observe
Must not                      → silently become a fix
```
