#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$APP_ROOT/../.." && pwd)"
cd "$APP_ROOT"

opts="${PYTEST_ADDOPTS:-}"
if [[ ! "$opts" =~ -n[[:space:]]+ && ! "$opts" =~ --numprocesses ]]; then
  echo "test DB cache: serial run; skipping"
  exit 0
fi

PYTHON_BIN="${PYTHON_BIN:-/workspace/.venv/bin/python}"
if [[ ! -x "$PYTHON_BIN" ]]; then
  PYTHON_BIN="$(command -v python)"
fi

if ! pg_dump --version | grep -qE '\(PostgreSQL\) 1[7-9]'; then
  echo "test DB cache: pg_dump is older than the PostgreSQL server; skipping"
  exit 0
fi

BASE_DB="${POSTGRES_TEST_NAME:-test_${POSTGRES_NAME:-postgres}}"
export PGHOST="${POSTGRES_HOST:-db}"
export PGUSER="${POSTGRES_USER:-postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
CACHE_FILE="${CACHE_FILE:-$REPO_ROOT/.cache/test-db.dump}"
mkdir -p "$(dirname "$CACHE_FILE")"

echo "test DB cache: building $BASE_DB"
POSTGRES_TEST_NAME="$BASE_DB" "$PYTHON_BIN" scripts/setup_test_db.py
pg_dump --format=custom --dbname="$BASE_DB" --file="$CACHE_FILE"

if ! POSTGRES_NAME="$BASE_DB" "$PYTHON_BIN" scripts/validate_test_db.py; then
  rm -f "$CACHE_FILE"
  echo "test DB cache is stale; remove the cache entry and retry" >&2
  exit 1
fi

echo "test DB cache: built $CACHE_FILE"
