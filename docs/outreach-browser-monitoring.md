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
`targetUrl`. Numeric path redaction was added in response. Subsequent supplied
events showed `/client/[id]` and `/clients/[id]/edit` in navigation URLs, including
previous URLs. Tested click text was null or `See Details`. A synthetic error's
email, numeric path ID, and UUID were replaced with placeholders. Its stack trace
was empty, so that test did not verify stack-trace redaction. Already-ingested
events are not changed by this configuration update. Privacy acceptance remains
pending.

### Code privacy review (2026-10-28)

Reviewed the web initializer, monitoring API usage in the app and shared libraries,
application error paths, and the installed Browser agent 1.324.1 source.
The findings below describe the state before the protections added in the next section.

- The web initializer adds only environment, app version, and platform. The
  application search found no web calls adding client identity/custom events.
  The shared mobile monitoring hook has an empty web implementation.
- AJAX payload capture, replay, session traces, logging, user actions, and
  performance details/marks/measures are explicitly disabled. Body-size fields
  in the inspected events are sizes, not body contents.
- **Finding: navigation click text.** In the installed agent,
  `src/features/soft_navigations/aggregate/index.js` reads an anchor, button, or
  input's `title`, `value`, or `innerText` into `actionText`. Disabling
  `user_actions` does not disable this separate collection path. Generic text in
  the supplied sample does not establish safety for all clickable client data.
- **Finding: arbitrary error text.** Common screen errors use fixed messages, but
  shared HMIS API code propagates dynamic errors. Unhandled application or library
  errors can contain values not covered by the email/UUID/numeric-path patterns,
  such as names, notes, or tokens. Console logging being disabled does not disable
  uncaught error reporting. This is an exposure path, not evidence those values
  have already been ingested.
- The installed error aggregator applies obfuscation to error payloads, but that
  does not prove the existing patterns cover all sensitive stack/error text.
- Supplied telemetry includes network-derived location and session/trace
  identifiers; their acceptability still needs to be established for this app.

### Protections added after review

`browserPrivacyRules` now adds an event-scoped rule for `BrowserInteraction` and
`JavaScriptError`: strings other than exact configured environment, app version,
and platform values become `[redacted]`. This uses the agent's supported
`eventFilter` option. It deliberately removes navigation URLs/names, action text,
error messages/classes/causes, and nonempty stack contents from those payloads.
Because rules operate on values rather than field names, an exact match to one of
the three allowed metadata values remains wherever it occurs. Do not put personal
information in deployment metadata or add custom identity attributes.

Tradeoff: error diagnostics and navigation URL breakdowns are no longer readable
in those events. Numeric metrics remain; the route-change category is encoded
before obfuscation. PageView-based sessions and page-load timings are unaffected
by the new scoped rule. Existing global ID/email patterns still apply to other
event types. This does not constitute a universal privacy guarantee for all URLs,
all event types, numeric custom attributes, or historical data.

Offline tests against the installed agent's real obfuscator, error aggregator,
and navigation serializer pass: a synthetic name/note/token and nonempty stack
are removed, two error occurrences remain counted, route-change duration/category
survive, deployment tags survive, and PageView session/timing values survive.
Run from the repository root:

```sh
yarn esbuild apps/betterangels/src/monitoring/privacy.spec.ts --bundle --platform=node --outfile=/tmp/outreach-privacy-test.cjs
node --test /tmp/outreach-privacy-test.cjs
```

These tests import installed agent internals intentionally to detect behavioral
changes on upgrades. They do not start an agent or send data to New Relic.

### Pending ingestion verification

1. Restart the local server and fully reload the browser (Fast Refresh retains the
   old agent instance).
2. Navigate through the synthetic client's summary, details, and edit screens.
3. Generate a synthetic error with a nonempty stack and fake name/note/token text.
   Do not use real client data. Record the test time.
4. Inspect new `BrowserInteraction` and `JavaScriptError` events after that time:
   text should be `[redacted]` (or absent), environment/version should remain,
   errors should still be counted, and route durations/categories should remain.
   Do not filter by the original error message: it is now removed.
5. Recheck the dashboard and repeat on a deployed build. Network-derived location
   and session/trace metadata acceptance is still pending. Existing events are
   not retroactively scrubbed.

Reference: [New Relic browser obfuscation](https://docs.newrelic.com/docs/browser/new-relic-browser/configuration/obfuscate-browser-agent-data/).

Remaining work: review captured payloads for sensitive data, confirm acceptance
of the time-on-page proxy, configure and verify production ingestion, and share
or pin the dashboard link in the team's Slack or Confluence. The link is recorded
here but has not been posted to either service.
