# Outreach web Browser monitoring

The Browser agent starts before Expo Router through the platform-specific module
`apps/betterangels/src/monitoring/newRelic.web.ts`. Native builds resolve the empty
`newRelic.ts` module and retain the existing mobile agent. Static rendering does
not start the Browser agent. Missing license key or environment disables it.

## Local setup

Add to `apps/betterangels/.env.local` (do not replace existing settings):

```dotenv
EXPO_PUBLIC_NEW_RELIC_BROWSER_LICENSE_KEY=<browser license key from New Relic>
EXPO_PUBLIC_APP_ENV=development
```

Use the generated Browser key for application `601687499`, account `4017518`.
This is a public browser ingest key, embedded in the bundle; never use a New Relic
user API key here. Restart with `yarn nx serve betterangels --clear`.

For deployment, supply the same license-key variable in the web build environment.
The export-web targets set `development` for preview and `production` for production.
The `environment` attribute describes the frontend deployment, not the backend
selected by the user's login. `appVersion` comes from the Expo app version.

## Verify in New Relic

[Outreach Web — Performance & Reliability dashboard](https://one.newrelic.com/dashboards/detail/NDAxNzUxOHxWSVp8REFTSEJPQVJEfGRhOjEzMzk1MDY4?account=4017518)

Requires New Relic access to account `4017518`. Select an Environment and a
dashboard time range. Each widget filters on `environment IN ({{environment}})`.
The environment variable uses this query with String output:

```sql
FROM PageView SELECT uniques(environment)
WHERE appId = 601687499 SINCE 7 days ago
```

The dashboard contains page views by environment/version, average/P95 page-load
time, session count, JavaScript errors per 100 page views, P75/P95 LCP,
average/P95 SPA route-change duration, and time to first page hide.

Time to first page hide is a time-on-page proxy: it measures elapsed time until
the document first becomes hidden, including when switching tabs. It does not
measure active engagement or time spent on individual SPA routes. Acceptance of
this proxy for the ticket's time-on-page requirement remains to be confirmed.
The error ratio is event count divided by page views times 100, not the percentage
of affected visits, and can exceed 100.

Visit the app, navigate between screens, then allow a few minutes for ingestion.
In the account's query builder, run:

```sql
FROM PageView SELECT count(*)
WHERE appId = 601687499
FACET environment, appVersion SINCE 30 minutes ago
```

Check Browser monitoring's “See your data” step as well. An ad blocker or browser
tracking protection can prevent ingestion.

### Local validation (2026-10-27)

User-provided New Relic screenshots confirmed data in all seven widgets for
development, including app version `1.2.14`. A synthetic uncaught error produced
16.667 errors per 100 page views (one error and six page views). A separate local
`validation` environment showed two page views, one session, zero errors, and
different timing results with that environment selected. Production ingestion
and filtering have not yet been verified. Local development timings are not a
production performance baseline.

After the environment test, restore `EXPO_PUBLIC_APP_ENV=development` in the
local environment file and restart the dev server.

## Data collection scope

Built-in page views, page timing, JavaScript errors, AJAX timing, and soft
navigation monitoring remain enabled. Replay, session traces, console logging,
user-action collection, performance marks/measures, and AJAX payload capture are
disabled. Cookies remain enabled for session measurement, matching the supplied
configuration. No user identity or client-record attributes are added.

Numeric URL path segments, UUIDs and email addresses are obfuscated before harvest. These patterns cannot
guarantee that arbitrary error messages or URL paths contain no sensitive data.
Before production rollout, inspect outgoing events using synthetic records and
review URL/error content for additional required redaction.

The synthetic-client review exposed numeric client IDs in `pageUrl` and
`targetUrl`. Numeric path redaction was added in response; fresh ingested events
must be checked after a full reload. Already-ingested events are not changed by
this configuration update. Privacy acceptance remains pending.

Remaining work: review captured payloads for sensitive data, confirm acceptance
of the time-on-page proxy, configure and verify production ingestion, and share
or pin the dashboard link in the team's Slack or Confluence. The link is recorded
here but has not been posted to either service.
