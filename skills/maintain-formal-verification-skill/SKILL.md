---
name: maintain-formal-verification-skill
description: "Align existing project-local formal checks with the code they describe. Use when explicitly requested, or when an authorized workflow names action and coverage for a check whose recorded coverage this task touches. Do not edit product code."
when_to_use: Explicit request only, or a parent names action and coverage for an existing formal check this task touches. A read-only parent cannot apply.
disable-model-invocation: true
---

# Maintain a formal verification skill

Bring existing formal checks back in line with the code they describe. Follow [formal verification](../../references/formal-verification.md). Do not copy that contract into the report.

A pass on a stale description is not evidence about the changed code.

## Action and coverage

- **Inspect** is read-only for owned verification files, product code, and durable guidance. Disposable checker output may be written outside the checkout. Return proposed corrections and exact gaps. Drift findings are proposed updates, not applied changes.
- **Apply** edits only verification models, harnesses, property files, skill guidance, and directly necessary existing index pointers. Product fixes stay with the owning workflow.
- **Task-scoped** covers the named or affected checks and necessary shared verification support. State that limit.
- **Full audit** covers existing discovered formal checks, each with a result or a blocker. It does not launch creation for every unmodeled subsystem.

A direct unqualified upkeep request selects apply over existing formal checks. A parent names action and coverage. A read-only parent cannot escalate to apply.

## Alignment

1. Find checks through project pointers and what the procedures do, including differently named existing skills. No checks means report the gap and suggest `create-formal-verification-skill`. Do not run it.
2. Run the old procedure and keep that result as a baseline. A pass before alignment is not evidence about changed code. If freshness preflight stops the run, record that stale result and inspect prior model evidence separately when useful.
3. Review covered-code changes since the last confirmed sync, including current staged, unstaged, and untracked changes, moved symbols, and new writers of the guarded state. Names, commit messages, and the original path list are not sufficient.
4. Classify whether changes leave the represented behavior intact, require a representation update, intentionally change the promise, or may violate it.
5. Apply representation changes from code evidence. Change a property only when cited intent from an authoritative requirement, test, or decision says the promise changed. Record any changed assumptions or reduced bounds and their effect on coverage. Do not hide a reduced bound.
6. Rerun. Replay failures against real operations. Distinguish a representation error from a product bug. Name the introducing commit only when the evidence identifies it. Use unknown or uncommitted otherwise. Do not edit product code.
7. For aligned passing checks, repeat the relevant falsification rehearsal and the final restored run. Follow the generated instructions once before returning.
8. Update the confirmed sync record only for checks actually aligned and evaluated. A real bug can have an aligned sync record and a failing property. The record expresses correspondence, not correctness. A blocked check does not advance its confirmed sync record.

## Report

For each check, give the outcome (`in sync`, `updated`, `bug`, `blocked`; updated and bug may coexist), what changed in the representation and why, the rerun, the falsification rehearsal when one was required, each bug in project nouns, and what remains uncovered. Say when an earlier pass was on a stale description.

## Neighbors

```text
Usually follows:              develop, debug, refactor, or maintain-project when coverage is named
Often produces:               aligned formal guidance and a confirmed sync record
Escalate product bugs to:     debug or develop
Avoid combining automatically with: create-formal-verification-skill, product edits
```
