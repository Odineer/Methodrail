Origin: mattpocock/skills / skills/engineering/code-review
Import mode: adapted
Fidelity: methodrail-composed
Upstream revision: 59db609eb1e18aaf59b63284d0e52255aff0c63c
License: MIT (Copyright (c) 2026 Matt Pocock)

Methodrail changes:
- /review remains the workflow entrypoint; this skill is the two-axis leaf
- issue-tracker setup isolated; no setup-matt-pocock-skills requirement
- Methodrail review-packet integration
- subagents are conditional. Bounded review uses local Standards and Spec passes. Isolated reviewers require a rigor justification. Host availability alone does not escalate. This replaces the upstream default that both axes run as parallel sub-agents whenever the host supports them.
- Addy Osmani agent-skills composed at `6ca0cd7db39b41b1c37e26d335c507ee92382c6d`: test and check weakening from `skills/constraint-driven-development`; relevant correctness and verification effectiveness from `skills/code-review-and-quality`. Five public review axes, CONSTRAINTS.md, and the floor-guard script are not imported. Primary origin remains mattpocock/skills.
- WIP review captures staged, unstaged, and untracked work, not only `<base>...HEAD`
- Ponytail composed: unnecessary-complexity and redundant-comment checks on Standards only; no third axis; no "Lean already. Ship." verdict (DietrichGebert/ponytail `356918eba965ee1eac64bd3a7f0dd02108350de5`)
- Karpathy-inspired guidelines composed: Spec scope-creep allows necessary supporting work and change-created cleanup; unrelated churn remains out of scope (multica-ai/andrej-karpathy-skills `2c606141936f1eeef17fa3043a72095b4765b9c2`)
- 2026-10-27: standards search must include every repo writing-standard file, and `CODING_STANDARDS.md` / `CONTRIBUTING.md` when present. Did not take the foreground parallel sub-agent spawn.
