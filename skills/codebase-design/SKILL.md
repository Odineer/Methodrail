---
name: codebase-design
description: "Shared vocabulary for designing deep modules. Use when designing or improving a module's interface, finding deepening opportunities, deciding where a seam goes, or making code more testable. Distinct from architect, which is an explicit architecture decision exercise."
---

# Codebase design

Design **deep modules**: a lot of behaviour behind a small interface, placed at a clean seam, testable through that interface. This is reusable design discipline, not an architecture decision workshop. Use `architect` when a consequential architecture choice exists.

## Glossary

Use these terms exactly.

**Module**: anything with an interface and an implementation. Scale-agnostic: a function, class, package, or tier-spanning slice. Avoid: unit, component, service.

**Interface**: everything a caller must know to use the module correctly: the type signature, plus invariants, ordering constraints, error modes, required configuration, and performance characteristics. Avoid: API, signature (too narrow).

**Implementation**: what's inside a module. Distinct from **Adapter**: reach for "adapter" when the seam is the topic.

**Depth**: leverage at the interface. A module is **deep** when a large amount of behaviour sits behind a small interface, **shallow** when the interface is nearly as complex as the implementation.

**Seam** (Michael Feathers): a place where you can alter behaviour without editing in that place; the *location* at which a module's interface lives. Avoid: boundary (overloaded with DDD).

**Adapter**: a concrete thing that satisfies an interface at a seam.

**Leverage**: more capability per unit of interface callers learn.

**Locality**: change, bugs, knowledge, and verification concentrate in one place.

## Deep vs shallow

When designing an interface, ask:

- Can I reduce the number of methods?
- Can I simplify the parameters?
- Can I hide more complexity inside?

## Principles

- **Depth is a property of the interface, not the implementation.** A deep module can be internally composed of small parts; they just aren't part of the interface.
- **The deletion test.** Imagine deleting the module. If complexity vanishes, it was a pass-through (delete/consolidate). If complexity reappears across N callers, it earns existence; then ask whether it is deep enough.
- **Reuse before a new module.** Prefer an existing implementation, project pattern, or native/stdlib capability that already satisfies the semantics. See [simplicity](../../references/simplicity.md).
- **Necessity.** Add only the interface the present requirement justifies. A justified public contract or test seam stays, including one production adapter plus a test adapter; do not delete it because implementation count is low.
- **Already-deep is not a candidate.** High churn on a deep module is not a reason to rewrite it.
- **The interface is the test surface.** Callers and tests cross the same seam.
- **One adapter means a hypothetical seam. Two adapters means a real one.** Don't introduce a seam unless something actually varies across it.

## Designing for testability

1. Accept dependencies, don't create them.
2. Return results, don't hide behind untestable side effects when the result is the point.
3. Small surface area. Fewer methods = fewer tests. Fewer params = simpler setup.

## Rejected framings

- Depth as ratio of implementation-lines to interface-lines (rewards padding).
- "Interface" as only the TypeScript `interface` keyword.
- "Boundary" as a substitute for seam.

## Going deeper

- [DEEPENING.md](references/DEEPENING.md) — dependency categories, seam discipline, replace-don't-layer testing.
- [DESIGN-IT-TWICE.md](references/DESIGN-IT-TWICE.md) — parallel alternative interfaces, then compare on depth, locality, and seam placement.

## Neighbors

```text
Consequential decision        → architect
Structured hunt               → improve-codebase-architecture
TDD at a seam                 → tdd
```
