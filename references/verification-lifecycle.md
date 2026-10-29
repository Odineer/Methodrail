# Verification lifecycle

Shared decisions for creating, maintaining, and executing project verification. Workflow skills link here. They do not copy this procedure.

Three responsibilities stay distinct, and each stays a bounded operation under the active workflow:

- **Create** establishes a usable verification procedure.
- **Maintain** keeps that procedure and its feature map accurate.
- **Verify** executes the relevant checks and judges whether they support the completion claim.

`verify-change` owns Verify. It consumes procedures and evidence. It does not launch creation or a maintenance audit.

## Decisions

| id | When | Action |
|---|---|---|
| adequate-existing | Existing verification adequately covers the task | Reuse it. |
| scripts-sufficient | Existing tests, scripts, or control documentation are sufficient without a verification skill | Use them directly. |
| missing-path | A meaningful runnable surface lacks a reusable way to prove the requested behavior | Create within the task’s authorized scope. |
| mapped-change | The task adds, changes, or removes user-facing behavior that an existing feature map represents or should represent, including a behavior the map does not yet list | Task-scoped maintenance. |
| stale | Existing verification instructions appear stale | Classify the failure, then repair only the matching layer. |
| widespread | Drift is widespread, or the user requests a comprehensive audit | Full maintenance audit. |
| blocked-prereq | Verification is blocked by unavailable prerequisites | Report the exact gap and any narrower evidence obtained. |

Creation is justified by the need for reusable verification. Absence of a `verify-*` directory is not a reason to generate one.

## Failure classes

| Class | Meaning |
|---|---|
| documentation drift | Intended behavior is correct. Instructions describe it incorrectly. |
| harness defect | Behavior works. The verification mechanism cannot drive or inspect it. |
| product defect | Actual behavior violates intended behavior. |

Do not change expected behavior to make a failing product pass. Return a product defect to the owning workflow.

## Proportional path

Tiny edits keep the cheap path. A label change with an adequate existing check does not bootstrap a feature map, a formal proof, or an application-wide audit.

The normal path is reuse, then implement, then verify. Create and maintain run only when a decision above selects them. App-driving verification and formal checks are separate procedures. Formal alignment follows [formal verification](formal-verification.md). A recognized formal procedure does not prove app coverage, and an app feature map does not add proof obligations. Create a formal check only for an express formal target. Maintain one only when its recorded coverage is touched.

Specs state observable outcomes. Tickets name the existing verification procedure, the scenario, and the expected result. They do not copy launch, readiness, drive, reset, or cleanup steps into each ticket.

## Placement

In-repository guidance may use the repository’s supported native skill location, preferring `.agents/skills/verify-<app>/`. Linked external placement writes under `.methodrail/control/`. Do not generate a tracked native skill merely to expose private guidance.

## Evidence

A procedure that was not executed is a draft. Failed or unexecuted output is blocked or draft, not proven infrastructure. After maintenance edits invalidate evidence, rerun the affected checks before a completion claim. A task-scoped clean result covers only the inspected entries.

Completion evidence is produced in the current turn against unchanged relevant state. Within that turn, reuse a complete successful result when it still proves the claim and no relevant state changed. Do not rerun a check only because a leaf skill was entered. If review fixes, cleanup, harness maintenance, or a later repair change relevant state, rerun the affected checks. Reviewing an earlier run does not make it this turn's evidence.

## Parents

The caller names the action and the coverage. Standalone creation may run discovery and application when the user invoked it. Do not open a pull request, commit, or release from create or maintain; return the result to the parent.

Init keeps its preview contract: discovery proposes artifacts, and application waits for confirmation. Other workflows do not add an approval prompt for reversible verification support the task already authorizes.

## Maintenance action

`inspect` reconciles and reports. It writes no owned verification files. Actionable discrepancies are `findings`. Never report `changed` from inspection.

`apply` corrects owned files inside the existing edit scope and proves changed driving procedures. Apply outcomes stay `clean`, `changed`, and `blocked`.

Standalone “audit the verification skill” is full-audit application. `develop`, `debug`, and `refactor` keep task-scoped application when a decision above selects maintenance. `maintain-project` names both the action and the coverage. A read-only parent cannot escalate inspection into application. Broad project maintenance does not by itself request a full audit. A source-only sample is task-scoped coverage, not a full audit.

When no verification skill exists, record that fact and assess existing scripts or control evidence. Do not generate one during discovery or inspection. Create only during an authorized repair when the decision is `missing-path`.
