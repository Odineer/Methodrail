// Turn one run-claude-code.sh destination into committed artifacts and a draft run JSON.
//
// usage: node collect-claude-code-run.mjs <dest> <fixture-id> <baseline|methodrail> <label>
//
// Everything derivable from the stream-json transcript is filled in. evidence,
// behaviors_observed, and failure_modes are operator judgment: they start empty
// and must be written after reading the transcript.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [dest, fixture, condition, label] = process.argv.slice(2);
if (!dest || !fixture || !condition || !label) {
  console.error("usage: collect-claude-code-run.mjs <dest> <fixture-id> <baseline|methodrail> <label>");
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const destAbs = resolve(dest);
const work = join(destAbs, "work");
const runDir = join(destAbs, "run");
const read = (name) => readFileSync(join(runDir, name), "utf8").trim();

const events = read("TRANSCRIPT.jsonl")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const init = events.find((e) => e.type === "system" && e.subtype === "init");
const result = events.find((e) => e.type === "result");
const hook = events.find((e) => e.type === "system" && e.subtype === "hook_response" && e.hook_event === "SessionStart");

const toolUses = [];
const toolResults = new Map();
for (const event of events) {
  const content = event.message?.content;
  if (!Array.isArray(content)) continue;
  for (const block of content) {
    if (event.type === "assistant" && block.type === "tool_use") toolUses.push(block);
    if (event.type === "user" && block.type === "tool_result") toolResults.set(block.tool_use_id, block);
  }
}

function resultText(block) {
  if (!block) return "";
  if (typeof block.content === "string") return block.content;
  if (Array.isArray(block.content)) return block.content.map((part) => part.text ?? "").join("");
  return "";
}

function exitStatus(block) {
  if (!block) return null;
  const match = resultText(block).match(/^Exit code (\d+)/);
  if (match) return Number(match[1]);
  return block.is_error ? 1 : 0;
}

function stripNamespace(name) {
  return name.replace(/^methodrail:/, "");
}

const tools = [];
const skills = [];
const references = [];
const commands = [];
const add = (list, value) => {
  if (!list.includes(value)) list.push(value);
};

const prompt = read("PROMPT");
const slash = prompt.match(/^\/methodrail:([a-z0-9-]+)/);

// SESSION.jsonl holds account details and the full system prompt, so it is never
// committed. Only the slash-skill expansion is extracted from it.
const sessionPath = join(runDir, "SESSION.jsonl");
const sessionEvents = existsSync(sessionPath)
  ? readFileSync(sessionPath, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line))
  : [];
function userTexts(event) {
  const content = event.message?.content;
  if (typeof content === "string") return [content];
  if (Array.isArray(content)) return content.filter((part) => part.type === "text").map((part) => part.text);
  return [];
}
const commandName = sessionEvents
  .filter((e) => e.type === "user")
  .flatMap(userTexts)
  .map((text) => text.match(/<command-name>\/([^<]+)<\/command-name>/)?.[1])
  .find(Boolean);
const expansion = sessionEvents
  .filter((e) => e.type === "user" && e.isMeta)
  .flatMap(userTexts)
  .find((text) => text.startsWith("Base directory for this skill: "));
const baseDirectory = expansion?.match(/^Base directory for this skill: (.+)$/m)?.[1];
const skillFile = baseDirectory ? join(baseDirectory, "SKILL.md") : undefined;
const skillBody = expansion?.split("\n").slice(2).join("\n").trim() ?? "";
const bodyMatches =
  !!skillFile && existsSync(skillFile) && skillBody.length > 0 && readFileSync(skillFile, "utf8").includes(skillBody.slice(0, 2000));
const skillLoad = slash
  ? {
      requested: `/methodrail:${slash[1]}`,
      command_name: commandName ? `/${commandName}` : null,
      base_directory: baseDirectory ?? null,
      expanded_body_matches_skill_file: bodyMatches,
    }
  : null;
if (slash && commandName === `methodrail:${slash[1]}` && bodyMatches) {
  add(skills, slash[1]);
  add(references, `skills/${slash[1]}/SKILL.md`);
}
const hookContext = hook ? (() => {
  try {
    return JSON.parse(hook.output).hookSpecificOutput?.additionalContext ?? "";
  } catch {
    return "";
  }
})() : "";
if (hookContext) add(references, "adapters/claude/CLAUDE.md");

