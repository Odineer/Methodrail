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

Resolve implementation facts through source, tests, configuration, or runtime evidence before asking. If a consequential preference or policy remains unresolved, present the meaningful alternatives with a recommendation and ask before implementing dependent behavior. Continue independent investigation or implementation that does not depend on the missing choice.

For a low-impact reversible choice supported by context, state the material assumption briefly and proceed. Do not list obvious assumptions or ask permission to follow established conventions. If new evidence contradicts an assumption, revise the affected plan rather than silently preserving it.

Do not stop all useful work because something is unclear. Do not auto-trigger `grill-with-docs`, `wayfinder`, `architect`, or `prototype` for ordinary ambiguity.

A frontier choice that is hard to reverse, surprising without context, and a real trade-off may be offered as an ADR after approval. Reversible operational choices stay in the TSV trail. See [decision-record](protocols/decision-record.md).

Do not implement this as a graph engine. The native agent can reason with this model. `develop`, `architect`, `prototype`, and `domain-modeling` should use it when planning work.
