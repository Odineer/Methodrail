# Session and formal verification: paired pilot results

Status: not run. This file does not claim observed improvement.

Protocol: [session-formal-pilot-protocol.md](session-formal-pilot-protocol.md). Declared design was Cursor, grok-4.7, n=1. No trial was launched, so there is no result to retain or replace.

## Why the trials were not launched

The protocol requires the installed Cursor plugin to match each condition, `npm run doctor` to report `status: identical`, and a fresh Cursor session so cached skills cannot mix baseline and treatment. Doing that from this implementation turn would retarget the installed plugin and mix the implementation session with the observation. That was not done.

Formal creation and the stale-model trial also need a genuinely installed verifier. On this machine `/usr/bin/java` reports that a Java runtime is not available, and `tlc` is not on `PATH`. No checker was installed. Methodrail's install does not gain Java, TLC, mise, or a statechart helper to fill that gap.

## What was graded instead

Constructed fixtures and graders ran in the maintainer suite. They check destinations, sync hashes, command logs, and file roles. Recorded counterexample text under `evals/fixtures/formal-lease/recorded/` is labeled as not a TLC execution. Passing those tests does not show that an agent followed the new skills, and it does not show a live benefit.

Review fixes add an executable replay of the counterexample against the lease implementation and constructed TLC log records for grading completion, violation, mutation, and restoration evidence. The replay runs JavaScript operations; it is not model checking. No live formal-tool result has been added.

`npm run check` on the starting tree passed before these edits. The final maintainer gate is recorded in the implementation completion report, separate from this pilot.

## Claim boundary

Implementation of the skills, discovery, and constructed contracts can be complete while this pilot is unfinished. CONTRIBUTING still requires observed recurring failure and evidence of behavioral benefit before a behavior-validated release. That evidence is absent. Do not describe these results as neutral, helped, or harmed. They were not run.
