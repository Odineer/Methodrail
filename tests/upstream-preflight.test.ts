import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { run } from "../scripts/check-upstreams.mjs";
import {
  buildPreflight,
  classifyChangedPaths,
  describeRelevance,
  loadMatrixRows,
  loadSkillOrigins,
  originBelongsToRecord,
  parseCliArgs,
  parseMatrix,
  parseOrigin,
  parseSkillOrigin,
  recordAliases,
} from "../scripts/upstream-preflight.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const mattRecord = {
  stem: "matt-pocock",
  name: "mattpocock/skills",
  repository: "https://github.com/mattpocock/skills",
  imported: "aaa111",
  path: "",
};

const pstackRecord = {
  stem: "pstack",
  name: "pstack",
  repository: "https://github.com/cursor/plugins",
  imported: "bbb222",
  path: "pstack/",
};

const superpowersRecord = {
  stem: "superpowers",
  name: "superpowers",
  repository: "https://github.com/obra/superpowers",
  imported: "ccc333",
  path: "",
};

const matrixSource = `
| Skill | Purpose | Decision | Canonical Methodrail capability | Reason | Host requirements |
|---|---|---|---|---|---|
| tdd | Red-green | ADAPT | \`tdd\` | seams | portable |
| ask-matt | Router | SKIP | Methodrail workflows | Competing control plane | — |
| grilling | Interview | COMPOSE | inside \`grill-with-docs\` | Avoid a second interview skill | portable |
| wizard | Helper | SKIP | — | Not core | runtime-tool |
`;

function skillOrigin(name: string, source: string) {
  const parsed = parseSkillOrigin(name, source);
  assert.ok(parsed);
  return parsed;
}

test("parseOrigin splits source and path on space-slash-space", () => {
  assert.deepEqual(parseOrigin("Origin: mattpocock/skills / skills/engineering/tdd"), {
    source: "mattpocock/skills",
    originPath: "skills/engineering/tdd",
  });
  assert.deepEqual(parseOrigin("Origin: pstack / poteto-mode/playbooks/visual-parity.md"), {
    source: "pstack",
    originPath: "poteto-mode/playbooks/visual-parity.md",
  });
  assert.equal(parseOrigin("Fidelity: methodrail-composed"), null);
});

test("record aliases include stem, yaml name, and GitHub slug", () => {
  assert.deepEqual(recordAliases(mattRecord).sort(), ["matt-pocock", "mattpocock/skills"]);
  assert.ok(recordAliases(superpowersRecord).includes("obra/superpowers"));
});

test("originBelongsToRecord matches yaml name and GitHub slug, not other upstreams", () => {
  assert.equal(originBelongsToRecord("mattpocock/skills", mattRecord), true);
  assert.equal(originBelongsToRecord("obra/superpowers", superpowersRecord), true);
  assert.equal(originBelongsToRecord("pstack", pstackRecord), true);
  assert.equal(originBelongsToRecord("pstack", mattRecord), false);
  assert.equal(originBelongsToRecord("mattpocock/skills", superpowersRecord), false);
});

test("classifyChangedPaths maps origin-owned files, discovers SKIP/COMPOSE/unlisted, and leaves noise unmapped", () => {
  const skills = [
    skillOrigin("tdd", "Origin: mattpocock/skills / skills/engineering/tdd\nUpstream revision: abcdef0\n"),
    skillOrigin("how", "Origin: pstack / how\nUpstream revision: 1111111\n"),
  ];
  const result = classifyChangedPaths({
    changedPaths: [
      "skills/engineering/tdd/SKILL.md",
      "skills/engineering/tdd/references/tests.md",
      "skills/ask-matt/SKILL.md",
      "skills/engineering/grilling/SKILL.md",
      "skills/brand-new/SKILL.md",
      "README.md",
      "LICENSE",
    ],
    skills,
    record: mattRecord,
    matrixRows: parseMatrix(matrixSource),
  });

  assert.deepEqual(result.mapped, [
    {
      methodrail_skill: "tdd",
      origin_path: "skills/engineering/tdd",
      decision: "ADAPT",
      upstream_sha_recorded: "abcdef0",
      changed_paths: [
        "skills/engineering/tdd/SKILL.md",
        "skills/engineering/tdd/references/tests.md",
      ],
      action_hint: "review",
    },
  ]);
  assert.deepEqual(
    result.discoveries.map((row) => ({
      upstream_path: row.upstream_path,
      matrix_decision: row.matrix_decision,
    })),
    [
      { upstream_path: "skills/ask-matt/SKILL.md", matrix_decision: "SKIP" },
      { upstream_path: "skills/engineering/grilling/SKILL.md", matrix_decision: "COMPOSE" },
      { upstream_path: "skills/brand-new/SKILL.md", matrix_decision: "unlisted" },
    ],
  );
  assert.deepEqual(result.unmapped_changes, ["README.md", "LICENSE"]);
});

