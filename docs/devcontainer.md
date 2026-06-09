# Dev Container

This project uses a VS Code Dev Container to provide a consistent, pre-configured
development environment. All dependencies, tools, and configuration are managed through
Docker so you can start contributing immediately.

## What's Included

- **Python 3.14** with Poetry for dependency management
- **Node.js 22** with Yarn for frontend packages
- **PostgreSQL 17** with PostGIS for spatial data
- **Valkey** (Redis-compatible) for caching and task queues
- **MinIO** (S3-compatible) for local file storage
- **imgproxy** for image resizing and processing
- **Docker-in-Docker** for building and pushing images
- **AWS CLI** and **Session Manager Plugin** for Fargate access

See the [README](../README.md) for the full list of applications and services.

## SSH Agent Setup

VS Code automatically forwards your host's SSH agent into the dev container, so you can
push to GitHub without copying private keys into the container.

For detailed setup and troubleshooting, see [dev_container_ssh.md](./dev_container_ssh.md).

## GitHub CLI

The dev container includes the [GitHub CLI](https://cli.github.com/) (`gh`). Your
authentication token is persisted across container rebuilds via a Docker named volume,
so you only need to authenticate once.

### Authenticating

```bash
gh auth login
```

Follow the interactive prompts. Choose **HTTPS** when asked for your preferred protocol
for Git operations (the repository already uses SSH for git remotes; the CLI token is
used for API calls like creating PRs and issues).

Your token is stored in `~/.config/gh/` which is mounted as the `gh_config` Docker volume.

### Verifying

```bash
gh auth status
```

Should show your GitHub username and confirm `repo` scope.

## State Persistence

All developer tooling state is stored in Docker named volumes and survives container
rebuilds:

| What                  | Volume         | Inside container             |
| --------------------- | -------------- | ---------------------------- |
| GitHub CLI auth       | `gh_config`    | `~/.config/gh/`              |
| Cline settings & data | `cline_data`   | `~/.cline/`                  |
| VS Code user data     | `vscode_user`  | `~/.vscode-server/data/User` |
| Node modules          | `node_modules` | `/workspace/node_modules`    |
| Python virtualenv     | `venv`         | `/workspace/.venv`           |
| PostgreSQL data       | `pgdata`       | _(internal)_                 |
| MinIO data            | `minio_data`   | _(internal)_                 |

### Cline Data Details

The `cline_data` volume backs `~/.cline/` which contains:

- **API keys & settings**: `~/.cline/cline_config.json`
- **MCP server config**: `~/.cline/cline_mcp_settings.json`
- **Task history**: `~/.cline/globalStorage/saoudrizwan.claude-dev/tasks/`
- **Checkpoints**: `~/.cline/globalStorage/saoudrizwan.claude-dev/checkpoints/`

These paths are automatically backed by Docker named volumes, so all state survives
container rebuilds — no manual setup required.

### Clearing Persisted State

If you need to reset any persisted state, you can remove individual Docker volumes:

```bash
# Clear Cline data (API keys, MCP config, task history, checkpoints)
docker volume rm <project>_cline_data

# Clear GitHub CLI auth (requires re-running `gh auth login`)
docker volume rm <project>_gh_config

# Clear VS Code user data (extensions, settings) — useful if VS Code Server updates break things
docker volume rm <project>_vscode_user
```

Replace `<project>` with the Compose project name (usually the directory name, e.g.
`monorepo`). Run `docker volume ls` to see the actual names.

## Cline

[Cline](https://github.com/cline/cline) is an AI coding assistant included in the dev
container. It can read, write, edit, and run code across the entire monorepo with full
project context.

For setup, configuration, and available tools, see [cline.md](./cline.md).
