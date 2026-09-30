---
name: domain-modeling
description: "Build and sharpen a project's domain model. Use when discussing codebase terminology, ownership, states, or recording a consequential domain decision. Challenge fuzzy terms, stress-test with scenarios, and write canonical language down when it crystallises."
---

# Domain modeling

Actively build and sharpen the project's domain model. This is the *active* discipline: challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. Merely *reading* an existing glossary is not this skill.

## Where the glossary lives

Do not force a filename. Prefer the project's established source of truth, in this order:

1. An existing canonical glossary (`CONTEXT.md`, `CONTEXT-MAP.md`, `GLOSSARY.md`, `GLOSSARY-MAP.md`, `docs/domain.md`, or another project-native vocabulary the repository already uses)
2. Existing `.methodrail/knowledge/domain.md` only when that file is already the glossary
3. Create lazily as a project-native file (`docs/domain.md` or an existing convention such as `CONTEXT.md`) when the first term is actually resolved. Do not force `GLOSSARY.md`. Do not create a new untyped file under `.methodrail/knowledge/`.

If a `CONTEXT-MAP.md`, `GLOSSARY-MAP.md`, or equivalent exists, the repo has multiple contexts. Follow that map. System-wide decisions may live in `docs/adr/` or `.methodrail/knowledge/decisions/`; context-specific decisions stay with that context. Durable typed notes still go through `reflect` after approval.

`PROJECT.md` should point at whichever glossary is canonical. Do not copy the glossary into Methodrail-only duplicates.

The glossary should be devoid of implementation details. It is a vocabulary, not a spec, scratch pad, or repository for implementation decisions. Use the format in [CONTEXT-FORMAT.md](references/CONTEXT-FORMAT.md), adapted to the file you actually maintain.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account': do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force precision about boundaries.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it.

### Update the glossary inline

When a term is resolved, update the canonical glossary right there. Don't batch these up. Record:

- canonical term
- definition
- ownership when it matters
- states and transitions when they matter
- invariants
- rejected synonyms

Keep it concise. Do not turn the domain model into a running requirements document. See the [knowledge model](../../references/knowledge/model.md).

### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful
2. **Surprising without context**: a future reader will wonder why
3. **The result of a real trade-off**: genuine alternatives, picked for specific reasons

If any of the three is missing, skip the ADR. Do not write the file until the user approves the draft. Use [ADR-FORMAT.md](references/ADR-FORMAT.md). Write the ADR next to the project's existing decision records, or `.methodrail/knowledge/decisions/` if that is the home. See the [decision record](../../references/protocols/decision-record.md) promotion ladder and the [decision frontier](../../references/decision-frontier.md).

Ask humans only for preference or intent the environment cannot resolve.

## Neighbors

```text
Use existing project vocabulary rather than inventing a parallel glossary
May feed                      → grill-with-docs, wayfinder, architect
```
