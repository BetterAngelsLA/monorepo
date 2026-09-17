# Tooling & Commands

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
uv run pytest                    # run Django tests
uv run pytest --reuse-db          # skip DB setup (default), add --create-db to rebuild

# Frontend (Expo)
yarn nx test betterangels
yarn nx start betterangels

# Frontend (Admin)
yarn nx test betterangels-admin
yarn nx start betterangels-admin

# Shelter Web
yarn nx test shelter-web

# Shelter E2E (Playwright) — see apps/shelter-e2e/README.md
yarn nx run shelter-e2e:e2e
```

## Agent Browser Testing (Playwright MCP)

Workspace MCP configuration for agent-driven browser checks lives in
`.vscode/mcp.json`. See [`docs/agent_browser_testing/`](agent_browser_testing/README.md)
for setup, usage, and the approaches review.
