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

Keep the axes distinct. Use local passes for bounded changes. Assign a separate reviewer when [rigor](../../references/rigor.md) or the user calls for independent review and the host supports it. Use the parallel procedure below for substantial independent assignments.

`/methodrail-review` is the Methodrail workflow that may also invoke `blast-radius` and `verify-change`, and may name `interrogate` and wait. This skill performs the diff inspection. Do not load `interrogate` from this skill.

Give reviewers a [review packet](../../references/protocols/review-packet.md) when one exists. A composed reviewer uses the packet's base, spec, and diff and does not ask the user to supply them again. Standalone review resolves the range from the request and repository before seeking missing human input.

## Process

### 1. Pin the fixed point

Use the fixed point from the user or review packet. If neither specifies one, resolve it from the repository. Ask only when the range is still ambiguous.

When the packet supplies an exact slice or task-owned delta, use that scope and its base. Read surrounding context for callers, contracts, and evidence. Otherwise capture the **union** of committed and working-tree changes:

1. Committed range: `git diff <fixed-point>...HEAD` (three-dot, merge-base) and `git log <fixed-point>..HEAD --oneline`
2. Staged: `git diff --cached`
3. Unstaged tracked: `git diff`
4. Untracked (non-ignored): `git status --short` and `git ls-files --others --exclude-standard`. Read those files; they do not appear in `git diff`.

Confirm the base resolves. If the requested scope is empty, say so and stop. An empty committed range is not an empty review when staged, unstaged, or untracked files exist.

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

The review owner uses [swarm](../swarm/SKILL.md) when two or more read-only review assignments have enough independent work to justify parallel passes, or when the user asks for parallel review and the scope supports it. Assign by axis, or by stable diff slice for a large axis. Give workers the same captured diff and [review packet](../../references/protocols/review-packet.md), including relevant working-tree changes. Each worker completes its assigned pass directly and returns its coverage, findings with path and line evidence, and gaps.

The review owner covers shared contracts, interactions across slices, and any uncovered assignment. Reconcile findings into the three axes and report each issue once. Run the passes locally when the host lacks subagents. If the host cannot provide the requested independence, state that limitation. During per-slice implementation review, local passes can proceed while other workers finish.

Scope security, performance, architecture, and test-effectiveness checks to the portions of the change they affect. Report each issue once, on the axis that best explains it.

**Standards** report, per file/hunk: (a) documented-standard violations with citations; (b) relevant correctness, edge, and failure-path defects. Under 400 words.

**Spec** report: (a) missing or partial requirements; (b) scope creep; (c) implementations that look wrong; (d) whether the verification exercises the claim. Quote the spec line. Under 400 words.

**Maintainability** report, under 400 words. Report debt the diff introduces or worsens and artifacts it makes obsolete. Cite the change and the affected artifact, even if the artifact is outside the diff:

- **Documentation drift.** Check affected public docs, examples, runbooks, and explanatory comments for stale or missing guidance that would mislead a user or maintainer. Use the canonical source; skip docs untouched in meaning.
- **Obsolete code and artifacts.** Check for helpers, flags, configuration, dependencies, and compatibility paths that the change makes unused, as well as newly added code with no purpose. Trace consumers and check public, generated, or dynamic use where relevant before calling something unused. A text search with no matches is insufficient on its own.
- **Unnecessary complexity.** Use [simplicity](../../references/simplicity.md) to test whether additions earn their maintenance cost. Look for duplicate implementations, dependencies with a sufficient existing alternative, speculative layers, and fallbacks with no supported failure mode. Keep public contracts and test seams that meet a concrete need.
- **Comments and docstrings.** Apply the [comment rule](../../references/simplicity.md#comments) to new prose and existing prose that describes the affected behavior, including outside the diff. Cite the affected code and prose when reporting a removal or correction.

When the diff materially expands the maintenance surface, use the reviewed range to summarize production lines added and removed, source files added, and dependency changes. Use `git diff --numstat` for tracked changes and account for relevant untracked files in a WIP review. Treat counts as inspection signals. Cite the requirements or constraints that justify significant additions and apply any documented project budget.

Mark avoidable growth **important** when you can cite a material maintenance cost and show a simpler, in-scope path that preserves required behavior and safeguards. This includes safe removal of artifacts the change made obsolete. Cite the relevant consumers or contracts and name the verification path. Keep unproven suggestions optional. In a writing workflow, resolve important findings and verify the final state before claiming completion. Report any blocker that prevents resolution.

Use the **smell baseline** (Fowler, *Refactoring*, ch.3) to guide this pass. Two rules:

- **The repo overrides.** A documented repo standard always wins.
- **Always a judgement call.** Each smell is a labelled heuristic, never a hard violation. Skip anything tooling already enforces.

Smells: Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest.

If the diff has no unnecessary complexity, say so without drawing a shipping conclusion. Leave unrelated pre-existing debt out of the review. Classify findings by their concrete impact; optional cleanup is non-blocking.

For Standards and Spec, inspect tests and checks the diff changed:

- A test change is acceptable when it follows an authorized requirement change or corrects a defective oracle.
- Reject unjustified weakening of a still-valid expectation: removed assertions, skipped or deleted tests, a lowered threshold, or a new suppression whose only effect is to silence a failure.
- Apply [test reuse and retirement](../../references/simplicity.md#test-reuse-and-retirement). Flag duplicate additions and tests the change supersedes. For a deletion, cite the authorized behavior removal or the surviving coverage that catches each still-supported failure.
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
