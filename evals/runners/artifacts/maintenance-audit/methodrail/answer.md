Audit only. No files were edited.

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
      evidence: [package.json, docs/setup.md, .github/workflows/ci.yml]
    - id: V1
      lane: verification
      target: features/checkout.md
      disposition: confirmed
      cause: stale-recipe
      failure_class: documentation-drift
      evidence: [features/checkout.md, scripts/drive.mjs]
    - id: A1
      lane: architecture
      target: src/billing/wrap.js
      disposition: confirmed
      cause: caller-burden
      evidence: [src/billing/wrap.js, src/app.js, CHURN.md]
    - id: A2
      lane: architecture
      target: src/billing/ledger.js
      disposition: rejected
      reason: already-deep
      evidence: [src/billing/ledger.js, docs/adr/0001-ledger-owns-money.md]
    - id: A3
      lane: architecture
      target: src/quiet/format.js
      disposition: rejected
      reason: speculative
      evidence: [src/quiet/format.js, CHURN.md]
  ranking: [T1, V1, A1]
  product_defects: []
```
