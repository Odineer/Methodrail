---
name: generated
description: Check that a protected lease use cannot proceed for two valid holders.
when_to_use: When a change touches lease holders or the lease model.
---

Verification method: formal

## Properties

A protected use cannot proceed for two simultaneously valid holders. Harm: two owners both perform the protected operation.

## Covered code

`src/lease.js` symbols `claim`, `release`, and `use`. The model action `Claim` is one atomic step, matching `claim`. Excludes admin tools and the UI.

## Run

No TLC execution is recorded in this fixture. The constructed counterexample is `recorded/counterexample.md`. A real run uses the project's installed checker:

`java -cp tools/tla2tools.jar tlc2.TLC -config model/Lease.cfg model/Lease.tla`

From the aligned fixture root, compare the covered file's SHA-256 with the Sync record before running that command. A mismatch requires alignment first. The repository-local tools/tla2tools.jar and Java are prerequisites; neither is installed by this fixture. Missing either blocks the check. A JavaScript syntax check is not evidence for SingleOwner.

## Assumptions and bounds

Ids are a finite set of two. The model does not include crashes or disk failure.

## Results

Success means `SingleOwner` completed without a violation and the checker did not truncate. A violation is a property failure. A missing checker is a setup failure. Truncation is inconclusive. Replay steps against `beginClaim` and `finishClaim` only after the model contains those actions.

## Sync record

Confirmed: yes
Reviewed commit: none
Fallback: unversioned:constructed-fixture

| Path | sha256 |
| --- | --- |
| src/lease.js | 7b4090db26d5ccefd7725cb3fea5ea2b2df9ec79d083014de55b16aa6ccfd222 |

## Upkeep

Align the model when `claim` is split or a new writer touches `holders`. `maintain-formal-verification-skill` handles accumulated drift. Change `SingleOwner` only when a requirement says the promise changed.
