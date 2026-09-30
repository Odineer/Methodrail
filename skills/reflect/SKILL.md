---
name: reflect
description: "Mine a completed non-trivial session for durable lessons and propose knowledge, skill, or structural-enforcement candidates. Use when the user says reflect, or after complex work that generalized. Do not turn every session into self-analysis. Never auto-apply standing rules."
disable-model-invocation: true
---

# Reflect

Mine completed work for durable learnings. Skip when the conversation is trivial, off-topic, or already covered by an existing skill followed correctly. One-offs are not learnings.

Outputs are candidates, not automatic permanent rules:

```text
knowledge candidate
skill candidate
structural-enforcement candidate
```

See [knowledge lifecycle](../../references/knowledge/lifecycle.md), [note contract](../../references/knowledge/note-contract.md), [reuse](../../references/knowledge/reuse.md), and [structural enforcement](../../references/structural-enforcement.md).

## Process

### 1. Locate the work just completed

Prefer this conversation's artifacts, diffs, and decision log. If the host exposes a transcript for the active workspace, use that path only. Do not glob unrelated private chats.

### 2. Review from three lenses

When the host supports parallel subagents, spawn judgment, tooling, and divergent reviewers using [judgment-reviewer.md](references/judgment-reviewer.md), [tooling-reviewer.md](references/tooling-reviewer.md), and [divergent-reviewer.md](references/divergent-reviewer.md). Judgment uses the `reflect judgment` role, divergent uses `reflect divergent`, and tooling uses `reflect tooling`, each via [host capabilities](../../references/host-capabilities.md) and its selection procedure, including a rejected slug. Otherwise run the three lenses sequentially in this context. Omit `model` when the host cannot choose one.

### 3. Synthesize

Use [synthesizer.md](references/synthesizer.md). If the host can spawn the synthesizer, use the `reflect synthesizer` role in [host capabilities](../../references/host-capabilities.md) and follow its selection procedure, including a rejected slug. Otherwise synthesize here. Omit `model` when the host cannot choose one. Produce Accepted / Rejected / Backlog.

### 4. Route Accepted items

- Recurring project fact → **knowledge candidate** under `.methodrail/knowledge/` (do not persist without evidence)
- Recurring agent failure a skill would prevent → **skill candidate** (justify per CONTRIBUTING; do not invent a skill ad hoc)
- Check a compiler, linter, test, or script should enforce → **structural-enforcement candidate**

Move anything a mechanical check would enforce more reliably than a skill onto the structural-enforcement list.

A knowledge candidate is earned only from this work's evidence. Ordinary implementation detail is not a note. Propose at most one governance mutation per approval: create, narrow scope, dispute, resolve, retire, or a bounded reconciliation of evidence/`validated_at`. Include:

- proposed `kind`, `status`, and `lifecycle`
- concise claim
- evidence
- `validated_at` (current Git SHA, or `unversioned:<reason>`)
- `relevant_paths` and optional `scope` (only when the claim is path-bounded; do not invent scope)
- `conflicts_with` or `superseded_by` when disputing or retiring
- how a future task would reuse it
- estimated rediscovery cost
- staleness risk and refresh triggers
- duplication check against existing knowledge and canonical docs
- whether a test, type, or lint rule is a better destination
- proposed `.methodrail/PROJECT.md` index entry

“Accepted for proposal” is not approval to persist. “No candidate earned promotion” is a valid result.

After evaluation failures, classify the miss before writing more instructions:

```text
knowledge problem
skill problem
verification problem
tooling problem
structural-enforcement problem
```

Prefer a stronger check, test, type, or fixture over another paragraph. Do not auto-add standing rules.

### 5. Present and wait

Show the full Accepted / Rejected / Backlog list. Wait for explicit approval before writing any knowledge note or skill edit. Skill changes affect future agents; do not auto-apply. Do not silently create, modify, merge, or delete a knowledge note.

### 6. Promotion transaction after approval

1. Recheck that the evidence still supports the claim.
2. Confirm that another canonical document does not already own the information.
3. Confirm that structural enforcement is not the better destination.
4. Apply the approved mutation using [templates/project/knowledge/note.md](../../templates/project/knowledge/note.md). Default is exactly one typed note. A reciprocal dispute may update both notes and the PROJECT.md pointer set as one transaction.
5. Add or update the concise PROJECT.md pointer(s).
6. Validate kind, status, lifecycle, evidence, index, size, and dispute/retirement sections. Report freshness and scope. An approved reconciliation updates evidence and `validated_at` in the same write.
7. Verify that an unchanged rerun produces no diff.

If the transaction is only partly applied, show the incomplete diff. Do not guess the missing half. Ask whether to complete or revert it.

Do not keep a candidate queue on disk.

Do not file tracker issues unless the user asks. Do not treat Methodrail global skills as an org-wide dump for project-local lessons.

## Neighbors

```text
Existing decision trail       → show-me-your-work
Continuity artifact           → handoff
```

Do not auto-promote candidates.
