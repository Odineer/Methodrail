// Invocation choice for shipped skills. Hosts that enforce
// `disable-model-invocation` read it from frontmatter; hosts that ignore it get
// the same guard from `when_to_use` or from a projected host rule.

export const SUGGEST_ONLY_SKILLS = ["interrogate"] as const;

export const EXPLICIT_SKILLS = new Set([
  "methodrail-init",
  "investigate",
  "develop",
  "debug",
  "simplify",
  "methodrail-review",
  "prototype",
  "grill-with-docs",
  "wayfinder",
  "architect",
  "improve-codebase-architecture",
  "interrogate",
  "arena",
  "swarm",
  "to-spec",
  "to-tickets",
  "runtime-forensics",
  "trace-forensics",
  "performance",
  "hillclimb",
  "visual-parity",
  "create-verification-skill",
  "maintain-verification-skill",
  "create-formal-verification-skill",
  "maintain-formal-verification-skill",
  "ketchup",
  "show-me-your-work",
  "reflect",
  "handoff",
  "refresh-model-routing",
  "maintain-project",
]);
