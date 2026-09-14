Origin: mattpocock/skills / skills/engineering/code-review
Import mode: adapted
Fidelity: upstream-preserved-with-extensions
Upstream revision: 5b15a47f2d7150f545fbcacbfe381787fc0230dc
License: MIT (Copyright (c) 2026 Matt Pocock)

Methodrail changes:
- /review remains the workflow entrypoint; this skill is the two-axis leaf
- issue-tracker setup isolated; no setup-matt-pocock-skills requirement
- Methodrail review-packet integration
- subagents optional per host capabilities
- WIP review captures staged, unstaged, and untracked work, not only `<base>...HEAD`
- Ponytail composed: unnecessary-complexity and redundant-comment checks on Standards only; no third axis; no "Lean already. Ship." verdict (DietrichGebert/ponytail `356918eba965ee1eac64bd3a7f0dd02108350de5`)
- Karpathy-inspired guidelines composed: Spec scope-creep allows necessary supporting work and change-created cleanup; unrelated churn remains out of scope (multica-ai/andrej-karpathy-skills `2c606141936f1eeef17fa3043a72095b4765b9c2`)
