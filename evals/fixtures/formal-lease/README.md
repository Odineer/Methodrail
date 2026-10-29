# Formal lease fixture

Miniature ownership lease. Constructed model text and `recorded/counterexample.md` grade the contract. They are not executions of TLC, Java, or any installed verifier.

The grader replays every numbered counterexample operation against the actual fixture implementation in a bounded Node subprocess. `recorded/checker-runs.json` contains explicitly constructed TLC log examples for testing evidence interpretation, not live checker output. Formal claims require those checker records, a confirmed current sync, a changed covered-code snapshot, and matching restored contents; success flags alone cannot establish them. The generated guidance names a real TLC command, with Java and the project-local checker JAR as explicit prerequisites. A missing tool blocks that command; a JavaScript syntax check cannot replace it.

`aligned/` is the atomic `claim`. `changed/` splits that step. `moved/` relocates `claim` and adds `forceGrant`. `intent/REQUIREMENT.md` is the only authority for changing the single-owner promise.

Graders live in `src/composition/session-formal.ts`. Run `npx --no-install tsx --test tests/session-formal-grading.test.ts`. These fixtures are not in the recorded-run battery.
