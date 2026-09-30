---
name: arena
description: "Same problem, multiple competing candidate solutions, then comparison and synthesis. Use for /arena or when one attempt at a non-trivial artifact would lock in the wrong shape. Do not auto-trigger for routine work."
disable-model-invocation: true
---

# Arena

Fan out N parallel attempts at the **same** task. Read every candidate end to end. Pick the strongest as the base. Graft the best ideas from the others into it. Verify the synthesized result.

```text
swarm        = partition different independent slices
arena        = compete on the same work
interrogate  = independent adversarial review
```

Do not reduce this to a generic "spawn agents" skill.

## Start

Phases: Frame, Fan out, Cross-judge, Pick, Graft, Verify.

## Phase A: Frame

The N candidates receive the same prompt, so the prompt is the contract.

1. State the artifact each candidate is producing.
2. Derive a rubric: 3–6 concrete gradeable criteria. Concrete: `Adds a --dry-run flag that skips writes`. Vague: `code is correct`.
3. Pick runners. If the host supports choosing models, use the `arena runners` role in [host capabilities](../../references/host-capabilities.md) and follow its selection procedure, including a rejected slug. Otherwise spawn independent contexts on the default model, or run sequential independent attempts. Omit `model` when the host cannot choose one.
4. Assign output paths. Each candidate writes to its own location (git worktree where possible, otherwise a unique temp directory). N candidates writing to the same path is shared mutable state.

## Phase B: Fan out

Spawn all N in one message when the host allows parallel subagents. Each produces the artifact and a short rationale naming alternatives considered and rejected. If a candidate fails, proceed with N-1 and note the dropout.

## Phase C: Cross-judge

After candidates complete, obtain one independent judge pass when possible. If the host can choose its model, use the `arena cross-judge` role in [host capabilities](../../references/host-capabilities.md) and follow its selection procedure, including a rejected slug. It sees the rubric and the candidates by path, scores each criterion, and recommends a base. Do not spawn the judge while candidates are still writing. Omit `model` when the host cannot choose one.

## Phase D: Pick a base

Read every candidate end to end. Score criterion by criterion, not on holistic feel. Prefer the cleaner boundary or smaller surface when two feel tied. Record the pick and reason.

## Phase E: Graft

Walk each loser and port one or two things worth keeping. Fold by hand so the result stays coherent. Record grafts and rejections. When N candidates converge, note the convergence and ship it. When they wildly diverge, Phase A was under-specified — reframe rather than averaging.

## Phase F: Verify

The synthesized artifact has to hold up under `verify-change`. The arena does not earn a pass.

## Outputs

One synthesized artifact. One short synthesis note: base, grafts, rejections, dropouts, verification result.

## Neighbors

```text
Different slices              → swarm
Adversarial review            → name `interrogate` and wait
Must finish with              → verify-change
```

Do not auto-trigger for routine work.
