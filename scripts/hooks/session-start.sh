#!/bin/sh
# Fail open. Injects the projected family invariant; does not gate tools.
DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$DIR/run-node.sh" session-start.mjs
