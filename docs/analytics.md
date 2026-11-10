# Product analytics and the shelter handoff

Two PostHog clients, one project:

| App                                    | SDK                    | Entry                                                                                                                            |
| -------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `apps/betterangels` (iOS / Android)    | `posthog-react-native` | `libs/expo/betterangels/src/lib/analytics/client.ts`, started by `useAnalyticsInit()` in `apps/betterangels/src/app/_layout.tsx` |
| `apps/shelter-web` (public React site) | `posthog-js`           | `apps/shelter-web/src/analytics/posthog.ts`, called from `main.tsx` before the first render                                      |

New Relic stays where it is. It answers "is the app healthy" — crashes, latency,
failed requests. PostHog answers "what did people do" — which is a different
data model, and the reason the two exist side by side rather than one replacing
the other.

## The handoff

The outreach app and the shelter site are separate storage universes. Opening a
URL from the app — `WebBrowser.openBrowserAsync` (SFSafariViewController on
iOS, Chrome Custom Tabs on Android) or the full browser — starts a context that
inherits nothing from the app. The only thing that crosses is the URL.

So the session travels in it:

```
https://shelter.betterangels.la/#ba_did=<distinct id>&ba_sid=<session id>
```

- Written by `withShelterHandoff` (`libs/expo/betterangels/src/lib/analytics/shelterHandoff.ts`).
- Read by `readHandoff` (`apps/shelter-web/src/analytics/posthog.ts`) and passed
  to PostHog's `bootstrap`, which continues the session instead of starting a
  new one.
- The **fragment**, not the query string: a `#` parameter is never sent to the
  server and never appears in a `Referer`. shelter-web strips it from the
  address bar before any event is captured, so it does not leak into
  `$current_url` either.

The two ids are PostHog's own identity, not a new one, which is why the app side
and the web side resolve to the same person and the same session.

### The funnel it exists for

| Step | Event                                | Sent by                         |
| ---- | ------------------------------------ | ------------------------------- |
| 1    | `shelter_search_opened` (`handoff*`) | app, on the Find Shelter button |
| 1b   | `shelter_search_failed` (`source`)   | app, when the browser refuses   |
| 2    | `shelter_search_landed` (`handoff*`) | shelter-web, on load            |

Both names are duplicated deliberately — the app's constants live in
`analytics/events.ts`, the web's in `shelter-web/src/analytics/posthog.ts`.
**Renaming one without the other breaks the funnel silently.**

`handoff*` is two flags, because they mean different things:

| Flag             | Means                         | If false                                    |
| ---------------- | ----------------------------- | ------------------------------------------- |
| `handoff`        | the **session id** travelled  | step 2 is a new session for the same person |
| `handoff_person` | the **distinct id** travelled | step 2 is an unrelated visitor              |

`handoff: true / handoff_person: true` is the healthy case. Both false means
analytics was off or the SDK had not assigned an id yet, and the button still
works.

The press is flushed before the browser opens (`flushAnalytics`, bounded at
800 ms): the client batches for up to 10 s, and opening a browser can suspend
the app, which would drop the event that starts the funnel while the landing
event still arrives. On the web side the same call is unnecessary — a page load
flushes itself.

## Configuration

| Variable                       | Used by     | Notes                                                                    |
| ------------------------------ | ----------- | ------------------------------------------------------------------------ |
| `EXPO_PUBLIC_POSTHOG_API_KEY`  | app         | Public project token, inlined into the bundle. Unset disables analytics. |
| `EXPO_PUBLIC_POSTHOG_HOST`     | app         | Set per build profile in `eas.json`.                                     |
| `VITE_SHELTER_POSTHOG_API_KEY` | shelter-web | Same project token. Unset disables analytics.                            |
| `VITE_SHELTER_POSTHOG_HOST`    | shelter-web | Set in CI; `https://us.i.posthog.com` when absent.                       |

Secrets live in GitHub as `EXPO_PUBLIC_POSTHOG_API_KEY`, `VITE_SHELTER_POSTHOG_API_KEY`
and `VITE_SHELTER_POSTHOG_HOST`, and flow into builds the same way the New Relic and
Google Maps keys do. `write-eas-env.mjs` passes any `EXPO_PUBLIC_*` through, so
no extra plumbing is needed when a key is added to CI.

A missing key is not an error: the app opens the shelter site without a
fragment and sends nothing. That is deliberate, so a developer without a token
can still run the app.

## Session replay

Enabled on iOS and Android only. It needs `@posthog/react-native-plugin`, which
autolinks like any other native module — **no Expo config plugin**, so there is
nothing to add to `app.config.js` and no prebuild step for a developer to run.
EAS prebuilds on the worker as usual.

- **Expo Go cannot load it.** Use a development build (`eas build --profile
development` or `npx expo run:ios`).
- **Android needs API 26+.** The app keeps Expo's default `minSdkVersion` (24),
  so recording is simply absent on API 24–25 devices rather than those devices
  being dropped. Do not raise `minSdkVersion` for this.
