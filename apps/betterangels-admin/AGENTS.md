# AGENTS — betterangels-admin (React + Vite + antd)

Admin portal. Canonical rules: `docs/ai-instructions.md` and
[`docs/styleguides/react.md`](../../docs/styleguides/react.md). Adding a **new** Vite
app/static site requires Terraform infra — see
[`docs/frontend_vite_apps.md`](../../docs/frontend_vite_apps.md) before scaffolding.

## Commands (run from the workspace root)

| Task | Command |
| --- | --- |
| Serve | `yarn nx serve betterangels-admin --port 8084` |
| Tests | `yarn nx test betterangels-admin` (vitest via Nx) |
| Lint / typecheck | `ynx-lint` · `ynx-typecheck` |

## Conventions

- UI kit is antd (v6); charts via `@ant-design/charts`. Shared admin components live in
  `libs/react/betterangels-admin`.
- The React styleguide applies in full (named exports, hooks colocating `.graphql`,
  `mergeCss`, early returns over ternaries, `??` over `||`).
- Same test gotchas as shelter-web: no jest, stub browser APIs in the node env, run
  vitest through Nx.
