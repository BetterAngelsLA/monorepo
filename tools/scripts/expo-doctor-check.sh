#!/usr/bin/env bash
# expo-doctor-check.sh — validates Expo dependencies in CI
#
# Usage: ./tools/scripts/expo-doctor-check.sh <app-dir>
#   e.g. ./tools/scripts/expo-doctor-check.sh apps/betterangels
#
# Pipeline:
#   1. Snapshot package.json → run sync-deps → fail if changed
#   2. Fill star deps (* → real versions from root)
#   3. Run expo-doctor from app directory
#   4. Cleanup (restore original package.json)
set -euo pipefail

APP_DIR="${1:?Usage: $0 <app-dir>}"
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
APP_NAME="$(basename "$APP_DIR")"

# Resolve to absolute paths — the script cd's around, so relative paths break in trap
ABS_APP_DIR="$(cd "$APP_DIR" 2>/dev/null && pwd || echo "$ROOT_DIR/$APP_DIR")"

ORIG_PKG=""
SNAPSHOT=""
EXIT_CODE=0

# Ensure cleanup runs even if script fails mid-way
cleanup() {
  if [ -n "$ORIG_PKG" ] && [ -f "$ORIG_PKG" ]; then
    cp "$ORIG_PKG" "$ABS_APP_DIR/package.json"
    rm -f "$ABS_APP_DIR/yarn.lock"
    echo "  ✓ Restored original package.json"
  fi
  rm -f "$SNAPSHOT" "$ORIG_PKG"
}
trap cleanup EXIT

echo "::group::🔍 sync-deps check ($APP_NAME)"
SNAPSHOT=$(mktemp)
cp "$ABS_APP_DIR/package.json" "$SNAPSHOT"

# Run sync-deps from workspace root (where Yarn workspaces are configured)
cd "$ROOT_DIR"
yarn nx run "${APP_NAME}:sync-deps" --skip-nx-cache >/dev/null 2>&1

if ! diff -q "$SNAPSHOT" "$ABS_APP_DIR/package.json" >/dev/null 2>&1; then
  echo "ERROR: sync-deps modified $ABS_APP_DIR/package.json!"
  echo "Dependencies are out of sync. Run 'yarn nx run ${APP_NAME}:sync-deps' locally and commit."
  exit 1
fi
echo "  ✓ Package deps in sync"
echo "::endgroup::"

echo "::group::📦 fill-star-deps ($APP_NAME)"
ORIG_PKG=$(mktemp)
cp "$ABS_APP_DIR/package.json" "$ORIG_PKG"

node "$ROOT_DIR/tools/scripts/fill-star-deps.mjs" "$ROOT_DIR" "$ABS_APP_DIR"
echo "::endgroup::"

echo "::group::🩺 expo-doctor ($APP_NAME)"
cd "$ABS_APP_DIR"
npx -y expo-doctor || EXIT_CODE=$?
echo "::endgroup::"

exit $EXIT_CODE
