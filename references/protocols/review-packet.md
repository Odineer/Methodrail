# Review packet

A reviewer should receive relevant context directly rather than spend expensive model turns rediscovering deterministic facts.

The `review` and `interrogate` skills should use this principle.

## Suggested contents

```text
Original request
Acceptance criteria
Task-owned delta, distinguished from pre-existing user work
Base revision and worktree state
Relevant diff (committed range plus applicable staged, unstaged, and untracked work)
Applicable standards
Verification evidence, labeled as fresh or supplied
Known deviations
Review depth selected from rigor
```

The parent supplies this packet for a composed review. Capture enough initial worktree information to separate the agent's changes from pre-existing user work. Inspect surrounding context. Do not treat unrelated edits as permission to change them.

Assemble the packet from artifacts that already exist. A composed reviewer does not ask the user for a base or spec the packet already contains. Standalone review resolves its range and intent from the request and repository before seeking missing human input.

If verification evidence is missing, say so in the packet. Supplied evidence can inform the review. It does not become a claim that the reviewer ran it. Review cannot substitute for `verify-change`.
