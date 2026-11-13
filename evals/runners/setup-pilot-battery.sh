#!/bin/bash
# Operator setup for one recorded live battery: v0.7, v0.8, v0.9, or v0.10.
# Does not modify fixture task.md, fixture repos, or graders.
set -euo pipefail
BATTERY="${1:?usage: setup-pilot-battery.sh v0.7|v0.8|v0.9|v0.10}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

case "$BATTERY" in
  v0.7) DEFAULT="/tmp/methodrail-pilot-20260825-v07" ;;
  v0.8) DEFAULT="/tmp/methodrail-pilot-20260831-v08" ;;
  v0.9) DEFAULT="/tmp/methodrail-pilot-20260901-v09" ;;
  v0.10) DEFAULT="/tmp/methodrail-pilot-v010" ;;
  *) echo "usage: setup-pilot-battery.sh v0.7|v0.8|v0.9|v0.10" >&2; exit 2 ;;
esac
PILOT="${METHODRAIL_PILOT_DIR:-$DEFAULT}"
case "$(basename "$PILOT")" in
  methodrail-pilot-*) ;;
  *) echo "Refusing to replace a pilot directory without a methodrail-pilot-* basename" >&2; exit 2 ;;
esac
rm -rf "$PILOT"
mkdir -p "$PILOT"

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

copy_named_repo() {
  local fixture="$1"
  local dest="$2"
  mkdir -p "$dest"
  cp -R "$ROOT/evals/fixtures/$fixture/repo" "$dest/repo"
  cp "$ROOT/evals/fixtures/$fixture/task.md" "$dest/TASK.md"
  if [ -d "$ROOT/evals/fixtures/$fixture/.methodrail" ]; then
    cp -R "$ROOT/evals/fixtures/$fixture/.methodrail" "$dest/.methodrail"
  fi
}

