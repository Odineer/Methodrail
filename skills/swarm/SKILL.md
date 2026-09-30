---
name: swarm
description: "Fan out parallel workers over different independent slices and return one report. Use for /swarm, partitioned coverage, or exploration across disjoint scopes. Do not use to compete on the same artifact; that is arena."
disable-model-invocation: true
---

# Swarm

Fan out N parallel workers over **independent slices**. The parent waits, aggregates, and returns one report.

```text
swarm        = partition different independent slices
arena        = compete on the same work
interrogate  = independent adversarial review
```

If the user asks to compete on one artifact, use `arena` instead.

## Start

Phases: Frame, Fan out, Aggregate, Report.

## Phase A: Frame

1. State the done predicate and the report the swarm must return.
2. Partition into independent slices. Each slice has its own scope that does not share a mutable artifact with the others.
3. Set N from the number of slices, or from the user when they named the slices.
4. Pick worker models if the host allows; otherwise use the host default. See [host capabilities](../../references/host-capabilities.md).
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, and order). The worker records both in its result.

## Phase B: Fan out

Spawn all N in one message when parallel subagents exist. Prefer local workers unless the work truly needs an isolated remote checkout. Cloud/remote workers are optional.

Every brief stands alone: goal, exact slice, how to verify, what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it. If the host cannot parallelize, run slices sequentially and say so.

## Phase C: Aggregate

Drop a result that does not record the SHAs and method its brief required, and rerun that worker once. After a second miss, record a gap. A gap does not count as a pass. Every required slice needs a result. Do not paste raw worker dumps. Keep a compact result table, one-line evidenced issues, and explicit gaps.

## Phase D: Report

One consolidated in-chat report: table, issue one-liners, and gaps or dropouts.

## Neighbors

```text
Same artifact, compete        → arena
Understanding partition       → how explorers
```
