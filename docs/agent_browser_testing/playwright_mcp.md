# Agent Browser Testing — Playwright MCP

This repo ships a workspace-level [MCP](https://modelcontextprotocol.io/) server
configuration that gives AI agents a **real Chromium browser** while working inside
the dev container. Agents can then load deployed web apps (branch previews, DEV,
and other environments), resize the viewport, inspect pages through the
accessibility tree, take screenshots, and interact with the UI — driven by the same
Playwright engine our e2e suite uses.

- Configuration: [`.vscode/mcp.json`](../../.vscode/mcp.json)
- Server: [`@playwright/mcp`](https://github.com/microsoft/playwright-mcp) (Apache-2.0, free)

## Why this exists

Agent-led sanity checks of `shelter-web` (and friends) were previously limited by
the built-in page tooling an agent has in VS Code. Real limitations observed during
the first walkthrough of the `SDB-277` branch preview:

| Limitation                                               | Impact                                                                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| No viewport control — pages render at an arbitrary width | Desktop-only UI (e.g. the `hidden lg:flex` nav links in `Navigation.tsx`) is invisible; md/lg layouts can't be reviewed |
| No clicking / typing                                     | Interactive states, like the sign-in button's enabled/disabled logic, can only be read in code — not exercised          |
| No console/network visibility                            | React errors, failed GraphQL calls, and 404s go unnoticed                                                               |
| Snapshot timing                                          | Async init (geolocation → map idle → shelter query) can be captured mid-flight, making state-dependent copy look wrong  |

A real browser fixes all four without changing application code.

## Where the configuration lives

`.vscode/mcp.json` is committed to the repo, so every teammate gets the server
when they open the workspace (VS Code prompts to trust it the first time it
starts). Note: `.vscode/*` is ignored in `.gitignore` with a small allowlist —
`mcp.json` was added to that allowlist.

The server itself is not installed per-project: VS Code launches it on demand via
`npx` inside the dev container and shuts it down when idle. Nothing runs otherwise.

### Current configuration

```json
{
  "servers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--headless", "--isolated", "--viewport-size=1440x900"]
    }
  }
}
```

Flag rationale:

| Arg                         | Why                                                                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `-y @playwright/mcp@latest` | Fetch/update the server without prompting. Pin an explicit version instead if reproducibility matters more than freshness.                                                                                            |
| `--headless`                | The dev container has no display server. The server is headed by default and would otherwise need a DISPLAY or the HTTP-transport workaround.                                                                         |
| `--isolated`                | In-memory browser profile: no cookies/state persist between sessions, and concurrent agent sessions don't fight over the persistent profile lock. Drop this flag locally if you want logins to stick across sessions. |
| `--viewport-size=1440x900`  | Comfortable desktop default — our `lg` breakpoint is 1152px (see `apps/shelter-web/src/assets/styles/global.css`). Agents resize per check.                                                                           |

Useful optional flags (full list in the
[server README](https://github.com/microsoft/playwright-mcp)):

- `--device="iPhone 15"` / `--mobile` — device emulation
- `--grant-permissions=geolocation` — needed for map pages that call `getCurrentPosition`
- `--storage-state=<file>` — pre-seeded cookies/localStorage for logged-in checks
- `--secrets=<dotenv>` — keep credentials out of chat/tool calls
- `--console-level=error` — reduce console noise returned to the model
- `--allowed-origins` / `--blocked-origins` — scope where the browser may navigate
- `--no-sandbox` — fallback if Chromium fails to launch inside the container

## Getting started

1. Open the repo in VS Code (dev container attached).
2. The first time an agent uses a browser tool, VS Code asks to trust the server —
   allow it. Manage later via `MCP: List Servers` (start/stop, **Show Output** for
   logs; `MCP: Reset Trust` revokes).
3. First run downloads a Chromium build (~150 MB, once).
4. Ask the agent for a browser task, e.g.:

   > Open `https://shelter.dev.betterangels.la/branches/<branch>/`, resize the
   > viewport to 1440×900, take a screenshot, and tell me whether the desktop nav
   > links ("Home", "About Us", "Watch Video", "Sign In") are visible.

5. Individual browser tools can be toggled per chat via the **Configure Tools**
   button in the chat input.

### Troubleshooting

| Symptom                          | Fix                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Server fails to start            | `MCP: List Servers` → Show Output. Common cause: the initial `npx` fetch had no network access. |
| Chromium fails to launch         | `npx playwright install chromium` (add `--with-deps` if system libraries are missing).          |
| Sandbox errors in the container  | Add `--no-sandbox` to the args (container-only; prefer fixing deps first).                      |
| Stale tools after editing config | Restart the server from `MCP: List Servers`, or enable `chat.mcp.autostart`.                    |

## Viewport playbook

Our web breakpoints (Tailwind v4 `@theme` in
`apps/shelter-web/src/assets/styles/global.css`):

| Name | Width  | Use for                                                    |
| ---- | ------ | ---------------------------------------------------------- |
| `sm` | 375px  | phone                                                      |
| `md` | 768px  | tablet                                                     |
| `lg` | 1152px | desktop (`lg:` utilities activate — e.g. nav links appear) |

Example prompts:

- **Desktop review:** "Resize to 1440×900 and 1152×900, screenshot both, and report any layout differences."
- **Mobile review:** "Resize to 375×844 and list what's hidden compared to desktop."
- **Interaction check:** "Click 'Sign In' and type `someone@example.org`; is the submit button enabled? Then try `someone@example.com`."
- **Error check:** "Load the home page and report console errors and failed network requests."

## Auth-gated pages

The `shelter-web` sign-in has a built-in password mode for `@example.com`
addresses (no email-code round trip — see `SignIn.tsx`), and local dev seeds
`admin@example.com` / `agent@example.com` (password `password`) via
`accounts/signals.py`, gated behind `settings.IS_LOCAL_DEV`.

For deployed DEV / preview environments:

1. Seed (or have an admin assign a password to) a **dedicated dev-only account**
   with an `@example.com` address, guarded by environment settings so it can
   never exist in production.
2. Give the agent's browser a session:
   - Recommended: `--storage-state=<file>` — cookies/localStorage captured from a
     login performed once (see [Playwright auth docs](https://playwright.dev/docs/auth)).
   - Or drop `--isolated` locally and use a persistent profile: log in once, stay
     logged in across sessions.
3. Keep credentials out of chat: put them in a dotenv file and pass
   `--secrets=<file>`, or use `--storage-state`.

> **Not an auth bypass:** the `+demo@` email tag is mobile-app environment routing
> (waffle switch `demo_login_email`; the web app simply strips it in
> `stripDemoTag`). Don't build login automation on it.

## Security & guardrails

- The MCP server runs locally and drives a local browser; it is **not a security
  boundary**. VS Code asks for trust before the first start; review the config if
  in doubt.
- The workspace default is `--isolated`, so nothing persists between sessions.
  Use `--allowed-origins` / `--blocked-origins` if navigation should be constrained.
- Prefer branch previews and DEV. Avoid logging into production surfaces from
  agent sessions; if prod pages must be checked, keep them anonymous.
- Page content (accessibility snapshots, screenshots, console output) is sent to
  whichever model powers the agent session — treat it like sharing a screenshot
  in chat.

## Costs

- MCP server, Playwright, Chromium: **free** (open source), plus a one-time
  ~150 MB browser download.
- Local compute: one headless Chromium while a session runs.
- Model usage: the agent session consumes tokens from whichever model/billing
  path the session uses (Copilot plan credits, or a bring-your-own-key endpoint,
  e.g. a self-managed DeepSeek configuration). Browser snapshots are token-heavy —
  prefer targeted extraction on large pages, and close the browser when done.

## Relationship to scripted Playwright (CI)

This setup is the **interactive** arm of browser testing; it complements — and
feeds — the scripted suite:

- `apps/betterangels-admin-e2e/` shows the pattern for scripted tests with a
  `BASE_URL` override (deploy preview → tests → PR feedback).
- `apps/shelter-e2e/` is the (currently empty) scaffold for the same, aimed at
  `shelter-web`.
- Typical flow: a check that proves valuable as an agent walkthrough gets
  graduated into a spec, which then runs deterministically per PR in CI.

## Optional extensions

- **Deterministic geolocation** — `--init-page` accepts a script evaluated per
  page; e.g. grant geolocation and pin a coordinate to remove map-init variance:

  ```ts
  // tools/agent-browser/init-page.ts (example, not yet committed)
  export default async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    // LA County center — same fallback the app uses (constants.maps.ts)
    await page.context().setGeolocation({ latitude: 34.04499, longitude: -118.251601 });
  };
  ```

- **Dev-container provisioning** — VS Code supports declaring MCP servers in dev
  container customizations so they're configured for every new container.
- **Pinning versions** — replace `@latest` with an explicit `@playwright/mcp@x.y.z`
  if update surprises are a concern.

## References

- Microsoft Playwright MCP — https://github.com/microsoft/playwright-mcp
- VS Code MCP servers — https://code.visualstudio.com/docs/agent-customization/mcp-servers
- Playwright auth / storage state — https://playwright.dev/docs/auth
- Companion doc (approaches review & next steps) — [`README.md`](./README.md)
