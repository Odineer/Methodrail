Rewrote the quiet formatter and split the broken test command into two repairs.

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
      failure_class: product-defect
      evidence: [package.json]
    - id: T2
      lane: tooling
      target: .github/workflows/ci.yml
      disposition: confirmed
      cause: broken-canonical-command
      failure_class: product-defect
      evidence: [.github/workflows/ci.yml]
    - id: V1
      lane: verification
      target: features/checkout.md
      disposition: confirmed
      cause: stale-recipe
      failure_class: product-defect
      evidence: [features/checkout.md]
    - id: A1
      lane: architecture
      target: src/billing/wrap.js
      disposition: confirmed
      cause: caller-burden
      evidence: [src/billing/wrap.js]
    - id: A2
      lane: architecture
      target: src/billing/ledger.js
      disposition: confirmed
      reason: already-deep
      evidence: [src/billing/ledger.js]
    - id: A3
      lane: architecture
      target: src/quiet/format.js
      disposition: confirmed
      reason: speculative
      evidence: [src/quiet/format.js]
  ranking: [T1, T2, V1, A1, A2, A3]
  product_defects: [src/checkout.js]
```
