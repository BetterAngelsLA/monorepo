# AGENTS — shelter-web (React + Vite)

Public shelter search site. Canonical rules: `docs/ai-instructions.md` and
[`docs/styleguides/react.md`](../../docs/styleguides/react.md). Adding a **new** Vite
app/static site requires Terraform infra — see
[`docs/frontend_vite_apps.md`](../../docs/frontend_vite_apps.md) before scaffolding.

## Commands (run from the workspace root)

| Task | Command |
| --- | --- |
| Serve | `yarn nx serve shelter-web --port 8083` |
| Tests | `yarn nx test shelter-web` (vitest, node env, globals — `describe/it/expect` without imports) |
| Lint / typecheck | `ynx-lint` · `ynx-typecheck` |

## Test gotchas

- `jest` is NOT installed in this repo — do not run `npx jest`. Vitest only, and always
  through Nx (Vitest's `include` paths are project-root-relative).
- Browser APIs in the node test env: stub via
  `Object.defineProperty(globalThis, 'sessionStorage', { value: mock, configurable: true })`.
- SVGs are stubbed during vitest runs by `svgTestResolver` in `vite.config.mts`
  (active only when `VITEST` is set).
