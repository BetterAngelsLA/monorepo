# AI Instructions — BetterAngels Monorepo

This is the canonical entry point for all AI coding assistants (Copilot, etc.).
Each tool reads its own config file (`.github/copilot-instructions.md`)
which points here.

**Read the following files for full conventions:**

| File                         | Contents                    |
| ---------------------------- | --------------------------- |
| `docs/styleguides/python.md` | Python / Django styleguide  |
| `docs/styleguides/react.md`  | React / Frontend styleguide |
| `docs/tooling.md`            | Commands, MCP bootstrap     |

## Iterative Learning

During a session, if you identify a recurring pattern, convention, or lesson that is not
yet in the styleguides, **proactively suggest it to the developer** as a candidate for
addition. Frame it as: *"I've noticed [pattern]. Should I add this to the styleguide?"*
This keeps the styleguides living documents that improve with every PR review.

---

## Project Overview

This is the BetterAngels monorepo:

| App                    | Stack                                                    |
| ---------------------- | -------------------------------------------------------- |
| `betterangels-backend` | Django + GraphQL (strawberry) + Celery                   |
| `betterangels`         | React Native (Expo)                                      |
| `betterangels-admin`   | React (Vite)                                             |
| `shelter-web`          | React (Vite)                                             |
| `wildfires`            | —                                                        |
| `libs/`                | Shared libraries (Python, React, Expo, Apollo, Tailwind) |

## Critical Environment Rules

- **You are running INSIDE the dev container.** Do NOT use `docker compose` or `docker` commands.
- **Always use the NX wrapper for Python commands.** The backend uses `uv` with a shared venv at `/workspace/.venv`. Use `yarn nx run betterangels-backend:<command>` or `yarn nx test betterangels-backend`. If you MUST run raw Python, use `uv run python ...` — uv handles venv activation automatically.
- See `docs/tooling.md` for the full command reference.

## Before Committing Code

**Always run these three checks before committing any changes:**

```bash
ynx-generate     # regenerate GraphQL schema + types
ynx-lint         # lint all affected projects
ynx-typecheck    # typecheck all affected projects
```

These use `yarn nx affected` under the hood — only changed projects are checked.
All three must pass with zero errors before code is ready to commit.
