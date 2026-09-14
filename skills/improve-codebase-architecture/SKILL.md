---
name: improve-codebase-architecture
description: "Orchestrate a codebase-wide architecture improvement survey: scan active, high-churn code, classify delete vs deepen vs preserve vs reject, help select a candidate, and produce a refactor brief. Use when the user asks to find, rank, or choose architecture improvements across a codebase. Do not use to implement an already-selected refactor or for speculative cleanup of quiet code."
disable-model-invocation: true
---

# Improve codebase architecture

Surface architectural friction. Ask two questions, in order:

1. Does the module earn existence? If deleted, does complexity vanish or reappear across callers?
2. If it earns existence, is it deep enough?

Call `codebase-design` for the vocabulary (**module**, **interface**, **depth**, **seam**, **adapter**, **leverage**, **locality**). Do not copy that glossary here. Use the project's canonical glossary for domain names.

This skill owns portfolio-level discovery and selection across the codebase. `/refactor` is a downstream executor for one selected behavior-preserving change; it does not invoke or own this survey.

## Process

### 1. Explore

**Scope before you scan.** Weight recently changed code and current work.

- If the user named a module, subsystem, or pain point, take it.
- Otherwise walk commit history for hot spots. If changes are scattered, widen the net.
- Stop if the code is quiet, unused, or unrelated to current work.

Read the glossary, ADRs, typed notes, and verification features in the area first. Then walk the code. For each candidate collect:

- recent or current-work relevance
- repeated navigation or caller burden
- defects, review friction, or testability evidence when available
- interface leakage and expected interface reduction
- caller list and blast radius
- related project knowledge and ADRs
- existing verification and characterization gaps
- reuse of an existing helper or project pattern
- native/stdlib capability that already satisfies the semantics
- unnecessary layer: wrapper that only delegates, speculative flexibility, or a dependency the platform already covers

Classify:

- **delete/consolidate** — pass-through; deletion removes complexity
- **deepen** — earns a seam but the interface is still too wide, leaky, or hard to test
- **preserve** — already deep; high churn is not a reason to rewrite it
- **reject** — quiet speculative cleanup, or a one-adapter hypothetical seam

Reuse, native-capability, and unnecessary-layer notes feed those four classes. Rank by justified benefit and risk, not by deleted lines. A justified contract or test seam is not a delete candidate. See [simplicity](../../references/simplicity.md).

Do not edit source during the survey.

### 2. Present candidates

Default presentation is Markdown in the conversation. Generate HTML only when several relationships materially benefit from a visual. Write optional HTML to the OS temp directory: `$TMPDIR/architecture-review-<timestamp>.html` (fallback `/tmp`, or `%TEMP%` on Windows). Do not commit survey reports. If you generate HTML, inspect the rendered file before presenting it. See [HTML-REPORT.md](references/HTML-REPORT.md).

Each candidate names friction with evidence, current vs proposed interface, callers, behavior to preserve, verification baseline or gap, related knowledge, expected locality/leverage gain, and recommendation strength:

- `Strong` — demonstrated recurring friction, a credible smaller interface, and an honest verification path
- `Worth exploring` — real friction, but the seam or verification path remains uncertain
- `Speculative` — plausible improvement without enough usage, churn, or evidence to justify implementation

A UI candidate without a visual baseline, or a candidate with no credible verification route, cannot be `Strong`.

If a candidate contradicts an active ADR, only surface it when friction is real enough to reopen the ADR through the [decision-record](../../references/protocols/decision-record.md) gate.

End with a top recommendation. Ask which candidate to explore. Do not propose detailed interfaces yet.

### 3. Grilling loop

Once the user picks a candidate, use `grill-with-docs` to walk constraints, the deepened or deleted module, the seam, and which tests survive. Use `domain-modeling` as terms crystallise. Use `codebase-design` / design-it-twice to explore alternative interfaces.

### 4. Refactor brief

After grilling, return a compact brief:

- evidence-backed friction statement
- current and proposed interface
- caller list and blast radius
- behavior and public contracts to preserve
- baseline verification route and missing characterization
- related ADRs, typed notes, and feature-map entries
- unresolved choices
- route: `/refactor` for behavior-preserving work, `/develop` for intentional behavior change, `to-spec` / `to-tickets` for large independently landable work

Log the selection in TSV only when `show-me-your-work` is already justified. Offer an ADR only through the three-part gate.

## Neighbors

```text
Vocabulary                    → codebase-design
Chosen candidate              → grill-with-docs
Behavior-preserving work      → /refactor
```
