#!/usr/bin/env bash

# Fail fast:
# -e : exit immediately if any command fails
# -u : error on use of undefined variables
# -o pipefail : pipelines fail if any command in the pipe fails
set -euo pipefail


# .maestro root: level above this script
MAESTRO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$MAESTRO_ROOT/tests"
ENV_FILE="$MAESTRO_ROOT/.env.local"


# Ensure Maestro CLI exists before running anything
if ! command -v maestro >/dev/null 2>&1; then
  echo "🛑 Maestro CLI not found. Run from host machine."
  exit 1
fi


# Ensure env file exists (keeps config predictable)
if [[ ! -f "$ENV_FILE" ]]; then
  echo "🛑 Missing $ENV_FILE"
  exit 1
fi


# -----------------------------
# Load env vars from .env.local
# -----------------------------

# Maestro accepts env vars as:
#   -e KEY=value
#
# Convert each non-empty, non-comment line of the file
# into a "-e KEY=value" pair and store it safely in an array.
#
ENV_ARGS=()

while IFS= read -r line; do
  # skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  ENV_ARGS+=("-e" "$line")

done < "$ENV_FILE"


# -----------------------------
# Parse CLI arguments
# -----------------------------

# Flags passed directly to the Maestro CLI
# Examples
#   -p ios
#   --verbose
#   --verbose -p android
GLOBAL_FLAGS=()

# Optional test file to run (landing.yml etc)
TEST_FILE=""

# Additional arguments passed through to the Maestro CLI
TEST_ARGS=()


# Parse arguments provided to this wrapper
while [[ $# -gt 0 ]]; do
  case "$1" in

    # Platform flags
    -p|--platform)

      FLAG="$1"
      GLOBAL_FLAGS+=("$FLAG")
      shift

      # Some flags require a value (e.g. -p ios)
      # Only consume a second argument if it exists
      # and does not start with "-"
      if [[ $# -gt 0 && "$1" != -* ]]; then
        VALUE="$1"
        GLOBAL_FLAGS+=("$VALUE")

        shift
      fi
      ;;

    # Other global flags (e.g. --verbose)
    --*)
      GLOBAL_FLAGS+=("$1")
      shift
      ;;

    # Anything else is treated as a test file
    *)
      if [[ -z "$TEST_FILE" ]]; then
        TEST_FILE="$1"
      else
        TEST_ARGS+=("$1")
      fi
      shift
      ;;
  esac
done


# Default to iOS if neither -p nor --platform was provided
HAS_PLATFORM_FLAG=false

for flag in "${GLOBAL_FLAGS[@]-}"; do
  if [[ "$flag" == "-p" || "$flag" == "--platform" ]]; then
    HAS_PLATFORM_FLAG=true
    break
  fi
done

if [[ "$HAS_PLATFORM_FLAG" == false ]]; then
  GLOBAL_FLAGS+=("-p" "ios")
fi

# -----------------------------
# Build Maestro command
# -----------------------------

# Construct the Maestro command.
#
# Final command produced:
#   maestro [GLOBAL_FLAGS] test [TEST_PATH] [ENV_ARGS] [TEST_ARGS]
#
# Which corresponds to the Maestro CLI pattern:
#   maestro [options] [subcommand] [subcommand options]
#
# Example:
#   maestro -p ios test tests/landing.yml \
#     -e MAESTRO_DEEPLINK=... \
#     --debug-output
#
# Build the command as an array to avoid shell quoting issues.
CMD=(maestro)

# Add global flags (if any)
CMD+=("${GLOBAL_FLAGS[@]}")

# Add `test` subcommand
CMD+=(test)


# Determine which test(s) to run
if [[ -z "$TEST_FILE" ]]; then
  # run entire directory
  CMD+=("$TEST_DIR")
else
  # accept both "landing.yml" and "landing" (all test files are .yml)
  [[ "$TEST_FILE" != *.yml ]] && TEST_FILE="$TEST_FILE.yml"

  CMD+=("$TEST_DIR/$TEST_FILE")
fi


# Add environment variables (-e KEY=value)
[[ ${#ENV_ARGS[@]} -gt 0 ]] && CMD+=("${ENV_ARGS[@]}")


# Forward additional CLI arguments
[[ ${#TEST_ARGS[@]} -gt 0 ]] && CMD+=("${TEST_ARGS[@]}")


# Print command for debugging
printf "🚀 Running command:\n"
printf "  %q" "${CMD[@]}"
printf "\n\n"


# -----------------------------
# Execute command
# -----------------------------
"${CMD[@]}"
