#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$APP_ROOT/../.." && pwd)"
cd "$APP_ROOT"
source "$SCRIPT_DIR/test_db_common.sh"

PYTHON_BIN="$(test_db_python_bin)"
if ! test_db_pg_dump_ok; then
  echo "test DB cache: pg_dump is older than 17; skipping restore"
  exit 0
fi

if ! workers="$(test_db_workers)"; then
  echo "test DB cache: serial run; skipping restore"
  exit 0
fi
if [[ "$workers" -lt 1 ]]; then
  echo "test DB cache: invalid worker count $workers; skipping restore"
  exit 0
fi

test_db_export_pg_env
BASE_DB="$(test_db_base_db)"
CACHE_FILE="$(test_db_cache_file)"

if [[ ! -f "$CACHE_FILE" ]]; then
  echo "test DB cache: no dump; using normal test DB creation"
  exit 0
fi

echo "test DB cache: restoring $BASE_DB"
dropdb --if-exists "$BASE_DB"
createdb "$BASE_DB"
pg_restore --dbname="$BASE_DB" "$CACHE_FILE"
if ! POSTGRES_NAME="$BASE_DB" "$PYTHON_BIN" scripts/validate_test_db.py; then
  echo "test DB cache is stale; remove the cache entry and retry" >&2
  exit 1
fi

# A template database cannot have open connections while it is cloned.
psql --dbname=postgres -v ON_ERROR_STOP=1 \
  -c "select pg_terminate_backend(pid) from pg_stat_activity where datname = '$BASE_DB' and pid <> pg_backend_pid()" >/dev/null

for i in $(seq 0 $((workers - 1))); do
  dropdb --if-exists "${BASE_DB}_gw${i}"
  createdb --template="$BASE_DB" "${BASE_DB}_gw${i}"
done

echo "test DB cache: prepared ${workers} worker DBs from ${BASE_DB}"
