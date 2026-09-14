---
name: code-review
description: "Two-axis review of the diff since a fixed point: Standards (repo coding standards plus a smell baseline) and Spec (does it implement the originating request/spec?). Use when reviewing a branch, PR, or work-in-progress. Do not use as the Methodrail /review workflow; that orchestrates this skill."
---

# Code review

Two-axis review of the requested range since a fixed point, including uncommitted work when it exists:

- **Standards**: does the code conform to this repo's documented coding standards?
- **Spec**: does the code faithfully implement the originating issue, spec, or request?

Both axes should run as **parallel sub-agents** when the host supports them, so they don't pollute each other's context. If not, run them sequentially as separate passes and keep the reports unmerged. See [host capabilities](../../references/host-capabilities.md).

`/review` is the Methodrail workflow that may also invoke `blast-radius` and `verify-change`, and may name `interrogate` and wait. This skill is the leaf that performs the two-axis inspection.

Give reviewers a [review packet](../../references/protocols/review-packet.md) of deterministic facts when one exists.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point (commit SHA, branch, tag, `main`, `HEAD~5`). If they didn't specify one, ask.

Capture the **union** of committed and working-tree changes:

1. Committed range: `git diff <fixed-point>...HEAD` (three-dot, merge-base) and `git log <fixed-point>..HEAD --oneline`
2. Staged: `git diff --cached`
3. Unstaged tracked: `git diff`
4. Untracked (non-ignored): `git status --short` and `git ls-files --others --exclude-standard`. Read those files; they do not appear in `git diff`.

Confirm the ref resolves. Spawn reviewers only when that union is non-empty. An empty committed range is not an empty review when staged, unstaged, or untracked files exist. If the union is empty, say so and stop.

Do not treat `git diff <fixed-point>...HEAD` as the whole change. That command never includes the working tree.

### 2. Identify the spec source

Look in this order:

1. Issue references in commit messages, fetched with the project's existing tracker workflow if any
2. A path the user passed
3. A spec file under `docs/`, `specs/`, `.scratch/`, or `.methodrail/` matching the branch or feature
4. The user's request in this conversation

If nothing is found, ask. If they say there isn't one, the Spec axis reports "no spec available".

Do not require `docs/agents/issue-tracker.md` or any Matt Pocock setup skill.

### 3. Identify the standards sources

Anything in the repo that documents how code should be written, such as `CONTRIBUTING.md` or `CODING_STANDARDS.md`.

On top of whatever the repo documents, the Standards axis always carries this **smell baseline** (Fowler, *Refactoring*, ch.3). Two rules:

- **The repo overrides.** A documented repo standard always wins.
- **Always a judgement call.** Each smell is a labelled heuristic, never a hard violation. Skip anything tooling already enforces.

Smells: Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest.

Also check, as judgement calls under Standards (not a third axis):

- **Unnecessary complexity.** Parallel helper when an existing one fits; new dependency when stdlib, native platform, or an already-installed capability satisfies the semantics; speculative abstraction or unused flexibility. Cite [simplicity](../../references/simplicity.md). Assess whether a public contract or test seam serves a concrete compatibility or testing need. Retain justified seams; a test adapter alone does not establish necessity. Do not recommend deletion solely because implementation count is low.
- **Redundant comments.** Restatements of visible code, narration of ordinary operations, decorative section labels, or comments that excuse a confusing name. Retain rationale, tool/compiler directives, license notices, and required public documentation.

If the diff has no unnecessary complexity, say so. That is a Standards finding of absence, not a shipping claim.

### 4. Spawn both axes

**Standards** report, per file/hunk: (a) documented-standard violations with citations; (b) baseline smells, unnecessary complexity, and redundant comments as judgement calls. Under 400 words.

**Spec** report: (a) missing or partial requirements; (b) scope creep; (c) implementations that look wrong. Quote the spec line. Under 400 words.

Scope creep is unrelated churn or unexplained leftovers, not every extra file. Necessary supporting work can include shared-owner fixes, regression tests, generated output, snapshot updates, and lockfiles. Cleanup of artifacts this change made unused is in scope; deleting pre-existing unrelated dead code is not. Do not revert other contributors' edits. When the original request is unavailable, follow the missing-spec behavior; do not invent a scope boundary.

If the spec is missing, skip Spec and note it.

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec`. Do **not** merge or rerank findings across axes. End with a one-line summary: total findings per axis, and the worst issue *within each axis*.

A change can pass one axis and fail the other. That is the point of the split.

## Neighbors

```text
Usually follows:              review, develop
Often produces:               standards report; spec report
Escalate to:                  blast-radius, verify-change
Avoid combining automatically with: interrogate, arena
```

```text
Consume                       → review packet, project constraints, verification evidence
Need impact beyond the diff   → blast-radius
Name `interrogate` and wait   → interrogate
```

Do not rerun unrelated exploration when verification evidence is already supplied.
