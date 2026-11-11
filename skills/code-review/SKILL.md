---
name: code-review
description: "Review a branch, PR, or work-in-progress diff since a fixed point for Standards, Spec, and Maintainability (documentation drift and technical debt). The /methodrail-review workflow orchestrates this skill."
when_to_use: Use when reviewing a branch, PR, or work-in-progress diff for standards, spec fit, or maintainability. The /methodrail-review workflow orchestrates this skill.
---

# Code review

Review the requested range since a fixed point, including uncommitted work when it exists, across three axes:

- **Standards**: does the code follow repo standards and avoid correctness defects?
- **Spec**: does the code faithfully implement the originating issue, spec, or request?
- **Maintainability**: does the change leave affected documentation accurate and avoid adding or worsening debt?

Keep the axes distinct. For a bounded substantive change, run them as separate passes in the current context. Use isolated independent reviewers only when [rigor](../../references/rigor.md) selects that depth: the change is sensitive or consequential across a boundary, the host can isolate, and independence meaningfully reduces risk. Host support alone is not a reason. If the host cannot isolate, run separate local passes and say the review was not independent. An explicit request for a stronger mechanism is honored within its scope.

`/methodrail-review` is the Methodrail workflow that may also invoke `blast-radius` and `verify-change`, and may name `interrogate` and wait. This skill performs the diff inspection. Do not load `interrogate` from this skill.

Give reviewers a [review packet](../../references/protocols/review-packet.md) when one exists. A composed reviewer uses the packet's base, spec, and diff and does not ask the user to supply them again. Standalone review resolves the range from the request and repository before seeking missing human input.

## Process

### 1. Pin the fixed point

Whatever the user or the review packet said is the fixed point (commit SHA, branch, tag, `main`, `HEAD~5`). If neither specified one, resolve it from the repository. Ask only when the range is still ambiguous.

Capture the **union** of committed and working-tree changes:

1. Committed range: `git diff <fixed-point>...HEAD` (three-dot, merge-base) and `git log <fixed-point>..HEAD --oneline`
2. Staged: `git diff --cached`
3. Unstaged tracked: `git diff`
4. Untracked (non-ignored): `git status --short` and `git ls-files --others --exclude-standard`. Read those files; they do not appear in `git diff`.

Confirm the ref resolves. Review that union only when it is non-empty. An empty committed range is not an empty review when staged, unstaged, or untracked files exist. If the union is empty, say so and stop. Isolated reviewers are a separate depth choice, not the default for a non-empty diff.

Do not treat `git diff <fixed-point>...HEAD` as the whole change. That command never includes the working tree.

### 2. Identify the spec source

Look in this order:

1. Issue references in commit messages, fetched with the project's existing tracker workflow if any
2. A path the user passed
3. A spec file under `docs/`, `specs/`, `.scratch/`, or `.methodrail/` matching the branch or feature
4. The user's request in this conversation

If the packet or conversation already has the request, use it. If nothing is found, ask. If they say there isn't one, the Spec axis reports "no spec available".

Do not require `docs/agents/issue-tracker.md` or any Matt Pocock setup skill.

### 3. Identify the standards sources

Search the repo for every file that documents how code should be written. When `CODING_STANDARDS.md` or `CONTRIBUTING.md` exists, it must be on the list.

### 4. Review each axis

Scope security, performance, architecture, and test-effectiveness checks to the portions of the change they affect. Report each issue once, on the axis that best explains it.

**Standards** report, per file/hunk: (a) documented-standard violations with citations; (b) relevant correctness, edge, and failure-path defects. Under 400 words.

**Spec** report: (a) missing or partial requirements; (b) scope creep; (c) implementations that look wrong; (d) whether the verification exercises the claim. Quote the spec line. Under 400 words.

**Maintainability** report, under 400 words. Report debt the diff introduces or worsens and artifacts it makes obsolete. Cite the change and the affected artifact, even if the artifact is outside the diff:

- **Documentation drift.** Check affected public docs, examples, runbooks, and explanatory comments for stale or missing guidance that would mislead a user or maintainer. Use the canonical source; skip docs untouched in meaning.
- **Obsolete code and artifacts.** Check for helpers, flags, configuration, dependencies, and compatibility paths that the change makes unused, as well as newly added code with no purpose. Trace consumers and check public, generated, or dynamic use where relevant before calling something unused. A text search with no matches is insufficient on its own.
- **Unnecessary complexity.** Parallel helper when an existing one fits; new dependency when stdlib, native platform, or an already-installed capability satisfies the semantics; speculative abstraction or unused flexibility. Cite [simplicity](../../references/simplicity.md). Assess whether a public contract or test seam serves a concrete compatibility or testing need. Retain justified seams; a test adapter alone does not establish necessity. Do not recommend deletion solely because implementation count is low.
- **Redundant comments.** Restatements of visible code, narration of ordinary operations, decorative section labels, or comments that excuse a confusing name. Retain rationale, tool/compiler directives, license notices, and required public documentation.

Use the **smell baseline** (Fowler, *Refactoring*, ch.3) to guide this pass. Two rules:

- **The repo overrides.** A documented repo standard always wins.
- **Always a judgement call.** Each smell is a labelled heuristic, never a hard violation. Skip anything tooling already enforces.

Smells: Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest.

If the diff has no unnecessary complexity, say so without drawing a shipping conclusion. Leave unrelated pre-existing debt out of the review. Classify findings by their concrete impact; optional cleanup is non-blocking.

For Standards and Spec, inspect tests and checks the diff changed:

- A test change is acceptable when it follows an authorized requirement change or corrects a defective oracle.
- Reject unjustified weakening of a still-valid expectation: removed assertions, skipped or deleted tests, a lowered threshold, or a new suppression whose only effect is to silence a failure.
- A legitimate, evidenced suppression or deletion can stand. Say why.
- Green tests do not close a requirement the tests do not exercise.

### 5. Return the axes

When a parent owns the task, return each axis's report with severity and evidence. Do not merge them and do not emit a terminal completion report.

Standalone, present the reports under `## Standards`, `## Spec`, and `## Maintainability`. Do **not** merge or rerank findings across axes. End with a one-line summary: total findings per axis, and the worst issue *within each axis*.

Scope creep is work outside the request. Necessary supporting work can include shared-owner fixes, regression tests, generated output, snapshot updates, lockfiles, and cleanup of artifacts this change made unused. Do not revert other contributors' edits. When the original request is unavailable, follow the missing-spec behavior; do not invent a scope boundary.

If the spec is missing, skip Spec and note it.

A change can pass one axis and fail another. In a writing workflow the parent repairs material findings and then verifies the invalidated state. Optional suggestions do not expand scope. A finding alone does not authorize product edits.

## Neighbors

```text
Usually follows:              review, develop
Often produces:               standards, spec, and maintainability reports
Escalate to:                  blast-radius, verify-change
Avoid combining automatically with: interrogate, arena
```

```text
Consume                       → review packet, project constraints, verification evidence
Need impact beyond the diff   → blast-radius
Name `interrogate` and wait   → interrogate
```

Do not rerun unrelated exploration when verification evidence is already supplied.
