#!/bin/sh
# Locate node, then run the ledger hook. Fail open.
DIR="$(cd "$(dirname "$0")" && pwd)"
for candidate in "$(command -v node 2>/dev/null)" /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.volta/bin/node" "$(ls -d "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | sort -V | tail -1)"; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    exec "$candidate" "$DIR/session-ledger.mjs"
  fi
done
cat >/dev/null
printf '{}\n'
exit 0
