# Task packet

A conceptual context package for:

- subagents
- isolated investigation
- implementation delegation
- architecture candidates
- prototypes

Give a child agent the minimum sufficient context, not the entire parent conversation.

## Suggested contents

```text
Task/question
Scope
Acceptance criteria, by reference when a spec exists
Known facts
Relevant project knowledge
Constraints
Available evidence
Expected output
Existing verification pointer, scenario, and expected result
```

Do not build runtime packet classes. Write the packet as short markdown, a prompt preamble, or a handoff note.

Include pointers (paths, revisions, commands) rather than pasting large source dumps. Put fog questions in a "do not answer yet" list so the child does not spend budget there.
