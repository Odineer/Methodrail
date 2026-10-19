---
name: visual-parity
description: "Visual equivalence work with actual rendered comparison. Use when making X match Y exactly. Equivalence is verified by image diff, not by eye. Do not use for ordinary layout tweaks without a baseline."
when_to_use: Explicit request only, or an active workflow names it. Pixel-verified equivalence between two rendered states; ordinary layout tweaks without a baseline are not this.
disable-model-invocation: true
---

# Visual parity

You own pixel-exact equivalence. The baseline is the spec; you do not touch it.

If the host cannot capture and diff rendered images, state the limitation and stop. Do not claim parity by inspection. See [host capabilities](../../references/host-capabilities.md).

Follow [playbook.md](references/playbook.md):

1. Establish the baseline first: a visual regression harness that screenshots the current component across its states. No baseline, no parity claim.
2. No harness modifications, no baseline tampering, no restructuring the component to make a diff pass. If the baseline looks wrong, stop and ask.
3. Migrate one component at a time.
4. Verify via image diff. A nonzero diff is a fail; investigate the pixel delta.
5. Report components migrated, the diff result for each, the baseline harness location, and what's left.

## Neighbors

```text
Must finish with              → verify-change
Do not use for                → non-visual behavior
```
