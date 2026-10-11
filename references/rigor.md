# Rigor

Rigor is guidance for native-agent behavior. It is not a scheduler.

Match investigation, design, review, and verification effort to consequence and reversibility. Workflow skills should consult this document when they need escalation guidance. Do not invoke expensive skills merely because a task is interesting.

## Level 0 — Mechanical

Examples: rename, formatting, obvious local config edit, generated-file update.

Typical behavior:

- inspect local context
- make the change
- run deterministic validation

Do not invoke `architect`, `prototype`, or `interrogate`.

## Multi-agent cost

Guidance, not a scheduler. Explicit user invocation remains allowed.

| Rigor | Parallel posture |
|---|---|
| 0–1 | Prefer one context |
| 2 | Isolated subagents only where they improve context quality or independence |
| 3 | Parallel exploration may be justified |
| 4 | Arena may be justified; name `interrogate` and wait |
| 5 | Strong independent evidence/review is expected where available |

Keep parallel semantics distinct: swarm partitions work; arena competes candidates; interrogate reviews adversarially; how explorers partition understanding; code-review axes split review dimensions.

## Level 1 — Bounded

A small local change or bug.

Typical behavior:

- understand the relevant local implementation
- apply appropriate verification
- limited review if useful

## Level 2 — Standard

A normal feature or behavior-changing change.

Typical behavior:

- understand current behavior
- define acceptance criteria
- plan proportionally
- verify with fresh evidence

## Level 3 — Cross-boundary

Touches multiple modules, ownership boundaries, or meaningful abstractions.

Typical behavior may include:

- `how`
- `domain-modeling`
- architecture assessment
- runtime observation
- `blast-radius`
- stronger review

## Level 4 — High risk

Examples: billing, permissions, auth, security-sensitive behavior, migrations, concurrency, destructive operations, major architecture.

Typical behavior may include:

- explicit evidence gathering
- `architect`
- `prototype`
- runtime observation
- `blast-radius`
- independent review
- `interrogate` only when explicitly requested

## Level 5 — Critical / hard to reverse

Use the strongest available evidence and explicit human approval for consequential choices.

Examples: irreversible migrations, destructive production operations, security model changes, highly consequential architectural commitments.

`interrogate` remains explicit-only even at this level.

## Choosing a level

Raise rigor when failure is expensive, the change is hard to reverse, or ownership/contracts are in play. Lower it when the change is local, mechanical, and covered by deterministic checks. When unsure, prefer one level higher for verification, not for ceremony.

## Review selection

`code-review` is the procedure. `/review` is the separate read-only workflow. Required ordinary review does not load `interrogate`.

| Situation | Required approach |
|---|---|
| Mechanical edit, copy change, or deterministic regeneration with an adequate check | Quick diff inspection and that check. No review skill and no reviewer agents unless the user asked for review. |
| Substantive change: behavior-changing production code, a meaningful interface or contract change, or configuration that materially affects behavior or safety | `code-review`, with distinct Standards and Spec passes in the current context. A one-line change can be substantive. File or line counts are not the classifier. |
| Sensitive or consequential cross-boundary change | Isolated independent review when the host can isolate reviewers and independence meaningfully reduces risk. |
| Host cannot isolate | Separate local passes. Say that the review was not independent. |
| User asks for a stronger review mechanism | Honor that request within its scope and the existing invocation boundaries. |

Security-sensitive authorization, sensitive-data handling, hard-to-reverse migrations, concurrency, shared public contracts, and consequential architecture are signals for independent review. A reviewer capability being available is not a reason to escalate. Use `arena` only when the user asks or when consequence, ambiguity, and independent exploration justify the cost. Host support alone is not enough.

`develop` uses this selection before completing a substantive change. Substantive structural repairs in `refactor` and nontrivial production-code fixes in `debug` use it too. The parent supplies the [review packet](protocols/review-packet.md). In a writing workflow, repair material findings inside the authorized task, then verify the state those repairs invalidate. Optional suggestions do not expand scope. Standalone `/review` stays read-only unless fixes were requested. Stop the loop when material findings are resolved, a concrete blocker remains, or a qualifying human decision is unsettled. Report new external scope; do not absorb it.
