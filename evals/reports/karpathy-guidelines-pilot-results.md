# Live pilot results — Karpathy-inspired guidelines composition

Executed: not completed as a paired battery. Implementation date: 2026-09-13. Inspected upstream SHA: `2c606141936f1eeef17fa3043a72095b4765b9c2`.

This document is the live-pilot outcome for the Karpathy-inspired guidelines composition. It is separate from structural validation (`npm run check`, constructed eval YAML) and from the [Ponytail simplicity pilot](./v0.9.2-ponytail-simplicity-pilot-results.md). Constructed examples, YAML specs, and the leaderboard hidden grader do not prove live agent improvement.

Baseline for a later battery: the post-Ponytail Methodrail tree hashed in [karpathy-upstream-comparison.md](../../docs/internal/karpathy-upstream-comparison.md), not v0.9.1 and not HEAD-only.

## Planned pairs

Same host/model and task conditions, fresh contexts, baseline (frozen post-Ponytail Methodrail) vs treatment (that tree plus this composition only):

| Case | Required live observation |
| --- | --- |
| Change-created cleanup vs pre-existing dead code | Remove the new orphan; retain unrelated unused helper |
| Task-scope check with user edits and supporting work | Preserve the user edit; keep necessary tests/generated output; reject unrelated churn |
| Source-resolvable uncertainty vs consequential unresolved choice | No interview for documented format; clarify export scope before dependent implementation |
| Verification that must catch score-only sorting | Hidden identity-order grader fails score-only ranking and dropped ties |

Simulated user answers, if a pair asks: for the export-scope case, reply “profile fields only, not invoices or payment methods.” Use that answer in both conditions.

## What ran

| Pair | Host | Model | Result |
| --- | --- | --- | --- |
| Change-created cleanup | — | — | **unavailable** — no frozen post-Ponytail vs treatment worktrees were launched |
| Task-scope / user edits | — | — | **unavailable** |
| Assumptions | — | — | **unavailable** |
| Leaderboard verification | — | — | **unavailable** as a live pair. The hidden grader was executed as a unit test against known-wrong and known-correct modules; that is specification evidence, not an empirical live result |

No Codex (`codex` not invoked). No Claude Code. Cursor Task subagents in this implementation session are not a paired comparison: they share the implementation conversation and do not isolate baseline Methodrail.

Missing capability: an independent runner that can launch fresh host sessions against frozen skill trees without this implementation context. That is not an environmental impossibility; the sessions were not launched.

## What this does and does not show

- Structural validation of the composition is a `npm run check` / `npm run check-upstreams` claim, recorded elsewhere.
- Specification: leaderboard hidden grader distinguishes score-only ranking, dropped ties, and the correct identity order.
- Empirical result for live agent behavior: **incomplete**. No `helped`, `neutral`, or `harmed` scores exist.
- Do not treat constructed Karpathy-inspired evals as live proof.
- Do not mix this gap with the Ponytail pilot's unavailable battery.

A later paired battery should freeze the post-Ponytail skill tree before treatment edits, run both conditions on the four cases above, and record completion, correctness, scope, verification, clarification behavior, preserved user changes, and overhead per pair.
