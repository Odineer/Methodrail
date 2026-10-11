---
name: to-tickets
description: "Break a plan, spec, or conversation into tracer-bullet tickets with blocking edges. Publishes to the project's tracker when available, otherwise to local markdown. Do not use to implement the work."
disable-model-invocation: true
---

# To tickets

Break a plan, spec, or conversation into **tickets**: tracer-bullet vertical slices, each declaring the tickets that **block** it.

## Process

### 1. Gather context

Work from the conversation. If the user passes a spec path or issue, fetch and read it.

### 2. Explore the codebase if needed

Use domain glossary vocabulary. Respect ADRs. Look for prefactor opportunities: make the change easy, then make the easy change.

### 3. Draft vertical slices

- Each slice cuts a narrow but complete path through every needed layer: vertical, not a horizontal slice of one layer
- A completed slice is demoable or verifiable on its own
- Sized to one fresh context window
- Prefactoring first

Give each ticket **blocking edges**. A ticket with no blockers can start immediately.

**Wide refactors** are the exception. Sequence them as expand–contract rather than forcing a tracer bullet. Use `blast-radius` when a mechanical change fans across the codebase.

### 4. Choose the cut

Choose routine granularity and dependency edges. Prefer complete verifiable slices. Order contract-first or risk-first when the real dependencies require it. Wide refactors stay expand–contract. Do not ask the user to approve ordinary ticket size. Ask only when a qualifying human decision under the [decision frontier](../../references/decision-frontier.md) is still unresolved. When those decisions are already resolved, publish. Do not add another approval of them.

Check that the set covers the spec's required outcomes and adds no invented scope. If an incomplete plan or another agent's tickets already occupy the destination, use an unoccupied feature-specific path. If replacement needs a human scope or ownership choice, explain the conflict. Do not overwrite that work.

### 5. Publish

- **Local files** (default when no tracker is configured): one file per ticket under `.scratch/<feature-slug>/issues/` or `docs/tickets/<feature-slug>/`, numbered from `01` in dependency order.
- **Real tracker** (GitHub, Linear, GitLab, …): one issue per ticket, using native blocking when the tracker has it. Only when the project already uses that tracker.

Do not require `setup-matt-pocock-skills`. Do not close or modify any parent issue unless asked.

Local ticket body:

```markdown
# NN: Ticket title

**Outcome:** the bounded observable result.

**Acceptance:** criteria this ticket satisfies, by reference when a spec exists.

**Blocked by:** numbers/titles, or "None (can start immediately)".

**Verification:** existing procedure; scenario; expected result. Name a real prerequisite gap here when one blocks execution.

**Status:** ready-for-agent, or blocked with that gap.
```

Do not copy launch, readiness, drive, reset, or cleanup instructions into the ticket. Point at the verification procedure that already owns them. Avoid specific file paths or code snippets unless a prototype snippet encodes a decision. A technical plan adjustment that preserves the intended behavior can be made while implementing. A qualifying product change waits for the human decision before dependent tickets proceed.

## Neighbors

```text
Wide refactor tickets         → blast-radius
Foggy destination             → wayfinder
```
