#!/usr/bin/env bash
# Maestro e2e for the mobile app (apps/betterangels). HOST only — it drives a
# simulator/emulator, which the dev container does not have.
#
# Usage:
#   make test maestro                        help
#   make test maestro ios (i)                full suite, iOS
#   make test maestro android (a)            full suite, Android
#   make test maestro <file path>            one test file, iOS
#   make test maestro android <file path>    one test file, Android

set -euo pipefail

root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "Error: not inside a git checkout" >&2
  exit 1
}

platform="ios"
verbose=""
flow=""
run_all=0
dry_run=0

while [[ $# -gt 0 ]]; do
  case "$1" in
  -h | --help | help)
    awk '/^# Usage:/{f=1} f && /^$/{exit} f {sub(/^# ?/,""); print}' "$0"
    exit 0
    ;;
  -p | --platform)
    platform="${2:-}"
    [[ -n "$platform" ]] || {
      echo "Error: -p needs a platform (ios or android)" >&2
      exit 2
    }
    shift 2
    ;;
  --verbose)
    verbose="--verbose"
    shift
    ;;
  ios | i)
    platform="ios"
    run_all=1
    shift
    ;;
  android | a)
    platform="android"
    run_all=1
    shift
    ;;
  --dry-run)
    dry_run=1
    shift
    ;;
  *)
    [[ -n "$flow" ]] || flow="$1"
    shift
    ;;
  esac
done

# No arguments means "show me the usage", matching `make` and `make test`.
if [[ -z "$flow" ]] && ((!run_all)); then
  awk '/^# Usage:/{f=1} f && /^$/{exit} f {sub(/^# ?/,""); print}' "$0"
  exit 0
fi

# Fail here rather than inside Maestro when the argument is not a test file.
if [[ -n "$flow" && ! -f "$root/apps/betterangels/$flow" ]]; then
  echo "Error: '$flow' is not a test file (looked for apps/betterangels/$flow)." >&2
  echo "Expected one of: ios | i | android | a | <file path>" >&2
  exit 2
fi

# Normalise a flow path to the executor's cwd (apps/betterangels).
case "$flow" in
"") ;;
"$root"/apps/betterangels/*) flow="${flow#"$root"/apps/betterangels/}" ;;
apps/betterangels/*) flow="${flow#apps/betterangels/}" ;;
esac

target="betterangels:e2e:$platform"

if [[ -n "$verbose" && -n "$flow" ]]; then
  cmd=(yarn nx run "$target" --args="$verbose $flow")
elif [[ -n "$verbose" ]]; then
  cmd=(yarn nx run "$target" --args="$verbose")
elif [[ -n "$flow" ]]; then
  cmd=(yarn nx run "$target" -- "$flow")
else
  cmd=(yarn nx run "$target")
fi

if ((dry_run)); then
  printf '%s\n' "${cmd[*]}"
  exit 0
fi

if [[ -f /.dockerenv ]]; then
  echo "Error: Maestro needs a simulator/emulator — run this from the HOST, not inside the container." >&2
  exit 1
fi

exec "${cmd[@]}"
