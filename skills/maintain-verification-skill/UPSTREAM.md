Origin: pstack / maintain-verification-skill
Import mode: adapted
Fidelity: upstream-preserved-with-extensions
Upstream revision: 46125561306434d8a1d7745d540d8932ab0cd2a2
License: MIT (Copyright (c) 2026 Lauren Tan)

Methodrail changes:
- target discovery includes .agents/skills/verify-*, .methodrail/control/, and PROJECT.md pointers
- task-scoped maintenance is a Methodrail mode for parent workflows; standalone audit stays a full audit
- outcomes remain clean / changed / blocked and must name scope and coverage
- no product-code mutation; documentation drift, harness defect, and product defect stay distinct
- does not open a pull request; the parent receives the result
- compared with pstack @ 5bf2b1544db739998121a306340631963c2ff3de (maintain-verification-skill and docs/guide/06-verify-and-ship.md); full audit keeps source-plus-live coverage, and PR shipping was not imported
