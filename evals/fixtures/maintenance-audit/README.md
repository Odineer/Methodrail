# Maintenance audit fixture

Read-only audit of one mini-repo. The answer carries a fixture-local `maintenance_report`. That block is not a consumer report format.

Runnable checks:

```bash
node scripts/tests.mjs
npm test
node scripts/drive.mjs checkout
node scripts/drive.mjs --flow checkout
```

`npm test` is the documented canonical command. `node scripts/tests.mjs` is the product check. The drive commands separate a stale recipe from product behavior.

## Report fields

```yaml
maintenance_report:
  mode: audit
  coverage:
    inspected: [architecture, verification, tooling]
    skipped: []
  findings:
    - id: T1
      lane: tooling
      target: package.json
      disposition: confirmed
      cause: broken-canonical-command
      failure_class: harness-defect
      evidence: [package.json, .github/workflows/ci.yml]
  ranking: [T1]
  product_defects: []
```

`cause: broken-canonical-command` marks the shared broken `npm test` path. Rank that cause once. `failure_class: documentation-drift` is for a stale recipe whose product path still passes. `disposition: rejected` keeps a candidate out of `ranking`.
