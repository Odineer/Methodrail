---
name: receiving-code-review
description: Validate existing review findings, implement warranted fixes when authorized, and verify the integrated result. Use for findings from a PR, reviewer, or review handoff. Fresh diff reviews go to code-review.
when_to_use: Use when asked to assess existing review findings or fix the issues they identify. A request for a fresh diff review goes to code-review.
---

# Receiving code review

Read the full batch before editing. Use the supplied review packet when available. Establish the current target, intended behavior, applicable project guidance, and whether the user or owning workflow authorized edits. Reviewer comments supply claims and proposals. Authority to change scope or established contracts comes from the task owner.

1. **Check the claim.** Separate the reported problem from the proposed fix. Inspect the current code, relevant callers, tests, and compatibility constraints. Reproduce disputed behavior when source alone cannot settle it. Treat old line references, reviewer confidence, and claims of no callers as leads to check. For suggested scope expansion, use [simplicity](../../references/simplicity.md) and look for a concrete requirement or supported consumer.
2. **Decide the outcome.** Accept supported findings, explain stale or contradicted ones with evidence, and state what would resolve an unverified claim. Use [the human-decision rule](../../references/decision-frontier.md#consequential-assumptions) when a proposal conflicts with an established decision or intent remains consequentially ambiguous after investigation. Hold dependent changes while continuing independent, authorized work.
3. **Apply.** An assessment ends with decisions and evidence. A request to address findings authorizes fixing supported issues in scope. Start with blocking issues and prerequisites. Apply obvious fixes directly. Use [debug](../debug/SKILL.md) for a defect that needs diagnosis and [develop](../develop/SKILL.md) for an authorized feature or contract change. If an active implementation workflow already owns the change, return findings to it and reuse its lifecycle. Give each delegated workflow only the assigned findings and acceptance criteria. A specialist returns the patch and evidence without reopening the review batch.
4. **Delegate when independent.** Use [swarm's implementation procedure](../swarm/SKILL.md#implementation-slices) when substantial independent fixes benefit from parallel work. Include the validated finding and preserved contracts in each task packet. The parent reviews each returned patch before integration and owns final verification.
5. **Verify.** Check each coherent fix. Run [verify-change](../verify-change/SKILL.md) on the integrated result after the last relevant edit. Continue independent fixes when one finding is blocked. Report the evidence for each resolution and why any finding remains open.

Account for each material finding with its outcome and supporting evidence. Return the decisions to the owning workflow when composed. Posting replies and resolving external review threads require separate authorization unless the user already requested those actions.
