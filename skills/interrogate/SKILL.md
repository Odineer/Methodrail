---
name: interrogate
description: "Explicit multi-reviewer adversarial analysis of a high-risk change. Use only when the user names interrogate. A finding survives only when a run proves it. Agreement is signal; disagreement is evidence; do not auto-apply patches."
when_to_use: Suggest-only. Never load it yourself; an active skill names it and waits for the user to invoke it. Multi-reviewer adversarial analysis of a high-risk change.
disable-model-invocation: true
---

# Interrogate

Spawn independent reviewers to adversarially review a change or a design. Each reviewer gets the same prompt and rubric. The adversarial signal comes from independence (and model diversity when available), not assigned theatrical personas.

A finding survives only when a run proves it. The deliverable is a synthesized verdict. Do NOT auto-apply changes.

Proceed only when the user explicitly names or invokes `interrogate`. A request to "review" or implement high-risk code is not sufficient. Other skills may name this skill; they must wait for that invocation.

## Step 1. Determine scope

- Specific files or a diff the user pointed at
- On a feature branch: `git diff main...HEAD` (or the appropriate base), plus uncommitted changes in the working tree
- Recent work referenced in the message

Package the diff plus surrounding context. Prefer a [review packet](../../references/protocols/review-packet.md) when one exists.

## Step 2. State the intent

One clear paragraph: what this change or design is trying to accomplish. Draw it from the user's message, the commits, and the PR description when one exists. Reviewers challenge whether the work achieves the intent well, not whether the intent itself is correct. If you're unsure, ask before proceeding.

## Step 3. Spawn reviewers

Launch three reviewers, A, B, and C, in a single message when the host supports parallel subagents. Use the `interrogate reviewers` role in [host capabilities](../../references/host-capabilities.md) in that order, and follow its selection procedure, including a rejected slug. If multi-model is unavailable, use independent agent contexts. If neither is available, say so and do not fake independence. Omit `model` when the host cannot choose one.

When the host can isolate, give each reviewer its own worktree and copy the uncommitted scope into it. The reviewer runs only there. When the host cannot isolate, say so. The proof is still a real run, and it leaves the product tree unchanged.

Fill [reviewer-prompt.md](references/reviewer-prompt.md) with:

1. The stated intent
2. The diff or file contents
3. [rubric.md](references/rubric.md)
4. [code-quality-review.md](references/code-quality-review.md)

The same filled template goes to all reviewers. The assignment names that reviewer's worktree path, or states that this run has no private worktree. The template's proof rule is the bar: a failing test, a repro script, or command output. For a design or plan, a prototype or a probe of the current tree. Each reported finding has a title, the exact command, the output it printed, and the output the intent requires. Anything not run stays out of the report, including style, naming, structure, and risks that need a future change to matter. No findings is a valid result. Reviewers do not apply fixes.

Report a code-quality hit only when that run proves it breaks the intent.

## Step 4. Synthesize

1. Parse all findings.
2. Rerun each finding's exact command yourself. Keep a behavioral finding (correctness, security, or a broken intent) only when the reviewer's run and this rerun both show the failure, and the failure breaks the intent.
3. Drop the rest. That includes unrun style, naming, structure, and future-risk notes; a command you could not rerun; a rerun that does not show the failure; and a failure that does not break the intent. Dropped findings stay out of Act on, Consider, Noted, and Dismissed.
4. Merge kept findings that share a root cause. Attribute a reviewer only when that reviewer's command survived the rerun.
5. Treat consensus (2+ independent reviewers) and lone findings as confidence on the kept set. A lone kept finding stays. Agreement that was not rerun is dropped.
6. Record disagreements in the agreement map. Disagreement is evidence.

Count the dropped findings per reviewer and in total. No verified findings is a valid result.

## Step 5. Lead judgment

You are a pragmatic lead, not a neutral aggregator. Read [lead-judgment.md](references/lead-judgment.md). Categorize only kept findings:

- **Act on.** Would block a real PR
- **Consider.** Legitimate, cost unclear
- **Noted.** Valid, not actionable now
- **Dismissed.** Wrong, nitpicky, or missing context

For each: which reviewer(s), category, one-line rationale.

Do not apply fixes. After the verdict, remove worktrees you added.

## Output

### Intent
### Reviewers
One line per reviewer: isolated or not, kept count, dropped count.
### Findings
Each kept finding: title, exact command, the output the rerun printed, how it breaks the intent, and which reviewers. Write "no verified findings" when none survive.
### Act On
### Consider
### Noted
### Dismissed
These four buckets contain only kept findings. Write "None" when a bucket is empty.
### Dropped
The count of dropped findings, per reviewer and in total, and why (not run, rerun missed the failure, or the failure does not break the intent).
### Agreement Map

The verdict recommends. Leave the product checkout unchanged.

Keep it expensive and conservative. Do not simulate reviewers with personas.

## Neighbors

```text
Receive                       → review packet with project context
Must not                      → auto-apply patches or other fixes
Must not                      → run because a parent named it
```

Rigor 0–1 work must not invoke this skill.
