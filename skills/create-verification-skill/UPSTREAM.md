Origin: pstack / create-verification-skill
Import mode: adapted
Fidelity: upstream-preserved-with-extensions
Upstream revision: 46125561306434d8a1d7745d540d8932ab0cd2a2
License: MIT (Copyright (c) 2026 Lauren Tan)

Methodrail changes:
- generated skill lives in the project's established native location (.agents/skills/verify-<app>/ preferred)
- linked external placement writes under .methodrail/control/ and does not add a tracked native skill
- discovery and application are separate caller-selected phases; init discovery does not write
- owning workflows may authorize application for a missing verification path without a second approval prompt
- does not repair product code; a product defect returns to the parent workflow
- compared with pstack @ 5bf2b1544db739998121a306340631963c2ff3de (create-verification-skill and docs/guide/06-verify-and-ship.md); did not import product-code repair, .cursor-only placement, or PR shipping
- CONTROL.md may still be generated for non-obvious coordination
