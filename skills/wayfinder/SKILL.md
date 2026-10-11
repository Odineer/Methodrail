---
name: wayfinder
description: "Plan work too large or foggy for one context as a shared map of decision tickets. Resolve unblocked decisions while evidence is available and no qualifying human choice blocks the next step. Use for huge uncertain projects, not for ordinary planning or implementation."
disable-model-invocation: true
---

# Wayfinder

A loose idea has arrived, too big for one agent session, and wrapped in fog. Wayfinding finds the way; it does not charge at the destination. Chart the way as a **shared map** of **decision tickets** (questions whose resolution is a decision, not slices of a build), then resolve them one at a time until the route is clear.

This is Methodrail's operational implementation of the [decision frontier](../../references/decision-frontier.md). Do not replace it with a simplified summary. Do not force foggy large work into a premature full implementation plan.

Read `.methodrail/PROJECT.md` for destination constraints and existing decisions when present.

## Plan, don't do

Each ticket resolves a decision. The map is done when the way is clear. The pull to just do the work is usually the signal you've reached the edge of the map. Absent an explicit Notes override, produce decisions, not deliverables.

## Refer by name

Every map and ticket has a **name** (its title). Refer to it by that name, never by a bare id.

## The map

The map is an **index**, not a store. Decisions live in their tickets. The map gists and links.

**Where it lives:** use the project's existing issue tracker when one is already in use (native parent/child and blocking if the tracker has them). Otherwise use local markdown:

```text
.scratch/<effort-slug>/wayfinder/MAP.md
.scratch/<effort-slug>/wayfinder/tickets/<nn>-<slug>.md
```

Labels such as `wayfinder:map` apply on real trackers. Locally, the MAP.md file *is* the map. Do not require a setup skill.

### The map body

```markdown
## Destination

<what reaching the end looks like. One or two lines.>

## Notes

<domain; skills every session should consult; standing preferences>

## Decisions so far

- [<closed ticket title>](link): <one-line gist>

## Not yet specified

<in-scope fog you can't ticket yet>

## Out of scope

<work ruled beyond the destination>
```

Open tickets are **not** listed on the map; they are found by query (or by listing the tickets directory).

### Tickets

Each ticket is a child of the map, sized to one decision:

```markdown
## Question

<the decision or investigation this ticket resolves>
```

Types: `research`, `prototype`, `grilling`, `task`.

- **Research**: call `research` when the question needs external or primary sources.
- **Prototype**: call `prototype` when the question is empirical. A safe, reversible experiment inside current authority does not require a human interruption.
- **Grilling**: call `grill-with-docs` only when the question is a qualifying human decision under the [decision frontier](../../references/decision-frontier.md). Do not default to grilling because the next step is unclear.
- **Task**: manual work that unblocks a decision, not delivery of the destination.

Classify the question before choosing a method. A ticket is **unblocked** when every blocker is closed. The **frontier** is open, unblocked children. Continue resolving unblocked tickets in the current context while the work stays bounded, the evidence is available, and no qualifying human decision blocks the next step. Use [isolate or handoff](../../references/context-management.md) when context size or decision independence warrants it. A new session is that choice, not a decision quota.

## Fog of war

Don't chart what you can't yet see. **Ticket** when the question is already sharp. **Not yet specified** when you can't yet phrase it that sharply. Out of scope is not fog.

## Invocation

Research tickets may run in parallel. Other unblocked tickets may be resolved in this context under the rule above.

### Chart the map

A chart-only request stays chart-only. Do not implement the destination.

1. **Name the destination** from the request and the repository. Use `grill-with-docs` only when the destination itself is a qualifying human decision.
2. **Map the frontier**, breadth-first. If this surfaces no fog (the whole journey fits the current context), stop and return that. You don't need a map.
3. **Create the map.**
4. **Create the tickets you can specify now**, then wire blocking edges.
5. **Fire research subagents** for research tickets.
6. Stop. Charting hand-resolves nothing.

### Work through the map

1. Load the map (low-res).
2. Choose the next frontier ticket, or the one the user named.
3. Resolve it by the classified method. Call skills named in Notes when they match that method.
4. Record the answer, close the ticket, append a gist to Decisions so far.
5. Add newly surfaced tickets; graduate fog that is now specifiable; rule out-of-scope work out of the route.
6. Continue while the next ticket is unblocked and no qualifying human decision blocks it.

## Neighbors

```text
Ambiguous destination         → grill-with-docs
External facts                → research
Empirical claims              → prototype
Consequential shape           → architect after the map is clear
```

Do not restart `/develop`. A composed call returns the decisions, the remaining frontier, and the evidence to the parent. Chart-only authority does not implement the feature.

## Done when

The map names the destination, the current frontier is ticketed, and this context resolved the unblocked decisions it could evidence. Qualifying human decisions that remain are explicit.
