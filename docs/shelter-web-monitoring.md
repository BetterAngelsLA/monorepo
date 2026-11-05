# Shelter-web Browser monitoring

## Implementation and deployment

Shelter-web is a React SPA using React Router's BrowserRouter and Vite (not
Expo/Metro). Nx builds to `dist/apps/shelter-web`; `cloudfront-deploy.mjs`
syncs to S3 and invalidates CloudFront. Preview builds use branch base paths.
The reference is Outreach's `apps/betterangels/src/monitoring/newRelic.web.ts`.
Shelter initializes its own BrowserAgent before app imports, keeps one instance
across hot reloads, and does not reuse Outreach's application ID.

Both `default.yml` (production and preview matrix) and `preview.yml` supply:

| Setting | Source |
| --- | --- |
| `VITE_SHELTER_WEB_NEW_RELIC_LICENSE_KEY` | GitHub Actions secret; public Browser ingest key, never a user API key |
| `VITE_SHELTER_APP_ENV` | Workflow environment (`production` or `preview`) |
| `VITE_SHELTER_APP_VERSION` | Commit SHA |

The dedicated shelter Browser application identity is hardcoded, matching
Outreach's approach: application/agent ID `601689920`, account ID `4017518`,
and trust key `4017518`. These public identifiers and the US `bam.nr-data.net`
beacons come from shelter's generated NPM snippet. Only the Browser ingest key
can be configured once as a repository Actions secret shared by preview and
production, or separately as environment secrets. Never substitute a
main account license key or user API key. Vite embeds the Browser key in the
public bundle, so the secret keeps it out of source control, not out of browsers.
The snippet's tracing and performance-measure defaults are overridden to retain
Outreach's privacy and cross-origin request protections.

CI builds fail on missing configuration. Local builds warn and remain usable;
use `.env.local` with the `.env.sample` names for local monitoring. Nx hashes all
three values so environment or identity changes cannot reuse an old bundle.

## Metrics and privacy

Only built-in events are used: PageView, PageViewTiming, JavaScriptError,
BrowserInteraction and AjaxRequest. Deployment environment/version are attached
at initialization. Replay, session trace, user actions, console logs, performance
marks/measures/details, AJAX payloads and distributed tracing are disabled.
No user ID or application/session authentication token is set.

