---
name: interrogate
description: "Explicit multi-reviewer adversarial analysis of a high-risk change. Use only when the user names interrogate. Agreement is signal; disagreement is evidence; do not auto-apply patches."
disable-model-invocation: true
---

# Interrogate

Spawn independent reviewers to adversarially review code changes. Each reviewer gets the same prompt and rubric. The adversarial signal comes from independence (and model diversity when available), not assigned theatrical personas.

The deliverable is a synthesized verdict. Do NOT auto-apply changes.

Proceed only when the user explicitly names or invokes `interrogate`. A request to "review" or implement high-risk code is not sufficient. Other skills may name this skill; they must wait for that invocation.

## Step 1. Determine scope

- Specific files or a diff the user pointed at
- On a feature branch: `git diff main...HEAD` (or the appropriate base)
- Recent work referenced in the message

Package the diff plus surrounding context. Prefer a [review packet](../../references/protocols/review-packet.md) when one exists.

## Step 2. State the intent

One clear paragraph: what this code is trying to accomplish. Reviewers challenge whether the work achieves the intent well, not whether the intent itself is correct. If you're unsure, ask before proceeding.

## Step 3. Spawn reviewers

Launch three reviewers, A, B, and C, in a single message when the host supports parallel read-only subagents. Use the `interrogate reviewers` role in [host capabilities](../../references/host-capabilities.md) in that order, and follow its selection procedure, including a rejected slug. If multi-model is unavailable, use independent agent contexts. If neither is available, say so and do not fake independence. Omit `model` when the host cannot choose one.

Fill [reviewer-prompt.md](references/reviewer-prompt.md) with:

1. The stated intent
2. The diff or file contents
3. [rubric.md](references/rubric.md)
4. [code-quality-review.md](references/code-quality-review.md)

The same filled template goes to all reviewers.

## Step 4. Synthesize

1. Parse all findings
2. Identify consensus (2+ independent reviewers)
3. Identify lone findings (worth reading, lower confidence)
4. Deduplicate
5. Note disagreements

## Step 5. Lead judgment

You are a pragmatic lead, not a neutral aggregator. Read [lead-judgment.md](references/lead-judgment.md). Categorize every finding:

- **Act on.** Would block a real PR
- **Consider.** Legitimate, cost unclear
- **Noted.** Valid, not actionable now
- **Dismissed.** Wrong, nitpicky, or missing context

For each: which reviewer(s), category, one-line rationale.

## Output

### Intent
### Reviewers
### Act On
### Consider
### Noted
### Dismissed
### Agreement Map

Keep it expensive and conservative. Do not simulate reviewers with personas.

## Neighbors

```text
Receive                       → review packet with project context
Must not                      → auto-apply patches
Must not                      → run because a parent named it
```

Rigor 0–1 work must not invoke this skill.
