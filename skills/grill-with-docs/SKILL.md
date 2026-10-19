---
name: grill-with-docs
description: "Relentless interview to sharpen a plan or design, updating the domain glossary and ADRs as decisions crystallise. Use when consequential requirements remain ambiguous and documents exist that should be interrogated alongside the human. Do not use for routine implementation."
when_to_use: Explicit request only, or an active workflow names it. Interviews the human while consequential requirements stay ambiguous; not routine implementation.
disable-model-invocation: true
---

# Grill with docs

Resolve uncertainty. This is not `to-spec` (which crystallizes already-resolved intent) and not routine development.

Activate only when the user asks to grill, or when a workflow entry skill (`/develop`, `wayfinder`) hits consequential ambiguity that documents and a human can jointly settle. Do not auto-trigger an interview for ordinary coding.

## Method

Run the grilling procedure in [grilling.md](references/grilling.md):

- Map the work as a design tree
- Filter ordinary workflow questions through the [human-decision rule](../../references/decision-frontier.md#consequential-assumptions) before they enter a round
- Ask the qualifying current frontier in one round, with a recommended answer for each question
- Wait for the user's answers before the next round
- Find facts yourself; never ask the user what the repository or environment can answer
- When the caller already has authority and the qualifying decisions are resolved, report the understanding and return. Do not add another approval of those decisions
- A standalone interview stops when the frontier is empty and ends with its synthesis. That synthesis does not authorize implementation

At the same time, run `domain-modeling`:

- Challenge terms against the canonical glossary
- Stress-test with scenarios
- Update the glossary inline when a term crystallises
- Offer ADRs only when hard to reverse, surprising, and the result of a real trade-off

A standalone interview does not act on the plan. The synthesis is the result. A composed call returns that understanding to the caller that already has authority.

## Neighbors

```text
Needs glossary/ADRs           → domain-modeling (already included)
Needs a large decision map    → wayfinder
Needs a durable spec          → to-spec after the frontier is empty
```

Do not auto-start `/develop`. Read `.methodrail/PROJECT.md` for glossary and ADR pointers when present.

## Done when

The qualifying frontier is empty. A standalone interview has stated the shared understanding. A composed call has returned it to the caller.
