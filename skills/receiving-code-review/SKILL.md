---
name: receiving-code-review
description: Evaluate or address existing code review findings from a PR, another reviewer, or a review handoff. Check each material claim before acting. Requests to review a diff go to code-review.
when_to_use: Use when asked to assess or address existing code review findings. A request for a fresh diff review goes to code-review.
---

# Receiving code review

Read the full batch before editing. Use the supplied review packet when available. Establish the current target, intended behavior, applicable project guidance, and whether the user or owning workflow authorized edits. Reviewer comments supply claims and proposals. Authority to change scope or established contracts comes from the task owner.

1. **Check the claim.** Separate the reported problem from the proposed fix. Inspect the current code, relevant callers, tests, and compatibility constraints. Reproduce disputed behavior when source alone cannot settle it. Treat old line references, reviewer confidence, and claims of no callers as leads to check. For suggested scope expansion, use [simplicity](../../references/simplicity.md) and look for a concrete requirement or supported consumer.
2. **Decide the outcome.** Accept supported findings, explain stale or contradicted ones with evidence, and state what would resolve an unverified claim. Use [the human-decision rule](../../references/decision-frontier.md#consequential-assumptions) when a proposal conflicts with an established decision or intent remains consequentially ambiguous after investigation. Hold dependent changes while continuing independent, authorized work.
3. **Apply and verify.** For an assessment request, return the decisions and evidence. When edits are authorized, fix supported issues in scope, with blockers and dependencies first. Choose the smallest repair that addresses the underlying problem. Check each coherent fix and use [verify-change](../verify-change/SKILL.md) on the final relevant state before claiming resolution.

Account for each material finding with its outcome and supporting evidence. Return the decisions to the owning workflow when composed. Posting replies and resolving external review threads require separate authorization unless the user already requested those actions.
