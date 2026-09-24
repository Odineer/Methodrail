---
name: architect
description: "Explicit architecture decision exercise. Ground in current implementation, sketch distinct alternatives, and compare tradeoffs. Return that design when composed under develop. Implement only when this skill was invoked directly and implementation was requested. Do not use for local mechanical changes."
disable-model-invocation: true
---

# Architect

Design before implementing when jumping to code would lock in the wrong shape. This is an explicit architecture decision exercise. `codebase-design` is the reusable design vocabulary; this skill is the decision workshop.

Use [rigor](../../references/rigor.md) and the [decision frontier](../../references/decision-frontier.md) to decide whether this ceremony is justified. Skip for trivial local changes.

## Start

Track phases so they don't silently disappear: Ground, Sketch, Agree, Implement, Scrap.

## Phase A: Ground the problem

Build a real mental model of every system the new code touches. Run `how` over the relevant subsystems. Critique mode if existing structure is the constraint.

Naming a file isn't grounding. If the design redefines ownership or layering, also run `why` on the existing shape so the rationale is a constraint, not a guess.

Skip Phase A only when the work is genuinely greenfield with no surrounding system.

## Phase B: Sketch

Produce at least two structurally distinct candidates before synthesis. Whole-shape alternatives, not point fixes inside one shape.

If the host supports `arena`, run it with the design-sketch task and Phase A grounding. Each candidate produces a design package per [runner-prompt.md](references/runner-prompt.md) and [rationale-template.md](references/rationale-template.md). If not, sketch two alternatives in this context. See [host capabilities](../../references/host-capabilities.md).

Screen every candidate against [design-red-flags.md](references/design-red-flags.md). Reject shallow modules, information leakage, temporal decomposition, and pass-through methods.

Compare viable candidates on:

- interface depth (prefer hiding more complexity behind a smaller public surface)
- ownership boundaries
- reversibility
- operational complexity
- migration cost
- observability and testability
- risks

## Phase C: Agree

When `develop` invoked this skill, stop here. Return the alternatives, the recommendation, and unresolved questions. Do not implement. The parent still owns prototyping, the decision, and implementation.

Standalone implementation is opt-in. Proceed to Phase D only when the user invoked `architect` directly and standalone implementation was requested. For adversarial pressure before implementing, name `interrogate` and wait for the user to invoke it.

## Phase D: Implement against the sketch

Run this phase only for requested standalone implementation. Do not run it when the parent is `develop`.

Replace `not implemented` bodies with code. Deviations from the sketch are signal. Surface them; don't bolt them on.

## Phase E: Scrap when the architecture is wrong

If implementation keeps producing friction the sketch can't absorb, throw the sketch out. The signal is a *pattern*: repeated workarounds, escape hatches, callers needing internal rules. A few edge cases don't condemn an architecture.

When you scrap: re-run `how` over what's been built, redesign from the new constraints, prefer a smaller sketch, return to Phase B.

## Outputs

Caller's usage written first, type sketch derived from it. Rationale shaped per [rationale-template.md](references/rationale-template.md), including the synthesis decision.

## Neighbors

```text
Usually follows:              how, domain-modeling, develop (uncertain design)
Often produces:               decision; rationale
Escalate to:                  prototype, arena
Avoid combining automatically with: develop restart, tdd, interrogate
```

```text
Current implementation        → how
Historical rationale          → why
Domain vocabulary             → domain-modeling / existing glossary
Empirical claim               → prototype
Competing sketches            → arena
Adversarial pressure          → name `interrogate` and wait
```

Use existing ADRs, domain vocabulary, and current implementation. Do not invent architecture from scratch. Must not restart `/develop`. When composed under `develop`, must not implement.

Complexity alone is not a reason to invoke this skill. Crossing a function boundary is not by itself a reason.
