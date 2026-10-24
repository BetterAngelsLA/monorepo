#!/usr/bin/env bash
# Shared helpers for the cached test database scripts.

test_db_python_bin() {
  local bin="${PYTHON_BIN:-/workspace/.venv/bin/python}"
  if [[ -x "$bin" ]]; then
    printf '%s\n' "$bin"
  else
    command -v python
  fi
}

test_db_workers() {
  local raw="${TEST_DB_WORKERS:-}"
  local opts="${PYTEST_ADDOPTS:-}"

  if [[ -z "$raw" ]]; then
    if [[ "$opts" =~ -n[[:space:]]+([^[:space:]]+) ]]; then
      raw="${BASH_REMATCH[1]}"
    elif [[ "$opts" =~ --numprocesses=([^[:space:]]+) ]]; then
      raw="${BASH_REMATCH[1]}"
    elif [[ "$opts" =~ --numprocesses[[:space:]]+([^[:space:]]+) ]]; then
      raw="${BASH_REMATCH[1]}"
    fi
  fi

  if [[ -z "$raw" ]]; then
    return 1
  fi

  if [[ "$raw" == "logical" ]]; then
    raw="$(nproc)"
  elif [[ "$raw" == "auto" ]]; then
    raw="$("$(test_db_python_bin)" -c 'import psutil; print(psutil.cpu_count(logical=False))')"
  elif [[ ! "$raw" =~ ^[0-9]+$ ]]; then
    return 2
  fi

  if [[ "$opts" =~ --maxprocesses[[:space:]]+([0-9]+) ]]; then
    local cap="${BASH_REMATCH[1]}"
    if (( raw > cap )); then
      raw="$cap"
    fi
  fi

  printf '%s\n' "$raw"
}

test_db_pg_dump_ok() {
  local version
  version="$(pg_dump --version | sed -nE 's/.*PostgreSQL\) ([0-9]+).*/\1/p')"
  [[ -n "$version" ]] && (( version >= 17 ))
}

test_db_export_pg_env() {
  export PGHOST="${POSTGRES_HOST:-db}"
  export PGUSER="${POSTGRES_USER:-postgres}"
  export PGPASSWORD="${POSTGRES_PASSWORD:-postgres}"
}

test_db_base_db() {
  printf '%s\n' "${POSTGRES_TEST_NAME:-test_${POSTGRES_NAME:-postgres}}"
}

test_db_cache_file() {
  printf '%s\n' "${CACHE_FILE:-$REPO_ROOT/.cache/test-db.dump}"
}

test_db_manifest_file() {
  printf '%s\n' "${MANIFEST_FILE:-$REPO_ROOT/.cache/test-db.manifest.json}"
}
