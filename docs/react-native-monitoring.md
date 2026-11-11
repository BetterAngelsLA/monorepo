# New Relic in the React Native app

`apps/betterangels` is one Expo app that ships to iOS, Android and the web. It
uses two New Relic agents, selected by platform:

| Platform | Agent | Entry |
| --- | --- | --- |
| iOS / Android | `newrelic-react-native-agent` (native TurboModule) | `libs/expo/betterangels/src/lib/hooks/newRelic/useNewRelic.ts` |
| Web | `@newrelic/browser-agent` | `apps/betterangels/src/monitoring/newRelic.web.ts` |

`index.ts` imports `./src/monitoring/newRelic`, which Metro resolves to
`newRelic.web.ts` on web and to an empty stub (`newRelic.ts`) on native. The
import sits **before** `expo-router/entry` on purpose: New Relic documents that
the browser agent must load before any other script, otherwise it misses the
start of the page view. Static rendering evaluates the module in Node, so the
agent only starts when `typeof window !== 'undefined'`.

## Configuration

| Variable | Used by | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_NEW_RELIC_WEB_LICENSE_KEY` | web | Browser **license key**, not a user API key. Public: it is inlined into the bundle. |
| `EXPO_PUBLIC_APP_ENV` | web, native | Becomes the `environment` attribute every dashboard widget filters on. |
| `EXPO_PUBLIC_COMMIT_SHA` | web, native | Commit SHA attached as the `commit` attribute; set by `write-eas-env`. |
| `EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_IOS` | native | |
| `EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_ANDROID` | native | |

Values come from `apps/betterangels/eas.json` (`build.<profile>.env`) via
`tools/scripts/write-eas-env.mjs`, from GitHub secrets in CI, and from
`.env.local` locally. Do not hardcode them per Nx configuration: `export-web`
already depends on `write-eas-env`, which is hashed into the task inputs, so the
profile is the single source of truth.

`apps/betterangels/app.config.js` fails the build in CI when the monitoring
variables for the target are missing (`APP_ENV`, plus the web key, the platform
mobile key, or both for an EAS update), rather than shipping a bundle with
monitoring silently disabled. Locally it warns and continues, so a developer
without a New Relic key can still run the app. Monitoring is expected in every
deployed environment — preview and development included — not only production.

The agent's `applicationID`, `accountID`, `trustKey` and `sa` block is the
account's browser app identity. Copy it verbatim from the snippet generated in
the New Relic UI rather than retyping it; a wrong `agentID`/`trustKey`
misattributes or drops data without an error.

## What is collected

Enabled: page views, page-load timing (LCP, FCP, TTFB, load), JavaScript errors,
AJAX timing, and SPA soft navigations.

Disabled in `init`: session replay, session traces, console logging, user
actions, performance marks/measures/detail, and AJAX payload capture.

Cookies stay enabled so sessions can be counted (`privacy.cookies_enabled`).
Collection is **not** gated by New Relic's consent mode: the app asks every user
to accept the privacy policy at sign-in (`<apiUrl>/legal/privacy-policy`, also
linked from the consent modal), and that acceptance is treated as covering
monitoring. `browser_consent_mode` is therefore left at its default (off). If the
policy ever requires a separate analytics opt-in, set `browser_consent_mode` and
call `consent()` — with it on, nothing is harvested until that call.

Distributed tracing is disabled. The web app calls the API cross-origin, and the
agent only adds `traceparent`/`tracestate`/`newrelic` to an approved origin whose
server also allows those headers. To turn it on: add the origin in New Relic, add
the three headers to the API's `CORS_ALLOW_HEADERS`, then enable
`distributed_tracing` here. Doing one without the others breaks every API call.

## Privacy: route-level masking

Obfuscation is configured inline in `init.obfuscate`
(`apps/betterangels/src/monitoring/privacy.ts`). URLs keep their **route shape**
so per-route dashboards work, while identifiers are replaced and query/fragment
are dropped:

| Raw | Reported |
| --- | --- |
| `https://app.example/client/123` | `https://app.example/client/[id]` |
| `https://app.example/clients/123/edit?token=…` | `https://app.example/clients/[id]/edit` |
| `https://app.example/client/550e8400-e29b-41d4-a716-446655440000` | `https://app.example/client/[id]` |
| `/clients/123/relations/456/edit` | `/clients/[id]/relations/[id]/edit` |
| `/graphql` | `/graphql` |

