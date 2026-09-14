Origin: pstack / how
Import mode: adapted
Upstream revision: 5bf2b1544db739998121a306340631963c2ff3de
License: MIT (Copyright (c) 2026 Lauren Tan)

Methodrail changes:
- project knowledge lookup and freshness check before expensive exploration
- host-specific model slugs isolated; subagents optional
- Methodrail inference/unknown labeling
- public skill restored to require entrypoint, data/control/state flow, boundaries, structured explorer output, and non-default critique
- added Methodrail behavioral evals
- 2026-09-13: took explainer/explorer prompt wording from upstream; kept model-invoked discovery and critique (upstream deleted critique and added disable-model-invocation)

Fidelity: upstream-preserved-with-extensions
