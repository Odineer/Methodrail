Origin: pstack / reflect
Import mode: adapted
Fidelity: upstream-preserved-with-extensions
Upstream revision: c742dd61706fbacc1b95f1a20b7b988cf096ce6c
License: MIT (Copyright (c) 2026 Lauren Tan)

Methodrail changes:
- Environment and structural-enforcement candidates are exempt from the skill-invocation filter when session and repository evidence support them; an unwired check need not have run.
- outputs are knowledge / skill / structural-enforcement candidates, not automatic permanent rules
- do not auto-apply edits to Methodrail or org skills
- Cursor create-skill / tracker filing isolated
- skip trivial sessions
- 2026-09-29: reviewers list each durable learning instead of a 3-5 cap. Cursor model roles centralized in references/host-capabilities.md as of 4b4d98e.
- 2026-10-27: when several transcripts exist, take the file whose first record matches this conversation's opening user text; otherwise use durable artifacts. Skipped model slugs, poteto-mode speed text, and copy-to-~/.cursor/skills.

Composed source: mattpocock/skills / skills/engineering/retro/SKILL.md
Composed revision: 59db609eb1e18aaf59b63284d0e52255aff0c63c
Composed license: MIT (Copyright (c) 2026 Matt Pocock)
Composition: environment analysis for an evidenced mistake (navigation, unwired or broken checks, mechanical standards, instruction load, tool access) inside the existing tooling lens. Not a second public skill. Primary Origin remains pstack reflect. The upstream-preflight parser reads only the first Origin line.