// Phase comes from order: code run before the first non-test source edit is
// reproduction (test runs are regression evidence); code run after it verifies.
const runsCode = /(^|[\s;&|(])(node|npm|npx|tsx)(\s|$)/;
const isTestRun = (command) => /--test|npm (run )?test/.test(command);
let fixed = false;
function phaseFor(command) {
  if (!runsCode.test(command)) return "other";
  if (fixed) return "verify";
  return isTestRun(command) ? "regression" : "repro";
}

let subagents = 0;
for (const use of toolUses) {
  const editedPath = (use.name === "Edit" || use.name === "Write") && typeof use.input?.file_path === "string" ? use.input.file_path : "";
  if (editedPath && !relative(work, editedPath).startsWith("..") && !/(^|\/)test|\.test\./.test(relative(work, editedPath))) {
    fixed = true;
  }
  add(tools, use.name.toLowerCase());
  if (use.name === "Agent" || use.name === "Task") subagents += 1;
  if (use.name === "Skill" && typeof use.input?.skill === "string") {
    const name = stripNamespace(use.input.skill);
    add(skills, name);
    add(references, `skills/${name}/SKILL.md`);
  }
  if (use.name === "Read" && typeof use.input?.file_path === "string") {
    const path = normalize(use.input.file_path);
    const inPlugin = relative(root, path);
    const inWork = relative(work, path);
    if (!inPlugin.startsWith("..")) {
      add(references, inPlugin);
      const skill = inPlugin.match(/^skills\/([^/]+)\/SKILL\.md$/);
      if (skill) add(skills, skill[1]);
    } else if (!inWork.startsWith("..") && /(^|\/)(\.methodrail|\.agents)\//.test(inWork)) {
      add(references, inWork);
    }
  }
  if (use.name === "Bash" && typeof use.input?.command === "string") {
    for (const path of use.input.command.match(/\.(?:methodrail|agents)\/[\w./-]+/g) ?? []) {
      if (existsSync(join(work, path))) add(references, path);
    }
    const block = toolResults.get(use.id);
    commands.push({
      command: use.input.command,
      phase: phaseFor(use.input.command),
      exit_status: exitStatus(block),
      stdout: resultText(block).slice(0, 2000),
    });
  }
}

const verification = commands
  .filter((entry) => entry.phase !== "other")
  .map(({ command, phase, exit_status }) => ({ command, phase, exit_status }));

// Claude Code also names per-project folders with a slug of the cwd.
const slug = (path) => path.replace(/[^a-zA-Z0-9]/g, "-");
const sanitize = (text) =>
  text
    .split(root).join("<methodrail>")
    .split(destAbs).join("<run>")
    .split(slug(destAbs)).join("<run-slug>")
    .split(process.env.HOME ?? "\u0000").join("~");

const artifactRel = join("evals/runners/artifacts", fixture, label);
const artifactAbs = join(root, artifactRel);
rmSync(artifactAbs, { recursive: true, force: true });
mkdirSync(artifactAbs, { recursive: true });
execFileSync("node", [join(root, "evals/runners/extract-overlay.mjs"), join(destAbs, "orig"), work, join(artifactAbs, "overlay")], {
  stdio: "inherit",
});
// Files the agent wrote beside work/ (for example ../verify) are outside the overlay.
for (const name of readdirSync(destAbs)) {
  if (["orig", "work", "run"].includes(name)) continue;
  cpSync(join(destAbs, name), join(artifactAbs, "outside-work", name), { recursive: true });
}
const answer = typeof result?.result === "string" ? result.result.trim() : "";
writeFileSync(join(artifactAbs, "answer.md"), `${sanitize(answer)}\n`);
writeFileSync(join(artifactAbs, "command.log.json"), `${JSON.stringify(JSON.parse(sanitize(JSON.stringify(commands))), null, 2)}\n`);
writeFileSync(join(artifactAbs, "TRANSCRIPT.jsonl"), `${sanitize(read("TRANSCRIPT.jsonl"))}\n`);
const adapter = readFileSync(join(root, "adapters/claude/CLAUDE.md"), "utf8").trim();
const evidence = {
  session_start_hook: hook
    ? { exit_code: hook.exit_code ?? null, additional_context_matches_adapter: hookContext === adapter }
    : null,
  skill_load: skillLoad,
};
writeFileSync(join(artifactAbs, "load-evidence.json"), `${sanitize(JSON.stringify(evidence, null, 2))}\n`);
for (const name of ["PROMPT", "MODEL", "CLAUDE_VERSION", "CLAUDE_EXIT", "STARTED_AT", "ENDED_AT"]) {
  if (existsSync(join(runDir, name))) cpSync(join(runDir, name), join(artifactAbs, name));
}

const usage = result?.usage;
const input = usage
  ? (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0)
  : null;
const run = {
  fixture_id: fixture,
  condition,
  host: "claude-code",
  model: init?.model ?? read("MODEL"),
  ...(label.match(/-r(\d+)-/) ? { repeat: Number(label.match(/-r(\d+)-/)[1]) } : {}),
  started_at: read("STARTED_AT"),
  ended_at: read("ENDED_AT"),
  latency_ms: typeof result?.duration_ms === "number" ? result.duration_ms : null,
  skills_invoked: skills,
  references_loaded: references,
  tools_used: tools,
  subagents_used: subagents,
  verification_steps: verification,
  evidence: [],
  outcome: sanitize(answer.split("\n\n")[0] ?? ""),
  failure_modes: [],
  behaviors_observed: [],
  notes: `Live Claude Code ${read("CLAUDE_VERSION").split(" ")[0]} via evals/runners/run-claude-code.sh. Prompt: ${prompt}`,
  provenance: "live",
  capture: "runner_captured",
  artifacts: {
    overlay: join(artifactRel, "overlay"),
    command_log: join(artifactRel, "command.log.json"),
    answer: join(artifactRel, "answer.md"),
    transcript: join(artifactRel, "TRANSCRIPT.jsonl"),
  },
  ...(usage
    ? {
        usage: {
          source: "native-report",
          scope: subagents > 0 ? "parent-only" : "complete-run",
          input_tokens: input,
          output_tokens: usage.output_tokens ?? null,
          cached_input_tokens: usage.cache_read_input_tokens ?? null,
          total_tokens: input === null || usage.output_tokens == null ? null : input + usage.output_tokens,
          artifact: join(artifactRel, "TRANSCRIPT.jsonl"),
        },
      }
    : {}),
};
const out = join(root, "evals/runners/examples", `${fixture}.${label}.json`);
writeFileSync(out, `${sanitize(JSON.stringify(run, null, 2))}\n`);
console.log(`wrote ${relative(root, out)}; hook context ${hookContext ? "present" : "absent"}; exit ${read("CLAUDE_EXIT")}`);
