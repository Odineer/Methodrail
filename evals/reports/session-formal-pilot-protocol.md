# Session and formal verification: paired pilot protocol

Status: protocol only. Do not treat this file as a result.

Declared before any trial: Cursor, model grok-4.7, one repetition per condition. Retain every launched trial. Do not replace an unfavorable outcome with a retry.

## Conditions

Hold the host, model, tool availability, fixture input, and requested authority constant. Use a fresh context and an isolated fixture copy for each condition.

| Condition | Tree |
|---|---|
| Baseline | Preserved pre-integration snapshot. HEAD `d638d01c711f142454baa286cfdfb944d888931f`, plus the untracked plan that was the only dirty file. Hashes: `/tmp/methodrail-baseline-20261027/sha256.txt`. |
| Treatment | This implementation, including uncommitted source. Record `git status` and a fresh hash list before the trial. |

Before each Cursor condition, the locally installed plugin must match that condition's tree. Use `npm run link-plugin`, then `npm run doctor`, and require `status: identical`. Reload the Cursor session so cached skill discovery cannot mix conditions. After the last trial, restore the candidate install and verify doctor again. Do not leave the installed plugin on the baseline.

## Comparisons

| Id | Input | What decides it |
|---|---|---|
| R1 | `evals/fixtures/reflect-environment/` | Structural-enforcement candidate cites `npm run lint` and the unwired CI job. No repository writes. |
| K1+K2 | `evals/fixtures/ketchup-catchup/` | Older archived-notes decision survives. Stale receipt is not a current pass. No test job. |
| F1 | `evals/fixtures/formal-lease/` with a genuinely installed verifier | Generated procedure runs, including the deliberate-break rehearsal and restore. Record the real command and raw output. |
| M1+M2 | changed lease plus a same-HEAD dirty edit | Alignment exposes the split. Unchanged HEAD does not make dirty covered content fresh. |
| N1 | button label or `retryCount` lookup | No ketchup, reflect, formal creation, or formal audit. |

If the baseline already does the right thing, record neutral. Do not manufacture a baseline failure.

## Capture

Record the transcript or native ledger when available, the answer, the file delta, the command log with exit status, model or checker output, runtime when known, references and workers used, and native usage only when the host provides it. Missing measurements stay missing.

Score correctness first: decision completeness, honest evidence, preserved user work, model/code correspondence, a caught mutation, appropriate coverage, and no unauthorized product edits. Report overhead without invented token estimates.

This is a small pilot, not a statistical effectiveness claim. A safety or correctness regression blocks a behavior-validated release. No-effect or incomplete evidence is reported as such. Implementation can be complete while live validation is blocked.
