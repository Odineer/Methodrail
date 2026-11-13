# Simplicity

Make the smallest complete change that meets the user's intent and preserves required behavior. Minimize unnecessary complexity. Fewer files, lines, dependencies, and abstractions can help; they are not success metrics by themselves.

Load the procedure before substantive implementation, when assessing complexity, or when deciding whether a change made something unused. Mechanical edits can skip the procedure. The comment rule still applies to new and materially changed code. Change-created cleanup still applies after a replacement or deletion. Start with the affected flow and acceptance criteria.

```text
explicit requirements, no speculative extras
↓
reuse an existing implementation or project pattern
↓
consider stdlib, native platform, and already-installed capabilities
↓
add only the implementation and interfaces this requirement justifies
↓
fix the root cause at its owner
↓
verify, then stop
```

## Procedure

1. **Requirements.** Fulfill what was asked. Exclude speculative additions, leftover scaffolding, and "for later" flexibility.
2. **Reuse or replace.** Before editing, find what owns the behavior, what can be reused or extended, and which paths the change would supersede. Check their callers and contracts before choosing a replacement.
3. **Native capability.** Consider standard-library, native-platform, and already-installed options. Choose what satisfies the required semantics and project constraints. There is no universal ranking that beats a missed requirement: if stdlib or a native feature is insufficient, keep the requirement and pick the sufficient implementation.
4. **Necessity.** Tie each new module, dependency, abstraction, configuration option, or fallback to a current requirement, supported failure mode, or concrete verification need. A larger coherent change is necessary when a local patch would duplicate logic or leave other paths broken.
5. **Owner.** Locate the violated contract and fix its owner, regardless of how many callers expose the defect. Fix caller misuse at the caller; fix a shared implementation that violates its contract there, even if only one caller triggers it. Verify the reported path and relevant shared behavior.
6. **Stop.** Run relevant verification and stop when acceptance is met. Do not open extra workflows or unrelated cleanup.

## Change-created cleanup

Remove code, configuration, and dependencies that this change makes unused, after checking remaining uses and effects. Leave pre-existing unrelated dead code alone. Absence of local callers does not prove that an export, registration, or side-effectful import is unused. Prefer compiler or linter evidence when it decides the case. Inspect source and contracts when it cannot.

Do not scan the repository for dead code, impose a removal quota, or delete another contributor's uncommitted work.

## Preserve

Keep security, accessibility, error handling, public contracts, justified extension seams, and testability. Follow the project's testing approach. Do not replace it with a one-check or no-framework rule.

Retain an abstraction that carries a real public contract or test seam. Do not delete it because it has few implementations.

When the request explicitly requires complex behavior, deliver that behavior. Do not substitute an easier feature without agreement.

## Comments

Default to clear names, straightforward control flow, and executable constraints (types, tests, assertions). Add comments or docstrings only to record non-obvious rationale or constraints, document a public contract, or meet a tooling or legal requirement.

Do not add comments that restate visible code, narrate ordinary operations, add decorative section labels, or explain confusing naming that should instead be improved. Do not add branded source markers or speculative TODOs.

When editing code, revisit the comments and docstrings that describe the affected behavior, including relevant prose outside the diff. Delete redundant prose and stale notes that have lost their purpose. Update prose that still carries a contract, constraint, or non-obvious reason. Preserve license notices and tool/compiler directives.

Before removing a docstring, check whether API documentation, doctests, generated help, or runtime introspection rely on it. Keep cleanup scoped to the affected behavior or the selected audit findings. Use comment counts to locate candidates and verify removals by checking what readers and tools rely on.

## Done when

Acceptance criteria are met, required safeguards remain, comments in the diff carry information the code cannot, artifacts this change made unused are removed, and the change does not include unrelated cleanup or a parallel implementation.
