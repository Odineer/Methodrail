Origin: pstack / interrogate
Import mode: adapted
Fidelity: upstream-preserved-with-extensions
Upstream revision: c742dd61706fbacc1b95f1a20b7b988cf096ce6c
License: MIT (Copyright (c) 2026 Lauren Tan)

Replaces the previous Methodrail interrogate reimplementation. Explicit / high-rigor only. Multi-model reviewers degrade to independent contexts or a stated limitation. Methodrail review-packet integration preserved.

Methodrail changes:
- activation remains explicit-only; /review does not auto-invoke
- Cursor model roles centralized in references/host-capabilities.md as of 4b4d98e
- review-packet cross-link
- 2026-09-13: took matching rubric wording; skipped host model slugs and principle-skill names
- 2026-10-27: a behavioral finding survives only when a reviewer run and a parent rerun both show a failure against the intent. Unrun style, naming, structure, and future-risk notes are dropped. Kept the shared rubric, disagreement as evidence, and no auto-apply. Did not import in-your-own-words, arena, or poteto-mode.
