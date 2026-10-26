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
INCREMENTAL_DB="${BASE_DB}_incremental"
mkdir -p "$(dirname "$CACHE_FILE")"

cleanup_build_dbs() {
  for i in $(seq 0 $((workers - 1))); do
    dropdb --force --if-exists "${BUILD_PREFIX}${i}" >/dev/null 2>&1 || true
  done
  dropdb --force --if-exists "$INCREMENTAL_DB" >/dev/null 2>&1 || true
}
trap cleanup_build_dbs EXIT

publish_cache() {
  local source_db="$1"
  local tmp_dump="${CACHE_FILE}.tmp.$$"
  local tmp_manifest="${MANIFEST_FILE}.tmp.$$"
  rm -f "$tmp_dump" "$tmp_manifest"
  if pg_dump --format=custom --dbname="$source_db" --file="$tmp_dump" &&
    POSTGRES_NAME="$source_db" "$PYTHON_BIN" scripts/test_db_cache_manifest.py write --output "$tmp_manifest"; then
    # Move only after both files exist, so a failed dump never publishes a
    # manifest that describes a different database.
    mv "$tmp_dump" "$CACHE_FILE"
    mv "$tmp_manifest" "$MANIFEST_FILE"
  else
    rm -f "$tmp_dump" "$tmp_manifest"
    return 1
  fi
}

echo "test DB cache: restoring the previous dump"
if [[ -f "$CACHE_FILE" && -f "$MANIFEST_FILE" ]] &&
  POSTGRES_NAME=postgres "$PYTHON_BIN" scripts/test_db_cache_manifest.py check --manifest "$MANIFEST_FILE"; then
  # Always run migrate on the restored dump, even with no new migrations:
  # post_migrate handlers re-run and bring seed rows in line with current code.
  dropdb --force --if-exists "$INCREMENTAL_DB" >/dev/null 2>&1 || true
  if createdb "$INCREMENTAL_DB" &&
    pg_restore --dbname="$INCREMENTAL_DB" "$CACHE_FILE" &&
    POSTGRES_NAME="$INCREMENTAL_DB" "$PYTHON_BIN" scripts/test_db_cache_manifest.py verify --manifest "$MANIFEST_FILE" &&
    POSTGRES_NAME="$INCREMENTAL_DB" "$PYTHON_BIN" manage.py migrate --noinput \
      --settings=betterangels_backend.settings_test &&
    POSTGRES_NAME="$INCREMENTAL_DB" "$PYTHON_BIN" manage.py flush --noinput \
      --settings=betterangels_backend.settings_test &&
    POSTGRES_NAME="$INCREMENTAL_DB" "$PYTHON_BIN" scripts/validate_test_db.py &&
    publish_cache "$INCREMENTAL_DB"; then
    echo "test DB cache: refreshed the previous dump"
    exit 0
  fi
  echo "test DB cache: restore path failed; falling back to a full build" >&2
  dropdb --force --if-exists "$INCREMENTAL_DB" >/dev/null 2>&1 || true
  rm -f "$CACHE_FILE" "$MANIFEST_FILE"
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
POSTGRES_NAME="$SOURCE_DB" "$PYTHON_BIN" manage.py flush --noinput \
  --settings=betterangels_backend.settings_test
if ! POSTGRES_NAME="$SOURCE_DB" "$PYTHON_BIN" scripts/validate_test_db.py; then
  rm -f "$CACHE_FILE" "$MANIFEST_FILE"
  echo "test DB cache is stale; remove the cache entry and retry" >&2
  exit 1
fi

publish_cache "$SOURCE_DB"
echo "test DB cache: built $CACHE_FILE"
