# Decision frontier

Do not attempt to answer every project question upfront. Resolve the currently actionable frontier, then recompute.

```text
Known
Frontier
Fog
```

## Known

Resolved facts, constraints, and decisions. Treat them as usable until freshness checks say otherwise.

## Frontier

Questions that are meaningful and answerable now. Their prerequisites are in Known.

## Fog

Questions whose prerequisites are unresolved, making them premature. Leave them in fog.

## Resolution methods

Classify frontier questions by the cheapest reliable method:

| Method | Use when | Typical skill |
| --- | --- | --- |
| source | the answer is in current implementation | `how` |
| runtime | actual behavior is in question | `observe` |
| history | motivation or origin is in question | `why` |
| prototype | the question is empirical | `prototype` |
| domain | product language or ownership is ambiguous | `domain-modeling` |
| human | the choice is preference, policy, or values | ask |
| deterministic-tool | a tool can answer without judgment | run the tool |

Examples:

```text
"Where is subscription ownership implemented?"
→ source → how

"What happens if the webhook is delivered twice?"
→ runtime → observe

"Why did this service move out of the monolith?"
→ history → why

"Will IndexedDB handle this volume?"
→ prototype

"What does 'workspace owner' mean?"
→ domain → domain-modeling

"Should the workflow optimize speed or auditability?"
→ human

"Did package-lock.json change?"
→ deterministic-tool
```

Downstream questions stay in fog until their prerequisites move into Known.

## Consequential assumptions

Identify interpretations that materially alter observable behavior, scope, data exposure, public contracts, or acceptance criteria.

Resolve implementation facts through source, tests, configuration, or runtime evidence before asking. A clarification is justified only when both conditions hold:

1. Human judgment is necessary. The choice is intent, preference, policy, or an intentional tradeoff, and it cannot be settled by the current request, prior answers, project guidance, source, tests, documentation, configuration, runtime evidence, or a suitable experiment.
2. The answers would change the build. They change observable behavior, meaningful scope, permissions, data handling, public compatibility, or acceptance criteria.

Several technical approaches do not satisfy either condition. Investigate those. An established convention or a supported low-impact reversible choice can be selected and stated. Do not list obvious assumptions or ask permission to follow established conventions. If new evidence contradicts an assumption, revise the affected plan rather than silently preserving it.

## Batch the qualified frontier

Before asking, gather evidence and drop any question that fails either condition. Ask the currently actionable, mutually independent qualifying questions in one round. Group related questions. Leave questions whose prerequisites are unanswered for a later round. Do not invent questions to fill a round. If none qualify, continue. If one qualifies, ask that one.

Each asked question states the unresolved choice and known facts, the meaningful alternatives, what would be built differently, and a recommendation with its tradeoff.

Pause only work that depends on an unanswered choice. Continue independent investigation or authorized work. Recompute the frontier after answers. Prior answers and prior authorization stay resolved across skills. Do not ask again because a different skill started. Do not treat silence or a timeout as approval.

An export with unresolved field scope and output format can ask both in that round: scope changes data exposure, and format changes the interface. A question that depends on one of those answers waits. Helper names, a documented date convention, and a repository-supported test seam do not enter the round.

This rule governs design clarification. It does not remove an existing approval boundary for ADRs, typed notes, harness placement or writes, or consequential external operations. Reuse approval already present in the session. When a necessary environment or redacted artifact is unavailable after reasonable attempts, report that blocker and request only the missing input or access. Do not turn the blocker into a requirements interview. Never ask the user to paste secrets.

`develop`, `debug`, `refactor`, `investigate`, and authorized maintenance repairs use this rule where a build choice appears. `to-spec` chooses a supported test seam unless that seam itself encodes a qualifying decision. `to-tickets` chooses routine granularity and dependency edges. `grill-with-docs` keeps frontier rounds, recommendations, and fact-finding, and filters ordinary workflow questions through this rule. When the qualifying decisions are resolved, report the understanding and follow the caller's existing authority. Do not add another approval of those same decisions. A standalone interview still ends with its synthesis and does not by itself authorize implementation.

Do not stop all useful work because something is unclear. Do not auto-trigger `grill-with-docs`, `wayfinder`, `architect`, or `prototype` for ordinary ambiguity.

A frontier choice that is hard to reverse, surprising without context, and a real trade-off may be offered as an ADR after approval. Reversible operational choices stay in the TSV trail. See [decision-record](protocols/decision-record.md).

Do not implement this as a graph engine. The native agent can reason with this model. `develop`, `architect`, `prototype`, and `domain-modeling` should use it when planning work.