- Recordings are **screenshots**, not wireframes. The React Native SDK has no
  view-hierarchy serialiser.

### What keeps client data out of a recording

`client.ts` sets these explicitly rather than relying on SDK defaults, because
these screens show names, dates of birth, notes, uploaded documents and photo
pickers:

| Setting                   | Value   | Why                                      |
| ------------------------- | ------- | ---------------------------------------- |
| `maskAllTextInputs`       | `true`  | Masks text and inputs                    |
| `maskAllImages`           | `true`  | Client photos, documents                 |
| `maskAllSandboxedViews`   | `true`  | Native pickers (photo library, contacts) |
| `captureLog`              | `false` | Console output can contain API payloads  |
| `captureNetworkTelemetry` | `false` | Request paths contain client ids         |

The default is therefore a recording that shows layout, navigation and taps but
not content — useful for "where do people get stuck", not for reading a client's
file.

### Surfaces those flags do not cover

The flags above act on React Native `<Text>`, `TextInput` and `<Image>`. Anything
drawn by a native view — a rendered PDF, a live camera feed, a map — is captured
as pixels. Those are masked explicitly with `ReplayMask`
(`libs/expo/shared/ui-components/src/lib/ReplayMask`):

| Component     | Why                                                 |
| ------------- | --------------------------------------------------- |
| `PdfViewer`   | Client documents and scans                          |
| `CameraView`  | Live camera feed, and the captured document preview |
| `MapViewport` | Client interaction locations and shelter pins       |

`ReplayMask` is a drop-in replacement for a layout `View` carrying
`ph-no-capture`. **Wrap any new component that renders client data this way** —
`react-native-pdf`, `expo-camera`, maps, `react-native-svg`, Skia or any other
custom-painted surface, since PostHog cannot see inside them.

**Before relaxing any of these**, decide which screen it applies to and see
`https://posthog.com/docs/session-replay/privacy`. The escape hatches are
`PostHogMaskView`/`ReplayMask` (mask a subtree), `accessibilityLabel="ph-no-capture"`
(mask one component), and `ph-no-mask` (reveal a subtree — never put one on a
screen that renders client data).

### Consent

Replay is materially more invasive than the timing and error data New Relic
collects, and the basis for New Relic (`apps/betterangels/src/monitoring/privacy.ts`,
privacy-policy acceptance at sign-in) was written for that narrower scope. The
SDK defaults to opted in (`defaultOptIn: true`); this app does not gate it.

This needs an explicit decision before replay is enabled for real users, and the
outcome belongs here. If the policy requires a separate analytics opt-in, set
`defaultOptIn: false` in `client.ts` and call `optIn()` where acceptance is
recorded. Until then, treat replay storage as holding client-adjacent data.

## What must never be sent

Events are about what a worker did, never about the client they did it for:

- No names, notes, dates of birth, HMIS ids, client or note primary keys.
- No `identify()` with anything but an internal staff id. `AnalyticsIdentity`
  calls `identify(String(user.id))` while signed in, and `useSignOut` calls
  `reset()` on the way out so a shared tablet cannot merge two workers.
- No free-form text in event properties.

This mirrors `apps/betterangels/src/monitoring/privacy.ts`, which masks ids out
of every New Relic URL for the same reason. PostHog has no equivalent automatic
scrubber on native, so the constraint lives in code review: if an event needs a
client identifier to be useful, it needs a different design.

## Verifying locally

1. Set `EXPO_PUBLIC_POSTHOG_API_KEY` in `apps/betterangels/.env.local` and
   `VITE_SHELTER_POSTHOG_API_KEY` in the shell that runs `nx serve shelter-web`.
2. Run a development build, sign in, open a client profile, tap **Find
   Shelter**.
3. In PostHog: _Activity → Live events_ should show `shelter_search_opened`
   followed by `shelter_search_landed` with the same `$session_id`.

If the second event carries a different session, the fragment did not reach
`bootstrap` — check that `VITE_SHELTER_POSTHOG_API_KEY` was set for the **build**, not
just the dev server, since Vite inlines `VITE_*` at transform time.

## Known limits

- **Returning from the site to the app is not joined yet.** shelter-web does not
  link back to `outreach.betterangels.la`, and `posthog-react-native`'s
  `bootstrap` accepts `distinctId` but not `sessionId`, so a future deep link can
  join the person but not the session.
- Replay covers the app only. shelter-web sent analytics but no recordings.
- Android: no replay on API 25 and below. Those devices still run the app; their
  sessions are captured as events, just not as recordings.
- iOS: PostHog's native replay masks text but cannot mask custom-painted content
  (Skia, `react-native-svg` canvases) — wrap those in `ReplayMask`.
- shelter-web loads `posthog-js` as a separate chunk so it stays off the critical
  path for a map-heavy page; its `$pageview` therefore lands a moment after load.
- The shelter site's privacy policy is a Termly embed
  (`libs/react/shelter/src/lib/pages/policy/PolicyPage.tsx`), so it cannot be
  updated from this repo. **Someone with Termly access must add analytics to it
  before the site ships this.**
