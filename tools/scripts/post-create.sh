#!/bin/bash
# Devcontainer postCreateCommand — runs once after container is created.
# Results are cached; use "Rebuild Container" to re-run.

set -euo pipefail

echo "=== postCreate: Installing Node dependencies ==="
yarn install

echo "=== postCreate: Installing Python dependencies ==="
poetry install

echo "=== postCreate: Setting up Cline MCP config ==="
mkdir -p ~/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/settings
cp -n docs/cline_mcp_settings.example.json \
  ~/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json

echo "=== postCreate: Syncing VS Code extensions ==="
bash tools/scripts/sync-extensions.sh

echo "=== postCreate: Done ==="
