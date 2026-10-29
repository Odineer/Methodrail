# Evidence record

Evidence supports a specific claim. It is not the claim, and it is not a decision.

```text
evidence != conclusion
conclusion != decision
```

## Kinds

```text
source
test
runtime
trace
profile
benchmark
history
document
static-analysis
human-decision
generated-artifact
```

## Lightweight record

Use this when a claim matters and must survive the conversation:

```text
Claim:
Evidence kind:
Location:
Revision:
Captured:
Confidence:
Notes:
```

Do not require strict JSON unless tooling has a concrete use for it.

Validation should be fresh, relevant, and proportional to risk. A passing unrelated check is not evidence that a change works. Report what was checked, the result, and any important gap.

Confidence labels are defined in [observation records](observation-record.md).

Formal checker output — finite model checking, bounded code verification, or a proof under stated assumptions — is `static-analysis`. Put the method, bounds, assumptions, and scope in Notes. A generated-input or property test is `test` evidence, not a formal proof. A tool exit status is not the claim. See [formal verification](../formal-verification.md).
