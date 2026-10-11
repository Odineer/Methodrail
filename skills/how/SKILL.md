---
name: how
description: "Use for \"how does X work\", code walkthroughs before changing something, and placement / ownership / layering questions. Explains subsystem architecture and runtime flow from actual implementation. Can critique architecture. Use why for historical motivation and observe for live behavior."
---

# How

Explore the codebase to answer "how does X work?" Produce a working mental model of the current implementation, not annotated source and not a directory tour.

Two modes:

1. **Explain** (default). Explore the codebase and produce a clear explanation.
2. **Critique.** Explain first, then independently identify architectural issues.

Critique is not the default. Do not make every exploration adversarial.

## Before expensive exploration

```text
check project knowledge
↓
check whether relevant knowledge may be stale
↓
reuse or selectively refresh
```

1. Read `.methodrail/PROJECT.md` if present and any linked notes that match the question.
2. Check [freshness](../../references/knowledge/freshness.md) before treating stored notes as current.
3. Reuse still-valid knowledge. Refresh only the stale slice. Do not skip the investigation below merely because a note exists.

Then follow the investigation procedure. Do not shorten it.

## Explain mode

```text
simple question
    →
direct explanation

complex question
    →
partition exploration
    →
independent explorers
    →
synthesis
```

### Step 1. Understand the question and assess complexity

Parse what the user is asking about:

- "How does the rate limiter work?" — a subsystem
- "How do we handle billing for on-demand usage?" — a feature flow
- "How is the auth service structured?" — an architectural overview
- "Walk me through what happens when a user submits a form" — a runtime trace

Identify the scope. If ambiguous, state your best-guess interpretation before exploring. Don't ask. Let the user redirect if you're off.

**Assess complexity:**

- **Simple** (a single module, a small utility, a narrow "how does function X work"): skip explorer agents; explore and explain in a single pass. Go to Step 2b.
- **Complex** (a subsystem spanning multiple files/services, a cross-cutting feature, a full architectural overview): partition first, then synthesize. Go to Step 2a.

When in doubt, lean simple. You can always partition later if the explainer hits a wall.

### Explorer obligations

Every exploration, simple or complex, must actually do this work:

1. **Find the entry point.** What triggers the behavior? User action, API call, job, message, boot path?
2. **Trace data, control, and state flow.** Follow the call chain. What data moves, what branches, where authoritative state lives, what mutates it, what reads it.
3. **Map key abstractions.** Types, services, interfaces, modules that carry the design.
4. **Find boundaries.** Inputs, outputs, and seams with other subsystems.
5. **Record unknowns.** If a step cannot be traced, say so. Label inference as inferred, not observed.

Do not infer architecture from filenames alone.

### Step 2a. Explore (complex questions only)

Decompose the question into 2–4 parallel exploration angles, each a distinct slice so explorers don't duplicate work. Example split for "how does the rate limiter work?":

- Explorer 1: data model and state management
- Explorer 2: request path and enforcement
- Explorer 3: configuration and metrics infrastructure

Narrow questions: 2 explorers is fine. Broad subsystems: up to 4.

If the host supports subagents, spawn all explorers in a single message, read-only. Use the `how explorer` role in [host capabilities](../../references/host-capabilities.md) and follow its selection procedure, including a rejected slug. Each explorer gets [explorer-prompt.md](references/explorer-prompt.md) plus its slice. If the host does not, run the same slices sequentially in this context. Omit `model` when the host cannot choose one.

Explorers follow [explorer-prompt.md](references/explorer-prompt.md) and return that structured output:

- Components Found
- Flow, including state
- Files Read
- Boundaries
- Non-Obvious Things
- Open Questions

Then proceed to Step 3.

### Step 2b. Direct explain (simple questions)

Explore and explain in one pass, read-only, still covering entrypoint, flow, state, boundaries, and unknowns. Use [explainer-prompt.md](references/explainer-prompt.md) for communication style and output format. If the host supports a read-only subagent, you may use one with the `how explainer` role in [host capabilities](../../references/host-capabilities.md), following its selection procedure, including a rejected slug. Otherwise do the work here. Omit `model` when the host cannot choose one.

