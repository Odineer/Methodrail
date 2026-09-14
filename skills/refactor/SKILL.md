---
name: refactor
description: Execute one selected, behavior-preserving structural change from a named friction, target, or refactor brief. Run only when explicitly requested. Do not use to survey the whole codebase, choose architecture opportunities, perform feature work, or handle mechanical edits.
disable-model-invocation: true
---

# Refactor

Execute a selected structural change while preserving relevant observable behavior. This is the focused implementation workflow, not a codebase-wide architecture survey or feature development.

```text
selected friction and target
↓
understand current structure
↓
behavior baseline
↓
smallest credible structural change
↓
incremental changes
↓
verification
↓
blast-radius/review proportional to risk
```

## Workflow

1. Confirm the selected friction and target. Accept a named structural problem or a refactor brief. If the request is to scan, rank, or choose opportunities across the codebase, route directly to `improve-codebase-architecture` and do not begin implementation.
2. Read `.methodrail/PROJECT.md` if present. If a knowledge pointer is relevant, follow [knowledge reuse](../../references/knowledge/reuse.md). Use `how` to understand current structure and `codebase-design` for depth/seam vocabulary.
3. Establish a behavioral baseline with existing tests or `observe` when behavior is not already characterized.
4. Validate that the proposed change addresses the named friction. Stop if the target is quiet, unused, unrelated to current work, or supported only by speculative cleanup claims. Apply [simplicity](../../references/simplicity.md) to that target only, including the comment rule and [change-created cleanup](../../references/simplicity.md#change-created-cleanup); do not expand into adjacent cleanup.
5. Add characterization coverage when existing checks would not catch an accidental behavior change.
6. Change structure in small increments. Preserve public contracts unless the request explicitly includes a contract change. Retain a justified contract or test seam.
7. Re-run the baseline after each increment. Use `verify-change` before claiming success.
8. Inspect this task's delta before claiming done. Each hunk should support the selected structural change, necessary supporting work, required verification, or cleanup of artifacts this change made unused. Remove only this agent's unrelated edits.
9. Use `blast-radius` for shared contracts or cross-boundary moves, then `code-review` when rigor or scope justifies it.

## Constraints

- Do not mix feature work into a refactor unless the user explicitly asked for both.
- Do not broaden a selected refactor into an architecture survey or adjacent cleanup.
- Do not choose among multiple codebase-wide candidates here. `improve-codebase-architecture` owns that discovery and selection workflow.
- Do not use `architect` or `prototype` for local mechanical restructuring.
- Do not claim behavior preservation from inspection alone.
- Consult [rigor](../../references/rigor.md) before escalating ceremony.

## Done when

The selected friction is reduced, relevant observable behavior is preserved with fresh evidence, and any intentional behavior change is explicit.

## Neighbors

```text
Usually follows:              a named structural problem or refactor brief
Often produces:               structural change; verify-change
Survey/choose opportunities:  improve-codebase-architecture
Escalate execution depth to:  how, codebase-design, blast-radius, code-review
Avoid combining automatically with: architect, prototype, develop-as-feature
```
