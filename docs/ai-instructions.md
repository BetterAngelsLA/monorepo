# AI Instructions — BetterAngels Monorepo

This is the canonical entry point for all AI coding assistants (Cline, Copilot, etc.).
Each tool reads its own config file (`.clinerules`, `.github/copilot-instructions.md`)
which points here.

**Read the following files for full conventions:**

| File                         | Contents                    |
| ---------------------------- | --------------------------- |
| `docs/styleguides/nx.md`     | NX monorepo styleguide      |
| `docs/styleguides/python.md` | Python / Django styleguide  |
| `docs/styleguides/react.md`  | React / Frontend styleguide |
| `docs/tooling.md`            | Commands, MCP bootstrap     |

## Iterative Learning

During a session, if you identify a recurring pattern, convention, or lesson that is not
yet in the styleguides, **proactively suggest it to the developer** as a candidate for
addition. Frame it as: _"I've noticed [pattern]. Should I add this to the styleguide?"_
This keeps the styleguides living documents that improve with every PR review.

---

## Monorepo Architecture

This is the BetterAngels monorepo, managed with [Nx](https://nx.dev). See
`docs/styleguides/nx.md` for library organization, tagging conventions,
folder structure, and dependency constraints.

| App / Lib              | Stack                                                    |
| ---------------------- | -------------------------------------------------------- |
| `betterangels-backend` | Django + GraphQL (strawberry) + Celery                   |
| `betterangels`         | React Native (Expo)                                      |
| `betterangels-admin`   | React (Vite)                                             |
| `shelter-web`          | React (Vite)                                             |
| `wildfires`            | —                                                        |
| `libs/`                | Shared libraries (Python, React, Expo, Apollo, Tailwind) |

## Critical Environment Rules

- **You are running INSIDE the dev container.** Do NOT use `docker compose` or `docker` commands.
  All services (Django, PostgreSQL, MinIO, etc.) are already running and accessible.
- **Always use the NX wrapper for Python commands.** The backend uses Poetry with a shared
  virtual environment at `/workspace/.venv`. Use `yarn nx run betterangels-backend:<command>`
  or `yarn nx test betterangels-backend`. If you MUST run raw Python, activate the shared
  venv first: `source /workspace/.venv/bin/activate && python ...`.

## Project-Specific Conventions

- The backend uses Django with GraphQL. The frontend uses React Native (Expo) and React (Vite).
- Always run backend tests with `yarn nx test betterangels-backend` and frontend tests with
  `yarn nx test betterangels` or `yarn nx test shelter-web`.

## Before Committing Code

**Always run these checks before committing any changes:**

```bash
yarn nx affected -t lint       # lint all affected projects
yarn nx affected -t test       # test all affected projects
yarn nx affected -t typecheck  # typecheck all affected projects (if applicable)
```

All three must pass with zero errors before code is ready to commit.
