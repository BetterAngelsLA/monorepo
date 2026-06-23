#!/bin/bash
# Syncs VS Code extensions to match devcontainer.json exactly.
# Installs missing extensions, uninstalls extras.
# Designed to fail gracefully — never blocks container startup.

DEV_CONTAINER="/workspace/.devcontainer/devcontainer.json"

if [ ! -f "$DEV_CONTAINER" ]; then
  echo "[sync-extensions] No devcontainer.json found, skipping."
  exit 0
fi

# Extract expected extensions from devcontainer.json (try python3, fall back to python)
EXPECTED=""
for py in python3 python; do
  if command -v "$py" &>/dev/null; then
    EXPECTED=$("$py" -c "
import json, sys
try:
    with open('$DEV_CONTAINER') as f:
        config = json.load(f)
    exts = config.get('customizations', {}).get('vscode', {}).get('extensions', [])
    for e in exts:
        print(e)
except Exception as ex:
    print(f'ERROR: {ex}', file=sys.stderr)
    sys.exit(0)
" 2>/dev/null) || EXPECTED=""
    break
  fi
done

if [ -z "$EXPECTED" ]; then
  echo "[sync-extensions] Could not parse devcontainer.json, skipping."
  exit 0
fi

# Get currently installed extensions
INSTALLED=$(code --list-extensions 2>/dev/null) || INSTALLED=""

if [ -z "$INSTALLED" ]; then
  echo "[sync-extensions] code CLI not available yet, skipping."
  exit 0
fi

# Install missing
echo "[sync-extensions] Syncing extensions..."
while IFS= read -r ext; do
  [ -z "$ext" ] && continue
  if ! echo "$INSTALLED" | grep -qxF "$ext"; then
    echo "[sync-extensions] Installing: $ext"
    code --install-extension "$ext" --force 2>&1 || echo "[sync-extensions] Failed to install $ext (non-fatal)"
  fi
done <<< "$EXPECTED"

# Uninstall extra
while IFS= read -r ext; do
  [ -z "$ext" ] && continue
  if ! echo "$EXPECTED" | grep -qxF "$ext"; then
    case "$ext" in
      vscode.*|ms-vscode.*|GitHub.*) continue ;;
    esac
    echo "[sync-extensions] Uninstalling: $ext"
    code --uninstall-extension "$ext" 2>&1 || echo "[sync-extensions] Failed to uninstall $ext (non-fatal)"
  fi
done <<< "$INSTALLED"

echo "[sync-extensions] Done."
