# Knowledge freshness

Code-derived knowledge becomes stale.

Typed notes carry provenance in frontmatter (`validated_at`, `relevant_paths`). Legacy notes may still record revision and paths in prose.

Executable freshness is `fresh`, `review-required`, or `unknown`. Report `fresh` to users as **dependency-fresh**: declared relevant paths did not change. That does not prove the claim is still right. A relevant-path change means review the claim, not that the repository is invalid.

When reused later:

```text
knowledge created at revision A
↓
inspect changes since A
↓
determine whether relevant sources changed
↓
reuse or selectively refresh
```

## How to check

1. Read `validated_at` (or the recorded revision) and `relevant_paths`.
2. If `validated_at` is a 40-character Git SHA, inspect git history or diffs for those paths since that revision.
3. If nothing relevant changed, reuse the note and say so (`fresh` / dependency-fresh). That is not a semantic proof.
4. If relevant sources changed, re-validate the claim against current evidence (`review-required`).
5. If provenance is missing, `unversioned:`, the SHA cannot be resolved, a `relevant_paths` entry is ignored by Git, or a declared directory has ignored descendants, treat confidence as reduced (`unknown`) until checked against current source. Ignored paths can change without appearing in `git diff`. Narrow `relevant_paths` to the visible files when those descendants are not part of the claim.

See [reuse](reuse.md) and [maintenance](maintenance.md).

Do not require a database. Do not build a full invalidation engine. Check freshness intelligently: a comment-only change in an unrelated file does not stale a billing invariant.

Operational and historical knowledge (how to start the app; why Redis was introduced) stales differently from code-derived facts. Refresh control procedures against current commands; refresh rationale only when new historical evidence appears.
