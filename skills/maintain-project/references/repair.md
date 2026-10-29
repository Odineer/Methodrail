# Maintenance repair

Execution handoffs for [maintain-project](../SKILL.md). The selected workflow owns the item. It returns evidence here. It does not restart project-wide discovery.

## Before edits

Revalidate each selected finding against current state. Stale facts from an earlier report do not authorize the repair. Announce the batch when the request was "find and fix" clear low-risk debt. Then edit.

Give the child the prior facts, the acceptance criteria, and a [task packet](../../../references/protocols/task-packet.md). Do not paste the whole audit.

## Handoffs

| Selected work | Owner | Stop rule |
|---|---|---|
| Architecture candidate still uncertain | `improve-codebase-architecture` design operators (`grill-with-docs`, `codebase-design`) for that item only | Do not rerun the whole survey or grilling loop for a local obvious repair |
| One behavior-preserving structural repair | `refactor` | Preserve the stated behavior. Do not widen into a survey |
| Intentional behavior change the repair explicitly requires | `develop` | Only that change |
| Verification drift or owned helper | `maintain-verification-skill` with action `apply` and the named coverage | A read-only audit cannot escalate itself to `apply` |
| Formal-check drift | `maintain-formal-verification-skill` with action `apply` and the named coverage | A read-only audit cannot escalate itself to `apply`. A product bug returns to `debug` |
| Broken command or pointer with an obvious fix | Bounded direct edit | Prove the canonical command |
| Failure that needs diagnosis | `debug` | Classify a product defect as a defect |

`apply` may edit the verification skill's owned files and must prove every changed driving procedure, including dependent flows of a changed helper. Product code, glossaries, specs, ADRs, and typed notes stay out of that edit scope. Do not change expected behavior to make a failing product pass. Return the product defect to the selected execution owner and recheck the flow after that owner fixes it.

Create a verification skill only during an authorized repair when [verification lifecycle](../../../references/verification-lifecycle.md) selects `missing-path`. Adequate scripts are not a reason to generate one.

## Evidence invalidation

After the last relevant edit, including cleanup and verification maintenance, rerun the checks that edit invalidated. A later repair can invalidate earlier evidence for a shared file or helper. Recheck those dependents before the batch claim. Reuse evidence whose relevant state did not change.

A repaired verification helper must be exercised on its affected flows and on the dependent flows in the selected scope. Skipping one of those flows leaves the batch unverified.

Verification that runs and is then followed by another relevant edit is stale. Rerun it. New contradictory evidence changes the finding's disposition. It is not permission for an unbounded debug or maintenance loop.

A repaired-state rerun that introduces further edits needs new evidence for those edits. No new evidence means no further diff.

## Reconciliation

Mark each selected item resolved, blocked, or still open with the evidence that supports that disposition. Out-of-batch discoveries go back on the report. They do not start another sweep.

Finish a substantive repair with the [completion report](../../../references/protocols/completion-report.md). Do not add keys.
