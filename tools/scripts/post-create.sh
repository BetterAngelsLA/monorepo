#!/bin/bash
# Devcontainer postCreateCommand — runs once after container is created.
# Results are cached; use "Rebuild Container" to re-run.

set -euo pipefail

echo "=== postCreate: Installing Node dependencies ==="
yarn install

echo "=== postCreate: Installing Python dependencies ==="
uv sync

echo "=== postCreate: Syncing VS Code extensions ==="
bash tools/scripts/sync-extensions.sh

echo "=== postCreate: Done ==="
