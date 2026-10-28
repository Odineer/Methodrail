Origin: mattpocock/skills / skills/engineering/diagnosing-bugs
Import mode: adapted
Fidelity: methodrail-composed
Upstream revision: 59db609eb1e18aaf59b63284d0e52255aff0c63c
License: MIT (Copyright (c) 2026 Matt Pocock)

Compared against obra/superpowers systematic-debugging (b36e0829c6d0140e93cfef2ca599b1b07d4a7797) and the previous Methodrail systematic-debugging skill. Matt won on feedback-loop construction, minimization, and instrumentation. Superpowers pressure resistance and tracing techniques are composed in. Methodrail runtime escalation (observe / runtime-forensics / trace-forensics) is preserved.

Methodrail changes:
- Superpowers rationalization table. After three unsuccessful fixes, reassess with a new causal claim and new evidence. That stop is not an automatic human meeting and not permission for a fourth unsupported guess. Hypothesis count is proportional; a single strongly supported hypothesis is allowed.
- runtime escalation to observe / forensics
- project knowledge / control lookup
- Methodrail verification via verify-change and tdd
- added Methodrail behavioral evals
- Ponytail composed: fix the owner of the violated contract regardless of caller count (DietrichGebert/ponytail `356918eba965ee1eac64bd3a7f0dd02108350de5`). Diagnosis loop remains Matt/Superpowers; Ponytail's one-check testing rule is not imported.
- Karpathy-inspired guidelines composed: after a verified fix, remove only artifacts that fix made unused; do not sweep unrelated dead code (multica-ai/andrej-karpathy-skills `2c606141936f1eeef17fa3043a72095b4765b9c2`)
- 2026-10-27: a forced red must be diffed against a pristine copy before it is trusted.
