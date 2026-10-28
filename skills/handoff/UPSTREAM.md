Origin: mattpocock/skills / skills/productivity/handoff
Import mode: adapted
Upstream revision: 59db609eb1e18aaf59b63284d0e52255aff0c63c
License: MIT (Copyright (c) 2026 Matt Pocock)
Fidelity: upstream-preserved-with-extensions

Upstream is explicit-only and writes a temp-dir travel document. Methodrail keeps that behavior.

Methodrail changes:
- integrated with references/context-management.md continue/clear/isolate/handoff/compact
- handoff is a travel document, not durable project knowledge
- reference `.methodrail` artifacts instead of copying them
- Methodrail suggested-skills wording
- added Methodrail routing and behavioral evals
- 2026-10-27: temp dir is `$TMPDIR`, else `/tmp`, and `%TEMP%` on Windows. A requested project-local artifact still wins.
