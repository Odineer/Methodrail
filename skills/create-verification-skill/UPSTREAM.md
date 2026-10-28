Origin: pstack / create-verification-skill
Import mode: adapted
Fidelity: upstream-preserved-with-extensions
Upstream revision: c742dd61706fbacc1b95f1a20b7b988cf096ce6c
License: MIT (Copyright (c) 2026 Lauren Tan)

Methodrail changes:
- generated skill lives in the project's established native location (.agents/skills/verify-<app>/ preferred)
- linked external placement writes under .methodrail/control/ and does not add a tracked native skill
- discovery and application are separate caller-selected phases; init discovery does not write
- owning workflows may authorize application for a missing verification path without a second approval prompt
- does not repair product code; a product defect returns to the parent workflow
- compared with pstack @ 5bf2b1544db739998121a306340631963c2ff3de (create-verification-skill and docs/guide/06-verify-and-ship.md); did not import product-code repair, .cursor-only placement, or PR shipping
- CONTROL.md may still be generated for non-obvious coordination
- 2026-10-27: launch must be usable from an empty data dir; a journey missing seed data fails into Gotchas; a stand-in proof lists setup the real target will not do.