test("pstack repo path prefix maps Origin how to pstack/how", () => {
  const result = classifyChangedPaths({
    changedPaths: ["pstack/how/SKILL.md", "pstack/LICENSE"],
    skills: [skillOrigin("how", "Origin: pstack / how\nUpstream revision: 4612556\n")],
    record: pstackRecord,
    matrixRows: parseMatrix("| Skill | Decision |\n| how | ADAPT |\n"),
  });
  assert.equal(result.mapped[0]?.methodrail_skill, "how");
  assert.deepEqual(result.mapped[0]?.changed_paths, ["pstack/how/SKILL.md"]);
  assert.deepEqual(result.unmapped_changes, ["pstack/LICENSE"]);
});

test("pstack skills/ layout maps Origin how and playbook files", () => {
  const result = classifyChangedPaths({
    changedPaths: [
      "pstack/skills/how/SKILL.md",
      "pstack/skills/architect/SKILL.md",
      "pstack/skills/poteto-mode/playbooks/visual-parity.md",
      "pstack/LICENSE",
    ],
    skills: [
      skillOrigin("how", "Origin: pstack / how\nUpstream revision: 4612556\n"),
      skillOrigin(
        "visual-parity",
        "Origin: pstack / poteto-mode/playbooks/visual-parity.md\nUpstream revision: 4612556\n",
      ),
    ],
    record: pstackRecord,
    matrixRows: parseMatrix("| Skill | Decision |\n| how | ADAPT |\n| visual-parity playbook | ADAPT |\n"),
  });
  const names = result.mapped.map((row) => row.methodrail_skill).sort();
  assert.deepEqual(names, ["how", "visual-parity"]);
  assert.deepEqual(result.mapped.find((row) => row.methodrail_skill === "how")?.changed_paths, [
    "pstack/skills/how/SKILL.md",
  ]);
  assert.deepEqual(result.unmapped_changes, ["pstack/LICENSE"]);
});

test("buildPreflight does not invent path lists when current or unreachable", () => {
  const current = buildPreflight({
    record: mattRecord,
    head: "aaa111",
    changedPaths: ["skills/engineering/tdd/SKILL.md"],
    skills: [],
    matrixRows: [],
  });
  assert.equal(current.status, "current");
  assert.deepEqual(current.mapped, []);
  assert.equal(current.head, "aaa111");

  const unreachable = buildPreflight({
    record: mattRecord,
    head: "",
    changedPaths: ["skills/engineering/tdd/SKILL.md"],
    skills: [],
    matrixRows: [],
  });
  assert.equal(unreachable.status, "unreachable");
  assert.equal(unreachable.head, null);
  assert.deepEqual(unreachable.mapped, []);
});

test("buildPreflight emits the named upstream payload when changed", () => {
  const payload = buildPreflight({
    record: mattRecord,
    head: "zzz999",
    changedPaths: ["skills/engineering/tdd/SKILL.md", "README.md"],
    skills: [
      skillOrigin("tdd", "Origin: mattpocock/skills / skills/engineering/tdd\nUpstream revision: abcdef0\n"),
    ],
    matrixRows: parseMatrix(matrixSource),
  });
  assert.equal(payload.upstream, "matt-pocock");
  assert.equal(payload.repository, mattRecord.repository);
  assert.equal(payload.imported, "aaa111");
  assert.equal(payload.head, "zzz999");
  assert.equal(payload.status, "changed");
  assert.equal(payload.mapped[0]?.methodrail_skill, "tdd");
  assert.deepEqual(payload.unmapped_changes, ["README.md"]);
  assert.equal(payload.relevance, "mapped");
});

