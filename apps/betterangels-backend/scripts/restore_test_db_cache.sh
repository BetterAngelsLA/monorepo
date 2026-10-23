#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$APP_ROOT/../.." && pwd)"
cd "$APP_ROOT"

opts="${PYTEST_ADDOPTS:-}"
workers=""
if [[ "$opts" =~ -n[[:space:]]+([^[:space:]]+) ]]; then
  workers="${BASH_REMATCH[1]}"
elif [[ "$opts" =~ --numprocesses=([^[:space:]]+) ]]; then
  workers="${BASH_REMATCH[1]}"
elif [[ "$opts" =~ --numprocesses[[:space:]]+([^[:space:]]+) ]]; then
  workers="${BASH_REMATCH[1]}"
fi

if [[ -z "$workers" ]]; then
  echo "test DB cache: serial run; skipping restore"
  exit 0
fi

PYTHON_BIN="${PYTHON_BIN:-/workspace/.venv/bin/python}"
if [[ ! -x "$PYTHON_BIN" ]]; then
  PYTHON_BIN="$(command -v python)"
fi

if ! pg_dump --version | grep -qE '\(PostgreSQL\) 1[7-9]'; then
  echo "test DB cache: pg_dump is older than the PostgreSQL server; skipping restore"
  exit 0
fi

if [[ "$workers" == "logical" ]]; then
  workers="$(nproc)"
elif [[ "$workers" == "auto" ]]; then
  workers="$("$PYTHON_BIN" -c 'import psutil; print(psutil.cpu_count(logical=False))')"
elif [[ ! "$workers" =~ ^[0-9]+$ ]]; then
  echo "test DB cache: unsupported worker count '$workers'; skipping restore"
  exit 0
fi

if [[ "$opts" =~ --maxprocesses[[:space:]]+([0-9]+) ]]; then
  cap="${BASH_REMATCH[1]}"
  if (( workers > cap )); then
    workers="$cap"
  fi
fi

BASE_DB="${POSTGRES_TEST_NAME:-test_${POSTGRES_NAME:-postgres}}"
export PGHOST="${POSTGRES_HOST:-db}"
export PGUSER="${POSTGRES_USER:-postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
CACHE_FILE="${CACHE_FILE:-$REPO_ROOT/.cache/test-db.dump}"

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
