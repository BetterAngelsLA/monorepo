# Cline

[Cline](https://github.com/cline/cline) is an AI coding assistant that runs directly in VS
Code. It's included in our dev container so every developer has it available automatically.

For infrastructure details (SSH, GitHub CLI auth, state persistence), see
[devcontainer.md](./devcontainer.md).

## Why Cline

Cline can read, write, edit, and run code across the entire monorepo with full project
context. Combined with SSH agent forwarding, it can do git operations and push directly
to GitHub from inside the container.

## Bring Your Own Key

Cline is **bring your own key** — you use your own API keys and pay only for the tokens you
use. No per-seat licensing.

We're currently testing **Cline + DeepSeek V4** as our recommended workflow. DeepSeek and
Mimo (Moonshot) are dramatically cheaper than Anthropic/OpenAI models — roughly **90% less**
— while still delivering strong results for day-to-day development.

For setup instructions and available models, see the
[Cline documentation](https://docs.cline.bot).

## Remote Browser Control

Cline has a built-in `browser_action` tool that uses Puppeteer to control a headless
Chromium browser. This eliminates the need for external MCP browser servers.

### Supported Actions

| Action          | Description                          |
| --------------- | ------------------------------------ |
| **launch**      | Launch browser and navigate to a URL |
| **click**       | Click at specific x,y coordinates    |
| **type**        | Type text via keyboard               |
| **scroll_down** | Scroll down one page                 |
| **scroll_up**   | Scroll up one page                   |
| **close**       | Close the browser                    |

Cline uses `puppeteer-core` and maintains its own Chromium snapshots at
`~/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/puppeteer/`.

### Using a Remote Chrome Instance

If you want Cline to use a Chrome instance running on your host machine (e.g., for
debugging or to leverage an already-authenticated browser session), you can connect
Cline to Chrome's remote debugging port.

**1. Launch Chrome with Remote Debugging**

On your **host machine**:

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --remote-allow-origins=*

# Linux
google-chrome \
  --remote-debugging-port=9222 \
  --remote-allow-origins=*
```

> **Important:** `--remote-allow-origins=*` is required. Without it, Chrome will reject
> WebSocket connections from the dev container's IP address with a 403 error.

**2. Verify the Connection**

From inside the dev container, confirm Chrome is accessible:

```bash
curl -s -H "Host: localhost" http://192.168.65.254:9222/json/version
```

You should see a JSON response with `"Browser": "Chrome/..."`.

### Built-in vs. MCP Browser Servers

**Cline's native `browser_action` is the recommended approach.** Do **not** add a
separate MCP browser server to `cline_mcp_settings.json`. Cline's built-in tool:

- Uses the same Puppeteer stack natively integrated with Cline's UI
- Requires no external npm packages or MCP server processes
- Supports Cline's `discoverBrowser` and `relaunchChromeDebugMode` commands for
  automatic Chrome discovery

### Troubleshooting

**"Not connected" when using MCP browser tools:** This means Cline's MCP server
process has lost its connection. Since you should be using Cline's native
`browser_action` tool (not an MCP server for browser control), remove any `browser`
entry from `cline_mcp_settings.json`.

**WebSocket 403 Forbidden:**

```
Rejected an incoming WebSocket connection from the http://192.168.65.254:9222 origin.
Use the command line flag --remote-allow-origins=* to allow all origins.
```

Re-launch Chrome with `--remote-allow-origins=*` as shown above.

**Chrome not found in dev container:** Cline may use its own bundled Chromium inside
the container instead of the host's Chrome. This is expected behavior — Cline falls
back to its internal Chromium snapshots when no remote browser is configured.

## GitHub Integration

Cline can read, submit, and comment on pull requests through a GitHub MCP server. The MCP
server auto-detects authentication from the `gh` CLI — no personal access token required.

First, authenticate with GitHub (`gh auth login` — see
[devcontainer.md](./devcontainer.md#github-cli)). The MCP server config is
bootstrapped automatically when the dev container is created. If your container
was created before this automation was added, Cline's `.clinerules` will remind
you to copy it:

```bash
cp docs/cline_mcp_settings.example.json ~/.cline/cline_mcp_settings.json
```

Reload the VS Code window to pick up the new MCP server.

### Available GitHub MCP Tools

Once configured, Cline can use these tools directly (no shell commands needed):

- `create_or_update_file` — create or update a file in a repository
- `search_repositories` — search for GitHub repositories
- `create_repository` — create a new GitHub repository
- `get_file_contents` — get the contents of a file or directory
- `push_files` — push multiple files to a repository in a single commit
- `create_issue` — create a new issue
- `create_pull_request` — create a new pull request
- `create_branch` — create a new branch
- `list_commits` — get a list of commits in a branch
- `list_issues` — list issues
- `update_issue` — update an issue
- `add_issue_comment` — add a comment to an issue or pull request
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
