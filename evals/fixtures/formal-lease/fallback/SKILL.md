---
name: fallback
description: Property-test lease use with generated holders.
when_to_use: When no formal checker is installed.
---

Verification method: property-testing

## Properties

Generated holders never include two ids when claim rejects a second owner. This is testing, not a formal proof.

## Covered code

`src/lease.js`

## Run

`node --test test/lease.test.js`

## Sync record

Confirmed: no
Reviewed commit: none
Fallback: unversioned:no-checker

| Path | sha256 |
| --- | --- |
| src/lease.js | 7b4090db26d5ccefd7725cb3fea5ea2b2df9ec79d083014de55b16aa6ccfd222 |
