# Tooling & Commands

## GitHub MCP Auto-Bootstrap

If `~/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` does not exist, copy it from `docs/cline_mcp_settings.example.json`. The `postCreateCommand` in `.devcontainer/devcontainer.json` runs `tools/scripts/post-create.sh` which does this automatically — this is a fallback.

## Key Commands

```bash
# Backend (via NX)
yarn nx test betterangels-backend
yarn nx run betterangels-backend:typecheck
yarn nx run betterangels-backend:lint
yarn nx start betterangels-backend

# Backend (via uv)
uv sync                          # install/sync Python dependencies
uv run python script.py          # run a script within the venv
uv run python manage.py test     # run Django tests directly

# Frontend (Expo)
yarn nx test betterangels
yarn nx start betterangels

# Frontend (Admin)
yarn nx test betterangels-admin
yarn nx start betterangels-admin

# Shelter Web
yarn nx test shelter-web
```
