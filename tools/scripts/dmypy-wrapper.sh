#!/bin/bash
# Wrapper to inject --timeout 300 into dmypy run commands
args=()
for arg in "$@"; do
    args+=("$arg")
    if [ "$arg" = "run" ]; then
        args+=("--timeout" "300")
    fi
done
exec /workspace/.venv/bin/dmypy "${args[@]}"
