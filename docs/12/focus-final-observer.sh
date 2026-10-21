#!/usr/bin/env bash
set -euo pipefail
MAIN=$(git rev-parse --show-toplevel)
VERIFY=$(mktemp -d /tmp/nightshift-12-final-observer.XXXXXX)
printf '%s\n' "$VERIFY" > "$MAIN/docs/12/independent-final-observer-directory.txt"
git archive HEAD | tar -x -C "$VERIFY"
ln -s "$MAIN/frontend/node_modules" "$VERIFY/frontend/node_modules"
mkdir -p "$VERIFY/docs/12/browser-evidence"
cp "$MAIN/docs/12/browser-evidence/baseline.json" "$VERIFY/docs/12/browser-evidence/baseline.json"
cd "$VERIFY"
npm --prefix frontend test
npm --prefix frontend run test:e2e
npm --prefix frontend run build
printf '\nAll observer commands exited 0. Verification checkout retained: %s\n' "$VERIFY"
