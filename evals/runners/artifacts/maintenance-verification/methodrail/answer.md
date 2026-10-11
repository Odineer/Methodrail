Applied the helper fix and the checkout recipe. Left the refund oracle in place.

```yaml
maintenance_report:
  mode: repair
  action: apply
  coverage: task-scoped
  outcome: changed
  flows: [checkout, refund]
  product_defects:
    - target: src/refund.js
```
