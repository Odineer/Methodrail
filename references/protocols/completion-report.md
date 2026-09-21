# Completion report

Finish substantive work with one fenced `yaml` block. It is a claim, not evidence; every line must be backed by something the reader can check. Proportional: a tiny change reports `claim` and `verification` only.

```yaml
methodrail_completion:
  claim: "expired sessions now land on /login"
  verification:
    - command: "node --test src/session.test.js"
      result: pass
  evidence_labels: [test-confirmed, observed]
  decisions:
    - subject: "orderIntake"
      disposition: "deepen"
      approval: not-needed
  knowledge: none
  residual_risk: none
```

Rules: never mark `result: pass` for a command that did not run in this turn; `approval: approved` requires that the approval is visible in the conversation; do not add keys.
