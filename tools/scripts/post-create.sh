#!/bin/bash
# Devcontainer postCreateCommand — runs once after container is created.
# Results are cached; use "Rebuild Container" to re-run.

set -euo pipefail

echo "=== postCreate: Installing Node dependencies ==="
yarn install

echo "=== postCreate: Installing Playwright browsers (shelter-e2e) ==="
# The `development` image already carries Chromium, but `dev_home` is a named
# volume over /home/betterangels: an existing volume shadows the baked cache, so
# this is what makes the browser appear there. Non-fatal on purpose — a CDN blip
# or a rate limit would otherwise fail the whole postCreateCommand, and only the
# e2e suites need the browser.
yarn playwright install chromium \
  || echo "⚠️  Could not install the Playwright browser. Run 'yarn playwright install chromium' if you need e2e."

echo "=== postCreate: Installing Python dependencies ==="
uv sync

echo "=== postCreate: Syncing VS Code extensions ==="
bash tools/scripts/sync-extensions.sh

echo "=== postCreate: Done ==="
