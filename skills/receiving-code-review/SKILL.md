---
name: receiving-code-review
description: Assess existing findings from a PR, reviewer, or handoff. Dispatch and verify repairs when the user asks to address or fix findings. Fresh diff reviews go to code-review.
when_to_use: Use to assess received review findings or address them on request. Use code-review for a fresh diff review.
---

# Receiving code review

Read the full batch. Use the supplied review packet when available. Establish the current target, intended behavior, and applicable project guidance. Default to read-only assessment. A user request to address, fix, or apply findings authorizes repair of supported findings within scope. A bare invocation or a reviewer request supplies findings to assess. Authority to change scope or established contracts comes from the task owner.

1. **Check the claim.** Separate the reported problem from the proposed fix. Inspect the current code, relevant callers, tests, and compatibility constraints. Reproduce disputed behavior when source alone cannot settle it. Treat old line references, reviewer confidence, and claims of no callers as leads to check. For suggested scope expansion, use [simplicity](../../references/simplicity.md) and look for a concrete requirement or supported consumer.
2. **Decide the outcome.** Accept supported findings, explain stale or contradicted ones with evidence, and state what would resolve an unverified claim. Use [the human-decision rule](../../references/decision-frontier.md#consequential-assumptions) when a proposal conflicts with an established decision or intent remains consequentially ambiguous after investigation. Hold dependent changes while continuing independent, authorized work.
3. **Route the outcome.** When called by an active implementation workflow, return decisions and evidence to that workflow for handling within its existing scope and lifecycle. For standalone use, continue to repair only if the user requested it. Otherwise report each material finding's outcome and evidence, then stop before edits or repair dispatch.
4. **Apply requested repairs.** Start with blocking issues and prerequisites. Fix clear defects, documentation drift, and straightforward test gaps directly in the owning code, document, or tests. Use [debug](../debug/SKILL.md) for a defect that needs diagnosis and [develop](../develop/SKILL.md) for substantive missing behavior or an authorized contract change. When the [verification lifecycle](../../references/verification-lifecycle.md) selects maintenance for an affected verification procedure or feature map, call [maintain-verification-skill](../maintain-verification-skill/SKILL.md) in task-scoped `apply` mode. Give each specialist its assigned findings, acceptance criteria, and preserved contracts. The specialist returns the patch and evidence to the batch owner.
5. **Delegate when independent.** Use [swarm's implementation procedure](../swarm/SKILL.md#implementation-slices) when substantial independent fixes benefit from parallel work. The batch owner reviews each returned patch before integration and owns final verification.
6. **Verify.** Check each coherent fix. Run [verify-change](../verify-change/SKILL.md) on the integrated result after the last relevant edit. Continue independent fixes when one finding is blocked. Report the evidence for each resolution and why any finding remains open.

Account for each material finding with its outcome and supporting evidence. Posting replies and resolving external review threads require separate authorization unless the user already requested those actions.
