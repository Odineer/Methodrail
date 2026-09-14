# Historical pilot hash discrepancy

`hash-audit.json` preserves the saved pilot hashes and hashes recomputed from the recovered `/tmp/methodrail-karpathy-pilot/skills/` files during review repair.

Five baseline entries disagree: `references/decision-frontier.md` and the `code-review`, `develop`, `diagnosing-bugs`, and `refactor` skill bodies. The saved manifest gives the same skill-body hashes for both conditions; the recovered baseline files instead match the original pre-Karpathy hashes. This audit cannot determine which bytes the agents saw during the historical runs. Do not infer that either manifest or recovered files alone establish the executed control condition.

The reported four neutral pairs retain their historical output evidence, but attribution to an isolated full-integration comparison remains unverified. Do not retroactively replace their input provenance. Use the separately [reconstructed baseline](../post-ponytail/README.md) for future paired runs, capturing and verifying its manifest before dispatch.
