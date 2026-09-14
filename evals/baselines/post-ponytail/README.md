# Reproducible post-Ponytail baseline

Reconstruct the baseline into a new directory from the immutable commit and patch:

```bash
python3 evals/baselines/post-ponytail/reconstruct.py /tmp/methodrail-post-ponytail-baseline
```

The destination must not exist. The script exports the base commit, applies the patch, and verifies every recorded skill/reference hash plus all ten historical pre-edit hashes in `docs/internal/karpathy-upstream-comparison.md`. No working-tree files are used as baseline input.

`manifest.json` pins the base commit and complete `skills/` and `references/` file inventory. `reconstruct.patch` reverses the Karpathy changes in the nine recorded methodology files; the tenth historical file (`src/eval/grade-outcome.ts`) already matches the base commit. Other files are inherited from that commit, including evaluation and release metadata; this is a reconstructed methodology baseline, not a claim to reproduce the entire historical working tree.

This baseline preserves the original pre-Karpathy behavior, including the verification ordering subsequently corrected in the treatment. Do not apply current fixes to the historical baseline.

The earlier Cursor pilot has conflicting saved and recovered input hashes, documented in [karpathy-pilot-capture](../karpathy-pilot-capture/README.md). Do not retroactively attribute those runs to this baseline.
