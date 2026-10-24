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

if [[ "$workers" == "logical" ]]; then
  workers="$(nproc)"
elif [[ "$workers" == "auto" ]]; then
  workers="$("$PYTHON_BIN" -c 'import psutil; print(psutil.cpu_count(logical=False))')"
elif [[ ! "$workers" =~ ^[0-9]+$ ]]; then
  echo "test DB cache: unsupported worker count '$workers'; skipping"
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
BUILD_PREFIX="${BASE_DB}_build"
mkdir -p "$(dirname "$CACHE_FILE")"

cleanup_build_dbs() {
  for i in $(seq 0 $((workers - 1))); do
    dropdb --if-exists "${BUILD_PREFIX}${i}" >/dev/null 2>&1 || true
  done
}
trap cleanup_build_dbs EXIT

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
  rm -f "$CACHE_FILE"
  echo "test DB cache is stale; remove the cache entry and retry" >&2
  exit 1
fi

echo "test DB cache: built $CACHE_FILE"
