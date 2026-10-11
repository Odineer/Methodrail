---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview until the qualifying decisions are shared. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Filter questions through the [human-decision rule](../../../references/decision-frontier.md#consequential-assumptions). A question enters a round only when human judgment is necessary and the answer would change the build. Find facts yourself. Do not ask the user to resolve a technical approach, a supported seam, or a convention.

Work the tree in **rounds**. The **frontier** is every qualifying decision whose prerequisites are already settled. Ask that frontier in one round: number each question, state the alternatives and what each would build, and give your recommended answer. Then wait. A dependent question waits for a later round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when no qualifying decision remains. Report the understanding. A standalone interview ends with that synthesis and does not implement. When the caller already authorized the work, return the understanding and do not ask for a second approval of the same decisions.
