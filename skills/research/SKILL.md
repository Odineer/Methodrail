---
name: research
description: "Investigate a question against high-trust primary sources and return cited findings in chat. Use for external docs, specs, APIs, or first-party references. Do not use for current-codebase how, historical why, or live observe. Do not write a file unless the user asks to persist."
when_to_use: Use for external docs, specs, APIs, or first-party references. Not for current-codebase how, historical why, or live observe. Persists findings only when the user asks.
---

# Research

External / reference research against authoritative primary sources. Distinct from:

```text
how      = current codebase understanding
why      = historical project reasoning
observe  = live behavior
research = external/reference sources
```

## Method

If the question is narrow and one primary source is obvious, investigate it in this context. If the host supports a background or child agent, spin one up only when several sources compete, the search is broad, or this context cannot wait. The child returns findings here; it does not write a repository file. Otherwise do the research here. See [host capabilities](../../references/host-capabilities.md).

1. Investigate the question against **primary sources** (official docs, source of the dependency, specs, first-party APIs), not a secondary write-up. Follow every claim back to the source that owns it.
2. Return the cited findings in this conversation.
3. Persist a Markdown file only when the user asks to save the findings. Use the project's existing notes location (`docs/`, `specs/`, `.scratch/`). If none exists, ask where to put it. Even then, do not write `.methodrail/knowledge/`.

Findings may become a knowledge candidate in the answer. Do not promote them to standing rules. Typed notes go through `reflect` after approval. See [knowledge lifecycle](../../references/knowledge/lifecycle.md).

## Neighbors

```text
Current code                  → how
History                       → why
Live behavior                 → observe
```

Do not use research for the local codebase.
