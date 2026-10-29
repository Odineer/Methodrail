Origin: pstack / maintain-formal-verification-skill
Import mode: adapted
Fidelity: upstream-preserved-with-extensions
Upstream revision: c742dd61706fbacc1b95f1a20b7b988cf096ce6c
License: MIT (Copyright (c) 2026 Lauren Tan)

Methodrail changes:
- reuses references/formal-verification.md instead of a second contract
- inspect is read-only; apply cannot be escalated by a read-only parent
- sync record hashes covered contents, including dirty and untracked inputs
- a blocked check does not advance its confirmed sync record
- no mandatory statechart; no product edits; no translation into app-maintainer clean/changed outcomes
- compared with pstack maintain-formal-verification-skill at c742dd61706fbacc1b95f1a20b7b988cf096ce6c
