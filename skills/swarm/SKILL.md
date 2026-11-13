---
name: swarm
description: "Fan out parallel workers over different independent slices and return one report. Use for /swarm, partitioned coverage, or exploration across disjoint scopes. Do not use to compete on the same artifact; that is arena."
when_to_use: Explicit request only (/swarm), or an active workflow names it. Parallel workers over different independent slices; competing on one artifact is arena.
disable-model-invocation: true
---

# Swarm

Fan out parallel workers over **independent slices**. The parent handles returned results and owns the combined outcome.

```text
swarm        = partition different independent slices
arena        = compete on the same work
interrogate  = independent adversarial review
```

If the user asks to compete on one artifact, use `arena` instead.

## Start

Phases: Frame, Fan out, Aggregate, Report. For delegated implementation, also follow [Implementation slices](#implementation-slices).

## Phase A: Frame

1. State the done predicate and the report the swarm must return.
2. Partition into independent slices. Each slice has its own scope that does not share a mutable artifact with the others.
3. Set N from the number of slices, or from the user when they named the slices.
4. Pick worker models from the `swarm workers` role in [host capabilities](../../references/host-capabilities.md) when the host allows, and follow its selection procedure, including a rejected slug. Otherwise use the host default. Omit `model` when the host cannot choose one. Local workers remain the default.
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, and order). The worker records both in its result.

## Phase B: Fan out

Launch the independent workers together up to the host's available capacity. Start remaining slices as slots free up. Prefer local workers unless the work truly needs an isolated remote checkout. Cloud/remote workers are optional.

Give each worker a self-contained brief with its goal, exact slice, checks, and expected output. The worker completes its assignment directly. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, continue the remaining slices and account for the missing result during aggregation. If the host cannot parallelize, run slices sequentially and say so.

## Phase C: Aggregate

Drop a result that does not record the SHAs and method its brief required, and rerun that worker once. After a second miss, record a gap. A gap does not count as a pass. Every required slice needs a result. Do not paste raw worker dumps. Keep a compact result table, one-line evidenced issues, and explicit gaps.

## Phase D: Report

One consolidated in-chat report: table, issue one-liners, and gaps or dropouts.

When composed, return the results to the workflow owner for its report.

## Implementation slices

1. **Assign.** Give each worker a [task packet](../../references/protocols/task-packet.md) with the starting revision and relevant worktree state, owned source and verification paths, settled contracts, acceptance criteria, checks, and applicable workflow constraints. Use an isolated writable workspace per worker. Handle shared files, contracts that are still changing, and dependent slices in sequence. If isolation or subagents are unavailable, implement sequentially in the parent. Workers implement only the assigned slice and return its exact patch, including new files, with verification evidence and any blockers or deviations.
2. **Review on return.** As each worker finishes, the parent inspects the actual patch and runs [code-review](../code-review/SKILL.md) against that slice's acceptance criteria and [review packet](../../references/protocols/review-packet.md). Other independent workers can keep running. The implementer's checks inform the review. The parent or a separate reviewer makes the review judgment. Use local passes for a bounded slice and follow [rigor](../../references/rigor.md) when independent review is warranted. Resolve material findings, review the affected edits, and rerun invalidated slice checks before integrating the patch or starting dependent work.
3. **Integrate and verify.** The parent accounts for every assigned slice, takes over or reassigns a dropped slice when feasible, and reports unresolved blockers. Review interactions and integration edits, reuse reviews of unchanged patches, and run the owning workflow's final verification on the integrated state.

## Neighbors

```text
Same artifact, compete        → arena
Understanding partition       → how explorers
```