copy_fixture_tree() {
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

add_v07_guidance() {
  local dest="$1"
  mkdir -p "$dest/rules" "$dest/references/knowledge"
  cp "$ROOT/rules/methodrail.mdc" "$dest/rules/methodrail.mdc"
  cp "$ROOT/references/knowledge/reuse.md" "$dest/references/knowledge/reuse.md"
  cp "$ROOT/references/knowledge/freshness.md" "$dest/references/knowledge/freshness.md"
  cp "$ROOT/references/knowledge/note-contract.md" "$dest/references/knowledge/note-contract.md"
}

write_v08_operator() {
  local dest="$1"
  local condition="$2"
  if [ "$condition" = "methodrail" ]; then
    cat > "$dest/OPERATOR.md" <<'EOF'
Complete the task in TASK.md.

This directory includes Methodrail methodology:
- rules/methodrail.mdc
- references/knowledge/

Read rules/methodrail.mdc. If .methodrail/PROJECT.md exists, read it before substantive work and follow only the knowledge pointers that bear on this task. Use references/knowledge/reuse.md for how to treat project notes.

Stay inside this directory. Do not read parent directories, other worktrees, or any Methodrail plugin, evals, grader, expected.yaml, or README files outside this tree.

Write your final user-facing answer to ANSWER.md.
Write every shell command you ran to COMMANDS.json as a JSON array of objects: {"command":"...","exit_status":N}.

Do not modify TASK.md, RUN.json, or OPERATOR.md.
EOF
  else
    cat > "$dest/OPERATOR.md" <<'EOF'
Complete the task in TASK.md.

You are a baseline coding agent. Do not load or follow Methodrail skills, rules, or knowledge-reuse procedures even if they appear in your environment. Use only this worktree.

Stay inside this directory. Do not read parent directories, other worktrees, or any Methodrail plugin, evals, grader, expected.yaml, or README files outside this tree.

Write your final user-facing answer to ANSWER.md.
Write every shell command you ran to COMMANDS.json as a JSON array of objects: {"command":"...","exit_status":N}.

Do not modify TASK.md, RUN.json, or OPERATOR.md.
EOF
  fi
}

write_v09_operator() {
  local dest="$1"
  local condition="$2"
  local fixture="$3"
  if [ "$condition" = "methodrail" ]; then
    local extra=""
    if [ "$fixture" = "decision-ladder" ]; then
      extra="Unattended-operator note: if a procedure requires explicit human approval before writing a durable ADR, this battery operator grants that approval only for a qualifying hard-to-reverse store choice after you classify it. Reversible log-format choices are not approved as ADRs."
    elif [ "$fixture" = "knowledge-reconciliation-v0.9" ]; then
      extra="Unattended-operator note: this operator does not grant approval to rewrite typed knowledge notes."
    fi
    cat > "$dest/OPERATOR.md" <<EOF
Complete the task in TASK.md.

This directory includes Methodrail methodology under rules/, references/, and skills/.
Read rules/methodrail.mdc. If .methodrail/PROJECT.md exists, read it before substantive work and follow only the pointers that bear on this task.

Stay inside this directory. Do not read parent directories, other worktrees, or any Methodrail plugin, evals, grader, expected.yaml, or README files outside this tree.

${extra}

Write your final user-facing answer to ANSWER.md.
Write every shell command you ran to COMMANDS.json as a JSON array of objects: {"command":"...","exit_status":N}.

Do not modify TASK.md, RUN.json, or OPERATOR.md.
EOF
  else
    cat > "$dest/OPERATOR.md" <<'EOF'
Complete the task in TASK.md.

You are a baseline coding agent. Do not load or follow Methodrail skills, rules, or knowledge-reuse procedures even if they appear in your environment. Use only this worktree.

Stay inside this directory. Do not read parent directories, other worktrees, or any Methodrail plugin, evals, grader, expected.yaml, or README files outside this tree.

Write your final user-facing answer to ANSWER.md.
Write every shell command you ran to COMMANDS.json as a JSON array of objects: {"command":"...","exit_status":N}.

Do not modify TASK.md, RUN.json, or OPERATOR.md.
EOF
  fi
}

add_v09_guidance() {
  local dest="$1"
  local fixture="$2"
  mkdir -p "$dest/rules" "$dest/references/knowledge" "$dest/references/protocols" "$dest/skills"
  cp "$ROOT/rules/methodrail.mdc" "$dest/rules/methodrail.mdc"
  case "$fixture" in
    decision-ladder)
      cp "$ROOT/references/decision-frontier.md" "$dest/references/decision-frontier.md"
      cp "$ROOT/references/protocols/decision-record.md" "$dest/references/protocols/decision-record.md"
      cp -R "$ROOT/skills/show-me-your-work" "$dest/skills/show-me-your-work"
      ;;
    knowledge-reconciliation-v0.9)
      cp "$ROOT/references/knowledge/reuse.md" "$dest/references/knowledge/reuse.md"
      cp "$ROOT/references/knowledge/freshness.md" "$dest/references/knowledge/freshness.md"
      cp "$ROOT/references/knowledge/note-contract.md" "$dest/references/knowledge/note-contract.md"
      cp "$ROOT/references/knowledge.md" "$dest/references/knowledge.md"
      cp -R "$ROOT/skills/reflect" "$dest/skills/reflect"
      ;;
    architecture-deepening)
      cp -R "$ROOT/skills/improve-codebase-architecture" "$dest/skills/improve-codebase-architecture"
      cp -R "$ROOT/skills/codebase-design" "$dest/skills/codebase-design"
      ;;
  esac
}

write_v10_operator() {
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

write_ledger_env() {
  local dest="$1"
  mkdir -p "$dest/.ledger"
  cat > "$dest/LEDGER.env" <<EOF
# Source this before launching a Cursor Task subagent on this worktree.
export METHODRAIL_LEDGER=1
export METHODRAIL_LEDGER_DIR=$dest/.ledger
EOF
}

finish_common() {
  echo "Prepared $PILOT"
  find "$PILOT" -name RUN.json | wc -l
}

setup_v07() {
  local fixture="$1" host="$2" repeat="$3" condition="$4"
  local dest="$PILOT/$fixture/${host}-r${repeat}-${condition}"
  copy_named_repo "$fixture" "$dest"
  if [ "$fixture" = "knowledge-refresh" ]; then
    node --import tsx "$ROOT/evals/runners/prepare-v0.7-fixture.ts" "$ROOT/evals/fixtures/$fixture" "$dest"
  fi
  case "$fixture" in
    knowledge-reuse)
      if [ "$condition" = "baseline" ]; then
        rm -f "$dest/.methodrail/knowledge/notifications.md"
      else
        add_v07_guidance "$dest"
      fi
      ;;
    knowledge-refresh)
      if [ "$condition" = "baseline" ]; then
        rm -f "$dest/.methodrail/knowledge/mail.md"
      else
        add_v07_guidance "$dest"
      fi
      ;;
  esac
  stamp "$dest" "$fixture" "$host" "$repeat" "$condition"
  cp -R "$dest" "${dest}.clean"
}

