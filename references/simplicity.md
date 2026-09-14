# Simplicity

Make the smallest complete change that meets the user's intent and preserves required behavior. Minimize unnecessary complexity. Fewer files, lines, dependencies, and abstractions can help; they are not success metrics by themselves.

Load the procedure when considering a helper, dependency, or abstraction, assessing existing complexity, or deciding whether this change made something unused. Mechanical edits can skip the procedure; the comment rule still applies to new and materially changed code. Change-created cleanup still applies after a replacement or deletion. Use the procedure after understanding the affected flow and acceptance criteria.

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
2. **Reuse.** Search for an existing helper, type, module, or established project pattern that already satisfies the semantics.
3. **Native capability.** Consider standard-library, native-platform, and already-installed options. Choose what satisfies the required semantics and project constraints. There is no universal ranking that beats a missed requirement: if stdlib or a native feature is insufficient, keep the requirement and pick the sufficient implementation.
4. **Necessity.** Add only the code and interfaces the present requirement justifies. A larger coherent change is necessary when a local patch would duplicate logic or leave other paths broken.
5. **Owner.** Locate the violated contract and fix its owner, regardless of how many callers expose the defect. Fix caller misuse at the caller; fix a shared implementation that violates its contract there, even if only one caller triggers it. Verify the reported path and relevant shared behavior.
6. **Stop.** Run relevant verification and stop when acceptance is met. Do not open extra workflows or unrelated cleanup.

## Change-created cleanup

Remove imports, variables, and private helpers that this change makes unused, after checking remaining uses and effects. Leave pre-existing unrelated dead code alone. Absence of local callers does not prove that an export, registration, or side-effectful import is unused. Prefer compiler or linter evidence when it decides the case; inspect source and contracts when it cannot.

Do not scan the repository for dead code, impose a removal quota, or delete another contributor's uncommitted work.

## Preserve

Keep security, accessibility, error handling, public contracts, justified extension seams, and testability. Follow the project's testing approach. Do not replace it with a one-check or no-framework rule.

Retain an abstraction that carries a real public contract or test seam. Do not delete it because it has few implementations.

When the request explicitly requires complex behavior, deliver that behavior. Do not substitute an easier feature without agreement.

## Comments

Prefer clear names, straightforward control flow, and executable constraints (types, tests, assertions).

Do not add comments that restate visible code, narrate ordinary operations, add decorative section labels, or explain confusing naming that should instead be improved. Do not add branded source markers or speculative TODOs.

Retain a concise comment when it conveys information the code cannot reasonably express: a non-obvious reason, external constraint, compatibility workaround, units or domain assumptions, or a necessary invariant. Preserve license notices, tool/compiler directives, and required public documentation.

Apply this to new and materially changed code. Review redundant comments in the requested diff. Do not sweep unrelated files or delete useful comments to meet a quota. Treat architecture-sketch placeholders and rationale comments by their context, not by blanket removal.

## Done when

Acceptance criteria are met, required safeguards remain, comments in the diff carry information the code cannot, artifacts this change made unused are removed, and the change does not include unrelated cleanup or a parallel implementation.