test("buildPreflight scopes relevance to adapted paths", () => {
  const tdd = skillOrigin("tdd", "Origin: mattpocock/skills / skills/engineering/tdd\nUpstream revision: abcdef0\n");
  const unrelated = buildPreflight({
    record: mattRecord,
    head: "zzz999",
    changedPaths: ["README.md", "docs/blog/post.md"],
    skills: [tdd],
    matrixRows: parseMatrix(matrixSource),
  });
  assert.equal(unrelated.status, "changed");
  assert.equal(unrelated.relevance, "unrelated");
  assert.match(describeRelevance(unrelated), /^unrelated \(2 path/);

  const discoveries = buildPreflight({
    record: mattRecord,
    head: "zzz999",
    changedPaths: ["skills/brand-new/SKILL.md"],
    skills: [tdd],
    matrixRows: parseMatrix(matrixSource),
  });
  assert.equal(discoveries.relevance, "discoveries-only");
  assert.match(describeRelevance(discoveries), /^discoveries-only \(1 upstream/);

  const mapped = buildPreflight({
    record: mattRecord,
    head: "zzz999",
    changedPaths: ["skills/engineering/tdd/SKILL.md"],
    skills: [tdd],
    matrixRows: parseMatrix(matrixSource),
  });
  assert.equal(describeRelevance(mapped), "mapped (tdd)");

  const current = buildPreflight({ record: mattRecord, head: "aaa111", changedPaths: [], skills: [tdd], matrixRows: [] });
  assert.equal(current.relevance, undefined);
  assert.equal(describeRelevance(current), "");

  const failed = buildPreflight({
    record: mattRecord,
    head: "zzz999",
    changedPaths: [],
    skills: [tdd],
    matrixRows: [],
    diffError: "could not list changed paths",
  });
  assert.equal(failed.relevance, undefined);
  assert.match(describeRelevance(failed), /^diff unavailable/);
});

test("text mode reports relevance per upstream without touching git when injected", () => {
  const logs: string[] = [];
  const original = console.log;
  console.log = (line) => logs.push(String(line));
  try {
    run([], {
      loadRecords: () => [mattRecord, pstackRecord],
      loadSkillOrigins: () => [
        skillOrigin("tdd", "Origin: mattpocock/skills / skills/engineering/tdd\nUpstream revision: abcdef0\n"),
        skillOrigin("how", "Origin: pstack / how\nUpstream revision: 1111111\n"),
      ],
      loadMatrixRows: () => parseMatrix(matrixSource),
      gitLsRemote: () => "zzz999",
      listChangedPaths: (repository) =>
        repository === pstackRecord.repository ? ["pstack/skills/how/SKILL.md"] : ["README.md"],
    });
  } finally {
    console.log = original;
  }
  const text = logs.join("\n");
  assert.match(text, /mattpocock\/skills:\n(?:.*\n){2}  status: changed\n  relevance: unrelated \(1 path/);
  assert.match(text, /pstack:\n(?:.*\n){2}  status: changed\n  relevance: mapped \(how\)/);
});

test("parseCliArgs requires --upstream with json format and defaults to text", () => {
  assert.deepEqual(parseCliArgs([]), { format: "text", upstream: null });
  assert.deepEqual(parseCliArgs(["--upstream", "matt-pocock", "--format", "json"]), {
    format: "json",
    upstream: "matt-pocock",
  });
  assert.throws(() => parseCliArgs(["--format", "json"]), /--upstream/);
  assert.throws(() => parseCliArgs(["--format", "xml"]), /format/);
});

test("real Methodrail UPSTREAM.md origins map synthetic matt-pocock paths", () => {
  const skills = loadSkillOrigins(root);
  const matrixRows = loadMatrixRows(root);
  const result = classifyChangedPaths({
    changedPaths: [
      "skills/engineering/tdd/SKILL.md",
      "skills/productivity/writing-for-agents/SKILL.md",
      "skills/ask-matt/SKILL.md",
      "docs/README.md",
    ],
    skills,
    record: {
      ...mattRecord,
      imported: "6654f6b60cd9d5be8b54c6fafe44346dabeb3b76",
    },
    matrixRows,
  });
  const names = result.mapped.map((row) => row.methodrail_skill).sort();
  assert.ok(names.includes("tdd"), names.join(","));
  assert.ok(names.includes("writing-for-agents"), names.join(","));
  assert.equal(
    result.discoveries.some((row) => row.matrix_decision === "SKIP" && row.upstream_path.includes("ask-matt")),
    true,
  );
  assert.deepEqual(result.unmapped_changes, ["docs/README.md"]);
});

test("json CLI requires --upstream and run() prints mapped preflight without touching git when injected", () => {
  const missing = spawnSync(process.execPath, ["scripts/check-upstreams.mjs", "--format", "json"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /--upstream/);

  const logs: string[] = [];
  const original = console.log;
  console.log = (line) => logs.push(String(line));
  try {
    run(["--upstream", "matt-pocock", "--format", "json"], {
      loadRecords: () => [mattRecord],
      loadSkillOrigins: () => [
        skillOrigin(
          "tdd",
          "Origin: mattpocock/skills / skills/engineering/tdd\nUpstream revision: abcdef0\n",
        ),
      ],
      loadMatrixRows: () => parseMatrix(matrixSource),
      gitLsRemote: () => "zzz999",
      listChangedPaths: () => ["skills/engineering/tdd/SKILL.md", "README.md"],
    });
  } finally {
    console.log = original;
  }
  const payload = JSON.parse(logs.join("\n"));
  assert.equal(payload.status, "changed");
  assert.equal(payload.mapped[0]?.methodrail_skill, "tdd");
  assert.deepEqual(payload.unmapped_changes, ["README.md"]);
});

test("sync-upstream lives outside the plugin skill tree", () => {
  const plugin = JSON.parse(readFileSync(join(root, ".cursor-plugin/plugin.json"), "utf8"));
  assert.equal(plugin.skills, "./skills/");
  assert.equal(existsSync(join(root, "maintainer/skills/sync-upstream/SKILL.md")), true);
  assert.equal(existsSync(join(root, "skills/sync-upstream/SKILL.md")), false);
});