Proceed to Step 4.

### Step 3. Synthesize (complex questions only)

Once all explorer slices return, synthesize them into one coherent explanation using [explainer-prompt.md](references/explainer-prompt.md). Reconcile overlapping findings, resolve contradictions by reading the code, and weave the slices into a unified picture. Include a mermaid or ASCII diagram when it clarifies a multi-component flow; skip it when prose is enough.

### Step 4. Present

Present the explanation. You may lightly edit for clarity or add conversation context, but don't substantially rewrite.

### Output format

Follow this structure, adapted to the question. Not every section is needed.

**Overview.** 1–2 paragraphs. What it is, what it does, why it exists. Enough to decide whether to keep reading.

**Key Concepts.** The important types, services, or abstractions. Brief definition of each.

**How It Works.** Walk through the flow: what triggers it, what happens step by step, where data and state go, the decision points. Prose, not a dump of code. Reference specific files and functions. Diagram when it clarifies.

**Where Things Live.** A brief map of the relevant files. Not every file.

**Gotchas.** Non-obvious or surprising things. Known sharp edges.

**Unknowns.** Gaps you could not trace. Label inference as inferred, not observed. See [observation record](../../references/protocols/observation-record.md).

## Critique mode

Not the default. Use it when existing structure is questionable, architectural constraints matter, the user asks whether the design is good, or a redesign is being evaluated. Ordinary "how does this work?" stays in explain mode.

```text
Explain first
        →
Independent critique
        →
Architecture concerns
        →
Tradeoffs
        →
Judgment
```

### Step 1. Explain first

Run the full explain flow above. You must understand the architecture before critiquing it.

### Step 2. Independent critique

After the explanation is complete, obtain independent critiques when the host supports it. Prefer diverse model families if the host can select models. Otherwise use independent agent contexts, or say that independent multi-model critique is unavailable.

Each critic gets the explanation, relevant file paths, [critic-prompt.md](references/critic-prompt.md), and [critique-rubric.md](references/critique-rubric.md).

### Step 3. Architecture concerns

Collect structural issues: wrong boundaries, dishonest data models, coupling that will block change, complexity that does not earn its keep. Ignore line-level nits.

### Step 4. Tradeoffs

For each surviving concern, say what the current design buys and what it costs. Do not recommend a rewrite without showing the problem.

### Step 5. Lead judgment

Categorize findings:

- **Act on.** Architectural problems worth fixing now
- **Consider.** Real concerns, cost/benefit unclear
- **Noted.** Valid observations, low priority
- **Dismissed.** Wrong, missing context, or style preference

Present the explanation first, then the critique. Someone who just wants to understand the system shouldn't wade through critique.

## Constraints

- Read-only. No production code changes.
- Do not infer architecture from filenames alone.
- Do not produce giant repository summaries unless specifically requested.
- Runtime evidence is out of scope unless you escalate to `observe`.

## Neighbors

```text
Usually follows:              investigate, develop (understand)
Often produces:               explanation; optional critique; knowledge candidate
Escalate to:                  observe, why, blast-radius, architect
Avoid combining automatically with: architect, arena, interrogate
```

```text
Need live behavior            → observe
Need historical motivation    → why
Need change consequences      → blast-radius
Need domain vocabulary        → domain-modeling
```

Complexity alone is not a reason to invoke `architect`. This skill is a leaf. It must not restart `/develop` or `/investigate`.

May produce a knowledge candidate when a stable, surprising ownership or flow rule would be expensive to rediscover. Do not persist ordinary source summaries.

## Done when

The relevant path from entrypoint to effect is traced, authoritative state and side effects are accounted for, inference is labeled, and remaining unknowns are explicit. Critique, if triggered, follows explanation and separates concerns, tradeoffs, and judgment.
