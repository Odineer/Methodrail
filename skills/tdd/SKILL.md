---
name: tdd
description: "Test-driven development with a red-green loop. Use when building features or fixes test-first, or when implementation should proceed in vertical slices at agreed seams. Not for throwaway prototypes or generated code."
when_to_use: Use when building features or fixes test-first, or when implementation should proceed in vertical slices at agreed seams. Not for throwaway prototypes.
---

# Test-driven development

TDD is the red → green loop. This skill makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop.

TDD is Methodrail's strong default for appropriate behavior-changing production-code changes. It is not the only verification technique. Characterization tests, runtime observation, typechecking, and other strategies remain valid when they are the honest match for the claim. The universal law is in `verify-change`: every meaningful change requires a falsifiable verification strategy.

When exploring the codebase, read the canonical domain glossary so test names match project language, and respect ADRs in the area you're touching.

Before the first test, discover how this repository runs tests. Prefer its documented command, a checked-in wrapper, and the existing focused-test form. Use that focused command during the loop. Use the project's broader suite before the slice is claimed done, when the project has one. Do not assume `npm test` is that command. Do not rerun a command that already passed in this turn if the relevant state is unchanged.

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification.

See [tests.md](references/tests.md) for examples, [mocking.md](references/mocking.md) for mocking guidelines, and [superpowers-writing-good-tests.md](references/superpowers-writing-good-tests.md) for honesty rules (name the production change that would make the test fail before writing it; never assert on mock behavior).

## Seams: where tests go

A **seam** is the public boundary you test at. Tests live at seams, never against internals.

Before writing any test, write down the seams under test. Give each proposed seam a one-line note on what it catches and what it misses. Prefer agreeing them with the user when the interface shape is itself in question. Use `codebase-design` for the vocabulary of module, interface, depth, seam, adapter, leverage, and locality.

## Anti-patterns

- **Implementation-coupled**: mocks internal collaborators, tests private methods, or verifies through a side channel. The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological**: the assertion recomputes the expected value the way the code does, so it can never disagree with the code. Expected values must come from an independent source of truth.
- **Horizontal slicing**: writing all tests first, then all implementation. Work in **vertical slices** instead: one test → one implementation → repeat.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it. Watch it fail for the expected reason.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Don't add speculative features.**
- After green, `verify-change` before claiming the slice done.

Refactoring of production structure is not a substitute for the loop. Local cleanup after green is fine; broad restructuring belongs to `/refactor`.

## Pressure resistance

Thinking "skip TDD just this once" for production behavior is usually rationalization. Valid exceptions: throwaway prototypes, generated code, configuration with no behavior, and changes whose honest verification strategy is not a unit/integration test (then use that strategy via `verify-change`).

If you wrote production code before the test, don't keep it as "reference." Implement from the failing test.

## Bug fixes

Write a failing test that reproduces the bug, then follow the loop. The test proves the fix and prevents regression. Coordinate with `diagnosing-bugs`: the loop from diagnosis often *is* the red test.

## Neighbors

```text
Usually follows:              develop, debug
Often produces:               failing test; passing implementation; verify-change
Escalate to:                  codebase-design, verify-change, diagnosing-bugs
Avoid combining automatically with: prototype, architect
```

```text
Design vocabulary             → codebase-design
After green                   → verify-change
Diagnosis loop                → diagnosing-bugs
```

Use project test conventions and the project verification skill when representative integration evidence is needed.
