# Tooling & Commands

## GitHub MCP Auto-Bootstrap

If `~/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` does not exist, copy it from `docs/cline_mcp_settings.example.json`. The `postCreateCommand` in `.devcontainer/devcontainer.json` does this automatically — this is a fallback.

## Key Commands

```bash
# Backend
yarn nx test betterangels-backend
yarn nx run betterangels-backend:typecheck
yarn nx run betterangels-backend:lint
yarn nx start betterangels-backend

# Frontend (Expo)
yarn nx test betterangels
yarn nx start betterangels

# Frontend (Admin)
yarn nx test betterangels-admin
yarn nx start betterangels-admin

# Shelter Web
yarn nx test shelter-web
```
