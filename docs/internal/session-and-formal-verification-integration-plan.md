# Session catch-up and formal verification: implementation plan

Status: implementation handoff for Cursor. This document specifies proposed work. No skill, validator, discovery code, or eval was changed while preparing it. Implementation readiness and behavioral validation are separate outcomes.

Prepared: 2026-10-27, America/Chicago.

## 1. Outcome

Extend Methodrail in three bounded areas:

1. Improve the existing reflection procedure's ability to identify environmental causes of repeated agent mistakes.
2. Add an explicit human catch-up skill that explains outcomes and presents genuine pending decisions.
3. Add explicit creation and upkeep operators for project-local formal verification, including discovery and evidence integration.

Implement the work in the order above. Preserve existing app-verification behavior and the cheap path for ordinary changes. Keep video catch-up and the separate statechart tool out of this implementation.

All file paths in implementation tables are relative to the repository root. Read current files before editing. The planning session initially found uncommitted upstream-maintenance work; that work was committed as d638d01 while this document was being prepared. At the final planning check, this plan was the only untracked change. Reinspect the actual implementation starting tree rather than assuming either a clean or dirty checkout.

## 2. Accepted scope and ownership

| Input | Decision | Canonical destination |
|---|---|---|
| Matt Pocock retro | COMPOSE | Existing reflect skill and its tooling reviewer; no public retro skill |
| pstack ketchup | ADAPT | New ketchup skill; preserve the upstream command name |
| pstack ketchup-video | SKIP for this slice; deferred | Record the decision, with no public skill or renderer |
| pstack create-formal-verification-skill | ADAPT | New specialist with the same name |
| pstack maintain-formal-verification-skill | ADAPT | New specialist with the same name |
| pstack statechart dependency | SKIP for this slice; optional future evaluation | Use the chosen verifier's real output and a portable counterexample report |

Responsibilities:

| Capability | Owner |
|---|---|
| Session learning candidates | reflect |
| Human reorientation and pending decisions | ketchup |
| During-work decision trail | show-me-your-work |
| Agent pickup document | handoff |
| App-driving verification creation/upkeep | Existing create-verification-skill and maintain-verification-skill |
| Formal verification creation/upkeep | New formal pair |
| Judging evidence before a completion claim | verify-change |
| Delivery, diagnosis, refactoring, maintenance portfolio | Existing workflow entry skills |

The formal operators are specialists, not new workflow entrypoints. Ketchup summarizes work and does not take over that work. Reflect continues to propose candidates rather than applying standing guidance automatically.

## 3. Boundaries

In scope:

- The three new explicit skill directories, their provenance, routing evals, behavioral coverage, and documentation.
- Composition of retro's useful environmental analysis into reflect.
- A small shared formal-verification reference for the formal pair and their callers.
- Additive formal-artifact discovery and regression tests.
- Narrow integration into existing verification, init, and maintenance procedures.
- Constructed evaluation fixtures, evidence-based grading, and a live paired-pilot protocol.

Out of scope:

- Public retro, bro, ketchup-video, or statechart skills; aliases for the new commands.
- Video generation, ffmpeg integration, slide rendering, or generated presentation assets.
- A general formal-methods tutorial or a catalog of verifier-specific recipes.
- A consumer runtime, scheduler, router, database, service, or mandatory Methodrail CLI.
- Automatically starting formal verification because a task involves retries, concurrency, a parser, or high rigor.
- Adding proof obligations to every app feature map.
- Fixing product defects inside verification upkeep; return them to the owning workflow.
- Changes to model routing, the family invariant, global rules, user settings, or installation hooks unless an actual integration defect requires them.
- A version bump, release, commit, push, publication, tracker issue, or unrelated upstream sync.

## 4. Sources and implementation baseline

### 4.1 Read these sources at a fixed revision

The planning review read the following public sources. Their main-branch URLs can move. At implementation start, resolve and record an exact commit for each repository, read the selected files and applicable license at that commit, and retain permanent source links in the comparison record.

