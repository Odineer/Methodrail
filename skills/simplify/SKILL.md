---
name: simplify
description: Reduce avoidable code and complexity in selected areas while preserving observable behavior. Use for a named simplification or a batch of selected findings. Run only when explicitly requested or called by a workflow.
when_to_use: Explicit request only (/simplify), or an active workflow names it. Executes selected behavior-preserving reductions, including a batch.
disable-model-invocation: true
---

# Simplify

## Workflow

1. Confirm the selected targets and the reduction sought. Treat authorized findings as a batch. Group changes that share callers, contracts, or checks and order them by dependency. Route requests to discover or rank opportunities to `improve-codebase-architecture` for architecture or `maintain-project` for broader debt.
2. Read `.methodrail/PROJECT.md` if present. If a knowledge pointer is relevant, follow [knowledge reuse](../../references/knowledge/reuse.md). Use `how` to understand current structure and `codebase-design` for depth/seam vocabulary.
3. Establish a behavioral baseline with existing tests, the project verification skill, or `observe` when behavior is not already characterized. Follow [verification lifecycle](../../references/verification-lifecycle.md). Reuse adequate checks. Do not invoke `create-verification-skill` when those checks already characterize the target.
4. Validate that the proposed change addresses the named friction with a demonstrated benefit. A named target may be quiet or unused and still have evidenced maintenance, packaging, contract, or tooling cost. Stop when the change is unrelated to the request or supported only by speculative cleanup. Before removing unused code, check exports, dynamic loading, side effects, generated registration, and external compatibility. Absence of local callers is not proof the code is dispensable. Apply [simplicity](../../references/simplicity.md) to that target only, including the comment rule and [change-created cleanup](../../references/simplicity.md#change-created-cleanup); do not expand into adjacent cleanup.
5. Reuse checks that exercise the preserved contracts. Add only characterization coverage needed to catch a specific regression and run it before editing the implementation.
6. Work in small increments. Try proven deletion first, then reuse or inlining, then consolidation. Delete superseded paths in the same increment. Compare the whole maintenance surface, including adapters, config, and tests. Drop a proposed consolidation if its new machinery outweighs the reduction. Preserve public contracts and justified test seams.
7. Rerun affected baseline checks after each increment. Keep working through the selected batch. If one item is blocked, continue with independent items and report the blocker.
8. Inspect this task's delta before claiming done. Each hunk should support the selected structural change, necessary supporting work, required verification, or cleanup of artifacts this change made unused. When reduction is the goal, report lines added and removed against the starting state, including new files. Show the implementation and verification changes separately and include the net total. If the agreed reduction was missed, report it as unmet and name what offset the savings. Remove only this agent's unrelated edits.
9. Use `blast-radius` for shared contracts or cross-boundary moves. Run `code-review` for a substantive structural repair, at the depth [rigor](../../references/rigor.md) selects. Use `receiving-code-review` when received findings are disputed or materially ambiguous. An intentional behavior change the user asked for alongside the restructuring is a bounded feature phase under `develop`, not a silent behavior-preserving claim. Ask only under the [human-decision rule](../../references/decision-frontier.md#consequential-assumptions).
10. If the refactor adds, changes, or removes user-facing behavior an existing map represents or should represent, or invalidates a shared verification helper, invoke `maintain-verification-skill` in task-scoped mode and exercise the affected entries plus dependent flows of a changed helper. Do not start a full audit. When changed covered operations alter an existing formal check's representation, invoke `maintain-formal-verification-skill` with action `apply` and task-scoped coverage, and return its evidence here. Do not create a formal check from generic refactor intent. After all cleanup and review-driven edits, use `verify-change` before claiming success. If later edits change relevant state, rerun the affected verification.

## Delegation

Use [swarm](../swarm/SKILL.md) when independent slices are substantial enough to benefit from parallel work. Give each worker a [task packet](../../references/protocols/task-packet.md) with its paths, behavior to preserve, baseline, and reduction goal. Delegate edits only with isolated writable workspaces and disjoint ownership of source and verification artifacts. Handle shared contracts, files, and dependent edits sequentially. Integrate and review the combined diff, then run checks on the integrated state. Use the same procedure sequentially when isolation is unavailable or a parent already delegated the slice.

## Constraints

- Do not mix feature work into a refactor unless the user explicitly asked for both.
- Do not broaden a selected refactor into an architecture survey or adjacent cleanup.
- Do not choose among multiple codebase-wide candidates here. `improve-codebase-architecture` owns that discovery and selection workflow.
- Do not use `architect` or `prototype` for local mechanical restructuring.
- Do not claim behavior preservation from inspection alone.
- Consult [rigor](../../references/rigor.md) before escalating ceremony.

## Done when

Each selected item has a verified reduction or an explicit unresolved disposition. The integrated result preserves relevant observable behavior with fresh evidence. This workflow emits one [completion report](../../references/protocols/completion-report.md) for substantive work.

## Neighbors

```text
Usually follows:              a named structural problem or refactor brief
Often produces:               structural change; verify-change
Survey/choose opportunities:  improve-codebase-architecture
Escalate execution depth to:  how, codebase-design, blast-radius, code-review, maintain-verification-skill
Avoid combining automatically with: architect, prototype, develop-as-feature
```