Both id shapes are masked because the app uses both: clients and notes have UUID
primary keys, accounts have integer ones. Static segments survive, which keeps
API endpoints distinguishable.

Free-form text in `BrowserInteraction`, `JavaScriptError` and `PageAction` is
replaced with `[redacted]` unless it is exactly a deployment metadata value or an
already-sanitized route. That removes click text, error messages, error classes,
stack contents and navigation names from those events. The tradeoff is real:
errors keep their route and their count but lose their human-readable identity,
so grouping beyond the numeric stack hash is not possible.

Known limits, deliberate or unaddressed:

- Masking is id-shaped, not route-table-shaped. A dynamic segment that is not an
  integer or a UUID ships verbatim. A test named `KNOWN LIMITATION` pins this.
- `PageViewTiming` system attributes (`eid`, `element`, `elUrl`, `elTag`) are
  written by the agent with a non-obfuscating serialiser, so `init.obfuscate`
  cannot reach them. Keep identifiers out of DOM ids and LCP resource paths.
- Inline `obfuscate` **overrides** rules configured in the New Relic UI or
  NerdGraph, including the out-of-the-box PII patterns. Privacy policy for this
  app lives in this repo, not in the platform.
- Obfuscation applies to data harvested after the change; it does not scrub what
  was already ingested.

Run the privacy assertions against the installed agent (no network calls, no
agent started) after any dependency bump:

```sh
nx run betterangels:privacy-test
```

The `privacy-test` target bundles the spec with esbuild and runs it under
`node --test`; `nx test betterangels` depends on it, so `nx affected -t test` in CI
fails when a rule regresses. It is excluded from the vitest include on purpose.

The spec intentionally deep-imports `@newrelic/browser-agent/src/...` so it
exercises the real obfuscator, error aggregator and interaction serialiser. Those
paths are not public API; a version bump can move them. The file is named
`privacy.node-test.ts` rather than `*.spec.ts` so the vitest runner does not load
it twice.

## Dashboard

[Browser monitoring dashboard](https://one.newrelic.com/dashboards/detail/NDAxNzUxOHxWSVp8REFTSEJPQVJEfGRhOjEzMzk1MDY4?account=4017518)
(account `4017518`, application `601687499`). Each widget filters on
`environment IN ({{environment}})`.

Useful queries:

```sql
FROM PageView SELECT count(*) WHERE appId = 601687499
FACET environment, appVersion SINCE 30 minutes ago
```

```sql
FROM PageView SELECT uniques(environment) WHERE appId = 601687499 SINCE 7 days ago
```

Per-route load time works because paths keep their shape:

```sql
FROM PageView SELECT average(duration), percentile(duration, 95)
WHERE appId = 601687499 FACET pageUrl SINCE 1 day ago
```

Routes render as `/clients/[id]/edit`, so facet on `pageUrl` and read the
skeleton; do not expect raw client ids in the results.

Two widget definitions are approximations, not exact measurements:

- **Time to first page hide** is elapsed time until the document is first hidden
  (including tab switches). It proxies time-on-page; it is not engagement and is
  not per-route.
- **Error rate** is `JavaScriptError` count ÷ page views × 100. It can exceed 100
  because it is not the share of affected visits.

Because routes are masked, widgets should group on the masked route
(`/clients/[id]/edit`), not on raw paths.

## Verifying an environment

1. Build or run with the key and `EXPO_PUBLIC_APP_ENV` set.
2. Visit the app, navigate between screens, force an error with fake data only.
3. Wait a few minutes, then confirm `PageView`, `BrowserInteraction` and
   `JavaScriptError` arrive with the expected `environment`.
4. Check that paths read `[id]`, query strings are absent, and free text in the
   interactive events reads `[redacted]`.

An ad blocker or browser tracking protection can block ingest, which looks like a
broken agent. Production ingestion and filtering are still unverified.

## Upgrading the browser agent

`@newrelic/browser-agent` uses a caret range (`^1.324.1`), so minor upgrades resolve automatically. Before bumping:

- `eventFilter` on obfuscation rules must still exist; without it every rule
  becomes global and the redaction scope silently widens.
- Re-run the privacy spec. It asserts against agent internals and a serialised
  payload offset, both of which can move.
- Re-measure the web bundle: `loaders/browser-agent` registers every feature even
  when disabled at runtime.
