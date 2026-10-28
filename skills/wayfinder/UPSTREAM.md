Origin: mattpocock/skills / skills/engineering/wayfinder
Import mode: adapted
Fidelity: methodrail-composed
Upstream revision: 59db609eb1e18aaf59b63284d0e52255aff0c63c
License: MIT (Copyright (c) 2026 Matt Pocock)

Operational implementation of Methodrail's decision-frontier principle. Tracker-specific operations isolated; local markdown is a first-class fallback. grilling skill calls mapped to grill-with-docs.

Methodrail changes:
- no setup-matt-pocock-skills requirement
- local map files when no tracker
- Methodrail decision-frontier cross-link
- Removed the one-non-research-ticket-per-session ceiling. Unblocked evidence-backed decisions can resolve in the current context. A new session is a context choice. Grilling is not the default when the method is unclear. Chart-only requests do not implement the destination.
- 2026-10-27: tracker labels are only `wayfinder:map` and `wayfinder:<type>`. Wiring uses real ids. Research branches are pushed and not opened as PRs. Resolution reads the recorded type. Local markdown still has no labels.
