# Cline

[Cline](https://github.com/cline/cline) is an AI coding assistant that runs directly in VS
Code. It's included in our dev container so every developer has it available automatically.

## Why Cline

Cline can read, write, edit, and run code across the entire monorepo with full project
context. Combined with SSH agent forwarding (see
[dev_container_ssh.md](./dev_container_ssh.md)), it can do git operations and push directly
to GitHub from inside the container.

## Bring Your Own Key

Cline is **bring your own key** — you use your own API keys and pay only for the tokens you
use. No per-seat licensing.

We're currently testing **Cline + DeepSeek V4** as our recommended workflow. DeepSeek and
Mimo (Moonshot) are dramatically cheaper than Anthropic/OpenAI models — roughly **90% less**
— while still delivering strong results for day-to-day development.

For setup instructions and available models, see the
[Cline documentation](https://docs.cline.bot).

## Persistence

All developer tooling state is stored in Docker named volumes and survives container
rebuilds:

| What                | Location (inside container) | Example                                                      |
| ------------------- | --------------------------- | ------------------------------------------------------------ |
| API keys & settings | `~/.cline/`                 | `~/.cline/cline_config.json`                                 |
| MCP server config   | `~/.cline/`                 | `~/.cline/cline_mcp_settings.json`                           |
| Task history        | `~/.cline/globalStorage/`   | `~/.cline/globalStorage/saoudrizwan.claude-dev/tasks/`       |
| Checkpoints         | `~/.cline/globalStorage/`   | `~/.cline/globalStorage/saoudrizwan.claude-dev/checkpoints/` |

These paths are automatically backed by Docker named volumes, so all state survives
container rebuilds — no manual setup required.

## GitHub Integration

Cline can read, submit, and comment on pull requests through a GitHub MCP server. The MCP
server auto-detects authentication from the `gh` CLI — no personal access token required.

### One-time setup

1. Inside the dev container, authenticate with GitHub:

   ```bash
   gh auth login
   ```

   This stores your token in `~/.config/gh/`, which is persisted in a Docker named volume.
   You only need to do this once.

2. Copy the MCP server configuration into your Cline settings:

   ```bash
   cp docs/cline_mcp_settings.example.json ~/.cline/cline_mcp_settings.json
   ```

3. Reload the VS Code window to pick up the new MCP server.

### Available GitHub MCP tools

Once configured, Cline can use these tools directly (no shell commands needed):

- `create_or_update_file` — create or update a file in a repository
- `search_repositories` — search for GitHub repositories
- `create_repository` — create a new GitHub repository
- `get_file_contents` — get the contents of a file or directory
- `push_files` — push multiple files to a repository in a single commit
- `create_issue` — create a new issue
- `create_pull_request` — create a new pull request
- `create_branch` — create a new branch
- `list_commits` — get list of commits in a branch
- `list_issues` — list issues
- `update_issue` — update an issue
- `add_issue_comment` — add a comment to an issue or PR
- `search_code` — search for code across GitHub repositories
- `search_issues` — search for issues and pull requests
- `search_users` — search for users
- `get_issue` — get details of a specific issue
- `get_pull_request` — get details of a specific pull request
- `list_pull_requests` — list pull requests
- `create_pull_request_review` — create a review on a pull request
- `merge_pull_request` — merge a pull request
- `get_pull_request_files` — get the list of files changed in a pull request
- `get_pull_request_status` — get the combined status of all status checks for a pull request
- `update_pull_request_branch` — update a pull request branch with the latest changes from the base branch
- `get_pull_request_comments` — get the comments on a pull request
- `get_pull_request_reviews` — get the reviews on a pull request
