---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
when_to_use: Explicit request only, or an active workflow names it. Compacts the current conversation into a pickup document for another agent.
disable-model-invocation: true
---

# Handoff

Write a handoff document summarising the current conversation so a fresh agent can continue the work.

This is the operational skill for Methodrail's **handoff** context transition. It is explicit-only. See [context management](../../references/context-management.md) for when to continue, clear, isolate, handoff, or compact.

## Where to write it

Save to the temporary directory of the user's OS, not the current workspace, unless the user asked for a project-local artifact. A handoff is a travel document for the next agent, not durable project knowledge.

If the next agent is another session in this same checkout and nothing needs to travel, prefer continue, clear, isolate, or compact instead.

## What to include

Carry only the live thread:

- intent of the current work
- what is already decided
- open frontier / next action
- relevant evidence pointers
- suggested skills the next agent should load

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

## What not to duplicate

Do not duplicate content already captured in other artifacts. Reference them by path or URL:

- specs, plans, ADRs, issues
- commits, diffs
- `.methodrail/PROJECT.md` and linked knowledge
- decision records, observation records, verification evidence

The next agent should reload those artifacts rather than reading a copy.

## Redaction

Redact API keys, passwords, tokens, and personally identifiable information.

## Completion

A fresh agent can continue from the document plus the referenced artifacts, without the previous conversation, and without duplicated durable state.

## Neighbors

```text
Usually follows:              develop, debug, investigate, prototype
Often produces:               continuity artifact for a fresh agent
Escalate to:                  reflect when lessons are in scope
Avoid combining automatically with: compact-as-substitute
```

- Often follows: long `develop` / `debug` / `investigate` sessions, `prototype` round-trips
- May produce input for: the next session's workflow skill
- Do not combine automatically with: `compact` as a substitute, or `reflect` unless learning candidates are in scope
- Must not: copy specs/ADRs into the handoff, or write secrets
