# Session catch-up and formal verification: upstream comparison

Inspected 2026-10-28. Global review watermarks were not advanced. Both upstream HEADs already matched the recorded pins, and the new skills were read at those commits.

| Source | Pin | License |
|---|---|---|
| [mattpocock/skills](https://github.com/mattpocock/skills) `skills/engineering/retro/SKILL.md` | `59db609eb1e18aaf59b63284d0e52255aff0c63c` | MIT, Copyright (c) 2026 Matt Pocock |
| [pstack ketchup](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/ketchup/SKILL.md) | `c742dd61706fbacc1b95f1a20b7b988cf096ce6c` | MIT, Copyright (c) 2026 Lauren Tan |
| [pstack ketchup-video](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/ketchup-video/SKILL.md) | same pin | same license; SKIP |
| [pstack create-formal-verification-skill](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/create-formal-verification-skill/SKILL.md) | same pin | same license |
| [pstack maintain-formal-verification-skill](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/maintain-formal-verification-skill/SKILL.md) | same pin | same license |
| [pstack statechart](https://github.com/cursor/plugins/blob/c742dd61706fbacc1b95f1a20b7b988cf096ce6c/pstack/skills/statechart/SKILL.md) | same pin | same license; SKIP |

Full license text remains in [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md). Provenance stays out of the skill bodies. Reflect's primary Origin line stays pstack. Retro is report-only through the matrix and `skills/reflect/UPSTREAM.md`.

## Baseline

Starting tree `d638d01c711f142454baa286cfdfb944d888931f`. `git status` showed only the untracked implementation plan. `npm run check` passed on that tree before these edits. A working-tree hash list, including that untracked plan, was written outside the checkout at `/tmp/methodrail-baseline-20261027/sha256.txt` (2110 files). HEAD alone was not the baseline.

The design review identified capability gaps. It did not establish repeated live failures or a measured benefit. Constructed cases below demonstrate the contract. They are not observed user incidents. CONTRIBUTING's observed-failure bar is still unmet for a behavior-validated release.

## Adopted behavior

| Upstream | Decision | What Methodrail kept |
|---|---|---|
| retro | COMPOSE | Environment causes inside reflect's tooling lens: navigation, unwired or broken checks, mechanical standards, instruction load, tool access. Candidates only. |
| ketchup | ADAPT | Plain-language catch-up, last-user-message window, pending decisions from before that window, read-only collection, recap under 100 words with an unbounded decision list. |
| create-formal-verification-skill | ADAPT | One bounded target, code correspondence, deliberate-break rehearsal, honest scope, generated project guidance, upkeep pointer. |
| maintain-formal-verification-skill | ADAPT | Outcomes in sync, updated, bug, and blocked. Updated and bug may coexist. Verification edits only. |

## Deviations

- No public retro, bro, ketchup-video, or statechart skill.
- Ketchup states its plain-language style directly and does not load bro.
- Historical receipts stay historical. Ketchup does not emit a completion claim.
- Quoted worker text is data, not authorization.
- Formal guidance uses the shared contract in `references/formal-verification.md`, including covered-content hashes for dirty and untracked inputs.
- Counterexamples use the installed verifier's raw output, a short trace in project nouns, and source references. A shortest path is claimed only when the tool establishes it. Methodrail's install does not add mise, Java, or a renderer.
- A generated-input fallback is labeled testing. It is not a formal proof.
- Creation requires an express formal target. Retries, concurrency, parsers, and high rigor do not start it.
- App-driving verification is unchanged: Launch, feature maps, and the existing create/maintain pair stay the app path.

## Host assumptions

Native agents execute tools. Methodrail does not add a router, scheduler, or checker runtime. Formal skills are explicit. Parents load them only when their own procedure names the condition. Z Code reads `when_to_use`, which opens with `Explicit request only` and contains no colon-space.

## Evals that protect fidelity

Constructed outcome grading, not prose equality and not `behaviors_observed`:

```bash
npx --no-install tsx --test tests/session-formal-grading.test.ts tests/formal-verification-artifacts.test.ts
```

Routing, behavioral, pressure, fidelity, and composition YAML for the new skills are maintainer contracts. They are not in the recorded-run battery. `npm run eval` does not launch an agent and does not score those YAML files as live runs.

The paired-pilot protocol is [session-formal-pilot-protocol.md](../../evals/reports/session-formal-pilot-protocol.md). Results are [session-formal-pilot-results.md](../../evals/reports/session-formal-pilot-results.md).
