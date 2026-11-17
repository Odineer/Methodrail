#!/bin/bash
# One Claude Code live run. Preserve stdout/stderr even on failure.
#
# usage: run-claude-code.sh <fixture-id> <baseline|methodrail> <dest> [skill]
#
# <dest>/orig is the untouched fixture, <dest>/work is the agent's cwd, and
# <dest>/run holds the transcript and timing. methodrail loads this checkout
# with --plugin-dir; [skill] prefixes the prompt with /methodrail:<skill>.
# Both conditions skip user settings and MCP servers so only the plugin differs.
# The session file is moved into <dest>/run/SESSION.jsonl because stream-json
# does not show the prompt or what a slash skill expanded into.
set -u
FIXTURE="${1:?fixture id}"
CONDITION="${2:?baseline|methodrail}"
DEST="${3:?dest}"
SKILL="${4:-}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/evals/fixtures/$FIXTURE"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
MODEL="${CLAUDE_MODEL:-claude-opus-5-5}"

if [ ! -f "$SRC/task.md" ]; then
  echo "missing $SRC/task.md" >&2
  exit 2
fi
case "$CONDITION" in
  baseline) [ -z "$SKILL" ] || { echo "baseline takes no skill" >&2; exit 2; } ;;
  methodrail) ;;
  *) echo "condition must be baseline or methodrail" >&2; exit 2 ;;
esac
if [ -e "$DEST" ]; then
  echo "$DEST exists; use a fresh destination" >&2
  exit 2
fi

mkdir -p "$DEST/orig" "$DEST/run"
(cd "$SRC" && tar cf - --exclude expected.yaml --exclude task.md .) | (cd "$DEST/orig" && tar xf -)
cp "$SRC/task.md" "$DEST/orig/TASK.md"
cp -R "$DEST/orig" "$DEST/work"

PROMPT="Read TASK.md in the current directory and complete it."
[ -n "$SKILL" ] && PROMPT="/methodrail:$SKILL $PROMPT"
PLUGIN_ARGS=()
[ "$CONDITION" = methodrail ] && PLUGIN_ARGS=(--plugin-dir "$ROOT")

SESSION_ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
printf '%s\n' "$PROMPT" > "$DEST/run/PROMPT"
printf '%s\n' "$MODEL" > "$DEST/run/MODEL"
"$CLAUDE_BIN" --version > "$DEST/run/CLAUDE_VERSION" 2>&1
date -u +%Y-%m-%dT%H:%M:%SZ > "$DEST/run/STARTED_AT"
set +e
(
  cd "$DEST/work" &&
  env -i HOME="$HOME" USER="${USER:-}" TERM=dumb \
    PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin" \
    ${CLAUDE_CODE_OAUTH_TOKEN:+CLAUDE_CODE_OAUTH_TOKEN="$CLAUDE_CODE_OAUTH_TOKEN"} \
    ${ANTHROPIC_API_KEY:+ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"} \
    "$CLAUDE_BIN" -p "$PROMPT" \
      --model "$MODEL" \
      --output-format stream-json \
      --verbose \
      --include-hook-events \
      --setting-sources project \
      --strict-mcp-config \
      --session-id "$SESSION_ID" \
      --permission-mode acceptEdits \
      --allowedTools "Bash Read Edit Write Glob Grep Skill" \
      ${PLUGIN_ARGS[@]+"${PLUGIN_ARGS[@]}"}
) > "$DEST/run/TRANSCRIPT.jsonl" 2> "$DEST/run/TRANSCRIPT.err" < /dev/null
status=$?
set -e
echo "$status" > "$DEST/run/CLAUDE_EXIT"
SESSION_FILE="$(find "$HOME/.claude/projects" -name "$SESSION_ID.jsonl" 2>/dev/null | head -1)"
[ -n "$SESSION_FILE" ] && mv "$SESSION_FILE" "$DEST/run/SESSION.jsonl"
date -u +%Y-%m-%dT%H:%M:%SZ > "$DEST/run/ENDED_AT"
exit "$status"