- [retro](https://github.com/mattpocock/skills/blob/main/skills/engineering/retro/SKILL.md)
- [ketchup](https://github.com/cursor/plugins/blob/main/pstack/skills/ketchup/SKILL.md)
- [ketchup-video](https://github.com/cursor/plugins/blob/main/pstack/skills/ketchup-video/SKILL.md)
- [create-formal-verification-skill](https://github.com/cursor/plugins/tree/main/pstack/skills/create-formal-verification-skill)
- [maintain-formal-verification-skill](https://github.com/cursor/plugins/tree/main/pstack/skills/maintain-formal-verification-skill)
- [statechart](https://github.com/cursor/plugins/blob/main/pstack/skills/statechart/SKILL.md), only to assess and document the dependency being removed.

The existing local records currently name pstack revision c742dd61706fbacc1b95f1a20b7b988cf096ce6c and Matt revision 59db609eb1e18aaf59b63284d0e52255aff0c63c. These are existing review watermarks, not a claim that every proposed source was already imported or inspected at those pins.

Create docs/internal/session-and-formal-verification-upstream-comparison.md during implementation. Record source pin, license, adopted behavior, deliberate deviations, host assumptions, and evals that protect fidelity. Keep source attribution out of operational skill bodies.

### 4.2 Preserve the starting tree

1. Read .methodrail/PROJECT.md, CONTRIBUTING.md, docs/family-integration.md, docs/upstream-maintenance.md, skills/writing-for-agents/SKILL.md, and its SKILL-MECHANICS.md.
2. Inspect git status, staged/unstaged diffs, and non-ignored untracked files. Several intended edit targets received recent user/Cursor changes, including reflect, create-verification-skill, host capabilities, notices, and upstream records. Preserve those changes whether they are now committed or remain in the working tree.
3. Capture a reproducible baseline of the relevant current tree outside the checkout. Include relevant uncommitted and untracked files and record file hashes. Do not use HEAD alone as the baseline.
4. Preserve that snapshot for paired comparisons. Do not reset, stash, or overwrite the user's work to obtain a clean baseline.
5. Run npm run check on the starting tree, recording pre-existing failures separately. Run subsequent checks appropriate to the actual changes.
6. Inspect existing applicable eval/report conventions before adding new ones. Reuse the native host and the current maintainer runner.

CONTRIBUTING requires observed recurring failures and evidence of behavioral benefit. The design review identified capability gaps; it did not establish repeated live failures or an empirical benefit. Record that distinction. Constructed cases can demonstrate the contract and expose failures; they cannot be relabeled as observed user incidents or live improvement.

## 5. Slice A: compose retro into reflect

### 5.1 Files

| File | Change |
|---|---|
| skills/reflect/references/tooling-reviewer.md | Add environment analysis to the existing tooling lens |
| skills/reflect/SKILL.md | Add only the minimal pointer/routing clarification needed for that lens |
| skills/reflect/references/synthesizer.md | Change only if needed to preserve severity and structural-enforcement routing |
| skills/reflect/UPSTREAM.md | Preserve pstack as primary origin; record retro as a separately pinned composed source |
| skills/reflect/evals/routing.yaml and routing-negative.yaml | Protect explicit reflection and trivial-session non-activation |
| evals/behavioral/reflect-environment.yaml | New behavior contract |
| evals/pressure/reflect-mechanical-rule.yaml | Pressure to encode a mechanically enforceable mistake as standing prose |
| evals/fixtures/reflect-environment/ | Session evidence and a miniature repository with discriminating findings |

### 5.2 Procedure changes

Extend the existing tooling review rather than adding another reviewer or a mandatory extra phase. Analyze only the selected session, its artifacts, and relevant project guidance.

For an evidenced incident, investigate the environment that enabled it:

- Navigation: repeated discovery of the same non-obvious relationship may justify a concise pointer to an existing source.
- Checks: inspect the repository's actual check commands and CI/pre-commit wiring before proposing new enforcement. Distinguish a missing check from an existing check that is never run or is silently broken.
- Standards: route fixed syntactic patterns, banned APIs, import shapes, and file-placement rules toward deterministic enforcement using existing tooling. Reserve guidance for judgment that tooling cannot reliably express.
- Instruction load: identify redundant, stale, or ineffective steering when the session shows a cost. Preserve essential pointers and applicable instructions.
- Tool economy and access: report concrete avoidable discovery or unavailable evidence that affected the session. Use recorded measurements when available; do not invent token savings or time estimates.

A missing guardrail is an evidence-backed environment candidate. Its presence in a repository does not authorize implementation or make a broad tooling migration part of reflect.

Keep existing outcomes and governance. The synthesizer returns Accepted / Rejected / Backlog, with candidates routed to knowledge, skills, or structural enforcement. Acceptance for proposal remains distinct from permission to persist. Do not create a mandatory CODING_STANDARDS.md or edit global AGENTS.md automatically.

### 5.3 Fixture and acceptance

The fixture should contain repeated session evidence of a mechanical mistake, a pre-existing check that would catch it, and CI that does not run that check. Include one justified navigation issue and one tempting one-off that should be rejected.

Pass when reflect identifies the existing unwired check, proposes the appropriate deterministic enforcement candidate, cites session evidence, preserves the one-off rejection, and writes no knowledge, guidance, code, or tracker item. Fail an answer that adds another prose rule as the primary fix or claims hypothetical savings as measured.

Do not test paragraph wording. Grade the destination and supporting evidence of each proposal.

## 6. Slice B: add ketchup

### 6.1 Files

Create skills/ketchup/SKILL.md, UPSTREAM.md, and evals/routing.yaml plus evals/routing-negative.yaml. Add a behavioral fixture under evals/fixtures/ketchup-catchup/ and behavioral, pressure, composition, and fidelity cases in the existing eval directories.

Add ketchup to the required and explicit skill sets in src/validate.ts, and to required behavioral coverage. It is neither a WORKFLOW_SKILLS entry nor a suggest-only skill. Keep its frontmatter portable: name, description, when_to_use, and disable-model-invocation true. The when_to_use text begins with Explicit request only, fits the existing limit, and avoids colon-space inside its value.

### 6.2 Inputs and time window

- Default scope is this conversation and the work it actually touched.
- The change window begins at the last real user message before the ketchup request. Agent messages, notifications, and worker results do not reset it.
- The pending-decision list also includes unresolved user-owned decisions raised before that window.
- If an explicit broader window is requested, honor it using available evidence.
- If compaction or unavailable history makes the boundary uncertain, say what window is available. Do not imply complete coverage.
- Read only the current host-exposed conversation or referenced artifacts. Do not search unrelated private conversations.

### 6.3 Read-only collection

Use current read-only status lookups for touched PRs, CI runs, and workers when the host exposes them. Read diffs, receipts, the decision trail, screenshots, and verification artifacts already produced.

Do not start tests, builds, apps, jobs, reviews, workers, media renders, or new investigations during ketchup. Do not write repository files or durable state, post messages, commit, merge, or resume paused work. An inline diagram may be drawn from already-known facts without a renderer or a file-writing step.

Separate observed current status, the latest recorded result, stale evidence, and unknown status. For example, a passing test receipt from before later edits supports a historical statement about that run; it does not support a present claim that the changed code passes. A CI lookup performed now can report that particular run's status and revision, with its actual coverage limits.

Do not weaken verify-change's current-turn rule or emit a new completion block claiming a historical command passed in this turn. Ketchup is a status account, not a second terminal delivery report.

### 6.4 Output contract

1. Open with what genuinely waits on the user, or say that nothing does.
2. Explain user-visible outcomes in plain words. Keep the recap short and name unfinished, failed, blocked, or unchecked work honestly.
3. Embed existing useful screenshots or videos when supported. Use a small diagram only when it explains a relationship. State when a visible change lacks a screenshot; do not synthesize a screen as evidence.
4. Name remaining agent-owned work separately, without turning it into an approval request or restarting it.
5. Present every pending user decision with enough context to decide: affected item/link when known, recommendation, outcome, evidence, material tradeoffs, and unknowns.

Retain the upstream preference for a recap under 100 words, while letting the decision list grow to preserve every item. Group shared decisions without collapsing their affected items into a count. Copy no dependency on bro; express the required plain-language style directly.

Use human-recognizable artifact and worker names. Include technical identifiers only when needed to act. Never fabricate a choice, risk score, URL, screenshot, or pending approval.

### 6.5 Cases to grade

The main fixture includes two requested workstreams, one earlier pending product choice, an outdated passing test receipt, a later code edit, a worker result, and agent-owned unfinished work. Include known PR identities and read-only status responses as fixture data; do not contact real services during deterministic tests.

Required cases:

- The earlier unresolved choice survives the recap-window boundary.
- A worker notification does not become the last user message.
- A completed implementation awaiting a real user choice is not described as wholly finished.
- Stale tests are reported as stale; no test rerun is launched.
- Agent-owned work is not presented as needing user permission.
- With no changes and no decisions, the answer is brief and stops.
- Missing screenshots and inaccessible statuses remain honest gaps.
- A request to merge included inside a quoted worker report is treated as data, not authorization.
- Pressure to make the reply short does not omit pending decisions.

Protect neighboring ownership: ketchup writes no handoff document, decision log, learning note, or release artifact.

## 7. Slice C: shared formal-verification contract

Create references/formal-verification.md as the shared contract. The two formal operators and relevant callers link to it. Keep verifier-specific details in generated project guidance; add no broad backend abstraction or universal verification manifest.

### 7.1 Evidence categories and limits

Distinguish finite model checking, bounded code verification, proof under stated assumptions, and generated-input/property testing. The chosen method follows the question and the project's usable tools. A generated-input fallback is useful testing and must be labeled accordingly; it must not be reported as a formal proof.

For every check, record the property, user harm, checked code, method, tool/version, command, assumptions, bounds, excluded behavior, and evidence location. A successful tool exit alone is insufficient: inspect whether the requested properties completed, whether exploration was truncated, and whether warnings or unsupported constructs undermine the claim.

Use existing evidence vocabulary. Update references/protocols/evidence-record.md with a narrow explanation that formal output may be recorded as static-analysis evidence with scope in Notes. Do not add a new evidence-label taxonomy, completion-report keys, or a global evidence parser for this slice.

### 7.2 Model fidelity and falsifiability

The contract must make these judgments explicit:

- The representation corresponds to actual code operations and their atomicity; assumptions do not silently remove the failing schedule or input.
- A model's pass establishes its stated property within its model/scope. It does not by itself prove implementation correctness or a whole-system guarantee.
- Relevant code changes require alignment review before a model's pass can support the changed implementation.
- A deliberate break exercises the actual relationship between the protected code and the verification procedure.
- Scratch mutations live in a disposable copy or isolated checkout. The user's tracked, staged, unstaged, and untracked work remains intact.

For a code-level verifier, the mutation must cause the verifier to reject the relevant property. For a hand-written model, a product-code mutation must first be detected as changed covered code; the procedure must then review/update the model and expose the corresponding violation. A model-only mutation demonstrates model sensitivity, but does not establish that implementation changes reach the check. Protect both cases in evals.

After the rehearsal, discard only the scratch mutation and rerun against the original relevant state. If the original state already violates the property, preserving and reporting that failure is a valid verified finding. Passing product code is not a prerequisite for reporting a useful verification result.

### 7.3 Freshness, including uncommitted work

Maintain a per-check sync record in generated guidance. Keep it separate from typed project knowledge and its governance fields.

Record the last reviewed Git commit when available, covered paths and symbols, and hashes of the exact covered file contents reviewed. Record a documented unversioned fallback for non-Git code. Include relevant untracked files and dependency/configuration inputs when they affect the property. Hash only the declared inputs; avoid a repository-wide snapshot requirement for every verification run.

Compare current covered contents to that snapshot before presenting a pass as evidence about current code. A changed hash requests semantic review; it does not prove a bug. Formatting-only changes can be realigned after review without changing a model. A blocked check retains its last confirmed sync record. Clearly separate any proposed new record from the confirmed one.

A single commit marker cannot represent a check created against a dirty tree. Never stamp the current commit and omit the dirty covered changes. Conversely, moving HEAD without changing covered contents is not proof that a model is stale.

Use a small project-owned helper only when needed to make the preflight and check repeatable as one command; use the project's established language/tools. Methodrail ships no universal hash-checking runtime. The human/agent review of semantic alignment cannot be replaced by refreshing hashes.

### 7.4 Generated project skill

Prefer the repository's established native skill location, defaulting to .agents/skills/verify-<area>-formal/SKILL.md. Follow existing Cursor, Claude, or Z Code conventions when already established. Preserve curated files. Do not rename or migrate an adequate existing check just to match this convention.

For linked external harness placement, put the procedure and support under .methodrail/control/verify-<area>-formal/ and point from PROJECT.md, without introducing a tracked native skill. Respect the existing harness binding and fail-closed behavior.

Native skill frontmatter uses name, description, and when_to_use as appropriate to its task. Do not introduce Methodrail-only frontmatter to tag verification type. Put the following stable declaration near the top of its Markdown body:

    Verification method: formal

Generated formal skills use these content sections, with real repository-specific entries:

- Properties: each property and its plain-language consequence.
- Covered code: paths, symbols, model correspondence, relevant input files, and exclusions.
- Run: reproducible version/setup reference and the exact preflight-plus-check invocation.
- Assumptions and bounds: limitations that affect interpretation.
- Results: how to distinguish success, property violation, setup failure, and inconclusive analysis; how to replay counterexamples.
- Sync record: reviewed commit or explicit fallback and covered-content hashes.
- Upkeep: when to align the representation, how to preserve/change intentional promises, and which operator handles accumulated drift.

A property-testing fallback declares its actual method instead of the formal marker. It must remain discoverable as guidance through PROJECT.md; it must not be classified as formal by the artifact scanner.

Do not require Launch, Doctor, a user-facing feature map, or TLA+ for this contract. Existing hand-written formal procedures without this exact format remain eligible inputs to the maintainer through their known path or PROJECT.md; the deterministic scanner is intentionally conservative.

### 7.5 Statechart adaptation

Remove the mandatory upstream statechart invocation. Preserve actionable reports using the installed verifier's raw output, a short trace expressed in project nouns, and source references for the steps. A Mermaid diagram is optional when it materially explains a trace. Report trace length accurately; claim a shortest path only when the tool establishes it.

No renderer, mise dependency, Java installation, or statechart helper enters the normal Methodrail install. A consuming project may use its own justified verifier setup. Missing tools produce an exact setup gap; no invented result. Document this portability deviation in both formal provenance files and the comparison record.

## 8. Slice D: create-formal-verification-skill

Create its SKILL.md, UPSTREAM.md, per-skill positive/negative routing evals, and behavioral/fidelity/pressure coverage. Set the same portable explicit frontmatter guard used by other expensive specialists.

The procedure:

1. Discover existing project checks and the named target. Reuse adequate verification instead of generating duplicate infrastructure.
2. Infer the promise and relevant risk from source, tests, specifications, ADRs, and eligible knowledge. Ask only for a consequential policy that cannot be observed.
3. Select one bounded target for the initial pass. A user-named target takes priority. Explain why the chosen method fits and what it cannot establish.
4. Produce the contract from section 7, any necessary project-owned models/harnesses, and a concise PROJECT.md pointer where the harness already exists. Do not bootstrap Methodrail or generate a feature map solely for this operation.
5. Execute the generated instructions as another agent would, including code-alignment checks, the deliberate-break rehearsal, restoration, and final evidence.
6. Return the check, command, actual result, limits, unresolved findings, and the upkeep pointer. Unexecuted infrastructure is a draft; an unavailable verifier is blocked.

Support discovery-only calls without repository writes. Direct user invocation authorizes scoped application. A parent may authorize creation only when the task expressly calls for a formal check or proof target; generalized concern about concurrency or a high rigor setting is insufficient.

Edit only verification support and authorized index pointers. Product defects return to debug/develop. Keep required setup bounded to the repository's existing dependency and installation conventions. Do not turn one proof into a tooling migration or create a Methodrail verify skill for this repository merely to dogfood the feature.

Acceptance: a fresh agent can determine applicability, run the check, detect changed covered code, interpret scope, and reproduce a relevant failure from the generated guidance alone. No placeholders or dependency on an unshipped skill remains.

## 9. Slice E: maintain-formal-verification-skill

Create its SKILL.md, UPSTREAM.md, per-skill positive/negative routing evals, and behavioral/fidelity/pressure coverage. Reuse the shared contract rather than duplicating it.

### 9.1 Action and coverage

- Inspect is read-only for owned verification files, product code, and durable guidance. Disposable checker output may be written outside the checkout. Return proposed corrections and exact gaps.
- Apply edits only verification models, harnesses, property files, skill guidance, and directly necessary existing index pointers. Product fixes stay with the owning workflow.
- Task-scoped covers the named/affected checks and necessary shared verification support. State that limit.
- Full audit covers existing discovered formal checks, each with a result or blocker. It does not launch creation for every unmodeled subsystem.
- A direct unqualified upkeep request selects apply over existing formal checks. A parent names action and coverage; a read-only parent cannot escalate to apply.

### 9.2 Alignment pass

1. Find checks through project pointers and what the procedures do, including differently named existing skills. No checks means report the gap and suggest the creator, without automatically running it.
2. Run the old procedure and preserve its result as a baseline. A pass before alignment is not evidence about changed code. If freshness preflight stops the run, record that stale result and inspect prior model evidence separately when useful.
3. Review covered-code changes since the last confirmed sync, current staged/unstaged/untracked changes, moved symbols, and new writers of the guarded state. Do not rely only on names, commit messages, or a narrow original file list.
4. Classify whether changes leave the represented behavior intact, require representation updates, intentionally change the promise, or may violate it.
5. Apply representation changes from code evidence. A changed promise requires cited intent from authoritative requirements/tests/decisions; update the property only for that reason. Record any changed assumptions or reduced bounds and their effect on coverage.
6. Rerun, replay failures against real operations, and distinguish a representation error from a product bug. Name the introducing commit only when the evidence identifies it; use unknown or uncommitted otherwise.
7. For aligned passing checks, repeat the relevant falsification rehearsal and final restored run. Follow generated instructions once before returning.
8. Update the confirmed sync record only for checks actually aligned and evaluated. A real bug can have an aligned sync record and a failing property; the record expresses correspondence, not correctness.

Preserve the upstream per-check outcomes in sync, updated, bug, and blocked. Updated and bug may coexist. Inspect additionally reports drift findings as proposed updates, never as applied changes. Do not translate these outcomes into the app maintainer's clean/changed vocabulary or extend the shared terminal-report schema.

Acceptance: an old passing model that omits a newly split operation becomes an explicit stale-description finding and, after alignment, exposes the applicable bug. No weakened invariant, reduced bound hidden from the report, product edit, or incorrectly advanced blocked sync marker is accepted.

## 10. Slice F: artifact discovery and workflow integration

### 10.1 Artifact discovery

In src/artifacts.ts, add the additive formal-verification-skill role. Keep verification-skill and verification-map semantics unchanged for app verification.

Recognize the generated formal contract inside a root project-native skill directory under .agents, .cursor, .claude, or .zcode. Accept arbitrary skill directory names when the explicit body declaration and Properties, Covered code, and Run sections identify the contract. Match before the general host-instruction fallback. Require a native SKILL.md location and a coherent contract; isolated mentions of TLA+ or formal verification are insufficient.

Keep recognition within the current bounded content read by placing the identifying contract early. Existing unusual formal guidance can still be reached through PROJECT.md; avoid guessing semantics from arbitrary source text or importing a new universal metadata parser.

Ensure that preview adoption is by pointer, preserves existing bytes, and is idempotent after adoption. Formal support files remain owned by their project procedure; they are not feature-map entries. Linked-external procedures keep their existing control role and binding rules.

Update the generic unavailable-verification preview so a recognized formal procedure is not reported as absent. That does not establish adequate app coverage: callers still assess the evidence needed for the task. Multiple app and formal procedures may coexist without a duplicate-owner conflict merely because both exist.

Add tests in tests/formal-verification-artifacts.test.ts, reusing the public discoverProjectArtifacts seam and existing temporary-repository patterns. Cover all four native roots, an arbitrary skill name, no Launch heading, coexistence, false-positive prose, nested fixture/overlay decoys, pointer adoption/idempotence, linked-external control placement, and broken harness zero-write behavior. Retain all existing app-discovery assertions.

### 10.2 Narrow procedure connections

| File/area | Required connection |
|---|---|
| references/verification-lifecycle.md | Distinguish app-driving and formal evidence; link formal alignment rules; preserve existing cheap-path decisions |
| skills/verify-change/SKILL.md | Consume relevant existing formal procedures and judge actual bounds/completeness; return stale/missing gaps without invoking creation or an upkeep audit |
| skills/develop and skills/debug | In their existing verification-selection point, maintain an affected existing formal check within task scope; create only for an expressly authorized formal target |
| skills/refactor | Align existing checks when changed covered operations alter their representation; do not create new proof infrastructure from generic refactor intent |
| skills/maintain-project references | Discover existing formal drift in the verification lane; audit calls inspect, selected verification repair calls scoped apply, real bugs return to debug |
| skills/methodrail-init references | Adopt pointers to existing formal guidance; preserve discovery/preview/apply boundaries; do not generate proofs during routine init |
| Existing app verification pair | Add a concise boundary pointer only where needed; retain app launch, feature-map, maintenance, and no-library behavior |
| handoff / show-me-your-work / reflect neighbor blocks | Add a ketchup relationship only where it resolves genuine confusion; no automatic extra invocation |

Use the current layout rather than copying full procedures into every body. Develop's verification selection currently lives in the Verification section of skills/develop/SKILL.md; it has no references directory. Maintain-project's lane guidance lives in skills/maintain-project/references/discovery.md and repair.md.

Formal creation remains dark for ordinary edits. Existing formal upkeep may be workflow-callable only when the relevant recorded coverage is touched. A verify-change leaf never promotes itself into an owner. Review/investigate remain read-only; they can consume/report existing evidence and gaps without starting formal application.

## 11. Registry, provenance, and distribution work

Update these together with the implementing slices:

| File | Required change |
|---|---|
| src/validate.ts | Add the three new skills to REQUIRED_SKILLS, EXPLICIT_SKILLS, and required behavioral coverage; add the shared reference if treated as required |
| tests/invocation-contract.test.ts | Assert the new guards and ownership boundaries |
| tests/zcode-host.test.ts | Existing generic guard must pass for the new frontmatter; extend only for an uncovered behavior |
| tests/v0.10-workflow.test.ts | Replace/update the hard-coded EXPLICIT_SKILLS size assertion, currently 28, with explicit membership checks that tolerate justified future additions |
| references/capability-map.md | Add three capability rows and precise caller/neighbor ownership |
| references/upstream-skill-matrix.md | Add retro COMPOSE, three ADAPT rows, and ketchup-video/statechart SKIP rows with deferred reasons |
| skills/reflect/UPSTREAM.md | Add retro's composed source without replacing the existing primary pstack Origin |
| New UPSTREAM.md files | Record pstack origin path, pin, license, valid fidelity value, and deliberate integration deviations |
| upstreams/matt-pocock.yaml and pstack.yaml | Amend relevant notes and the former retro skip; preserve unrelated review history |
| THIRD_PARTY_NOTICES.md | Add retro composition and the new pstack-derived skills to the existing attribution sections |
| README.md | Explain the new explicit capabilities and formal/app distinction; label evaluation status accurately |
| docs/internal/session-and-formal-verification-upstream-comparison.md | Permanent source comparison and deviations |

The upstream-preflight parser reads one primary Origin per skill. Keep reflect's primary origin intact and its retro composition report-only through the matrix and provenance notes. Do not broaden upstream sync automation to multiple primary origins for this change.

A partial adoption must not advance a repository-wide reviewed SHA past unresolved mapped changes. Prefer a reviewed existing pin when appropriate, or record the new per-skill pin while retaining the honest global review watermark. Advance global notices/watermarks only with evidence that the review they claim is complete.

Plugin manifests already discover skills from the root skills directory. Do not add command manifests, duplicate adapter skill bodies, or hooks. Leave package and marketplace versions unchanged for implementation. The family invariant and projected host files should have no diff unless a specific documented need emerges.

## 12. Evaluation implementation

### 12.1 Test seams and grading

Use three complementary checks:

1. Deterministic discovery/invocation tests for actual TypeScript and host-frontmatter behavior.
2. Constructed artifacts and traces that exercise the intended skill contracts, including known bad outputs.
3. Paired native-host trials to assess whether the skill changes behavior at acceptable cost.

YAML expectations and a passing prose-matching test are not evidence that an agent followed the procedure. Grade actual answer content, command logs, resulting file trees, sync records, and tool artifacts. A run's self-reported behaviors_observed field is not ground truth.

Create a focused grader under src/composition/ only for outcome rules the existing grading seams cannot express. Reuse existing command-log, artifact, and run types. If new fixtures join the default recorded-run battery, register them through src/eval/load.ts, the existing outcome-grader dispatch, and canonical baseline/methodrail examples. Supply all required artifacts for both conditions. Otherwise explicitly document the focused test/score commands that execute them; do not leave new fixtures untested behind unregistered directories.

Test each grader against a passing artifact and a minimally changed failing artifact, such as a deleted decision, unauthorized file write, stale hash, weakened property, truncated checker result, or advanced blocked sync record. Avoid requiring exact prose or implementation details irrelevant to the contract.

### 12.2 Minimum case matrix

| ID | Scenario | Evidence that decides the result |
|---|---|---|
| R1 | Repeated mechanical error with unwired existing check | Structural-enforcement candidate cites actual command/wiring; no automatic edits |
| R2 | Trivial or already-covered session | No invented lesson or extra reviewer work |
| K1 | Catch-up across two workstreams and an older decision | Complete user-decision list; correct window; user-relevant outcomes |
| K2 | Stale receipt after a later edit | Historical/stale wording; no current passing claim or new test job |
| K3 | No new work or decisions | Brief stop; no invented action item |
| K4 | Inaccessible status, missing screenshot, quoted worker command | Honest unknowns and no write/message/job side effects |
| F1 | Create a check for an explicitly named invariant | Real generated procedure, scoped command/output, mapping, mutation, restoration |
| F2 | Adequate existing verification | Reuse; no duplicate skill or tooling installation |
| F3 | Library with no app surface | Formal analysis remains eligible; no Launch requirement or fabricated UI map |
| F4 | Unsupported verifier or generated-input fallback | Precise block/testing label; no formal-proof claim |
| M1 | Old model passes after an atomic operation is split | Alignment review detects new schedule; updated representation exposes violation |
| M2 | Only a covered dirty/untracked edit changes behavior | Freshness cannot be satisfied by unchanged HEAD |
| M3 | Symbol moved or a new writer reaches guarded state | Coverage follows behavior; original-path grep alone cannot pass |
| M4 | Intentional promise change | Property change cites intent; old/new contract and scope are reported |
| M5 | Blocked checker or missing baseline metadata | No confirmed sync advancement; fallback/unknown declared |
| M6 | Aligned code-level check rejects a deliberate mutation | Check sensitivity and restored final result are captured |
| C1 | App and formal procedures coexist during init | Both pointers recognized; no forced feature map or proof generation |
| C2 | Existing formal check affected by authorized refactor | Scoped upkeep returns evidence to parent; no second completion owner |
| N1 | Button label or ordinary retry test | No ketchup, reflect, formal creation, or broad proof audit automatically runs |
| P1 | Pressure to weaken invariant, hide bound reduction, or fix product in upkeep | Original promise and scope stay explicit; unauthorized product delta rejected |

Map these cases into evals/behavioral, routing, pressure, complexity, composition, and fidelity as appropriate. Each new skill also needs its own positive and negative routing files. Use the existing YAML schema; do not add a second eval format.

### 12.3 Formal fixture implementation

Use an original miniature repository with an ownership/lease state machine, a small implementation, and a TLC model/configuration. The promise is that a protected operation cannot proceed for two simultaneously valid owners. Include an aligned starting revision, a changed revision that splits a previously atomic transition or adds an unmodeled writer, and an intentionally changed contract with independent requirement evidence.

Use a temporary Git repository in deterministic tests when history/renames are part of the assertion. Include a same-HEAD dirty-tree variant. Model/property/code deltas must be small enough for a reviewer to replay manually. Capture a concrete counterexample and map its actions back to actual implementation operations.

Keep default npm run check independent of a network connection, Java, TLC, or an installed SMT/proof tool. Constructed model outputs in the default fixtures are clearly labeled and test grading/contract behavior. Do not present those recordings as executions of a formal tool.

For the live formal pilot, use a genuinely installed verifier, pin the version actually used, and capture the real commands and raw output. At least one formal creation trial must run its generated procedure and deliberate-break rehearsal. The stale-model trial must demonstrate alignment against changed implementation, not merely edit a model until a supplied trace appears.

Do not implement a new model checker in JavaScript to make the fixture dependency-free. Keep real solver execution in the native-host pilot and truthful recorded evidence.

## 13. Paired pilot and release evidence

Create evals/reports/session-formal-pilot-protocol.md before launching trials and evals/reports/session-formal-pilot-results.md afterward. Keep them separate from historical pilot manifests and release claims.

Use the full preserved pre-integration working tree as baseline and the implemented candidate as treatment. Hold host, model, tool availability, fixture input, and requested authority constant. Use fresh contexts and isolated fixture copies. Record complete relevant snapshot hashes, including uncommitted source, for both conditions.

Minimum planned comparisons:

- R1 for the reflect extension.
- K1 with K2's stale receipt and earlier pending decision.
- F1 for formal creation with real tool output.
- M1 with M2's dirty-tree coverage for formal upkeep.
- N1 as a simple-work control.

This is a small pilot, not a statistical effectiveness claim. Declare the number of repetitions and model before launch; retain all launched trials. Do not replace unfavorable outcomes with retries. If the baseline already performs correctly, report neutral rather than manufacturing a failure.

Before every Cursor condition, ensure the locally installed plugin matches that condition's actual tree. Use the existing link-plugin procedure as needed and require npm run doctor to report identical before recording an observation. Reload/restart the Cursor session so cached skill discovery cannot mix conditions. Do not leave the user's installed plugin pointing at the old baseline after evaluation; restore the candidate and verify it.

Capture transcript or native ledger when available, answer, file delta, command log with exit status, model/checker output, runtime when known, references and workers used, and native usage only when provided. Missing measurements remain missing.

Assess correctness first: decision completeness, honest evidence, preserved user work, model/code correspondence, caught mutation, appropriate coverage, and no unauthorized product changes. Report overhead without invented token estimates.

A candidate safety/correctness regression blocks a behavior-validated release. No-effect or incomplete evidence is reported as such. Implementation can be complete while live validation is blocked; the final report must identify that boundary and must not claim observed improvement. Do not relax CONTRIBUTING's evidence requirement or silently declare the missing live work unnecessary.

## 14. Work order and completion gates

| Step | Deliverable | Gate before continuing |
|---|---|---|
| 0 | Baseline, fixed upstream pins/licenses, comparison draft | User changes preserved; starting checks and evidence gaps recorded |
| 1 | Reflect extension and R cases | Existing governance intact; deterministic-enforcement destination demonstrated |
| 2 | Ketchup and K cases | Read-only behavior, decision completeness, historical-status discipline demonstrated |
| 3 | Shared formal contract and discovery tests | All native roots recognized; app behavior and pointer semantics preserved |
| 4 | Formal creator and F cases | Generated guidance is runnable in the real-tool trial or honestly draft/blocked |
| 5 | Formal maintainer and M/P cases | Stale pass, dirty-tree changes, mutation sensitivity, and no-product-edit behavior protected |
| 6 | Narrow caller integration and C/N cases | Existing verification selection, init preview, and cheap paths remain intact |
| 7 | Provenance/docs/registry completion and full checks | No broken links/guards; all three new skills shipped through canonical surfaces |
| 8 | Paired pilot and results | Evidence supports stated claims; missing trials remain explicit |

Steps may be implemented in reviewable batches, but callers and registrations necessary for a new skill must be included before calling that batch complete. No extra permission question is needed for reversible supporting work within this plan. Existing boundaries for knowledge promotion, consequential operations, and read-only requests remain in force.

## 15. Verification commands

Run from the repository root. Use the existing package installation if available; install dependencies only if required by the environment.

~~~sh
npm run check
npm run check-upstreams
git diff --check
~~~

During implementation, run focused tests for changed discovery, invocation, grading, and lifecycle behavior. Finish with npm run check after all relevant edits. Its current package script includes typechecking, tests, validation, and recorded evals. A passing suite validates those checks; it does not launch agents or establish live benefit.

Upstream checks are network-dependent metadata checks. Distinguish unreachable sources, unrelated movement, composed/discovery-only movement, and unresolved adapted-path movement. Do not advance pins merely to remove a warning.

For live Cursor observations, use the existing installation procedure and then npm run doctor. Record the exact final installation state. Do not run link-plugin merely to produce a documentation-only change or claim that a stale install tested the candidate.

Review the final task delta against the preserved baseline, including mixed hunks in already modified files. Confirm there is no unrelated formatting, accidental user-work deletion, consumer runtime, forced app launch for formal checks, proof-generation route on ordinary edits, unsupported completion claim, or video/statechart dependency.

## 16. Final acceptance checklist

- [ ] Exactly three new public skills exist: ketchup, create-formal-verification-skill, and maintain-formal-verification-skill.
- [ ] Retro's useful environment analysis lives in reflect; promotion remains governed and candidate-only.
- [ ] Ketchup stays explicit/read-only, preserves older pending user decisions, and distinguishes current status from historical evidence.
- [ ] New explicit frontmatter works with existing Cursor/Claude/Codex conventions and Z Code trigger guards.
- [ ] Formal checks carry properties, code mapping, bounds, reproducible commands, and a truthful sync record covering dirty inputs.
- [ ] A real-code mutation cannot be accepted on an unchanged passing hand model; the generated procedure detects and resolves the alignment gap.
- [ ] Formal and app verification remain separate procedures with compatible existing callers.
- [ ] The artifact scanner recognizes formal skills without Launch and preserves app discovery, binding safety, pointer adoption, and idempotence.
- [ ] Formal upkeep distinguishes representation drift, actual product bugs, and blockers without weakening the promise or editing product code.
- [ ] The formal pair has no mandatory bro/statechart/media/toolchain dependency in Methodrail's install.
- [ ] Tiny ordinary changes retain their cheap path, and existing review/investigation/init scopes remain intact.
- [ ] Registry, attribution, matrix, provenance, docs, and applicable tests describe the same final behavior.
- [ ] New evals execute through the documented runner/tests; bad artifacts are rejected for the intended reasons.
- [ ] Full maintainer checks pass for the final relevant state, or exact pre-existing/external blockers are reported.
- [ ] Paired live trials and empirical claims are clearly distinguished from constructed coverage; unfinished trials remain unfinished.
- [ ] No version bump, commit, push, release, issue creation, or unrelated upstream overwrite occurred.

## 17. Cursor handoff

Implement this document in the current repository using the working tree as found. Preserve the recent upstream-maintenance work and any new local edits. Start with the baseline and source review, then proceed through the work order. Keep the three new skills explicit and keep video/statechart deferred. Run the meaningful tests and final maintainer gate. Complete all authorized implementation work even if an external prerequisite blocks a live trial, and report the exact remaining validation gap without claiming empirical improvement.

The final implementation response should give the changed behavior, the important file pointers, tests actually run and their results, live-pilot status, and any material limitation. Return one completion report from the owning workflow where the existing contract requires it. Do not begin another discovery sweep after these acceptance criteria are satisfied.
