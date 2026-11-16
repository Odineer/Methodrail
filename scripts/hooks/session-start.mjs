import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

// Claude Code auto-loads hooks/hooks.json from a plugin root, so Z Code and
// Claude Code share this hook. Each host exports its own plugin-root variable.
function projectionFor(env) {
  if (env.CLAUDE_PLUGIN_ROOT && !env.ZCODE_PLUGIN_ROOT) return "adapters/claude/CLAUDE.md";
  return "adapters/zcode/AGENTS.md";
}

const chunks = [];
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) chunks.push(chunk);

let event = "SessionStart";
try {
  const input = JSON.parse(chunks.join(""));
  if (typeof input.hook_event_name === "string" && input.hook_event_name !== "") {
    event = input.hook_event_name;
  }
} catch {
  // Fail open: still inject the invariant.
}

let additionalContext = "";
try {
  additionalContext = readFileSync(join(root, projectionFor(process.env)), "utf8").trim();
} catch {
  additionalContext = "";
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext,
    },
  }),
);
