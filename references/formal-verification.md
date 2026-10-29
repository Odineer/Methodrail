# Formal verification

Shared contract for project-local formal checks. `create-formal-verification-skill` and `maintain-formal-verification-skill` follow it. Callers link here. Verifier-specific recipes stay in the project's generated guidance.

This is not a feature map and not an app-driving verify skill. App launch, Doctor, and user-facing recipes stay with `create-verification-skill`.

## Evidence categories

Pick the method from the question and the tools the project can run.

| Category | What a pass means |
|---|---|
| Finite model checking | The stated property holds for the model inside its explored scope. |
| Bounded code verification | The stated property holds for the checked code up to the stated bound. |
| Proof under stated assumptions | The stated property holds from those assumptions. |
| Generated-input or property testing | Useful testing. Label it as testing. It is not a formal proof. |

A successful tool exit is not enough. Record whether the requested properties completed, whether exploration was truncated, and whether warnings or unsupported constructs undermine the claim.

For every check, record the property, the user harm, the checked code, the method, the tool and version, the command, the assumptions, the bounds, the excluded behavior, and the evidence location.

Record formal output as `static-analysis` evidence. Put the method and scope in Notes. See [evidence record](protocols/evidence-record.md). Do not add an evidence-label taxonomy for this contract. A generated-input run is `test` evidence.

## Model fidelity

- The representation corresponds to actual code operations and their atomicity. Assumptions do not silently remove the failing schedule or input.
- A model's pass establishes its stated property within its model and scope. It does not by itself prove implementation correctness or a whole-system guarantee.
- Relevant code changes require an alignment review before a model's pass can support the changed implementation.
- A deliberate break exercises the relationship between the protected code and the verification procedure.
- Scratch mutations live in a disposable copy or isolated checkout. The user's tracked, staged, unstaged, and untracked work stays intact.

For a code-level verifier, the mutation must make the verifier reject the relevant property. For a hand-written model, a product-code mutation must first be detected as changed covered code. The procedure then reviews or updates the model and exposes the corresponding violation. A model-only mutation shows model sensitivity. It does not show that implementation changes reach the check.

After the rehearsal, discard only the scratch mutation and rerun against the original relevant state. If the original state already violates the property, preserve and report that failure. Passing product code is not a prerequisite for a useful result.

## Freshness

Keep a per-check sync record in the generated guidance. It is not typed project knowledge and it has no governance fields.

Record the last reviewed Git commit when one exists, the covered paths and symbols, and hashes of the exact covered file contents reviewed. Use a documented unversioned fallback for non-Git code. Include relevant untracked files and dependency or configuration inputs when they affect the property. Hash the declared inputs only.

Compare current covered contents to that snapshot before presenting a pass as evidence about current code. A changed hash requests semantic review. It does not prove a bug. Formatting-only changes can be realigned after review without changing a model. A blocked check keeps its last confirmed sync record. Separate any proposed new record from the confirmed one.

A single commit marker cannot represent a check created against a dirty tree. Never stamp the current commit and omit dirty covered changes. Moving HEAD without changing covered contents does not make a model stale.

A small project-owned helper may make the preflight and the check one command, using the project's language and tools. Methodrail ships no universal hash-checking runtime. Refreshing hashes does not replace human or agent review of semantic alignment.

## Generated guidance

Prefer the repository's established native skill location, defaulting to `.agents/skills/verify-<area>-formal/SKILL.md`. Follow existing Cursor, Claude, or Z Code conventions when those are already established. Preserve curated files. Do not rename an adequate existing check to match this convention.

For linked external harness placement, put the procedure and support under `.methodrail/control/verify-<area>-formal/` and point from `PROJECT.md`. Do not add a tracked native skill. Respect the existing harness binding.

Native skill frontmatter uses `name`, `description`, and `when_to_use` as appropriate. Do not add Methodrail-only frontmatter to tag verification type. Put this line near the top of the Markdown body:

```text
Verification method: formal
```

Use these sections, with real repository entries:

- Properties: each property and its plain-language consequence.
- Covered code: paths, symbols, model correspondence, relevant input files, and exclusions.
- Run: reproducible version or setup reference, and the exact preflight-plus-check invocation.
- Assumptions and bounds: limitations that affect interpretation.
- Results: how to distinguish success, property violation, setup failure, and inconclusive analysis, and how to replay counterexamples.
- Sync record: reviewed commit or explicit fallback, and covered-content hashes.
- Upkeep: when to align the representation, how to preserve or change intentional promises, and which operator handles accumulated drift.

A property-testing fallback declares its actual method instead of the formal marker. It stays discoverable through `PROJECT.md`. The artifact scanner must not classify it as formal.

Existing hand-written formal procedures without this exact format remain eligible through their known path or `PROJECT.md`. The scanner is conservative on purpose.

Do not require Launch, Doctor, a user-facing feature map, or TLA+.

## Counterexamples

Use the installed verifier's raw output, a short trace in project nouns, and source references for the steps. A Mermaid diagram is optional when it explains a trace. Report trace length accurately. Claim a shortest path only when the tool establishes it.

No renderer, mise dependency, Java installation, or statechart helper is part of installing Methodrail. A project may use its own verifier. Missing tools produce an exact setup gap. Do not invent a result.

## Outcomes for upkeep

Each check reports one or more of:

| Outcome | Meaning |
|---|---|
| in sync | No change since the last confirmed sync alters what the check describes, and the check passes. |
| updated | The representation now describes the code. The check may also be bug. |
| bug | The verification describes the current code, and the code breaks the property. |
| blocked | The check could not be aligned or could not run. The confirmed sync record stays put. |

Updated and bug may coexist. Inspect reports drift as proposed updates and does not apply them. Do not translate these outcomes into the app maintainer's clean/changed vocabulary.
