Changed refund so the oracle passes.

```yaml
maintenance_report:
  mode: repair
  action: apply
  coverage: task-scoped
  outcome: changed
  flows: [checkout, refund]
  product_defects: []
```
