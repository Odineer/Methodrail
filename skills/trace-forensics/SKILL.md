---
name: trace-forensics
description: "Diagnose from an already captured trace, profile, heap snapshot, or spindump. Use when the artifact exists. Do not re-run the system; that is runtime-forensics."
when_to_use: Explicit request only, or an active workflow names it. Diagnoses from an already captured trace, profile, or snapshot without re-running the system; live instrumentation is runtime-forensics.
disable-model-invocation: true
---

# Trace forensics

You own the diagnosis from the artifact. Load it, shape it, narrow to the cause, attribute to source. The capture already exists; don't re-run it.

Follow [playbook.md](references/playbook.md):

1. Identify the format and load it with a generic tool (DevTools/trace parser, text editor, heap tooling).
2. Transform the raw artifact into a queryable shape (sqlite dump of samples/frames/nodes) before reading.
3. Narrow to the cause: hot path, retainer chain, stuck thread.
4. Attribute to source. A frame with no source mapping is not yet a diagnosis.
5. Confirm against a paired capture when you have one. Without one, mark the finding as the strongest hypothesis the artifact supports.
6. Cited diagnosis, no fix unless asked. Route back to `diagnosing-bugs` / `performance` once the cause is known.

## Neighbors

```text
Need a live capture           → runtime-forensics
Metric iteration              → performance / hillclimb
```
