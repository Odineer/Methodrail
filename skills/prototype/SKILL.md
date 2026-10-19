---
name: prototype
description: "Build a throwaway prototype to answer an empirical question. Use when a state model, UI, or approach is cheaper to test than to argue. Prototypes are evidence, not production. Do not use for questions answerable from source or existing tests."
when_to_use: Explicit request only, or an active workflow names it. A throwaway executable experiment when testing is cheaper than arguing; not for questions source or tests already answer.
disable-model-invocation: true
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape. Prototype code is evidence, not silently production implementation.

## Evidence record

Every prototype defines:

- question
- hypothesis
- minimal experiment
- observation (success/failure)
- verdict
- limitations
- evidence location

See [decision frontier](../../references/decision-frontier.md) when classifying empirical questions.

## Pick a branch

Identify which question is being answered:

- **"Does this logic / state model feel right?"** → [LOGIC.md](references/LOGIC.md). A single shareable HTML file that pushes the state machine through cases that are hard to reason about on paper.
- **"What should this look like?"** → [UI.md](references/UI.md). Several radically different UI variations, switchable.
- **Other empirical questions** (performance, API shape, protocol): keep the same evidence record; use the smallest runnable experiment. Specialized live-process probes belong in `runtime-forensics` / `performance`, not here. pstack's probe playbook is in [pstack-playbook.md](references/pstack-playbook.md) for reference only.

If the question is genuinely ambiguous and the user isn't reachable, default from surrounding code (backend → logic; page/component → UI) and state the assumption.

## Rules

1. **Throwaway from day one, and clearly marked as such.** Locate it near the module it prototypes, named so a casual reader can see it is not production.
2. **Trivial to run.**
3. **No persistence by default.** If the question involves a database, hit a scratch store named so it can be wiped.
4. **Skip the polish.** No tests beyond what makes it runnable, no abstractions.
5. **Surface the state** after every action.
6. **Capture it when done.** Fold any validated decision into real code deliberately. Keep the prototype off main unless the user asks to keep it. The verdict survives; the scaffolding does not, unless promoted.

Do not ship the prototype as the implementation.

## Neighbors

```text
Consumes                      → explicit empirical question
May inform                    → architect, wayfinder, decision record
Must not                      → silently become production code
```

Use the project verification/control surface when the experiment needs a running app. Specialized live-process probes belong in `runtime-forensics` / `performance`.
