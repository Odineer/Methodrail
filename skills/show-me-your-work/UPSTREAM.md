Origin: pstack / show-me-your-work
Import mode: adapted
Fidelity: upstream-preserved-with-extensions
Upstream revision: 4b4d98e5e3b3c139f63dbc1ce4b538954c8f2f52
License: MIT (Copyright (c) 2026 Lauren Tan)

Methodrail changes:
- transcript audit is host-optional
- cross-model review degrades per host capabilities
- maps onto Methodrail decision-record semantics
- not mandatory for trivial work
- kept one-line rows and ADR non-override
- 2026-09-29: append-only header uses `>>` when the file is empty; `start` rows separate runs; audit supersedes instead of deleting rows