setup_v08() {
  local fixture="$1" host="$2" repeat="$3" condition="$4"
  local dest="$PILOT/$fixture/${host}-r${repeat}-${condition}"
  copy_named_repo "$fixture" "$dest"
  if [ "$condition" = "methodrail" ]; then
    add_v07_guidance "$dest"
  fi
  write_v08_operator "$dest" "$condition"
  stamp "$dest" "$fixture" "$host" "$repeat" "$condition"
  cp -R "$dest" "${dest}.clean"
}

setup_v09() {
  local fixture="$1" host="$2" repeat="$3" condition="$4"
  local dest="$PILOT/$fixture/${host}-r${repeat}-${condition}"
  copy_fixture_tree "$fixture" "$dest"
  if [ "$condition" = "methodrail" ]; then
    add_v09_guidance "$dest" "$fixture"
  fi
  write_v09_operator "$dest" "$condition" "$fixture"
  stamp "$dest" "$fixture" "$host" "$repeat" "$condition"
  cp -R "$dest" "${dest}.clean"
}

setup_v10() {
  local fixture="$1" host="$2" repeat="$3" condition="$4"
  local dest="$PILOT/$fixture/${host}-r${repeat}-${condition}"
  copy_fixture_tree "$fixture" "$dest"
  if [ "$condition" = "methodrail" ]; then
    mkdir -p "$dest/rules"
    cp "$ROOT/rules/methodrail.mdc" "$dest/rules/methodrail.mdc"
  fi
  write_v10_operator "$dest" "$condition"
  write_ledger_env "$dest"
  stamp "$dest" "$fixture" "$host" "$repeat" "$condition"
  cp -R "$dest" "${dest}.clean"
}

each_pair() {
  local setup="$1"
  shift
  local fixture host_repeat host repeat
  for fixture in "$@"; do
    for host_repeat in "cursor 1" "cursor 2" "codex 1"; do
      set -- $host_repeat
      host="$1"
      repeat="$2"
      "$setup" "$fixture" "$host" "$repeat" baseline >/dev/null
      "$setup" "$fixture" "$host" "$repeat" methodrail >/dev/null
    done
  done
}

case "$BATTERY" in
  v0.7)
    each_pair setup_v07 knowledge-reuse knowledge-refresh
    finish_common
    ;;
  v0.8)
    each_pair setup_v08 knowledge-applicability knowledge-dispute knowledge-retired
    finish_common
    echo "$PILOT" > "$PILOT/PILOT_ROOT"
    git -C "$ROOT" rev-parse HEAD > "$PILOT/METHODRAIL_HEAD"
    date -u +%Y-%m-%dT%H:%M:%SZ > "$PILOT/PREPARED_AT"
    ;;
  v0.9)
    each_pair setup_v09 decision-ladder knowledge-reconciliation-v0.9 architecture-deepening
    finish_common
    echo "$PILOT" > "$PILOT/PILOT_ROOT"
    git -C "$ROOT" rev-parse HEAD > "$PILOT/METHODRAIL_HEAD"
    printf '%s\n' "uncommitted-v0.9-working-tree" > "$PILOT/METHODRAIL_FREEZE_NOTE"
    date -u +%Y-%m-%dT%H:%M:%SZ > "$PILOT/PREPARED_AT"
    shasum -a 256 \
      "$ROOT/src/eval/grade-outcome.ts" \
      "$ROOT/evals/release-policy.yaml" \
      "$ROOT/evals/pilot-v0.9-project-artifact-interoperability.yaml" \
      "$ROOT/evals/fixtures/decision-ladder/task.md" \
      "$ROOT/evals/fixtures/knowledge-reconciliation-v0.9/task.md" \
      "$ROOT/evals/fixtures/architecture-deepening/task.md" \
      > "$PILOT/FREEZE.sha256"
    ;;
  v0.10)
    setup_v10 simple-change cursor 1 baseline >/dev/null
    setup_v10 simple-change cursor 1 methodrail >/dev/null
    finish_common
    echo "$PILOT" > "$PILOT/PILOT_ROOT"
    git -C "$ROOT" rev-parse HEAD > "$PILOT/METHODRAIL_HEAD"
    date -u +%Y-%m-%dT%H:%M:%SZ > "$PILOT/PREPARED_AT"
    ;;
esac
