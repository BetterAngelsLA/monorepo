# Remote Browser Control with Cline

Cline has a built-in `browser_action` tool that uses Puppeteer to control a headless
Chromium browser. This eliminates the need for external MCP browser servers.

## How It Works

Cline's native `browser_action` tool supports these actions:

| Action        | Description                     |
|---------------|---------------------------------|
| **launch**    | Launch browser and navigate to a URL |
| **click**     | Click at specific x,y coordinates     |
| **type**      | Type text via keyboard          |
| **scroll_down** | Scroll down one page          |
| **scroll_up**  | Scroll up one page            |
| **close**     | Close the browser               |

Cline uses `puppeteer-core` and maintains its own Chromium snapshots at
`~/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/puppeteer/`.

## Using a Remote Chrome Instance

If you want Cline to use a Chrome instance running on your host machine (e.g., for
debugging or to leverage an already-authenticated browser session), you can connect
Cline to Chrome's remote debugging port.

### 1. Launch Chrome with Remote Debugging

On your **host machine** (macOS/Linux/Windows), launch Chrome with:

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

### 2. Verify the Connection

From inside the dev container, confirm Chrome is accessible:

```bash
curl -s -H "Host: localhost" http://192.168.65.254:9222/json/version
```

You should see a JSON response with `"Browser": "Chrome/..."`.

## Built-in vs. MCP Browser Servers

**Cline's native `browser_action` is the recommended approach.** Do **not** add a
separate MCP browser server to `cline_mcp_settings.json`. Cline's built-in tool:

- Uses the same Puppeteer stack natively integrated with Cline's UI
- Requires no external npm packages or MCP server processes
- Supports Cline's `discoverBrowser` and `relaunchChromeDebugMode` commands for
  automatic Chrome discovery

## Troubleshooting

### "Not connected" when using MCP browser tools

This means Cline's MCP server process has lost its connection. Since you should be
using Cline's native `browser_action` tool (not an MCP server for browser control),
remove any `browser` entry from `cline_mcp_settings.json`.

### WebSocket 403 Forbidden

```
Rejected an incoming WebSocket connection from the http://192.168.65.254:9222 origin.
Use the command line flag --remote-allow-origins=* to allow all origins.
```

Re-launch Chrome with `--remote-allow-origins=*` as shown above.

### Chrome not found in dev container

Cline may use its own bundled Chromium inside the container instead of the host's
Chrome. This is expected behavior — Cline falls back to its internal Chromium snapshots
when no remote browser is configured.