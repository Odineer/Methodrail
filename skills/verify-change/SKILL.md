---
name: verify-change
description: "Use when about to claim work is complete, fixed, or passing. Requires fresh verification evidence before any success claim. Do not use as an investigation skill."
---

# Verify change

**Core principle:** Evidence before claims, always.

Violating the letter of this rule is violating the spirit of this rule.

## The iron law

```text
NO COMPLETION CLAIM WITHOUT FRESH RELEVANT EVIDENCE
```

If you haven't run the verification in this turn, you cannot claim it passes.

Verification must be produced in this turn against unchanged relevant state. A prior message, a stale test run, or a check taken before later edits does not count.

The upstream Superpowers gate function is the operating procedure. Keep it. The full original is in [superpowers-verification-before-completion.md](references/superpowers-verification-before-completion.md).

## The gate function

BEFORE claiming any status or expressing satisfaction:

1. **IDENTIFY:** What command or observation proves this claim?
2. **RUN:** Execute the FULL command (fresh, complete), or exercise the real path when the claim is behavioral.
3. **READ:** Full output, check exit code, count failures. Inspect the result; do not skim.
4. **VERIFY:** Does the output confirm the claim?
   - If NO: state actual status with evidence
   - If YES: state the claim WITH evidence
5. **ONLY THEN:** make the claim

Skip any step = lying, not verifying.

## Reuse project verification

Before inventing verification steps, check the project:

```text
project verification skill?
control documentation?
runtime / start / drive guidance?
existing test, lint, or build workflow?
```

If `.methodrail/PROJECT.md` exists, read it. Follow pointers to a project-local verify skill, `.methodrail/control/CONTROL.md`, runtime notes, and documented commands.

If any of those exist, reuse them. Do not rediscover launch, readiness, drive, reset, or the local test workflow. Do not write a generic test-pyramid essay instead of running the check this repository already has.

Then apply the iron law to that reused path. Fresh evidence is still required. Reuse does not weaken the gate.

## What counts as evidence

Match the evidence to the claim:

- TDD / regression tests
- characterization tests
- integration and end-to-end scenarios
- static analysis / typechecking / compilation
- benchmarks
- visual baselines
- runtime observation (`observe`)
- migration dry runs
- invariant / property tests

TDD is the preferred default for normal behavior-changing production code, but not a universal law. The universal law: every meaningful change requires a falsifiable verification strategy. See [evidence record](../../references/protocols/evidence-record.md).

Distinguish **passed** verification from **merely executed** verification.

## Common failures

| Claim | Requires | Not sufficient |
|---|---|---|
| Tests pass | Test command output: 0 failures | Previous run, "should pass" |
| Linter clean | Linter output: 0 errors | Partial check |
| Build succeeds | Build command: exit 0 | Linter passing |
| Bug fixed | Original symptom: passes | Code changed, assumed fixed |
| Regression test works | Red-green cycle verified | Test passes once |
| Agent completed | VCS diff shows changes | Agent reports "success" |
| Requirements met | Line-by-line checklist | Tests passing |

## Red flags — STOP

- Using "should", "probably", "seems to"
- Expressing satisfaction before verification
- About to commit/push/PR without verification
- Trusting agent success reports
- Partial verification
- "Just this once"
- Tired and wanting work over
- Any wording implying success without having run verification

## Rationalization prevention

| Excuse | Reality |
|---|---|
| "Should work now" | RUN the verification |
| "I'm confident" | Confidence ≠ evidence |
| "Just this once" | No exceptions |
| "Linter passed" | Linter ≠ compiler |
| "Agent said success" | Verify independently |
| "I'm tired" | Exhaustion ≠ excuse |
| "Don't run tests; just tell me it's fixed" | Refuse the completion claim |

## When to apply

Always before any variation of success/completion claims, satisfaction, commit/PR, moving to the next task, or delegating "done" to another agent. The rule applies to exact phrases, paraphrases, and implications of success.

## Neighbors

```text
Usually follows:              develop, debug, refactor, tdd
Often produces:               fresh evidence record; pass/fail status
Escalate to:                  observe, project verify skill, performance, visual-parity
Avoid combining automatically with: how, architect, wayfinder
```

```text
Behavioral claim              → observe / project verify skill
Performance claim             → performance
Visual claim                  → visual-parity
```

This skill is a leaf gate, not a workflow. Prefer the project-local verify skill when present. Do not weaken this gate to save tokens. Evidence method should be proportional to the claim. End with the [completion report](../../references/protocols/completion-report.md) block; keep it proportional.
