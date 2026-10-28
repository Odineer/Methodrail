Origin: mattpocock/skills / skills/engineering/to-tickets
Import mode: adapted
Fidelity: methodrail-composed
Upstream revision: 59db609eb1e18aaf59b63284d0e52255aff0c63c
License: MIT (Copyright (c) 2026 Matt Pocock)

Methodrail changes:
- tracker-specific behavior isolated
- local markdown fallback is first-class, not a setup-skill failure
- Removed the unconditional granularity quiz. Routine cuts and dependency edges are chosen. Each ticket points at existing proof, the scenario, and the expected result.
- Addy Osmani `skills/planning-and-task-breakdown` at `6ca0cd7db39b41b1c37e26d335c507ee92382c6d` composed for acceptance, dependencies, and explicit verification. The `tasks/todo.md` default and the overwrite quiz are not imported. Primary origin remains mattpocock/skills.
- 2026-10-27: an existing source issue gets native sub-issues; Blocked by is omitted when native blocking edges are set. Local tickets keep Blocked by. Parent body stays unmodified unless asked.
