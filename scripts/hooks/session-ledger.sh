#!/bin/sh
# Locate node, then run the ledger hook. Fail open.
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/run-node.sh" session-ledger.mjs
