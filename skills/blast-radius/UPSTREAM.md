Origin: pstack / blast-radius
Import mode: adapted
Fidelity: upstream-preserved-with-extensions
Upstream revision: 5bf2b1544db739998121a306340631963c2ff3de
License: MIT (Copyright (c) 2026 Lauren Tan)

Methodrail changes:
- model-invoked so Methodrail workflows can compose it (pstack ships it explicit under poteto-mode)
- removed unslop dependency
- Methodrail evidence labeling; arena optional when the parent may edit and the host supports competing candidates
- read-only parent uses existing checks or temp probes; no repository writes
- added Methodrail behavioral evals
- 2026-09-13: aligned risk wording with upstream (risky / say so / Don't overstate); kept read-only vs write-parent proof split
