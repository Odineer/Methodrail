#!/bin/sh
# Fail open. Exec the named sibling script with the first node found.
DIR="$(cd "$(dirname "$0")" && pwd)"
script="${1:?}"
for candidate in "$(command -v node 2>/dev/null)" /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.volta/bin/node" "$(ls -d "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | sort -V | tail -1)"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    exec "$candidate" "$DIR/$script"
  fi
done
cat >/dev/null
printf '{}\n'
exit 0
