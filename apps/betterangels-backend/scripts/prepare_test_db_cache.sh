#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$APP_ROOT/../.." && pwd)"
cd "$APP_ROOT"
source "$SCRIPT_DIR/test_db_common.sh"

PYTHON_BIN="$(test_db_python_bin)"
if ! test_db_pg_dump_ok; then
  echo "test DB cache: pg_dump is older than 17; skipping"
  exit 0
fi

if ! workers="$(test_db_workers)"; then
  echo "test DB cache: serial run; skipping"
  exit 0
fi
if [[ "$workers" -lt 1 ]]; then
  echo "test DB cache: invalid worker count $workers; skipping"
  exit 0
fi

test_db_export_pg_env
BASE_DB="$(test_db_base_db)"
CACHE_FILE="$(test_db_cache_file)"
MANIFEST_FILE="$(test_db_manifest_file)"
BUILD_PREFIX="${BASE_DB}_build"
mkdir -p "$(dirname "$CACHE_FILE")"

cleanup_build_dbs() {
  for i in $(seq 0 $((workers - 1))); do
    dropdb --if-exists "${BUILD_PREFIX}${i}" >/dev/null 2>&1 || true
  done
}
trap cleanup_build_dbs EXIT

echo "test DB cache: checking for a current base"
if [[ -f "$CACHE_FILE" && -f "$MANIFEST_FILE" ]] &&
  POSTGRES_NAME=postgres "$PYTHON_BIN" scripts/test_db_cache_manifest.py check --manifest "$MANIFEST_FILE"; then
  # The manifest already covers every migration, settings, and DB input that
  # can change the dump. A matching manifest means there is nothing to apply.
  echo "test DB cache: cache is current"
  exit 0
fi

rm -f "$CACHE_FILE" "$MANIFEST_FILE"
echo "test DB cache: building with ${workers} parallel migrations"
pids=()
for i in $(seq 0 $((workers - 1))); do
  POSTGRES_TEST_NAME="${BUILD_PREFIX}${i}" "$PYTHON_BIN" scripts/setup_test_db.py &
  pids+=("$!")
done

failed=0
for pid in "${pids[@]}"; do
  if ! wait "$pid"; then
    failed=1
  fi
done
if (( failed )); then
  echo "test DB cache: one or more migration workers failed" >&2
  exit 1
fi

SOURCE_DB="${BUILD_PREFIX}0"
pg_dump --format=custom --dbname="$SOURCE_DB" --file="$CACHE_FILE"

if ! POSTGRES_NAME="$SOURCE_DB" "$PYTHON_BIN" scripts/validate_test_db.py; then
  rm -f "$CACHE_FILE" "$MANIFEST_FILE"
  echo "test DB cache is stale; remove the cache entry and retry" >&2
  exit 1
fi

POSTGRES_NAME="$SOURCE_DB" "$PYTHON_BIN" scripts/test_db_cache_manifest.py write --output "$MANIFEST_FILE"
echo "test DB cache: built $CACHE_FILE"
