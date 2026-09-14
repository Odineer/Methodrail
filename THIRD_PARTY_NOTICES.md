# Third-party notices

Methodrail includes adapted copies of third-party Agent Skills. This file preserves the copyright and license notices required by those projects. Skill-level provenance lives in each skill's `UPSTREAM.md`. Upstream metadata lives in `upstreams/`.

Methodrail itself is licensed under the MIT License. See `LICENSE`.

---

## mattpocock/skills

- Repository: https://github.com/mattpocock/skills
- Reviewed commit: `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`
- License: MIT

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Adopted or derived skills include `domain-modeling`, `diagnosing-bugs`, `tdd`, `code-review`, `grill-with-docs`, `wayfinder`, `codebase-design`, `improve-codebase-architecture`, `prototype`, `research`, `to-spec`, `to-tickets`, `writing-for-agents`, and `handoff`. `writing-for-agents` subsumes the earlier `writing-great-skills` concept.

---

## pstack (cursor/plugins)

- Repository: https://github.com/cursor/plugins
- Path: `pstack/`
- Reviewed commit: `46125561306434d8a1d7745d540d8932ab0cd2a2`
- License: MIT

```
MIT License

Copyright (c) 2026 Lauren Tan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Adopted or derived skills include `how`, `why`, `blast-radius`, `architect`, `arena`, `swarm`, `interrogate`, `create-verification-skill`, `maintain-verification-skill`, `show-me-your-work`, `reflect`, `runtime-forensics`, `trace-forensics`, `performance`, `hillclimb`, and `visual-parity`.

---

## obra/superpowers

- Repository: https://github.com/obra/superpowers
- Reviewed commit: `b36e0829c6d0140e93cfef2ca599b1b07d4a7797`
- License: MIT

```
MIT License

Copyright (c) 2025 Jesse Vincent

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`verify-change` is derived from `verification-before-completion`. Selected systematic-debugging techniques (`root-cause-tracing`, `defense-in-depth`, `condition-based-waiting`) and TDD pressure material are composed into `diagnosing-bugs` and `tdd`; those Superpowers skills are not shipped as Methodrail public skills.

---

## DietrichGebert/ponytail

- Repository: https://github.com/DietrichGebert/ponytail
- Reviewed commit: `356918eba965ee1eac64bd3a7f0dd02108350de5`
- License: MIT

```
MIT License

Copyright (c) 2026 DietrichGebert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`ponytail`, `ponytail-review`, and `ponytail-audit` are composed into existing Methodrail skills through `references/simplicity.md`. They are not shipped as public Methodrail skills. Intensity modes, hooks, `ponytail:` markers, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, Caveman, and Graphify are not imported.

---

## multica-ai/andrej-karpathy-skills

- Repository: https://github.com/multica-ai/andrej-karpathy-skills
- Reviewed commit: `2c606141936f1eeef17fa3043a72095b4765b9c2`
- Declared license: MIT, in skill frontmatter, `.claude-plugin/plugin.json`, and README
- Standalone LICENSE file: not present in the inspected tree
- Copyright holder / year: not present in the inspected tree
- Plugin author metadata: `forrestchang`

This is a community interpretation of Karpathy's observations, not code authored by Andrej Karpathy. Methodrail composes original wording for change-created cleanup, hunk-to-task scope, and consequential-assumption handling into existing skills. Host installation surfaces (`CLAUDE.md`, `CURSOR.md`, the always-on Cursor rule, plugin/router) are not imported. No public `karpathy-guidelines` skill is shipped.
