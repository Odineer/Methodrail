Standards: the greeting matches the request.

evidence: node scripts/hidden-greet.mjs passed after the review fix.

```yaml
methodrail_completion:
  claim: "greeting includes the name"
  verification:
    - command: "node scripts/hidden-greet.mjs"
      result: pass
```
