---
name: writing-for-agents
description: Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md, CLAUDE.md, Methodrail project instructions, verification skills, or any doc an agent reaches by a pointer.
when_to_use: Use when creating or editing skills, or modifying AGENTS.md, CLAUDE.md, project instructions, verification skills, or any doc an agent reaches by a pointer.
---

# Writing for agents

Reference for writing any document an agent consumes: a skill, an `AGENTS.md` / `CLAUDE.md`, Methodrail project instructions, a verification skill, a spec or ticket reached by a pointer. The packaging differs; the writing does not: the same levers make each one predictable, since the agent takes the same _process_ every run rather than producing the same output.

When the document is a Methodrail skill, also read [SKILL-MECHANICS.md](SKILL-MECHANICS.md) and Methodrail [skill authoring](../../references/skill-authoring.md). Use Methodrail behavioral evals before shipping a new or changed skill.

Use this skill whenever Methodrail generates agent-facing harness content, especially `methodrail-init`.

Do not create a second public skill named `writing-great-skills`. This skill subsumes that earlier concept.

## Context pointers

A **context pointer** is a reference held in the agent's context that names some out-of-context material and encodes the condition for reaching it. A skill's description is one; a line in `AGENTS.md` naming a doc is the same object. The pointer's _wording_, not its target, decides when the agent reaches the material, and how reliably. A must-have target behind a weakly worded pointer is a variance bug: sharpen the wording first, and inline the material only if sharpening fails.

A pointer does two jobs: state what the material is, and list the **branches** that should trigger reaching it (a branch is a distinct case the document handles, so different runs take different paths through it). Every word of an always-loaded pointer costs on every turn, so it earns even harder pruning than the body:

- **Front-load the leading word**: the pointer is where it does its triggering work.
- **One trigger per branch.** Synonyms that rename a single branch are one branch written twice; collapse them and keep only genuinely distinct branches.
- **Cut identity the body already carries.**

## The two loads

Every document and pointer you add spends one of two budgets:

- **Context load** is the cost of always-loaded material on the agent's window: an `AGENTS.md` line, a skill description, anything sitting in context every turn, spending tokens and attention whether or not it fires.
- **Cognitive load** is the cost on the human: which documents exist and when to reach for each. The human is the index. Not a cost to minimise: it is the price of human agency; spend it where human judgement matters, remove it where it does not.

Material reached only through a pointer escapes context load at the price of the pointer's own line; material with no pointer at all rides entirely on cognitive load.

See [context economics](../../references/context-economics.md). Permanent Methodrail context is Layer 0. The active skill is Layer 1. Detailed references are Layer 2.

## Information hierarchy

A document is built from two content types: **steps** (the ordered actions the agent performs) and **reference** (definitions, rules, facts consulted on demand). The two mix freely. The core decision is where each piece sits on the **information hierarchy**, a ladder ranked by how immediately the agent needs the material:

1. **In-file step** is the primary tier: what the agent does, in order.
2. **In-file reference** is consulted on demand.
3. **Disclosed reference** is pushed out into a separate file, reached by a context pointer, loaded only when the pointer fires.

Push too little down and the top bloats; push too much and you hide material the agent actually needs.

**Progressive disclosure** is the move down the ladder so the top stays legible. Branching is the cleanest disclosure test: inline what every branch needs, and push behind a pointer what only some branches reach.

**Co-location** is the within-file companion: keep a concept's definition, rules, and caveats under one heading rather than scattered.

**Sprawl** is a document simply too long, even when every line is live. The cure is the ladder: disclose reference behind pointers, and split by branch or sequence so each path carries only what it needs.

Do not shorten a mature pressure-resistant procedure merely to hit an arbitrary token target. Remove no-op explanation. Keep demonstrated behavioral reliability.

## Steps and completion criteria

Every meaningful step ends on a **completion criterion**, the condition that tells the agent the work is done.

- **Clarity**: can the agent tell done from not-done? A vague bound ("understanding reached") invites premature completion. Sharpen the bound first. Only if it is irreducibly fuzzy _and_ you observe the rush, hide later steps by splitting across a real context boundary.
- **Demand**: how much it requires. The strongest criteria are both checkable and exhaustive.

Prefer completion criteria that are clear, checkable, and appropriately demanding. Do not add artificial ceremony solely to make them measurable.

Weak: `Understand the code.`

Better: `Trace the relevant path from entrypoint to effect, account for authoritative state and side effects, and identify unsupported assumptions.`

## When to split

Split only when the cut earns it:

- **By sequence**: split a run of steps where the post-completion steps tempt the agent to rush the one in front of it.
- **By invocation**, skill-specific: see [SKILL-MECHANICS.md](SKILL-MECHANICS.md).

## Leading words

A **leading word** is a compact concept already living in the model's pretraining that the agent thinks with while running the document. Repeated as a token, never as a sentence, it anchors behavior in few tokens.

Keep strong established Methodrail/upstream terms when they improve model behavior: red-green-refactor, deep module, tracer bullet, decision frontier, blast radius, hillclimb. Do not rename them merely for Methodrail branding.

**Negation** is a failure mode: steering by prohibition drags the forbidden behaviour into context. Prompt the **positive** target behaviour. A prohibition earns its place only as a hard guardrail you cannot phrase positively.

## Pruning

- Keep each meaning in a **single source of truth**.
- The **environment** is a source of truth too. Cache only what the agent cannot find by looking.
- Check every line for **relevance**.
- Hunt **no-ops** sentence by sentence: an instruction the model already obeys by default pays load to say nothing. When a sentence fails, delete the whole sentence.

For every Methodrail rule, skill, and reference: does this sentence change likely agent behavior? If not, delete it, replace it with a pointer, rely on model prior, or rely on deterministic tooling.

## Methodrail constraints

- One canonical owner per capability. See [capability map](../../references/capability-map.md).
- Shared methodology lives in `references/`. Skills link; they do not duplicate.
- Project harness files are indexes and pointers, not copies of canonical docs.
- `methodrail-init` must generate pointer-oriented `AGENTS.md` / `CLAUDE.md` / rule integrations. Do not copy full methodology into those files.
- New skills need routing and behavioral evals; discipline-enforcing skills need pressure cases. Ship only when behavior improves.

## Neighbors

```text
Usually follows:              methodrail-init, create-verification-skill, skill edits
Often produces:               pointer-oriented agent docs
Escalate to:                  skill-mechanics, evals
Avoid combining automatically with: wayfinder, architect, arena
```

- Used by: `methodrail-init`, skill maintenance, verification-skill generation, agent-facing docs, handoff artifacts
- Do not combine automatically with: `wayfinder`, `architect`, `arena`
- After a skill change: add or update evals before considering the work done
