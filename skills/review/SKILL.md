---
name: review
description: Review a change for correctness, requirement fit, maintainability, evidence, and regressions. Run only when explicitly requested.
disable-model-invocation: true
---

# Review

Review independently from implementation and remain read-only unless the user asks for fixes. This workflow orchestrates; it is not a duplicate of `code-review`.

```text
intent
↓
review packet
↓
code-review
↓
verification evidence
↓
blast-radius if meaningful
↓
name `interrogate` if rigor/risk warrants; wait
```

Do not run multiple expensive reviewers for trivial changes. Give the reviewer a [review packet](../../references/protocols/review-packet.md) of deterministic facts, including project context and supplied verification evidence. Do not make every reviewer rediscover the diff, tests, and intent.

## Workflow

1. Establish the review target, base revision, request, acceptance criteria, and repository guidance. Read `.methodrail/PROJECT.md` if present. If a knowledge pointer is relevant, follow [knowledge reuse](../../references/knowledge/reuse.md). Assemble the packet. Consume existing verification evidence rather than rerunning unrelated exploration.
2. Invoke `code-review` for Standards vs Spec on the complete requested range, including staged, unstaged, and untracked work when the worktree is dirty.
3. Use `blast-radius` when boundaries, schemas, or public contracts changed, or when a small diff is untrusted. Keep it read-only: existing checks or temp probes, not repository writes.
4. Do not substitute review for verification. Note verification gaps; run or request `verify-change` when claims of correctness lack fresh evidence.
5. Classify findings: critical (data loss, security, unusable core behavior); important (likely incorrect behavior, serious regression, contract risk); minor (optional, non-blocking).
6. Converge: critical → fix; important → fix or explicitly adjudicate; minor → record; the same disputed issue repeatedly → escalate rather than loop.
7. Lead with findings, ordered by severity. Cite paths and lines. If there are no findings, say so and list material verification gaps.

## Constraints

- Do not edit code unless explicitly asked to apply fixes. Nested `blast-radius` stays read-only with this workflow.
- Do not report style preferences as defects unless they violate an established standard.
- Name `interrogate` and wait when rigor is high, architecture is consequential, review is contested, or failure cost is high. Do not load it from this workflow.
- Avoid infinite review loops.
- See [rigor](../../references/rigor.md) and [skill composition](../../references/skill-composition.md).

## Done when

The requested change range was inspected in context, findings are evidence-backed and prioritized, and verification gaps are explicit. End with the [completion report](../../references/protocols/completion-report.md) block; keep it proportional.

## Neighbors

```text
Usually follows:              develop, debug, refactor
Often produces:               findings; verification gaps
Escalate to:                  code-review, blast-radius, verify-change
Avoid combining automatically with: arena, swarm, interrogate
```
