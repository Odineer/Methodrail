# Context management

Context is a budget. Choose a transition instead of accumulating conversation forever.

```text
continue
clear
isolate
handoff
compact
```

## Continue

Use accumulated reasoning when it is still relevant to the current task. Default for short, coherent work.

## Clear

Use durable artifacts as the source of continuity when the old conversation is no longer useful. Start fresh and reload `.methodrail/PROJECT.md`, decisions, and evidence records.

## Isolate

Use a fresh child context for bounded work when context size or independence warrants it. A new session is that context choice, not a quota on how many decisions the current context may resolve. Give the child a [task packet](protocols/task-packet.md) or [review packet](protocols/review-packet.md), not the parent conversation. The packet carries the decisions, acceptance criteria, and evidence pointers the child needs.

## Handoff

Use a travel document when work moves between sessions or agents. The operational skill is `handoff`. It is continuity for the next agent, not a durable project record. Write what the next agent must know: intent, known facts, open frontier, evidence, and next action. Reference specs, ADRs, issues, commits, and diffs. Do not duplicate them. Redact secrets.

`handoff` is explicit-only. Save it outside the workspace unless the user asked for a project-local file. Facts that must survive beyond that travel document belong in the project harness, an evidence/decision record, or a task/review packet.

## Compact

Use only when continuity is required and context is too large. Compaction is lossy. Prefer structured durable artifacts over repeatedly summarizing giant conversations.

## Practical rule

If a fact must survive a new session, it belongs in the project harness, an evidence/decision record, or a task/review packet — not in chat residue.
