# Knowledge model

Do not conflate these types. They answer different questions and go stale in different ways.

```text
fact
decision
rationale
observation
invariant
convention
known-failure
hypothesis
```

## Types

**Fact** — a currently true statement about the system, usually recoverable from source, config, or a deterministic tool.

**Decision** — a choice that was made. It constrains future work even if the original rationale is later questioned.

**Rationale** — why a decision or shape exists. Historical. Do not invent it from current code.

**Observation** — what actually happened in a specific exercise of the system.

**Invariant** — a property that must remain true. Prefer encoding it in types, tests, or architecture.

**Convention** — a local agreement that is not an invariant but is costly to violate accidentally.

**Known-failure** — a trap, incident pattern, or false lead worth remembering.

**Hypothesis** — an unconfirmed explanation. Never promote a hypothesis as fact.

## Why the distinction matters

```text
FACT
The worker currently retries four times.

DECISION
Transient jobs should retry at most three times.

RATIONALE
Additional retries caused duplicate external side effects.

OBSERVATION
The current production implementation performs four retries.

HYPOTHESIS
Retry count may explain duplicate charges.
```

These can all be true at once. Mixing them produces false confidence: agents treat desired policy as implemented fact, or treat a one-run observation as an invariant.

Keep records lightweight. When a durable typed note is justified, start from [note.md](../../templates/project/knowledge/note.md) and follow the [note contract](note-contract.md). The other files in `templates/project/knowledge/` describe legacy untyped notes; do not create new ones from them. Do not force a database schema.

## Typed notes vs records

These five kinds may become typed Markdown notes under `.methodrail/knowledge/<slug>.md` after explicit human approval:

```text
fact
invariant
convention
known-failure
hypothesis
```

**Decision** stays on the decision-record template in `.methodrail/knowledge/decisions/`. **Rationale** and **observation** stay records. Do not file them as typed notes.

Typed notes use the [note contract](note-contract.md). Existing untyped files remain legacy notes with reduced confidence. Optional `lifecycle` and `scope` govern reuse; they do not change kind.
