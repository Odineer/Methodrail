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

Tiny edits keep the cheap path. A label change with an adequate existing check does not bootstrap a feature map and does not start an application-wide audit.

The normal path is reuse, then implement, then verify. Create and maintain run only when a decision above selects them.

## Placement

In-repository guidance may use the repository’s supported native skill location, preferring `.agents/skills/verify-<app>/`. Linked external placement writes under `.methodrail/control/`. Do not generate a tracked native skill merely to expose private guidance.

## Evidence

A procedure that was not executed is a draft. Failed or unexecuted output is blocked or draft, not proven infrastructure. After maintenance edits invalidate evidence, rerun the affected checks before a completion claim. A task-scoped clean result covers only the inspected entries.

## Parents

The caller names the phase and the scope. Standalone creation may run discovery and application when the user invoked it. Standalone “audit the verification skill” is a full audit. Parent workflows must explicitly select task-scoped maintenance. Do not open a pull request, commit, or release from create or maintain; return the result to the parent.

Init keeps its preview contract: discovery proposes artifacts, and application waits for confirmation. Other workflows do not add an approval prompt for reversible verification support the task already authorizes.
