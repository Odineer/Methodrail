---
name: observe
description: Establish a baseline, exercise a real user/client path, and record runtime evidence. Use when behavior is in question and observation is reasonably cheap.
when_to_use: Use when behavior is in question and exercising a real user or client path is reasonably cheap. Establishes a baseline and records runtime evidence.
---

# Observe

## Problem

Source can establish implementation. It cannot automatically establish runtime behavior. Agents still say 'users see X' after reading a handler.

## Observed failure

The agent reads a route handler, narrates the UX, and never starts the app. Or it calls a guess 'observed'.

## When to activate

Activate when the question is what actually happens, when a bug is behavioral, when verification needs a running system, or when source inference is insufficient.

## When not to activate

Do not activate when the question is purely structural, when starting the system is disproportionately expensive relative to risk, or when a deterministic test already answers the claim at the required confidence.

## Required context

How to start the system using existing project commands, the path to exercise, expected vs unknown behavior, and revision.

## Method

1. Establish a controlled baseline (revision, config, data).
2. Determine how the relevant system starts. Prefer existing project commands. Interview the repo before asking a human.
3. Verify readiness (doctor/health).
4. Exercise the actual user/client-facing path when feasible.
5. Inspect resulting state. Collect artifacts.
6. Compare observation against source inference.
7. Record reproduction details.
8. Label confidence correctly:

- inferred — derived from code or reasoning but not executed
- test-confirmed — a test demonstrates the behavior
- observed — the system was executed
- traced — runtime evidence shows the mechanism
- historically-confirmed — historical evidence, not current runtime
- unknown — insufficient or conflicting evidence

Never call something observed unless it was executed. See [observation record](../../references/protocols/observation-record.md).

## Permitted evidence

Runtime logs, UI/API responses, traces, screenshots, DB state after exercise, health checks. Source is supporting context, not a substitute.

## Side effects

May start local processes. Must not mutate production. Prefer isolated data and use established reset commands when available.

## Completion

Either the path was exercised and artifacts exist, or blockage is explicit (cannot start, cannot reach path) with what was tried.

## Artifacts

An observation record: question, baseline, exercise, result, confidence, reproduction, artifact locations.

## What survives

Reproduction steps, observed outcomes, confidence labels. Discard raw logs unless they encode a durable contract.

## Evaluation

Positive routing for 'what do users see' and runtime symptoms. Negative: pure how-questions can stay on how. Pressure: refuse to relabel inference as observation.

## Neighbors

```text
Need current implementation   → how
Need project drive/repro      → project verify skill
Need live instrumentation     → runtime-forensics
```

Reuse documented start/drive/reset procedures. Do not relaunch the app independently when the project harness already knows how.

May produce a behavior-knowledge candidate when a surprising durable contract is observed.
