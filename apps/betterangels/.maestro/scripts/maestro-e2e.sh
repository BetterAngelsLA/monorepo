#!/usr/bin/env bash

# Fail fast:
# -e : exit immediately if any command fails
# -u : error on use of undefined variables
# -o pipefail : pipelines fail if any command in the pipe fails
set -euo pipefail


# Directory of this script (portable way that works with symlinks and relative execution)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# .maestro root (one directory above /scripts)
MAESTRO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Directory containing Maestro flow files
TEST_DIR="$MAESTRO_ROOT/tests"

# Local env variables for Maestro runs
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
#
# Maestro accepts env vars as:
#   -e KEY=value
#
# We convert each non-empty, non-comment line of the file
# into a "-e KEY=value" pair and store it safely in an array.
#
ENV_ARGS=()

while IFS= read -r line; do
  # skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue

  ENV_ARGS+=("-e" "$line")

done < "$ENV_FILE"


# -----------------------------
# CLI argument parsing
# -----------------------------

# Flags passed directly to the Maestro CLI
# Examples
#   -p ios
#   --platform ios
#   --verbose
#   --verbose -p ios (--verbose come first)
GLOBAL_FLAGS=()

# Optional flow file to run (landing.yml etc)
FLOW=""

# Additional arguments passed after the flow
FLOW_ARGS=()


# Parse arguments provided to this wrapper
while [[ $# -gt 0 ]]; do
  case "$1" in

    # Global Maestro flags (e.g. --verbose, -p ios)
    --*|-p)

      GLOBAL_FLAGS+=("$1")
      shift

      # Some flags require a value (e.g. -p ios)
      # Only consume a second argument if it exists
      # and does not start with "-"
      if [[ "$1" != -* && -n "${1:-}" ]]; then
        GLOBAL_FLAGS+=("$1")
        shift
      fi
      ;;

    # Anything else is treated as a flow file
    *)
      if [[ -z "$FLOW" ]]; then
        FLOW="$1"
      else
        FLOW_ARGS+=("$1")
      fi
      shift
      ;;
  esac
done


# -----------------------------
# Build Maestro command safely
# -----------------------------
#
# We construct the command as an array to avoid shell
# word-splitting bugs and quoting problems.
#
CMD=(maestro)


# Add global flags (if any)
[[ ${#GLOBAL_FLAGS[@]} -gt 0 ]] && CMD+=("${GLOBAL_FLAGS[@]}")


# Add `test` subcommand
CMD+=(test)


# Determine which flow(s) to run
if [[ -z "$FLOW" ]]; then
  # run entire directory
  CMD+=("$TEST_DIR")

else
  # allow "landing" instead of "landing.yml"
  [[ "$FLOW" != *.yml ]] && FLOW="$FLOW.yml"

  CMD+=("$TEST_DIR/$FLOW")
fi


# Inject environment variables
[[ ${#ENV_ARGS[@]} -gt 0 ]] && CMD+=("${ENV_ARGS[@]}")


# Forward additional flow arguments
[[ ${#FLOW_ARGS[@]} -gt 0 ]] && CMD+=("${FLOW_ARGS[@]}")


# Print command for debugging
printf "🚀 Running command:\n"
printf "  %q" "${CMD[@]}"
printf "\n\n"


# -----------------------------
# Execute command
# -----------------------------
"${CMD[@]}"
