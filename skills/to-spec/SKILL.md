---
name: to-spec
description: "Turn resolved discussion into a durable implementation specification. No interview; synthesize what is already known. Use after grill-with-docs or when intent is already clear. Do not use to interrogate ambiguous requirements."
disable-model-invocation: true
---

# To spec

Takes current conversation context and codebase understanding and produces a spec. Do **not** interview the user; synthesize what you already know.

`grill-with-docs` resolves uncertainty. This skill crystallizes sufficiently resolved intent.

## Process

1. Explore the repo if you haven't already. Use the project's domain glossary throughout, and respect ADRs in the area you're touching.
2. Sketch the seams at which you're going to test the feature. Prefer existing seams. Use the highest seam possible. Choose a seam the repository already supports. Ask only when that seam itself is a qualifying human decision under the [decision frontier](../../references/decision-frontier.md).
3. Before calling the spec ready for dependent implementation, check that its acceptance criteria are observable and that qualifying human decisions are resolved. Return unresolved qualifying decisions to the parent. Do not pick the convenient behavior, and do not start an interview from this skill.
4. Write the spec using the template below, then publish it:
   - to the project's existing issue tracker if one is already in use, or
   - as a project-local markdown file (`docs/`, `specs/`, or `.scratch/`) when no tracker integration is available. Do not write `.methodrail/knowledge/`; that path is typed notes after `reflect` approval, or decision records.

Do not require a Methodrail or Matt Pocock tracker setup skill.

## Spec template

## Problem Statement

The problem from the user's perspective.

## Solution

The solution from the user's perspective.

## User Stories

A numbered list of user stories: As an actor, I want a feature, so that a benefit. Cover the feature thoroughly.

## Implementation Decisions

Modules, interfaces, architectural decisions, schema changes, API contracts. Do **not** include specific file paths or code snippets unless a prototype produced a snippet that encodes a decision more precisely than prose.

## Testing Decisions

What a good test is here, which modules will be tested, prior art in the codebase. Point at existing project commands and verification. Do not invent numerical coverage or performance thresholds.

## Acceptance Criteria

Observable conditions that decide the work is done. Each criterion is testable with an existing procedure or a gap the parent must resolve. Do not manufacture a numeric target the user and the project have not set.

## Boundaries

Material in-scope and out-of-scope behavior. Name existing approval boundaries that still apply, such as ADRs, harness writes, and production operations. A tiny unambiguous edit does not get a spec document.

## Out of Scope

## Further Notes

## Neighbors

```text
Unresolved questions          → grill-with-docs
Implementation                → /develop after spec exists
```