Anonymous browser storage remains enabled. New Relic uses a random 16-character
hex session ID; the redaction rules preserve distinct session IDs and numeric
metrics. Session counts use PageView only, never the sum of counts across event
types. They count sessions with a page load in the selected window, not all active
SPA sessions or people. Blocking or denying browser storage affects coverage.
See [New Relic session tracking](https://docs.newrelic.com/docs/browser/browser-monitoring/page-load-timing-resources/cookie-collection-session-tracking/).

URL values are collapsed to a fixed route placeholder, removing credentials,
query strings, fragments, IDs and slugs. This deliberately sacrifices per-route
breakdowns. Error/interaction free text is redacted while exact metadata and
opaque session IDs survive. Inline rules replace platform obfuscation rules.
Errors retain counts but lose readable messages and stacks.

**Remaining privacy validation:** the installed agent serializes LCP system
attributes (`eid`, `element`, `elUrl`) without applying `init.obfuscate`.
`capture_detail: false` does not suppress those attributes. Before rollout,
inspect synthetic public and operator flows to confirm DOM IDs/selectors and
LCP image paths contain no sensitive data. This limitation is also present in
Outreach; the current implementation does not claim full payload sanitization.
Do not put personal data in DOM IDs or resource paths. No separate consent gate
is added; confirm the shelter privacy policy covers anonymous monitoring of
public visitors as well as signed-in operators before rollout.

## Dashboard

The **Shelter Web** dashboard was created manually in New Relic, in account
`4017518`, for Browser application `601689920`. It does not depend on a local
JSON generator. To maintain it, edit the widgets in New Relic. To recreate a
widget, choose **Add widget → NRQL query** and use the queries below.

Dashboard URL: pending addition. Local development telemetry is reporting;
preview/production validation and internal link sharing remain outstanding.

### Environment variable

Create a Query/NRQL variable named `environment`, with display name
**Environment**, string output and multi-value selection enabled. Select account
`4017518` and use:

```sql
FROM PageView
SELECT uniques(environment)
WHERE appId = 601689920
SINCE 7 days ago
```

The current selection is `development`. Preview and production become available
when they report telemetry. Every widget must include
`environment IN ({{environment}})`; adding the dropdown alone does not filter
widgets. Keep the variable's seven-day lookback when configuring its time-range
behavior so a short dashboard window does not hide environment options.

### Widget queries

The queries below use a 30-minute lookback, matching the initial dashboard setup.
Use the dashboard time picker to inspect other periods and check the displayed
window on each chart. Timing charts use seconds.

**Page Load Time — Average & P95 (seconds)** — Line chart:

```sql
FROM PageView
SELECT average(duration) AS 'Average', percentile(duration, 95) AS 'P95'
WHERE appId = 601689920 AND environment IN ({{environment}})
SINCE 30 minutes ago
TIMESERIES
```

**JS Errors per 100 Page Views** — Billboard:

```sql
FROM PageView, JavaScriptError
SELECT 100 * filter(count(*), WHERE eventType() = 'JavaScriptError')
  / filter(count(*), WHERE eventType() = 'PageView')
  AS 'Errors per 100 page views'
WHERE appId = 601689920 AND environment IN ({{environment}})
SINCE 30 minutes ago
```

This ratio can exceed 100; it is not the percentage of sessions affected by
errors. For a trend, use a Line chart and append `TIMESERIES`.

**Session Count** — Billboard:

```sql
FROM PageView
SELECT uniqueCount(session) AS 'Sessions'
WHERE appId = 601689920 AND environment IN ({{environment}})
SINCE 30 minutes ago
```

**Largest Contentful Paint — Average & P95 (seconds)** — Line chart:

```sql
FROM PageViewTiming
SELECT average(largestContentfulPaint) AS 'Average',
       percentile(largestContentfulPaint, 95) AS 'P95'
WHERE appId = 601689920 AND environment IN ({{environment}})
SINCE 30 minutes ago
TIMESERIES
```

**Time to First Page Hide — Average & P95 (seconds)** — Line chart:

```sql
FROM PageViewTiming
SELECT average(pageHide) AS 'Average', percentile(pageHide, 95) AS 'P95'
WHERE appId = 601689920 AND environment IN ({{environment}})
SINCE 30 minutes ago
TIMESERIES
```

Use the built-in `pageHide` attribute, not `timeToFirstHide`. This measures time
until the document is first hidden, including tab switches. It is a time-on-page
approximation, not engaged time or per-route dwell time.

**SPA Navigation Time — Average & P95 (seconds)** — Line chart:

```sql
FROM BrowserInteraction
SELECT average(duration) AS 'Average', percentile(duration, 95) AS 'P95'
WHERE appId = 601689920 AND environment IN ({{environment}})
  AND category = 'Route change'
SINCE 30 minutes ago
TIMESERIES
```

**App Version Breakdown** — Table:

```sql
FROM PageView
SELECT count(*) AS 'Page views', uniqueCount(session) AS 'Sessions'
WHERE appId = 601689920 AND environment IN ({{environment}})
FACET appVersion, environment
SINCE 30 minutes ago
LIMIT 100
```

Local traffic reports version `local`; deployed releases report their commit SHA.

## Verification and remaining account work

Run `nx run shelter-web:privacy-test` after agent upgrades. It exercises the
installed obfuscator and verifies that distinct sessions remain distinct.

After setting account configuration and deploying:

1. Visit preview and production with synthetic data, navigate, hide the tab and
   trigger a synthetic JS error. Inspect ingest payloads for private values,
   particularly the LCP attributes noted above.
2. Query `FROM PageView SELECT count(*), uniqueCount(session) FACET environment,
   appVersion SINCE 30 minutes ago` scoped to the shelter application ID.
3. Check PageViewTiming, JavaScriptError and BrowserInteraction have the same
   metadata. Check separate sessions have distinct IDs and reloads retain the ID.
4. Open the existing dashboard and switch between environments and multi-selection;
   compare every widget against its standalone NRQL query.
5. Record the dashboard URL here and share/pin it internally after validation.

Confirmed locally: page-load timing, LCP, SPA navigation timing, session count,
app version/environment, and page-hide timing display data. A synthetic JavaScript
error appeared with a redacted message and masked URL; the dashboard reported
50 errors per 100 page views for one error and two page views. No stack trace was
displayed. An Incognito visit increased the session count from one to two, and
sampled repeated loads retained the same session identifier.

Inspected payloads retained deployment metadata and anonymous session IDs while
masking URL paths. Sampled LCP records had empty element IDs and CSS selectors
without obvious personal data, but no image resource URLs were present. Local
photos do not load, so LCP image/resource validation and synthetic operator-flow
checks must continue in the deployed preview environment. Geographic/network
metadata is present and remains part of the privacy review. Reload-count
stability, full payload privacy, preview/production filtering, dashboard URL
recording, and team access still need validation. No internal message has been sent.
