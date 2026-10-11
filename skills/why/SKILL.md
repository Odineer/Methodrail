---
name: why
description: "Use for 'why does X work this way', 'why we picked Y', design rationale, regressions, or postmortems. Searches historical evidence categories in parallel and returns a cited read on decisions and tradeoffs. Never infer intent from current code alone. Use how for current implementation."
---

# Why

Investigate the motivation and intent behind code. Why was it built this way? What alternatives were rejected, and why?

Companion to `how`. `how` answers what the code does. `why` answers what forces led to its shape. See [provenance](../../references/knowledge/provenance.md).

If `.methodrail/` already records the rationale and that note is still [fresh](../../references/knowledge/freshness.md), reuse it and say so. Otherwise search primary historical sources.

## Operating posture

Operate as a careful investigator. When the record is thin, say so.

- **Evidence before narrative.** Collect the pieces first. Never pick a story and recruit the evidence that fits it.
- **Precision over polish.** Prefer the exact quote and citation over a smooth paraphrase.
- **Name the gaps.** If a thread goes cold or a source isn't searchable, document the gap.
- **Hedge on purpose.** When evidence is indirect, say "appears to" / "likely" / "suggests".
- **No shortcut by code-reading.** The code tells you what it does, rarely why it exists.

## Core epistemics

Build a patchwork understanding from fragmented historical evidence. Tickets go stale. Commit messages lie. People change their minds.

- **Cite everything.** Every claim about intent should reference a commit hash, PR, ticket, doc, chat permalink, or comment. If you can't cite it, it's inference.
- **Prefer "appears to" over "because".**
- **Surface contradictions.** If two sources disagree, show both.
- **Acknowledge gaps.** An honest "we couldn't find out why" beats a confident guess.
- **Multiple hypotheses are valid.** Present them with the evidence for each.
- **Beware rationalization.** Don't retrofit intent onto code that merely exists.

Read [epistemics.md](references/epistemics.md). The synthesizer must follow it.

Map claims onto Methodrail labels:

```text
Historically supported — cited historical source
Inferred — indirect chain, hedged
Unknown — searched, not established
```

Current implementation is not historical evidence. Use `how` for "what currently happens."

## Step 1. Understand the target and the question

Parse the **target** (code, pattern, feature, named decision) and the **question** (design rationale, tradeoff, edge cases, business constraint, dead-code territory, history).

If the target is vague, guess from conversation context, state the interpretation, then proceed.

## Step 2. Establish the code anchor

Before spawning investigators, anchor in concrete code:

- relevant file path(s) and line range(s)
- key symbols
- an initial commit list
- PR numbers from merge commits when present

```bash
git blame -L <start>,<end> <file>
git log --follow -p -- <file>
git log --oneline -20 -- <file>
```

Pull PR bodies via `gh` when the project uses GitHub and `gh` is available. Capture seed context for investigators.

## Cheap path

A narrow question does not require every category. If one file or symbol, recent `git log` / `git blame`, or an identified ADR or decision record can answer it with citations, stop there. The cheap path does not spawn a synthesizer. Fan out the remaining categories only when that search is insufficient, contradictory, or the question is broader than that local record. Do not invent intent from current code; the cheap path is still historical evidence.

## Step 3. Search evidence categories (default posture)

When the cheap path is not enough, historical context spreads across seven categories. You cannot predict from the remaining question alone which one holds the answer. Enumerate what this environment can actually search, map each source to a category, query available categories in parallel, then synthesize. Null results are first-class evidence. See [host capabilities](../../references/host-capabilities.md).

Categories:

1. **Source control history** — always available through git (and `gh` when present). Best at implementation-time rationale captured during review.
2. **Issue / ticket tracker** — Linear, Jira, GitHub Issues, and similar. Best at the product or business forcing function.
3. **Long-form documents** — ADRs, RFCs, PRDs, design docs, postmortems, `.methodrail/knowledge/`.
4. **Real-time team chat** — only if a matching MCP or export is available.
5. **Infrastructure observability** — only if a matching MCP is available.
6. **Error / exception tracking** — only if a matching MCP is available.
7. **Product analytics warehouse** — only if a matching MCP is available.

Source control is always spawned. For the others, skip only with a written justification:

- no searchable source exists in this environment (a gap, not a choice), or
- the source is provably irrelevant (high bar: a build-time script with no runtime path, not "probably a feature").

"I doubt long-form docs would have this" is not sufficient. Run the search; let the null result speak.

If the host supports subagents, spawn one investigator per available category using [investigator-prompt.md](references/investigator-prompt.md) and the matching [sources](references/source-playbook.md) playbook. Use the `why investigators` role in [host capabilities](../../references/host-capabilities.md) and follow its selection procedure, including a rejected slug. If not, search the same categories sequentially. Omit `model` when the host cannot choose one. Do not collapse every category into one vague search.

Give investigators the code anchor and the original question. If the target looks defensive (retries, timeouts, rate limits, flags, OOM handlers), also load [incident-postmortem.md](references/sources/incident-postmortem.md).

## Step 4. Synthesize

Synthesize with [synthesizer-prompt.md](references/synthesizer-prompt.md) and [epistemics.md](references/epistemics.md). Separate "what we know" from "what we're inferring." Include null-result sources.

If the host supports a synthesizer subagent, use it with the `why synthesizer` role in [host capabilities](../../references/host-capabilities.md) and follow its selection procedure, including a rejected slug. Otherwise synthesize here. Omit `model` when the host cannot choose one. Do not rewrite confidence language to sound more authoritative.

## Step 5. Present

Keep the confidence separation intact.

**The Question.** Restate what the user asked.

**The Code in Question.** File paths, line ranges, key symbols.

**What We Found (direct evidence).** Cited claims.

**What We Can Reasonably Infer.** Inference chains with hedges.

**Competing Hypotheses.** If the evidence fits multiple stories.

**What We Don't Know.** Specific gaps and empty searches.

**Sources Consulted.** One line per category, including empty and skipped.

If this `why` is a precursor to changing the code, convert findings into Preserve / Change / Avoid / Risk constraints.

## Common failure modes

- Confident storytelling from thin evidence
- Citing the code as evidence for its own intent
- Recency bias
- Confirming the user's suggested reason without checking
- Skipping the gaps section
- Skipping categories by anticipation
- Inventing historical rationale

## Neighbors

```text
Need current implementation   → how
Need external sources         → research
Need decision records         → .methodrail pointers, then primary history
```

Use `.methodrail` decision/rationale pointers, but verify against primary history when needed.

## Done when

Claims about intent are cited, competing evidence is shown, and gaps are explicit. Unknown is a valid result.
