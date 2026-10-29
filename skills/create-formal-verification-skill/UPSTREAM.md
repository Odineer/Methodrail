Origin: pstack / create-formal-verification-skill
Import mode: adapted
Fidelity: upstream-preserved-with-extensions
Upstream revision: c742dd61706fbacc1b95f1a20b7b988cf096ce6c
License: MIT (Copyright (c) 2026 Lauren Tan)

Methodrail changes:
- shared contract in references/formal-verification.md, including dirty-tree sync hashes
- creation only for an express formal target; discovery writes nothing
- no mandatory statechart, mise, Java, or renderer; counterexamples use the installed verifier's raw output
- generated-input fallback is labeled testing, not a proof
- does not repair product code and does not require Launch or a feature map
- compared with pstack create-formal-verification-skill at c742dd61706fbacc1b95f1a20b7b988cf096ce6c
