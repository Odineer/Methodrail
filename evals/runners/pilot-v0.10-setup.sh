#!/bin/bash
# Operator setup for v0.10 hook-captured Cursor dry-runs / pilots.
# Per-run worktrees get METHODRAIL_LEDGER=1 and a private ledger directory so
# Task subagents do not share a ledger even if conversation_id collides.
# Does not modify fixture task.md, fixture repos, or graders.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PILOT="${METHODRAIL_PILOT_DIR:-/tmp/methodrail-pilot-v010}"
case "$(basename "$PILOT")" in
  methodrail-pilot-*) ;;
  *) echo "Refusing to replace a pilot directory without a methodrail-pilot-* basename" >&2; exit 2 ;;
esac
rm -rf "$PILOT"
mkdir -p "$PILOT"

copy_tree() {
  local fixture="$1"
  local dest="$2"
  mkdir -p "$dest"
  local src="$ROOT/evals/fixtures/$fixture"
  local name
  for name in $(ls -A "$src"); do
    case "$name" in
      expected.yaml|README.md|task.md|task-a.md) continue ;;
    esac
    cp -R "$src/$name" "$dest/$name"
  done
  cp "$src/task.md" "$dest/TASK.md"
}

add_methodrail_guidance() {
  local dest="$1"
  mkdir -p "$dest/rules"
  cp "$ROOT/rules/methodrail.mdc" "$dest/rules/methodrail.mdc"
}

write_ledger_env() {
  local dest="$1"
  mkdir -p "$dest/.ledger"
  cat > "$dest/LEDGER.env" <<EOF
# Source this before launching a Cursor Task subagent on this worktree.
export METHODRAIL_LEDGER=1
export METHODRAIL_LEDGER_DIR=$dest/.ledger
EOF
}

write_operator() {
  local dest="$1"
  local condition="$2"
  if [ "$condition" = "methodrail" ]; then
    cat > "$dest/OPERATOR.md" <<EOF
Complete the task in TASK.md.

This directory includes Methodrail methodology under rules/.
Read rules/methodrail.mdc. If .methodrail/PROJECT.md exists, read it before substantive work.

Stay inside this directory. Do not read parent directories, other worktrees, or any Methodrail plugin, evals, grader, expected.yaml, or README files outside this tree.

Write your final user-facing answer to ANSWER.md.

Do not modify TASK.md, RUN.json, OPERATOR.md, LEDGER.env, or .ledger/.
EOF
  else
    cat > "$dest/OPERATOR.md" <<'EOF'
Complete the task in TASK.md.

You are a baseline coding agent. Do not load or follow Methodrail skills, rules, or knowledge-reuse procedures even if they appear in your environment. Use only this worktree.

Stay inside this directory. Do not read parent directories, other worktrees, or any Methodrail plugin, evals, grader, expected.yaml, or README files outside this tree.

Write your final user-facing answer to ANSWER.md.

Do not modify TASK.md, RUN.json, OPERATOR.md, LEDGER.env, or .ledger/.
EOF
  fi
}

stamp() {
  local dest="$1"
  local fixture="$2"
  local host="$3"
  local repeat="$4"
  local condition="$5"
  cat > "$dest/RUN.json" <<EOF
{
  "fixture_id": "$fixture",
  "host": "$host",
  "repeat": $repeat,
  "condition": "$condition",
  "started_dir": "$dest"
}
EOF
}

setup_run() {
  local fixture="$1" host="$2" repeat="$3" condition="$4"
  local dest="$PILOT/$fixture/${host}-r${repeat}-${condition}"
  copy_tree "$fixture" "$dest"
  if [ "$condition" = "methodrail" ]; then
    add_methodrail_guidance "$dest"
  fi
  write_operator "$dest" "$condition"
  write_ledger_env "$dest"
  stamp "$dest" "$fixture" "$host" "$repeat" "$condition"
  cp -R "$dest" "${dest}.clean"
  echo "$dest"
}

for fixture in simple-change; do
  setup_run "$fixture" cursor 1 baseline >/dev/null
  setup_run "$fixture" cursor 1 methodrail >/dev/null
done

echo "Prepared $PILOT"
find "$PILOT" -name RUN.json | wc -l
echo "$PILOT" > "$PILOT/PILOT_ROOT"
git -C "$ROOT" rev-parse HEAD > "$PILOT/METHODRAIL_HEAD"
date -u +%Y-%m-%dT%H:%M:%SZ > "$PILOT/PREPARED_AT"
