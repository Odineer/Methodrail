---
name: debug
description: Diagnose and fix a reproducible failure using evidence, explicit hypotheses, and focused verification. Run only when explicitly requested.
disable-model-invocation: true
---

# Debug

Find the mechanism before changing code. This workflow owns debugging. `diagnosing-bugs` owns the diagnosis procedure inside it.

Do not skip root-cause reasoning to save tokens. Speculative patching loops are more expensive than a tight diagnosis loop.

```text
symptom
↓
cheap reproduction
↓
diagnosing-bugs
↓
local evidence first
↓
observe if behavior is needed
↓
runtime-forensics / trace-forensics only when needed
↓
regression evidence
↓
minimal fix
↓
verify-change
```

Do not automatically profile or trace every bug.

## Workflow

1. Capture the symptom, expected behavior, environment, revision, and available reproduction.
2. Read `.methodrail/PROJECT.md` and control guidance when present. If a knowledge pointer is relevant, follow [knowledge reuse](../../references/knowledge/reuse.md). Prefer documented start/doctor/drive commands and the project verification skill over asking how the project runs.
3. Invoke `diagnosing-bugs`: build a red-capable loop, minimise, hypothesise, instrument, then fix. Do not repeat that procedure here.
4. Escalate only when the loop is not enough: `observe` / `runtime-forensics` for live mechanism, `trace-forensics` for an existing capture, `performance` / `hillclimb` when the work is metric-driven.
5. Name the root cause with evidence. If the root cause remains unknown, do not disguise a guess as a fix.
6. Apply `tdd` for the regression at a correct seam when that is the honest strategy, then `verify-change`.
7. Use `blast-radius` only for shared contracts or cross-boundary changes.
8. Report reproduction, root cause, change, evidence, and residual uncertainty. A recurring failure mode may be a known-failure, regression test, or lint candidate. Do not auto-promote it.

## Constraints

- Do not use shotgun edits or change multiple variables without a reason.
- Keep local runtime actions isolated; do not mutate production.
- Preserve unrelated changes and avoid opportunistic refactors.
- `runtime-forensics` is an escalation operator, not the default.
- See [rigor](../../references/rigor.md) and [skill composition](../../references/skill-composition.md).

## Done when

The failure is reproduced or bounded, its cause is supported by evidence, and the fix is verified against the reproduction plus proportionate regression checks. End with the [completion report](../../references/protocols/completion-report.md) block; keep it proportional.

## Neighbors

```text
Usually follows:              investigate
Often produces:               reproduction; root cause; verify-change
Escalate to:                  diagnosing-bugs, observe, runtime-forensics
Avoid combining automatically with: architect, wayfinder, arena
```
