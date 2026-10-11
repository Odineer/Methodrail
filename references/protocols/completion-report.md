# Completion report

Substantive work ends with one fenced `yaml` block from the workflow that owns the task. It is a claim, not evidence; every line must be backed by something the reader can check. When the block is used, a small change reports `claim` and `verification` only.

A mechanical task may instead give a concise claim plus the verification that supports it, without this block.

Composed leaf skills return their bounded result to that owner. `verify-change` returns the judged claim, evidence, and gaps. `code-review` returns findings. The owner emits the one terminal block after the final relevant verification. A standalone leaf invocation that already uses this block still emits its own. Do not emit a second terminal block for the same task.

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
