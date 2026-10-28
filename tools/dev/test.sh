#!/usr/bin/env bash
# Test runner for this monorepo. Backs `make test` and works standalone.
#
# Usage:
#   tools/dev/test.sh [TARGET] [RUNNER_ARGS...]
#
#   (no target)    shows help — nothing runs
#   all            every project's `test` target        (nx run-many -t test)  - excludes maestro
#   be             backend pytest suite                 (nx test betterangels-backend)
#   fe             every frontend project                (nx run-many -t test --exclude=betterangels-backend)
#   e2e            every Playwright app, all specs      (apps/*/playwright.config.ts) - excludes maestro
#   maestro        HOST only — Maestro e2e for the mobile app
#                    make test maestro ios|android (i|a)               full suite
#                    make test maestro ios|android (i|a) <file path>   one test file
#   <project>      any project listed below, validated before use — its `e2e`
#                  target for Playwright projects, its `test` target otherwise
#   <file>         the project owning <file>, only that file. Resolved from the
#                  repo root (git top level): absolute (/workspace/apps/...),
#                  root-relative (apps/...), or project-relative (tests/...);
#                  a host-absolute path is translated for the container.
#                  A Maestro test file (apps/betterangels/.maestro/**/*.yml)
#                  runs on iOS — host only.
#
#   RUNNER_ARGS go to whichever runner the target uses: nx, pytest or playwright.

set -euo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "Error: not inside a git checkout" >&2
  exit 1
}
cd "$root"

usage() {
  awk '/^# Usage:/{f=1} f && /^$/{exit} f {sub(/^# ?/,""); print}' "$0"
}

# The project set is nx's, never a list kept here.
known_projects() {
  yarn nx show projects 2>/dev/null | sort
}

# Appended to the help output only: costs an nx call, so keep it off error paths.
list_projects() {
  local list
  list=$(known_projects || true)
  [[ -n "$list" ]] || return 0
  echo ""
  echo "Projects — any of these works as <project>:"
  # pr columnises; fall back to one per line where it is missing or differs.
  local out
  if command -v pr >/dev/null; then
    out=$(printf '%s\n' "$list" | pr -3 -t -w 100 2>/dev/null) && {
      printf '%s\n' "$out"
      return 0
    }
  fi
  printf '%s\n' "$list"
}

die() {
  echo "Error: $*" >&2
  echo "" >&2
  usage >&2
  exit 1
}

# Playwright apps, as absolute paths (a project is one iff it has a config).
playwright_apps() {
  local cfg
  for cfg in "$root"/apps/*/playwright.config.ts; do
    [[ -f "$cfg" ]] && printf '%s\n' "${cfg%/playwright.config.ts}"
  done
}

# Maestro owns its own CLI (platform, flow, --verbose) in tools/dev/test-maestro.sh.
run_maestro() {
  exec "$root/tools/dev/test-maestro.sh" "$@"
}

# Nearest ancestor directory (relative to the repo root) holding a project.json.
project_dir_for() {
  local dir
  dir=$(dirname "$1")
  while [[ "$dir" != "." && "$dir" != "/" ]]; do
    if [[ -f "$root/$dir/project.json" ]]; then
      printf '%s\n' "$dir"
      return
    fi
    dir=$(dirname "$dir")
  done
}

project_name_for() {
  grep -m1 '"name"' "$root/$1/project.json" |
    sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/'
}

# Absolute path for a file argument, empty when nothing matches.
resolve_file() {
  local t="$1" f
  if [[ -f "$t" ]]; then
    (cd "$(dirname "$t")" && printf '%s/%s\n' "$PWD" "$(basename "$t")")
    return
  fi
  if [[ -f "$root/$t" ]]; then
    printf '%s\n' "$root/$t"
    return
  fi
  while IFS= read -r f; do
    if [[ -f "$f/$t" ]]; then
      printf '%s\n' "$f/$t"
      return
    fi
  done < <(playwright_apps)
  for f in "$root"/apps/*/ "$root"/libs/*/; do
    if [[ -f "$f$t" ]]; then
      printf '%s\n' "$f$t"
      return
    fi
  done
}

target="${1:-}"
if [[ $# -gt 0 ]]; then shift; fi

case "$target" in
"" | -h | --help | help)
  usage
  list_projects
  exit 0
  ;;
all)
  exec yarn nx run-many -t test
  ;;
be | backend)
  exec yarn nx test betterangels-backend "$@"
  ;;
fe | frontend)
  exec yarn nx run-many -t test --exclude=betterangels-backend "$@"
  ;;
esac

# POSIX-ish read loop rather than mapfile: macOS ships bash 3.2.
pw_apps=()
while IFS= read -r pw_app; do
  pw_apps+=("$pw_app")
done < <(playwright_apps)

if [[ "$target" == "pw" || "$target" == "playwright" || "$target" == "e2e" ]]; then
  ((${#pw_apps[@]})) || die "no Playwright apps found (apps/*/playwright.config.ts)"
  status=0
  for app in "${pw_apps[@]}"; do
    echo "▶ ${app#"$root"/}"
    yarn playwright test -c "$app" "$@" || status=1
  done
  exit "$status"
fi

case "$target" in
maestro)
  run_maestro "$@"
  ;;
esac

# 1) a spec / test file
file=$(resolve_file "$target" || true)
if [[ -n "$file" ]]; then
  rel="${file#"$root"/}"

  case "$rel" in
  apps/betterangels-backend/*)
    (cd "$root/apps/betterangels-backend" && exec uv run pytest "${rel#apps/betterangels-backend/}" "$@")
    ;;
  apps/betterangels/.maestro/*)
    # cwd for the e2e executor is apps/betterangels; test-maestro.sh normalises it
    run_maestro "$rel" "$@"
    ;;
  esac

  if ((${#pw_apps[@]})); then
    for app in "${pw_apps[@]}"; do
      if [[ "$file" == "$app"/* ]]; then
        exec yarn playwright test -c "$app" "${file#"$app"/}" "$@"
      fi
    done
  fi

  proj_dir=$(project_dir_for "$rel")
  [[ -n "$proj_dir" ]] || die "no project owns '$rel'"
  proj=$(project_name_for "$proj_dir")
  [[ -n "$proj" ]] || die "could not read the project name from '$proj_dir/project.json'"

  # jest wants a path pattern, vitest takes the path positionally
  if compgen -G "$root/$proj_dir/jest.config.*" >/dev/null; then
    exec yarn nx test "$proj" --testPathPattern="$rel" "$@"
  fi
  exec yarn nx test "$proj" -- "$rel" "$@"
fi

# 2) a project name
if known_projects | grep -qx -- "$target"; then
  if [[ -f "$root/apps/$target/playwright.config.ts" ]]; then
    exec yarn nx run "$target:e2e" "$@"
  fi
  exec yarn nx test "$target" "$@"
fi

die "don't know how to test '$target'"
