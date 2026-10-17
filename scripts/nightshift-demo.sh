#!/usr/bin/env bash
# Explicit isolated public-community launcher. The feature is not run during --check.
set -euo pipefail
PROJECT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
COMMUNITY=${NIGHTSHIFT_COMMUNITY_HOME:-$(cd "$PROJECT/../.." && pwd -P)}
RUNTIME=${NIGHTSHIFT_DEMO_RUNTIME:-$COMMUNITY/.nightshift/production-smoke/runtime}
DAY=${1:-saturday}
if [ "$DAY" = --check ]; then DAY=saturday; CHECK=true; shift; else CHECK=false; [ "$#" -eq 0 ] || shift; fi
case "$DAY" in
  saturday|today) NUMBER=12 ;;
  monday) NUMBER=13 ;;
  tuesday) NUMBER=14 ;;
  friday) NUMBER=15 ;;
  *) echo 'Usage: scripts/nightshift-demo.sh [saturday|monday|tuesday|friday] [--check]' >&2; exit 64 ;;
esac
REF="gh:doctor-ew/counsel-of-ricks#$NUMBER"
if [ "${1:-}" = --check ]; then CHECK=true; shift; fi
[ "$#" -eq 0 ] || { echo 'Unexpected extra arguments.' >&2; exit 64; }
BASE='nightshift/live-demo-baseline'
export NIGHTSHIFT_HOME="$RUNTIME"
export NIGHTSHIFT_UPDATE_GUARD=1
export BEADS_DIR="$PROJECT/.beads"
[ -f "$RUNTIME/scripts/nightshift-factory.sh" ] || { echo 'Set NIGHTSHIFT_DEMO_RUNTIME to the reviewed public community runtime.' >&2; exit 66; }
[ "$(git -C "$PROJECT" branch --show-current)" = "$BASE" ] || { echo 'Run from the prepared live-demo baseline checkout.' >&2; exit 65; }
if [ "$CHECK" = true ]; then
  for tool in git python3 jq gh codex claude; do bash "$RUNTIME/scripts/nightshift-capability.sh" --presence "$tool"; done
  bash "$RUNTIME/scripts/nightshift-preflight-check.sh" --project "$PROJECT" --branch auto --base "$BASE" --ref "$REF"
  python3 "$RUNTIME/scripts/nightshift-project-context.py" --project "$PROJECT"
  printf '%s\n' 'Read-only admission passed. No feature stage or generation was started.'
  exit 0
fi
printf '%s\n' "Starting $REF from $BASE using the isolated community runtime."
printf '%s\n' 'This launches real engineering models. The before demo remains available; no merge or deploy is authorized.'
exec bash "$RUNTIME/scripts/nightshift-factory.sh" "$REF" --project "$PROJECT" \
  --provider codex --model gpt-6.1-sol --auth subscription --gear 1 \
  --branch auto --base "$BASE" --dashboard auto --dashboard-browser once \
  --output concise --push --pr
