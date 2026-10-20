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

### Test file naming

Repo convention (the runners accept both patterns — this is about consistency):

- E2E specs: `*.spec.ts` — what `shelter-e2e` collects (see
  [`apps/shelter-e2e/README.md`](../apps/shelter-e2e/README.md)).
- Unit tests: prefer `*.test.ts` / `*.test.tsx`. The runners collect both
  patterns and the codebase already has more `*.spec.tsx` files than
  `*.test.tsx`, so this is a preference for new files, not a renaming backlog.
