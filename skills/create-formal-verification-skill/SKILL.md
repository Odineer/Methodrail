---
name: create-formal-verification-skill
description: "Generate a project-local formal check for one named property. Use when explicitly requested, or when an authorized workflow names a formal target. Do not start because a task mentions retries, concurrency, a parser, or high rigor."
when_to_use: Explicit request only, or an authorized parent names a formal check or proof target. Ordinary edits, retries, and high rigor do not start it.
disable-model-invocation: true
---

# Create a formal verification skill

Create one project-local check for one bounded property, then leave guidance the next agent can run. Follow [formal verification](../../references/formal-verification.md). Write the guidance with `writing-for-agents`.

This skill does not drive an app and does not own a feature map. App-driving verification stays with `create-verification-skill`.

## Authorization

Discovery-only calls return a proposal and write nothing.

Direct user invocation authorizes scoped application. A parent may authorize creation only when the task expressly calls for a formal check or proof target. Generalized concern about concurrency, retries, parsers, or a high rigor setting is not authorization.

Edit only verification support and authorized index pointers. Return a product defect to `debug` or `develop`. Do not turn one proof into a tooling migration. Do not create a Methodrail verify skill for the Methodrail repository to dogfood this feature.

## Procedure

1. Discover existing project checks and the named target. Reuse an adequate check. Do not generate a duplicate.
2. Infer the promise and the relevant harm from source, tests, specifications, ADRs, and eligible knowledge. Ask only for a consequential policy that cannot be observed.
3. Select one bounded target. A user-named target wins. Explain why the chosen method fits and what it cannot establish. A library with no app surface can still be a formal target. Do not require Launch or a feature map.
4. Produce the contract in [formal verification](../../references/formal-verification.md), any necessary project-owned models or harnesses, and a concise `PROJECT.md` pointer where the harness already exists. Do not bootstrap Methodrail. If no installed verifier can answer the question, say so. A generated-input fallback is testing and must be labeled as testing. An unavailable verifier is blocked, with the exact setup gap. Do not invent a result.
5. When application is authorized, execute the generated instructions as another agent would. Check code alignment. Rehearse a deliberate break in a disposable copy. Restore the user's tracked, staged, unstaged, and untracked work. Record the final evidence. Unexecuted infrastructure is a draft.
6. Return the check, the command, the actual result, the limits, unresolved findings, and the upkeep pointer (`maintain-formal-verification-skill`).

Keep required setup inside the repository's existing dependency and installation conventions.

## Hand-off

A fresh agent must be able to tell whether a change touches the covered code, run the check, detect changed covered content, interpret the scope, and reproduce a relevant failure from the generated guidance alone. Leave no placeholders and no dependency on an unshipped skill.

## Neighbors

```text
Usually follows:              an express formal target from the user, develop, or debug
Often produces:               project-local formal guidance and its sync record
Escalate to:                  maintain-formal-verification-skill
Avoid combining automatically with: create-verification-skill, routine edits
```
