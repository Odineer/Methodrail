Origin: mattpocock/skills / skills/engineering/diagnosing-bugs
Import mode: adapted
Fidelity: methodrail-composed
Upstream revision: 5b15a47f2d7150f545fbcacbfe381787fc0230dc
License: MIT (Copyright (c) 2026 Matt Pocock)

Compared against obra/superpowers systematic-debugging (b36e0829c6d0140e93cfef2ca599b1b07d4a7797) and the previous Methodrail systematic-debugging skill. Matt won on feedback-loop construction, minimization, and instrumentation. Superpowers pressure resistance and tracing techniques are composed in. Methodrail runtime escalation (observe / runtime-forensics / trace-forensics) is preserved.

Methodrail changes:
- Superpowers rationalization table and 3-failed-fixes architecture stop
- runtime escalation to observe / forensics
- project knowledge / control lookup
- Methodrail verification via verify-change and tdd
- added Methodrail behavioral evals
- Ponytail composed: fix the owner of the violated contract regardless of caller count (DietrichGebert/ponytail `356918eba965ee1eac64bd3a7f0dd02108350de5`). Diagnosis loop remains Matt/Superpowers; Ponytail's one-check testing rule is not imported.
- Karpathy-inspired guidelines composed: after a verified fix, remove only artifacts that fix made unused; do not sweep unrelated dead code (multica-ai/andrej-karpathy-skills `2c606141936f1eeef17fa3043a72095b4765b9c2`)
