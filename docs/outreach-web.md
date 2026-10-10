# Outreach Web (react-native-web)

Status of running the BetterAngels outreach app (`apps/betterangels`) as a
browser app, and the decisions/deferrals attached to it.

## Decision log

| Decision                                    | Choice                                                                             | Date       |
| ------------------------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| Desktop layout                              | Phone-width centered frame first; responsive layouts are a follow-up once it works | 2026-10-08 |
| Hostnames                                   | prod `outreach.betterangels.la`, dev `outreach.dev.betterangels.la`                | 2026-10-08 |
| In-app Production/Demo environment switcher | Hidden on web — each deployment is built for, and locked to, its API environment   | 2026-10-08 |
| Sequencing                                  | App fixes first, then infra + CI                                                   | 2026-10-08 |
| Web export mode                             | SPA (`web.output: 'single'`, the Expo Router default) — no per-route prerendering  | 2026-10-08 |

Hostnames follow the existing static-site convention: prod units live in the
`prod.betterangels.la` zone and expose the public name as an alias, dev units
live in `dev.betterangels.la` (see `infrastructure/environments/*/us-west-2/static-sites/shelter-web`).

## Deferred: HMIS integration on web

**Deferred — not in scope for the first web release.** Tracked here so the
reasoning is not lost.

### Why it does not port directly

The HMIS client currently reaches HMIS cross-origin and **reads `Set-Cookie`
off the response** to copy cookies into the native cookie jar, then re-reads the
`auth_token` cookie back out by URL:

- `libs/expo/shared/clients/src/lib/common/interceptors.ts` — `interceptorHmis`
  reads `response.headers.get('set-cookie')` and calls
  `CookieManager.setFromResponse(targetDomain, str)`.
- `getAuthTokenHmis()` reads the cookie back via `CookieManager.get(targetUrl)`
  and injects it as a Bearer token / HMIS header.

In a browser, `Set-Cookie` is a **forbidden response header**: `response.headers.get('set-cookie')`
always returns `null`, by spec. There is no workaround from JavaScript. The
whole copy-the-cookie-into-the-jar mechanism is therefore structurally
impossible on web.

Compounding it: HMIS lives on a different registrable domain from
`betterangels.la`, so any cookie it sets is a **third-party cookie** — blocked
by Safari's ITP and being phased out in Chrome. Unlike BA's own API (which is
same-site with the web app and therefore fine), HMIS cannot lean on
first-party cookies as-is.

### Options when we pick this up

1. **Proxy HMIS through the BA backend.** The web app talks only to
   `api.*.betterangels.la`; the backend holds the HMIS session and forwards.
   Cookies become first-party and the `Set-Cookie` problem disappears. Most
   robust; real backend work. Note `apps/betterangels-backend/proxy/` already
   exists as a precedent for this shape (it currently proxies Google Maps/Places).
2. **Give HMIS a first-party surface** (e.g. an `hmis.*.betterangels.la`
   subdomain or a redirect flow) so cookies are first-party. Requires HMIS-side
   cooperation and is likely out of our control.
3. **Ship web without HMIS.** Non-HMIS flows (clients, notes, interactions,
   tasks, uploads, files) are unaffected. Lowest cost, and the reason this is
   acceptable to defer.

Option 1 is the expected path. Decide before HMIS parity is scheduled.

## Progress

### Landed

| Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Files                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web branch for the Maps key resolution (previously `ios ? … : android`, so web silently demanded the Android key and then threw)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `apps/betterangels/config.ts`                                                                                                                                           |
| `webGoogleMapsApiKey` in the embedded config `extra`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `apps/betterangels/app.config.js`                                                                                                                                       |
| Documented web key + its restrictions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `apps/betterangels/.env.local.sample`                                                                                                                                   |
| `react-native-maps` → Google Maps JS shim (restores `PROVIDER_GOOGLE`/`PROVIDER_DEFAULT`, injects the browser key)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `apps/betterangels/src/web-shims/react-native-maps.tsx`                                                                                                                 |
| `react-native-keyboard-controller` → the `Keyboard` seam (`libs/expo/shared/ui-components/src/lib/Keyboard`): plain `ScrollView`, pass-through provider, inert toolbar/events. Replaced its Metro alias — the package's non-native `bindings.ts` makes _importing_ it web-safe, but its `KeyboardAwareScrollView` is `undefined` on web, so it cannot be used directly                                                                                                                                                                                                                                                                                                      | `libs/.../ui-components/src/lib/{Keyboard,index.ts}`, `KeyboardAwareScrollView`, `MainScrollContainer`, `SignInContainer`, `keyboardToolbarProvider`, `BaDataProviders` |
| One Metro alias left, for `react-native-maps` (the keyboard entry above moved to a seam)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `apps/betterangels/metro.config.js`                                                                                                                                     |
| `useNewRelic` no-op web build                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `libs/.../hooks/newRelic/useNewRelic.web.ts`                                                                                                                            |
| `useRememberedEmail` localStorage web build (SecureStore's web build is `export default {}`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `libs/.../hooks/useRememberEmail/useRememberEmail.web.tsx`                                                                                                              |
| Feedback icon off the native `@react-native-vector-icons` TurboModule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `libs/.../NavModal/components/FeedbackModalButton.tsx`                                                                                                                  |
| Web bootstrap on `createWebFetchClient()` (same export surface as `init.ts`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `apps/betterangels/src/init.web.ts`                                                                                                                                     |
| HMIS interceptors split to a native module + inert `.web.ts`; storage keys to a neutral module                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `libs/.../common/{hmisInterceptors.ts,hmisInterceptors.web.ts,hmisStorageKeys.ts}`                                                                                      |
| Session teardown is one implementation for both platforms; only the cookie step splits (native `CookieManager.clearAll()`, a documented `.web` no-op)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `libs/.../hooks/user/{clearSessionCookies.ts,clearSessionCookies.web.ts}`                                                                                               |
| PDF viewer: direct `<iframe src>` when there is nothing to authenticate, Blob URL only when auth headers must be attached (props shared with native so they cannot drift)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `libs/.../PdfViewer/{PdfViewer.web.tsx,types.ts}`                                                                                                                       |
| Date/time picker via a transparent native `<input>` over the existing chrome                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `libs/.../DatePicker/WheelDatePicker.web.tsx`                                                                                                                           |
| Web disabled the "switch to production when signed out" effect — on a dev/preview deployment it silently repointed at the production API                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `libs/.../SignInContainer/index.tsx`                                                                                                                                    |
| `ClientCard` menu hoisted out of the card's pressable area — it rendered `<button>` inside `<button>` on web                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `libs/.../ClientCard/{ClientCard,ClientCardBase}.tsx` + new `ClientCard.spec.tsx`                                                                                       |
| `Checkbox` gained an opt-in `accessibilityRole` (default unchanged); consent rows use `checkbox`, removing `<a>` inside `<button>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `libs/.../Checkbox/Checkbox.tsx`, `libs/.../ConsentModal.tsx`, `Checkbox.spec.tsx`                                                                                      |
| Tab bar "main plus" hoisted out of the tab bar into a layout overlay. As a `Tabs.Screen` it lived inside expo-router's tab `<a>`, so on web the navigation won the race and it landed on its own empty route instead of opening the modal. It is no longer a tab route, still carries `accessibilityRole="button"`, and is still gated on `hmisProdDemoEnabled` — which is what the deleted placeholder expressed with `href: null`                                                                                                                                                                                                                                         | `apps/betterangels/src/app/(tabs)/_layout.tsx` (+ deleted `drawerPlaceholder.tsx`)                                                                                      |
| Places/geocoding routed through the BA backend proxy on web, via an optional transport on `GooglePlacesClient`; `libs/shared/places` gained a test target                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `libs/shared/places/src/lib/GooglePlacesClient.ts`, `apps/betterangels/src/init.web.ts` + new `GooglePlacesClient.spec.ts`                                              |
| Branch previews actually render: the web export now applies `experiments.baseUrl` from `getBranchBasePath()`, so bundled resources resolve under `/branches/<branch>`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `tools/shared/print-base-path.mjs`, `apps/betterangels/app.config.js`, `apps/betterangels/project.json`                                                                 |
| Deploy credentials wired the way the sibling apps do it: committed `.env.deploy.{preview,production}` (S3 bucket + deploy role), loaded by Nx per configuration — no CI change needed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `apps/betterangels/.env.deploy.*`                                                                                                                                       |
| A `typecheck` target added to the one project this PR touches that owned `.web` variants without one — the project named `expo-shared-apollo`, rooted at `libs/expo/shared/clients` — so CI stops ignoring those files. An equivalent target for `expo-shared-services` was added and then removed: that project is not otherwise touched here, and its pre-existing `s3Upload.web.ts` is covered by the consumer typechecks                                                                                                                                                                                                                                                | `libs/expo/shared/clients/project.json`                                                                                                                                 |
| `Avatar` silently dropped `accessibilityLabel`/`accessibilityHint` whenever there was no image — a client with no photo announced nothing, on every platform. Label now goes on the wrapper in that branch, and the photo control carries its own label + hint                                                                                                                                                                                                                                                                                                                                                                                                              | `libs/.../Avatar/Avatar.tsx`, `libs/.../ClientProfilePhotoUploader/...`                                                                                                 |
| Web camera verified live end-to-end in a real browser (synthetic camera device)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | evidence below                                                                                                                                                          |
| Camera capture contract pinned by a new spec (web returns a canvas data URL; the simulator-mock branch is unreachable off iOS)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `libs/.../Camera/useCapturePicture.spec.ts`                                                                                                                             |
| `WheelDatePicker.web.tsx`: CSS-only props moved out of `StyleSheet.create` — the lib typecheck (which does see `.web` files) rejected `border: 'none'` / `cursor`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `libs/.../DatePicker/WheelDatePicker.web.tsx`                                                                                                                           |
| Consent legal links made siblings of their checkbox — removes focusable children inside a `role="checkbox"` and nested hit targets                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `libs/.../ui-components/ConsentModal.tsx`                                                                                                                               |
| Document download on web hands the URL to the browser instead of going through expo-file-system (a warn-only stub on web)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `libs/.../ui-components/DocumentModal.tsx`, new `libs/expo/shared/utils/src/lib/file/downloadInBrowser.ts` + spec                                                       |
| Web maps open at the zoom the call site asked for. teovilla drops `initialRegion` deltas and hardcodes `zoom: 3`; the shim derives `initialCamera.zoom` from the deltas instead                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `apps/betterangels/src/web-shims/react-native-maps.tsx` + new `react-native-maps.spec.tsx`                                                                              |
| A controlled `region` prop now actually positions the web map — teovilla never reads it, so six call sites were rendering a world map at 0,0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | same shim; re-centres via `animateToRegion` on value change                                                                                                             |
| Store gained `reconcileActiveOrgId` (synchronous write, deferred notify) so the render-phase org reconcile stops updating the rendering component                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `libs/ba-platform/src/lib/activeOrg/{activeOrgStore.ts,index.ts}`, `.../activeOrg/useActiveOrgState.ts` + 4 new store tests                                             |
| `export-web` / `deploy` / `post-pr-preview` Nx targets, with per-environment `EXPO_PUBLIC_*`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `apps/betterangels/project.json`                                                                                                                                        |
| CI step that bundles the browser build on every affected run, plus the new key wired through compose and the build/deploy steps                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `.github/workflows/default.yml`, `docker-compose-ci.yml`                                                                                                                |
| Static-site units for `outreach.dev.betterangels.la` and `outreach.betterangels.la`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `infrastructure/environments/*/us-west-2/static-sites/outreach-web/`                                                                                                    |
| `.worktrees` added to `.nxignore` — worktree copies were making Nx see every project twice and refuse to build the graph                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `.nxignore`                                                                                                                                                             |
| Five styles asked for `fontFamily: 'Poppins'`, which matches no face `FontLoader` registers — so on web they silently fell back to the system font. Now the registered `Poppins-Regular` / `Poppins-SemiBold`, matching the weight each one asked for                                                                                                                                                                                                                                                                                                                                                                                                                       | `MapPinText.tsx`, `LoginForm/index.tsx`, `LoginFormHmis/index.tsx`, `ConsentModal.tsx` (×2)                                                                             |
| `FontLoader` no longer `throw`s when a font fails to load — that handed the error to the root boundary, which replaced the whole app (providers included) with the crash screen over a problem whose only consequence is a fallback typeface. It logs and continues, and `!loaded && !error` keeps that from becoming an eternal blank screen                                                                                                                                                                                                                                                                                                                               | `libs/.../Fonts/FontLoader.tsx`                                                                                                                                         |
| Session teardown un-duplicated: `useClearLocalSession.web.ts` was a 64-of-71-line copy of the native hook. Now one implementation, with only the cookie step split (`clearSessionCookies` + a `.web` no-op) — the same shape already used for `hmisInterceptors`                                                                                                                                                                                                                                                                                                                                                                                                            | `hooks/user/{useClearLocalSession.ts,clearSessionCookies.ts,clearSessionCookies.web.ts}` (deleted `useClearLocalSession.web.ts`)                                        |
| `downloadInBrowser` guards for a missing DOM (it is re-exported from a platform-neutral barrel, so a native caller would have failed at runtime with `ReferenceError: document is not defined`) and now reports whether the download was _dispatched_, so `DocumentModal` surfaces a snackbar instead of closing silently when it could not start                                                                                                                                                                                                                                                                                                                           | `libs/.../file/downloadInBrowser.ts` (+4→5 spec cases), `ui-components/DocumentModal.tsx`                                                                               |
| `WheelDatePicker.web.tsx`: dropped a `format` default that could never run (`format` is required in `IWheelDatePickerProps`, and the default diverged from native's `'MM/dd/yyyy'`) and a write-only `inputRef`. Time mode verified end-to-end in a browser — picking 14:30 on `/note/create` yields "10/09/2026 2:30 PM", so the parse → preserve-the-other-half → format path works                                                                                                                                                                                                                                                                                       | `libs/.../DatePicker/WheelDatePicker.web.tsx`                                                                                                                           |
| The one `outline` shorthand inside `StyleSheet.create` — which react-native-web's validator **rejects and deletes**, so the focus-ring suppression silently did nothing in dev — is now `outlineWidth: 0` (not `outlineStyle: 'none'`: RN's types allow only solid/dotted/dashed there). Three others use the same shorthand on **inline** styles, where `validate()` never runs; those were changed too and then **reverted** (see below)                                                                                                                                                                                                                                  | `Input.tsx`                                                                                                                                                             |
| Nine `pointerEvents` **prop** usages were migrated to `style.pointerEvents` and then **reverted**: react-native-web still applies the prop (`createDOMProps` merges `pointerEventsStyles[pointerEvents]` into the style) and only emits a dev `warnOnce`, and migrating our own sites does not remove the warning because it is emitted by `@gorhom/bottom-sheet`. The style form is **not** a drop-in replacement for the prop: `box-none` is polyfilled only in the atomic compiler, so it works from `StyleSheet.create` and is silently dropped inline. The one new element (the tab-bar "+" overlay) now puts it in its stylesheet entry — measured before/after below | `(tabs)/_layout.tsx`                                                                                                                                                    |
| `reconcileActiveOrgId` removed from the `@monorepo/ba-platform` barrel — its contract is "write during render, notify later", which only the provider that owns the state can honour. The one legitimate consumer imports the module path directly                                                                                                                                                                                                                                                                                                                                                                                                                          | `libs/ba-platform/src/lib/activeOrg/index.ts`, `.../providers/activeOrg/useActiveOrgState.ts`                                                                           |
| Dead `ui-components/Modal.tsx` deleted along with its barrel export. Zero importers — every `<Modal>` in the app imports react-native's — but the static re-export meant Metro still evaluated and bundled all 249 lines into every consumer                                                                                                                                                                                                                                                                                                                                                                                                                                | `libs/.../ui-components/{Modal.tsx,index.ts}`                                                                                                                           |
| Both header slots inset on web, not just the left one. `headerLeftInsetStyle` fixed "Back"; the right slot stayed flush, which clipped the "Edit" label against the window edge. `headerRightInsetStyle` is its mirror, applied to every right slot — the three "Edit" buttons, the client screen's overflow menu, and the modal close button — and the sign-in screen's own `headerLeft` (an icon button) got the left one it had been missing. Measured on the running app, ±12px on each slot                                                                                                                                                                            | `libs/.../navigation/{headerStyles,index,options}.tsx`, `screens/{Note,UserProfile,Client,NotesHmis/NoteViewHmis}`, `apps/betterangels/src/app/AppRoutesStack.tsx`      |

Verified: `tsc --noEmit` clean for both `tsconfig.app.json` and `tsconfig.spec.json`; the
`expo-shared-apollo` suite passes (12 tests, including `clientHmis.test.ts` which covers the
moved HMIS interceptor); `expo-betterangels` passes 460 tests including
`useSignOut.test.tsx`, which covers the split session hook. The map renders through the shim
from a call site passing **neither** `provider` nor `googleMapsApiKey` — confirming both
silent-failure modes are closed without touching the 19 map call sites.

> `UserProfile/index.test.tsx` and `ConsentModal.test.tsx` previously failed to _load_ under
> `vitest-native` (`expo-modules-core` type stripping). The real cause was the
> `@monorepo/expo/shared/ui-components` barrel eagerly re-exporting native-backed components;
> both specs now mock that barrel, following the repo's own convention
> (`src/__mocks__/sharedBarrels.tsx`). That surfaced three genuine component bugs, which is
> the point of having them — see "Bugs the web work surfaced" below.

### Bugs the web work surfaced

Making those two specs actually _run_ turned them from dead weight into a small bug hunt.
Three failures were real product bugs, not test problems — none of them web-specific, all of
them reachable on mobile too:

| Bug                                                                                                                                                                                                                                                                                                                                                                   | Consequence                                                                                                                   | State                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `UserProfile.deleteCurrentUserFunction` only caught _thrown_ errors, so a resolved `OperationInfo` refusal still navigated to `/auth` and called `signOut()`                                                                                                                                                                                                          | Signed a user out while their account still existed                                                                           | **Fixed** — surfaces `extractOperationInfoMessage(...)` via `showSnackbar` and returns                                |
| `ConsentModal.submitAgreements` guarded only `if (!data)`, so a resolved `OperationInfo` rejection still called `setUser(accepted)` and closed the sheet                                                                                                                                                                                                              | Told the user they had accepted terms the server had refused; the mutation's cache `update` also wrote `hasAcceptedTos: true` | **Fixed** — early-returns on `OperationInfo` before both, and the cache write is skipped for a refusal                |
| A read that **predates** the accept can land afterwards and flip the context back. The accept writes `hasAcceptedTos: true` into the `CurrentUserType` cache entry, then the in-flight `currentUser` query resolves with `hasAcceptedTos: false`; `createUserProvider`'s effect applies it via `setUser(parseUser(...))`, and the tabs-layout gate re-opens the sheet | The consent sheet re-opens after a successful accept                                                                          | **Fixed** — `parseUser` now receives the user already in context, and the outreach app treats acceptance as monotonic |

The third one is not a component bug: a component cannot stop `createUserProvider` from
overwriting context. It is a race — the app refetches `currentUser` on foreground, so a read
issued _before_ the accept resolves _after_ it, and the provider applied whatever arrived last.

The fix is deliberately made where the decision belongs rather than in the provider's policy:

```ts
// libs/ba-platform …/createUserProvider.tsx
setUser((prev) => parseUser(res.data?.currentUser, prev));
```

`parseUser` gains the user already in context (optional second argument — a one-parameter
implementation is still assignable, so the admin/dashboard apps were untouched), and the
outreach implementation decides what wins:

```ts
hasAcceptedTos: prev?.hasAcceptedTos || (userData.hasAcceptedTos ?? false);
```

So `ba-platform` stays domain-agnostic — it offers "merge instead of replace" without knowing
what consent is — while the rule "once accepted, stay accepted" lives in the app that owns it.
The trade-off, accepted knowingly: a _server-side_ revocation is not reflected until the next
fresh read (a reload or a new session). Nothing in the product revokes acceptance today, and
the alternative (ignoring any read that predates the last local write) needs request-identity
plumbing through Apollo for the same user-visible result.

`libs/ba-platform …/createUserProvider.test.tsx` covers the contract from both sides — `prev` is
`undefined` on the first load, and a later read cannot drop what is already applied (both cases
fail if the functional update is reverted). With the fix the `ConsentModal` spec passes and the
suite is green in full: `expo-betterangels: 60/60 files, 460/460 tests`.

Note for whoever picks it up: `toError()` (from `@monorepo/react/shared`) is **not** an
`OperationInfo` handler — it is `value instanceof Error ? value : new Error(String(value))`, so
it renders a refusal payload as `Error("[object Object]")`. The established refusal pattern in
this codebase is `extractOperationInfoMessage` / `extractOperationInfoMessages` +
`showSnackbar`, as used in the two fixes above and in `ReferralsTab`, `ClientContactDeleteBtn`
and `DocumentModal`.

### Review claims that turned out to be wrong

Worth recording so nobody acts on them:

- **`useRememberEmail.web.tsx` is not dead code and not lazy duplication.** The _file_ is
  `useRememberEmail.tsx` but its export is `useRememberedEmail` — and both login forms import
  it by explicit path (`hooks/useRememberEmail/useRememberEmail`), so the `.web` sibling is the
  **live web implementation**. A grep for the file's name finds nothing and looks conclusive;
  it isn't. The duplication is also small and justified: the native side is a keychain, the web
  side is `localStorage` with different failure modes (private mode, blocked storage) and a
  documented security scope. Left alone deliberately.
- **`/auth` does not end the server session, and that is correct.** Visiting it while signed in
  clears _local_ state (and is how the app catches sessions that died without a sign-out), but
  the Django session cookie is `HttpOnly` and only the server clears it on logout. So a private
  route re-authenticates afterwards — verified, not a bug.
- **No user-facing "Sign out" control is reachable** in this build: sign-out is wired only to
  `/welcome`, to account deletion, and to the consent modal's decline path. Flagged as a
  possible product gap, but it is not web-specific and was not introduced here.
- **`WheelDatePicker.web.tsx`'s `min`/`max` are not "date strings on a `type="time"` input".**
  `toInputValue` formats through the same mode-aware `inputValueFormat` the value uses, and the
  live time input on `/note/create` carries `max="23:59"`. Nothing to fix.
- **"A date-mode pick should yield midnight" is not supported.** The review asserted native
  returns midnight for a date-only pick. The native implementation seeds its picker with
  `value={value || new Date()}` and passes the picker's `Date` straight through
  (`WheelDatePicker.tsx:82`, `:71`) — so with no prior value it carries the _current_ time too,
  and on iOS retains it. The change was implemented, then reverted, and the code now carries a
  comment saying why, so it is not "fixed" again on the same reasoning. (Separately: the wheel
  picker has exactly one call site, `NoteForm/DateAndTime.tsx`, and it is `mode="time"`, so the
  date branch is latent in this app either way. It shares the parse/preserve path with time
  mode, which _is_ exercised — see below.)

- **The three click timeouts in `tmp/click-through-errors.mjs` are the harness, not the app.**
  It reports "client tab #0"/"#1" and "plus button (task modal)" failing because a `<div>` with
  `boxShadow`/`overflow:hidden`/`width:100%` "intercepts pointer events". Two things are wrong
  with those steps and neither is the product: they select `[role="tab"], [role="tablist"] a`,
  which never matches the client-profile tabs (`ClientTabs` renders each as a `TextButton` with
  `testId` `client-tab-<label>`, lowercase in the DOM), and the screenshot taken at that moment
  shows the "Add Interaction / Upload Documents" action sheet still open over the Clients list —
  a modal _correctly_ blocking clicks. In a clean session all six client-profile tabs click with
  0 console errors (`tmp/verify-client-tabs-web.mjs`). That probe also passed vacuously twice
  before this was fixed, once because `querySelectorAll` was handed `undefined` — which coerces
  to the string `"undefined"` and matches nothing — so it now aborts as INCONCLUSIVE when it
  finds no tabs rather than reporting a pass.

### Fixed: a render loop on the related-contact form

`/clients/:id/relations/add?componentName=RelevantContacts` (and the edit route) emitted
**~100 `Maximum update depth exceeded` warnings per load** — a runaway render loop, not a
stray warning. It was pre-existing and not web-specific (the form is shared with mobile), but
it was real: the page still rendered, so it burned CPU indefinitely rather than failing.

**The cause was `PhoneNumberInputBase`.** Its effect re-emitted the current value on _every_
parent render, because `onChangeParts` was an effect dependency and is always passed as an
inline arrow:

```
parent re-render
  -> new inline onChangeParts identity
  -> effect re-runs, calls onChangeParts(localPhone, localExt)
  -> react-hook-form field.onChange -> control._subjects.state.next(...)
  -> ClientContactForm's useWatch subscription callback -> updateValue(...)   [setState]
  -> ClientContactForm re-renders -> back to the top
```

Only this form of the three looped because it is the only one that calls `useWatch` — which is
also why three earlier hypotheses were red herrings. The fix keeps the latest callbacks in refs
(synced in a `useLayoutEffect`, so a changed callback is in place before the passive effect
reads it) and depends only on `localPhone`/`localExt`, so the effect re-emits when a value
actually changes instead of on every parent render. Measured: **~100 → 0**, on all five routes
that render the component (`tmp/diagnose-update-depth.mjs`, which now also covers
`/clients/:id/edit`).

Three plausible causes had been tested and falsified first — `AddressAutocomplete`, the inline
`useWatch` name array, and the `clientProfile` object in the effect deps (each implemented,
measured, reverted). Guessing was then abandoned for instrumentation:

1. `tmp/profile-commit-loop.mjs` installs `__REACT_DEVTOOLS_GLOBAL_HOOK__` before boot and, per
   `onCommitFiberRoot`, records every fibre carrying the `PerformedWork` flag (bit 1) — in a dev
   build that is exactly "this component rendered this commit". Result: **600 commits in ~2 s**,
   with the whole tree (providers, `Snackbar`, `StatusBar`, unrelated modals) rendering each
   time — so the update was scheduled at or near the root, not in one leaf.
2. `tmp/trace-setstate.mjs` wraps the `dispatch` of every `useState`/`useReducer` hook in the
   committed tree and captures an `Error` stack per call. Result: **385 calls into
   `ClientContactForm` alone**, all from a single stack, which named react-hook-form's
   `onChange`. Keep 20+ frames: at 6 the interesting caller is cut off, and that caller _was_
   the answer.
3. Those stacks carry bundle line offsets, not source paths. Metro's dev bundle terminates each
   module with `},<id>,[deps],"path/to/file.tsx");`, so fetching the bundle and taking the first
   terminator past the offset maps the frame to its file. That turned `419873` into
   `PhoneNumberInput/PhoneNumberInputBase.tsx` and made the loop obvious.

A gotcha that cost a run: values from the Node scope are not visible inside a Playwright
`addInitScript` body. A cap written as `>= MAX_COMMITS` threw `ReferenceError` on every hook
call, React swallowed it, and the probe reported 0 commits while the page looped normally.
Hardcode such values inside the page function.

Two things that are _not_ the cause, so nobody re-tests them: emitting the value on mount is
intentional (it normalises the stored value), and `PhoneNumberInput` genuinely has to pass a
fresh arrow, because its second consumer is a `Controller`'s `render` prop and there is no
component boundary to hang a `useCallback` on. The ref is the fix, not a workaround.

Regression coverage: `PhoneNumberInputBase.spec.tsx` (the new case fails against the old
dependency array), and `tmp/verify-phone-input-web.mjs` proves the emit still reaches
react-hook-form live — the typed digits appear in `useWatch`'s array and the extension formats
to `5551234567x42`.

### react-native-web style warnings, and their family

`Invalid style property of "outline". Please use long-form properties.` comes from
react-native-web's `StyleSheet.create`, which validates every style object in dev
(`validate.js`, gated on `NODE_ENV !== 'production'`). Two things make it easy to misread:

- **It fires at module load**, not on render — `StyleSheet.create` runs when the module is
  evaluated, which is why the call stack is a chain of `metroRequire` frames rather than a
  component tree.
- **It deletes the offending property** (`delete obj[k]`), so the style silently does not
  apply. It is not merely noise, but its **scope is narrow**: only styles that go through
  `StyleSheet.create` are validated. One input had `outline: 'none'` there, so its focus-ring
  suppression had never worked in dev; three others use the same shorthand on _inline_ styles,
  which `createReactDOMStyle` passes through untouched — those were changed during this work
  and reverted once that was established.

The validator rejects three things: `background`, `borderTop/Right/Bottom/Left`, `font`,
`grid`, `outline` and `textDecoration` outright; the multi-value shortforms
(`margin`, `padding`, `borderRadius`, `flex`, `inset`, `overflow`, …) when the value has more
than one token; and `!important` in any value.

**Siblings still present in this repo** (same family, found by scanning for each rule rather
than just for `outline`):

| Warning                                                             | Sites                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Nature                                                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `props.pointerEvents is deprecated. Use style.pointerEvents`        | Emitted by `@gorhom/bottom-sheet`, which passes `pointerEvents: "box-none"` as a prop to `View` (`BottomSheetHostingContainer.js:95`). Third-party; needs a patch or an upgrade. Our own nine sites were migrated and then reverted — react-native-web still applies the prop (`createDOMProps` merges `pointerEventsStyles[…]` into the style), so migrating them bought nothing and would not have silenced this warning. Note the form matters if you ever do migrate: only `StyleSheet.create` gets the `box-none` polyfill (see below) | Deprecation only; the prop is still applied                                                  |
| `"shadow*" style props are deprecated. Use "boxShadow"`             | 60 occurrences across ~10 files (`BottomSheetPanel`, `MapDirectionsActionSheet`, `LocateMeButton`, `Copy`, `BaseModal`, `ServicesModal`, `shared/static/src/lib/shadow.ts`, …)                                                                                                                                                                                                                                                                                                                                                              | Deprecation; the styles still apply. A real migration, and platform-sensitive, so left alone |
| `Unexpected text node: . A text node cannot be a child of a <View>` | `/note/create` (×5), `/settings/about` (×1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | **Mechanism known, source still not located — see below**                                    |

**The `Unexpected text node` warning, narrowed.** react-native-web emits it from the `View`
export, while _rendering_, for any child that is a direct string:

```js
// node_modules/react-native-web/dist/exports/View/index.js:55
React.Children.toArray(props.children).forEach((item) => {
  if (typeof item === 'string') console.error("Unexpected text node: " + item + …);
});
```

So the offending child is the literal string `"."`. Three things were established by
measurement:

- It fires **5×** on `/note/create` and **1×** on `/settings/about` (`tmp/locate-text-node.mjs`
  patches `console.error` before boot and counts them per route).
- It carries **no React component stack** — it is a plain `console.error`, not React's warning
  channel — and the JS stack at the call site is only React internals plus a bundle offset, so
  the component cannot be read off it.
- **No `"."` text node exists in the rendered output** — neither in the light DOM nor in any
  shadow root (the LogBox toast's included; a plain `document.body` walk skips those, which is
  why earlier attempts found nothing). Counted `0` on both routes.

That last point is the important one: whatever renders it produces **no DOM**, so this is a
dev-only console warning rather than invalid DOM nesting — there is no layout or a11y artefact
to fix. It is presumably a conditional separator rendering a `"."` string into a `View` (which
wants a `<Text>`) in a subtree that ends up empty, or one rendered into a detached container.

**Three methods failed to name the component, so don't re-run them:**

1. **DOM scan** for a `"."` text node — light DOM _and_ every shadow root → **0** on both
   routes (`tmp/locate-text-node.mjs`).
2. **JS stack at the warning** (patching `console.error` before boot) — only React internals
   and a bundle offset, because RNW uses plain `console.error` rather than React's warning
   channel, so there is no component stack to read.
3. **Fibre walk** via `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`, searching every
   committed fibre for `memoizedProps.children === '.'` → **0**
   (`tmp/find-text-node-component.mjs`; it does find the roots, so the hook works).

(2) and (3) together mean the offending `<View>` is never in the committed tree: it renders,
warns, and its output is discarded. That is also _why_ nothing appears in the DOM, and it is
consistent with the warning being harmless in practice. Catching it would need a render-phase
interception of the `View` component itself rather than an after-the-fact inspection.

Expected noise, not defects: `Animated: useNativeDriver is not supported…` (there is no native
animated module in a browser) and the local-dev CORS errors from `api.dev`, both documented
elsewhere in this file.

### The style form of `pointerEvents` is not the prop's equal

`pointerEvents` accepts two forms, and on react-native-web they are **not** interchangeable.
The prop is handled in `createDOMProps`, which merges `pointerEventsStyles[pointerEvents]` — a
`StyleSheet.create` object — into the style, so `box-none` works and only a dev `warnOnce`
fires. As a _style_, `box-none` is polyfilled only in the atomic compiler
(`StyleSheet/compiler/index.js`), which emits `pointer-events: none !important` on the element
plus `auto` on its direct children. Inline style objects never reach that path: `preprocess.js`
and `createReactDOMStyle.js` have no `pointerEvents` handling, and the value is dropped
altogether.

That is not academic — it bit the tab-bar "+" overlay, which was written with the style form
inline and therefore had a live 80×80 dead zone over the tab bar, eating taps in the white ring
around the button. Measured on the running web app, before and after moving the declaration into
the `StyleSheet.create` entry:

|                                           | before          | after                          |
| ----------------------------------------- | --------------- | ------------------------------ |
| computed `pointer-events` on the wrapper  | `auto`          | `none`                         |
| `elementFromPoint` at the ring (4 points) | the wrapper     | the tab bar (`<a role="tab">`) |
| clicking the ring                         | swallowed       | navigates to `/interactions`   |
| clicking the button centre                | opens the modal | opens the modal (unchanged)    |

The screenshots before and after are byte-identical, which is the point: this is a hit-area fix,
not a visual one. Only `StyleSheet.create` gets the polyfill, so a `.web`-safe migration of the
nine prop sites would have to break the style object into the stylesheet rather than inlining it.

### The web build no longer needs any scaffolding

`expo export --platform web` **succeeds with zero stubs** and `expo start --web` boots,
renders `/auth` and `/sign-in?provider=ba`, and reaches the API from the browser.

All four former blockers are resolved:

1. `@preeternal/react-native-cookie-manager` — resolved by a platform split, because
   swapping the fetch client alone was _not_ enough: three web-reachable modules imported
   it, one of them through a barrel.

   | Import site                                                        | Reached on web via                                                             | Resolution                                                                                                                                                                         |
   | ------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `libs/ba-platform/expo/src/lib/{fetchClient,csrfTokenProvider}.ts` | `init.ts`                                                                      | `apps/betterangels/src/init.web.ts` uses `createWebFetchClient()`; Metro prefers it                                                                                                |
   | `libs/expo/shared/clients/.../interceptors.ts`                     | `@monorepo/expo/shared/clients` barrel → `BaDataProviders` (`createErrorLink`) | HMIS code extracted to `hmisInterceptors.ts` + a `.web.ts` no-op; storage keys moved to `hmisStorageKeys.ts`; `interceptors.ts` re-exports both so its public surface is unchanged |
   | `libs/expo/betterangels/.../useClearLocalSession.ts`               | `auth.tsx`                                                                     | only the cookie step is platform-split: `clearSessionCookies.web.ts` is a documented no-op (no JS cookie jar; the session cookie is `HttpOnly`) and the hook itself is shared      |

2. `react-native-pdf` — `PdfViewer.web.tsx`. Props moved to `PdfViewer/types.ts` so the two
   builds cannot drift; the disk cache is intentionally dropped (HTTP cache replaces it).
   Two paths, because they have different constraints:
   - **No `headers`** (the only call site) — the `<iframe>` points straight at the URL and the
     browser fetches it as a _navigation_. A navigation is not subject to the CORS check, so
     this renders a PDF from a media origin that sends no ACAO — which the blob fetch could
     not. The fetch bought nothing here: nothing was being authenticated, and it turned a
     working document into "Sorry, there was a problem loading the PDF file" on the deployed
     media host.
   - **With `headers`** — the bytes must be fetched to attach them, then handed over as a Blob
     URL. This path can fail visibly, so it is the one that reports through `onError`, and it
     now aborts the request on unmount/URL change instead of only flagging it (a large PDF
     previously kept downloading and buffering after the viewer was gone).

   Verified in a browser against `ClientDocument id 1` (a real 94 KB PDF): pressing the
   thumbnail mounts an `<iframe>` whose `src` is the direct presigned URL (`blob:` = false),
   with the browser actually requesting the bytes and no error state. Repeating it with the
   media response's ACAO header **stripped** still renders — i.e. the deployed condition the
   old fetch path failed in. Note the local media store (SeaweedFS on `:9000`) _does_ echo
   `Access-Control-Allow-Origin`, which is why this failure was only ever visible on the
   deployed host and not locally.

3. `@react-native-community/datetimepicker` — `WheelDatePicker.web.tsx` layers a
   transparent native `<input type="date" | "time">` over the existing field chrome, so the
   label/error/icon and the real browser picker both survive. Handles `mode="time"`.
4. `@react-native-picker/picker` — **was never a real blocker.** `WheelPicker.tsx` has no
   importers anywhere; it is dead code and never enters the bundle. (I had over-stubbed it
   during the spike.)

### Local dev must run on port 8081

`CSRF_TRUSTED_ORIGINS` in the backend lists `http://localhost:8081` (and 8083/8084). Django
validates the `Origin` header on cross-origin writes, so serving the web app from any other
port makes every `POST /graphql` and login fail with **403** — which looks exactly like a
broken CSRF interceptor. Proved directly:

| `Origin` sent           | `POST /graphql` |
| ----------------------- | --------------- |
| `http://localhost:8090` | 403             |
| `http://localhost:8081` | 200             |
| (none)                  | 200             |

Verified working end-to-end in a browser against the local backend.

### Authenticated session: verified end to end

Confirmed with a throwaway user (created for the test, granted a temporary Caseworker
membership, then deleted — the DB was left exactly as found: 15 users, group membership
unchanged). Full sequence observed in the browser:

```
GET  /admin/login/                     -> 200   (CSRF seed)
POST /_allauth/browser/v1/auth/login   -> 200   login succeeded
POST /graphql                          -> 200   authenticated requests
final URL: http://localhost:8081/               app root, not /welcome
rendered:  "Clients / Displaying 1 of 1 clients / Test Client / Interactions / Consent"
```

So sign-in, session establishment, authenticated GraphQL, routing and live data all work in a
browser. `document.cookie` shows only `csrftoken` while the app is signed in — correct, since
the Django session cookie is `HttpOnly` and deliberately invisible to JS.

Two notes for whoever picks this up:

- **A brand-new user lands on the consent modal** (ToS / Privacy acceptance), which renders
  correctly on web. `SignInContainer` routes on the deprecated `isOutreachAuthorized` field
  (`accounts/types.py` marks it "Use userPermissions check instead") — worth migrating, but
  it works.

### Web-only DOM nesting bugs — all three fixed

`accessibilityRole="button"` renders a real `<button>` on react-native-web. Nesting one
interactive element inside another is harmless on native but invalid HTML on web, where React
reports it as a hydration error and screen readers get confused.

They were found by **walking the live DOM** (`button button`, `button a`, `a button`) rather
than by trusting the console, which matters: React's `validateDOMNesting` only warns about
_some_ combinations, so two of the three were silent. A final browser pass reports
`aInButton: 0`, `buttonInA: 0`, `buttonInButton: 0` with no nesting warnings.

1. **`ClientCard` (Clients list).** The card wrapped its content in
   `<Pressable accessibilityRole="button">` with the menu button inside. The menu is now a
   _sibling_ of the card's pressable area (`ClientCardBase` renders contents only; `ClientCard`
   owns the menu). Verified: `button button` 1 → 0, `buttonsInsideFirstCard: 0`, card is still
   a `<button>`. Pinned by `ClientCard.spec.tsx` (4 tests, including that `onPress` still
   fires), which runs in CI.

2. **Consent modal (`<button><a>Terms of Service</a></button>`).** `ConsentModal` puts
   expo-router `<Link>`s in the `Checkbox` label, and `Checkbox` rendered
   `accessibilityRole="button"`. Rather than change the shared component's established role
   (its spec asserts `getByRole('button')`), `Checkbox` gained an **opt-in**
   `accessibilityRole` prop defaulting to `'button'`; the consent rows pass `'checkbox'`. That
   renders `<div role="checkbox">`, which is valid _and_ the more accurate role. Verified:
   `button a` 4 → 0, links still render, `firstCheckboxRole: "checkbox"`. Pinned by a new
   `Checkbox.spec.tsx` case.

3. **Bottom tab bar (`<a><button data-testid="main-plus-tab-btn"></button></a>`).** expo-router
   wraps every tab in a link, and the "main plus" `tabBarIcon` was a `Pressable` with a button
   role. On web it now renders without a role — the enclosing tab link carries the semantics,
   and the modal is opened by the `tabPress` listener regardless. Verified: `a button` 4 → 0.

4. **Consent legal links moved out of the checkbox row.** `ConsentModal` had put the ToS /
   Privacy `<Link>`s _inside_ the `Checkbox` label, so a `role="checkbox"` contained focusable
   children — poor screen-reader structure on every platform, and nested hit targets (tapping
   the link also toggled the box). The links are now siblings of each checkbox. Verified in a
   browser: `[role="checkbox"] a` 4 → 0, links still render, no nesting warnings, and the
   screenshot confirms the layout is unchanged.

With that, the web build has no invalid DOM, no nesting warnings, and no application console
errors or warnings.

### `ActiveOrgProvider` setState-during-render — fixed

React 19 warned `Cannot update a component (ActiveOrgProvider) while rendering a different
component (ActiveOrgProvider)`. Root cause: `useActiveOrgState` deliberately reconciles the
active org **during render** (an effect would run child-before-parent, so the first query
would go out with no `X-Organization-ID` header), and it called the store's `setActiveOrgId`,
which notifies subscribers synchronously. The component subscribes to that same store through
`useSyncExternalStore`, so it was asking React to update itself mid-render.

The store gained `reconcileActiveOrgId`: the **write stays synchronous** (this render, and any
request issued from it, must see the new id) while the **notification is deferred to a
microtask**, which lands outside the render pass. Subscribers rendering later in the same pass
already read the new value from `getSnapshot`; the deferred notify just covers anyone who
already rendered. `setActiveOrgId` is unchanged and still notifies synchronously for
event-handler callers.

Covered by four cases in `activeOrgStore.test.ts` (synchronous write, deferred notify, no
notify when unchanged, `setActiveOrgId` still synchronous). Verified in a browser: the warning
is gone, and the authenticated shell now reports **no application errors or warnings** — the
only console output left is local-dev CORS noise from the app's default environment
(`api.dev` is tried before the email switches it to the local demo API).

### Running the web build against the deployed API (dev proxy)

The email-driven switch already routes to a deployed API: any address that is not
`@example.com` and has no `+demo` picks `EXPO_PUBLIC_API_URL`, which the tracked `.env` sets to
`https://api.dev.betterangels.la`. But a localhost page cannot actually talk to it, for four
reasons — all deliberate, and all solved by serving the API from the page's own origin:

| Blocker        | Why                                                                                           | Fix in the proxy                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| CORS           | dev allows only `https://*.dev.betterangels.la`                                               | request becomes same-origin                                                                                       |
| CSRF origin    | same allowlist, so Django 403s the write                                                      | rewrites request `Origin` to the upstream API's origin, satisfying both the host check and `CSRF_TRUSTED_ORIGINS` |
| CSRF token     | `csrftoken` is scoped to `.dev.betterangels.la`; `document.cookie` on localhost can't read it | strips `Domain`/`Secure` from `Set-Cookie` so the browser stores it host-only for `localhost`                     |
| Session cookie | `SameSite=Lax` (Django default) isn't sent cross-site                                         | first-party again once same-origin                                                                                |

`apps/betterangels/dev-api-proxy.js` implements this as Metro middleware via
`config.server.enhanceMiddleware`, which Expo wraps into its own stack — so it is one process on
one port, like Vite's `server.proxy`:

```sh
BA_DEV_PROXY_TARGET=https://api.dev.betterangels.la \
EXPO_PUBLIC_API_URL=http://localhost:8081/__api \
yarn nx serve betterangels --clear
```

The CSRF interceptor mints its token from `<origin>/admin/login/` — _outside_ the API prefix —
so the proxy also claims `/admin/login` when a target is set. Redirects pointing back at the API
are rewritten onto the proxy origin, and a missing target returns a 502 explaining the env var
instead of a confusing dev-server 404.

Verified:

- `GET /admin/login/` through the dev server → 200, `Set-Cookie: csrftoken=…` with **no
  `Domain`, no `Secure`**.
- `POST /__api/graphql` without a token → Django's CSRF 403; **with** the token minted through
  the proxied bootstrap → `{"data": {"__typename": "Query"}}` from the live API. That is what
  proves the `Origin` rewrite is doing its job.
- In a browser with the app pointed at the proxy: GraphQL goes to `/__api/graphql`, **nothing**
  goes direct to `api.dev`, **zero** CORS errors, and `document.cookie` **can** read
  `csrftoken`.
- A real sign-in against `api.dev` was not exercised — that needs live credentials.

### Branch previews need a base path — `experiments.baseUrl`

Deploying the export to `/branches/<branch>/` on the shared dev distribution did **not** work,
and the reason is specific to the way this app exports. Verified against the real bucket first:

```
/branches/pr-2527-with-envfix/                  -> 200   (the HTML is there)
  ...but it references:
/_expo/static/js/web/index-*.js                 -> 403   <- root-absolute
/_expo/static/css/Input-*.css                   -> 403
/favicon.ico                                    -> 403
```

Expo's web export writes **root-absolute** asset URLs. Put those files under a subpath and the
browser asks for them at the domain root, where nothing exists — so the preview rendered a blank
page. The Vite apps never hit this because `VITE_APP_BASE_PATH` feeds Vite's `base`, which
rewrites asset URLs at build time.

The equivalent for this app is Expo's `experiments.baseUrl`, applied through the same
base-path source so there is one definition of the path:

- `tools/shared/print-base-path.mjs` prints `getBranchBasePath()` (already used by the Vite
  apps: dev server → `/`, production configuration → `/`, CI/BRANCH_NAME → `/branches/<branch>`).
- The `export-web` target passes it: `EXPO_BASE_URL=$(node ../../tools/shared/print-base-path.mjs) expo export …`.
- `app.config.js` maps it to `experiments: { baseUrl: process.env.EXPO_BASE_URL || '' }`.

`@expo/cli` then prefixes every bundled resource (`exportAssets`, `exportStaticAsync`'s
`toAssetUrl`, `favicon`). After the fix the HTML references
`/branches/pr-2527-with-envfix/_expo/static/js/web/index-*.js`.

**Verified by deploying for real** (build → `aws s3 sync` → invalidation, dev account):

| Check                      | Before      | After                                                |
| -------------------------- | ----------- | ---------------------------------------------------- |
| Branch HTML                | 200         | 200                                                  |
| Referenced JS/CSS/favicon  | **403**     | **200**                                              |
| Browser: 4xx/5xx responses | every asset | **none**                                             |
| Browser: React root        | empty       | **mounted**; `document.title = "BetterAngels (Dev)"` |

**No workflow change was needed.** CI already runs `export-web` and `deploy` for the `preview`
configuration, and `.env.deploy.preview` now supplies the credentials, so previews deploy
automatically — the export just had to emit subpath-correct URLs.

Worth knowing: preview deployments land under `/branches/<branch>` (including `main`), not at the
site root — `shelter.dev.betterangels.la/branches/main/` returns 200 today, and
`NX_TASK_TARGET_CONFIGURATION=production` is what maps to `/`.

### Recipe: reaching the authenticated app in a browser

Browser verification kept stalling on the consent modal. The gate is
`apps/betterangels/src/app/(tabs)/_layout.tsx` and opens the modal when **either**:

```js
needsAgreements = user.hasAcceptedTos === false || user.hasAcceptedPrivacyPolicy === false;
shouldOpen = needsAgreements || (bothAccepted && (!user.firstName || !user.lastName)); // "Complete Your Registration"
```

So a usable test account needs **both** flags accepted **and** a first/last name, plus a
Caseworker `PermissionGroup` for the outreach-authorized path. Set them via the **snake_case**
model fields — `has_accepted_tos`, `has_accepted_privacy_policy`, `first_name`, `last_name` —
and `refresh_from_db()` to confirm. Assigning `u.hasAcceptedTos = True` on a model instance
silently does nothing (it just sets a throwaway Python attribute that `save()` ignores), which
looks like it worked if you only read the attribute back.

#### Verifying a `.web` variant

TypeScript resolves `./Foo` to `Foo.tsx` — it has no notion of platform extensions — so an
app's `tsconfig.app.json` **never checks `Foo.web.tsx`**. The app typecheck passing therefore
says nothing about the web variants.

What does cover them is the _lib's_ typecheck target: those tsconfigs include all of `src/**`,
so `nx run expo-shared-ui-components:typecheck` sees `WheelDatePicker.web.tsx` and
`PdfViewer.web.tsx`, and CI's `nx affected -t typecheck` runs it. That is what caught a real
error here — a `StyleSheet.create` containing CSS-only props (`border: 'none'`, `cursor`),
which the app typecheck had happily ignored for two rounds.

The precise rule, since it is not uniform:

- A `.web` file **inside the app project** is covered, because `tsconfig.app.json` includes
  `**/*.ts` by glob rather than by import. So `apps/betterangels/src/init.web.ts` is checked,
  and so are the `libs/ba-platform/web` modules it imports.
- A `.web` file **in another project** is covered only if that project's own `typecheck`
  target exists _and_ its tsconfig includes all of `src/**`. Without the target, nothing
  checks it.

One project this PR touches owned `.web` variants with no `typecheck` target, so CI's
`nx affected -t typecheck` was ignoring them entirely: the project _named_ `expo-shared-apollo`,
rooted at `libs/expo/shared/clients` (`hmisInterceptors.web.ts`). `tsc --noEmit -p
tsconfig.lib.json` passes there, and it now has a `typecheck` target so it stays that way.

`libs/expo/shared/services` (`s3Upload.web.ts`) has the same shape — it declares no `typecheck`
target — but this PR does not otherwise touch that project, so the target briefly added for it
was dropped again as unrelated scope. That `.web` file is still checked: the consumers that
import it typecheck it transitively (`tsc --listFiles` on `expo-betterangels` lists it).

(26 of the repo's 40 projects have no `typecheck` target at all; that is pre-existing and
broader than web, so only the one this PR touches was addressed here.)

**`ba-platform` is one of them, and it is not directly checkable either.** It has no
`typecheck` target, and running `tsc -p tsconfig.lib.json` by hand fails with a wall of
pre-existing `TS6307` ("file is not listed within the file list of project") errors from
project-reference configuration, plus an unrelated `tools/codegen/scalars.ts` error. So the
only typechecking that source gets is **transitive**, through consumers that do have the
target — `expo-betterangels`, `shelter-web` and `betterangels-admin` all report 0 errors, which
is what a change there was verified against. Worth knowing before trusting a green
`nx affected -t typecheck` to mean that library compiles.

One automation gotcha: react-native-web renders a **hidden duplicate** of the tree (an
`aria-hidden` copy used for measurement), so `document.querySelectorAll('[role="checkbox"]')`
returns 4 elements for 2 visible rows, and `force: true` clicks land on the hidden copies and
silently do nothing. Filter to what is actually visible, and expect `Pressable` to be awkward to
drive — a structural DOM assertion is often more reliable evidence than a scripted click.

### Infrastructure

Two static-site units were added, mirroring `shelter-web` exactly:

| Environment | Unit                                                                          | Host                                                               | Bucket                               |
| ----------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------ |
| dev         | `infrastructure/environments/development/us-west-2/static-sites/outreach-web` | `outreach.dev.betterangels.la`                                     | `development-us-west-2-outreach-web` |
| prod        | `infrastructure/environments/production/us-west-2/static-sites/outreach-web`  | `outreach.prod.betterangels.la` + alias `outreach.betterangels.la` | `production-us-west-2-outreach-web`  |

Dev enables `enable_preview_routing`, so branch/PR previews are served under a path prefix on
the same distribution. Prod exposes the public name as a CloudFront alias, matching the
convention used by `shelter` / `admin` / `wildfires`. SPA fallback (extension-less paths →
`index.html`) comes for free from the module's `index-redirect` CloudFront Function, which is
what an Expo Router SPA needs.

**A new static site also needs a line in the deploy role, and that is easy to miss.** The
GitHub Actions role (`iam/github-actions` in each environment) builds its inline policy from a
per-site list, and the bucket/distribution are only reachable if the site appears in it. The
first CI deploy failed exactly there:

```
AccessDenied: ...assumed-role/github-actions-deploy/deploy-betterangels is not authorized
to perform: s3:ListBucket on "arn:aws:s3:::development-us-west-2-outreach-web"
```

So `dependency "outreach_web"` plus an `OutreachWeb` entry were added to both environments'
`iam/github-actions` units — the deploy itself was fine; the role simply had no policy for the
new bucket. The units are applied for both accounts (0 added, 1 changed, 0 destroyed each).

### CI

`apps/betterangels` gained three targets: `export-web`, `deploy` (depends on `export-web`) and
`post-pr-preview`. Because the existing pipeline already runs `nx affected -t deploy` and
`nx affected -t post-pr-preview`, the outreach web app joins both automatically.

No dedicated export step was needed: `deploy` declares `dependsOn: ["export-web"]`, and CI
already runs `nx affected -t deploy`, so the browser bundle is built on every affected run.
(An explicit step was added first and then removed — `export-web` has no `cache` entry in
`nx.json` and Nx defaults it to off, so the second invocation re-bundled the whole app. One
path, not two.)

That dependency chain is what stops this rotting again — before it, nothing in CI ever bundled
for the browser, so a native-only import could break web indefinitely without anyone noticing.

**And it does fire.** That claim was originally inferred (a reviewer could not run Nx locally),
so it was re-checked by execution against this working tree:

```sh
yarn nx affected -t export-web              # → nx run betterangels:export-web → "Exported: ../../dist/apps/betterangels"
nx show projects --affected -t export-web   # → betterangels
nx show projects --affected -t typecheck    # → 16 projects
nx show projects --affected -t test         # → 23 projects
```

(Those counts are this branch against `origin/main`. Nx has no `affected --dry-run` here: the
flag is forwarded to the task's own command, so it lands on `tsc`/`mypy` and errors — use
`nx show projects --affected -t <target>` to list what a run would cover.)

So a change anywhere in the outreach web dependency graph is bundled, typechecked and tested
by the existing pipeline. The web build genuinely cannot regress unnoticed.

Per-environment API wiring is done in the target's `configurations`, and was **verified by
inspecting the built bundle**:

| Configuration | `apiUrl` baked                     | `shelterWebUrl` baked                 |
| ------------- | ---------------------------------- | ------------------------------------- |
| `preview`     | `https://api.dev.betterangels.la`  | `https://shelter.dev.betterangels.la` |
| `production`  | `https://api.prod.betterangels.la` | `https://shelter.betterangels.la`     |

The **production** bundle was re-inspected after the `APP_VARIANT` fix, because the original
`production` configuration was missing it and shipped dev identity:

```
index.html          <title>BetterAngels</title>        (was "BetterAngels (Dev)")
expo config extra   apiUrl:"https://api.prod.betterangels.la"
                    demoApiUrl:"https://api.dev.betterangels.la"
                    googlePlacesApiKey:"AIza…"          (expected — public, inlined)
```

The `demoApiUrl` pointing at the dev API is deliberate and matches the native production
profile in `eas.json`; it is the "demo slot" the app routes `@example.com` accounts to, not
the primary API. So the production artifact is correctly branded and correctly pointed — it
just has no distribution root to live at yet (see the infrastructure section).

`EXPO_PUBLIC_WEB_GOOGLEMAPS_JS_APIKEY` was added to `docker-compose-ci.yml` and to the build
and deploy steps, alongside the existing iOS/Android keys.

> **⚠️ `--clear` is load-bearing.** Metro caches the _inlined_ `EXPO_PUBLIC_*` values, so
> without `--clear` a rebuild keeps the previous environment's URLs regardless of the env
> you pass — the output filename does not even change. This cost real debugging time here: a
> "production" export silently shipped `api.dev`. The native `export` target already passes
> `--clear`; `export-web` now does too. Expect ~15s instead of ~4s.

### Deploy credentials: `apps/betterangels/.env.deploy.*`

**Correction.** An earlier draft of this document said `S3_BUCKET`, `CF_DISTRIBUTION_ID` and
`ASSUME_ROLE` "appear nowhere in this repo". That was wrong, and the error was mine: my searches
used `--include` filters (`*.yml`, `*.json`, `*.mjs`, `*.hcl`, …) that never matched `.env.deploy.*`
files, so I concluded the values were missing when they were committed all along.

The actual convention is a per-app, per-configuration env file that Nx loads for the task:

```
apps/<app>/.env.deploy.preview      -> nx run <app>:deploy --configuration preview
apps/<app>/.env.deploy.production   -> nx run <app>:deploy --configuration production
```

`shelter-web` and `betterangels-admin` both use it; the CI matrix is `["preview",
"production"]`, so the filenames line up with `--configuration` exactly. Outreach now has both
files, copied from the siblings — same bucket naming scheme, same per-environment deploy role:

|            | `S3_BUCKET`                          | `ASSUME_ROLE`                                          |
| ---------- | ------------------------------------ | ------------------------------------------------------ |
| preview    | `development-us-west-2-outreach-web` | `arn:aws:iam::784154756963:role/github-actions-deploy` |
| production | `production-us-west-2-outreach-web`  | `arn:aws:iam::792513288588:role/github-actions-deploy` |

The bucket names match the Terragrunt units exactly.

**No CI change is required.** The workflow already runs `nx affected -t deploy --configuration
${{ matrix.environment }}`, which picks these files up on its own.

Verified by running the real target against a stubbed `aws` binary:

```
📌 Base path: /branches/pr-2527-with-envfix
🔑 Assuming role: arn:aws:iam::784154756963:role/github-actions-deploy...
📦 betterangels → s3://development-us-west-2-outreach-web/branches/pr-2527-with-envfix
✅ S3 sync complete.  ✅ CloudFront invalidation sent.
```

That also confirms branch previews deploy to `/branches/<branch>` on the shared distribution,
which is what the `enable_preview_routing` + `index-redirect` CloudFront Function in the
static-site unit is for.

`CF_DISTRIBUTION_ID` is the only value that cannot be written in advance — CloudFront assigns
it at creation. **Both** sites have now been applied and both files hold their real IDs.

|            | `S3_BUCKET`                          | `CF_DISTRIBUTION_ID`                  |
| ---------- | ------------------------------------ | ------------------------------------- |
| preview    | `development-us-west-2-outreach-web` | `E18T6D6MTJ5IDH` (applied 2026-10-09) |
| production | `production-us-west-2-outreach-web`  | `E1HAHSEJI5YNWC` (applied 2026-10-09) |

The `static-website` module exposes both outputs for exactly this purpose — before that only the
ARNs were exported, which the deploy script does not use. Read them with:

```sh
cd infrastructure/environments/<env>/us-west-2/static-sites/outreach-web
terragrunt output -raw cloudfront_distribution_id
```

An empty `CF_DISTRIBUTION_ID` fails the script's own validation with
`❌ Missing required env vars: CF_DISTRIBUTION_ID`, so a half-configured deploy fails loudly
rather than syncing to the wrong place.

**How the env file reaches Nx — no CI wiring needed.** The earlier assumption that CI's Deploy
step had to be taught about `S3_BUCKET` / `CF_DISTRIBUTION_ID` was wrong, and it is worth
recording why, because nothing in the repo references these files. Nx itself loads a per-task
env file named `.env.<target>.<configuration>` from the project root, which is exactly the
shape of the sibling apps' `.env.deploy.{preview,production}`. Proven by running the deploy
target for each configuration and reading back the role it tried to assume:

```
yarn nx run betterangels:deploy --configuration preview     → ...784154756963:role/github-actions-deploy  (dev)
yarn nx run betterangels:deploy --configuration production  → ...792513288588:role/github-actions-deploy  (prod)
```

So the bridge was already wired; only the _values_ were missing.

**Both sites, as applied:**

| Property                | Development                               | Production                                     |
| ----------------------- | ----------------------------------------- | ---------------------------------------------- |
| CloudFront distribution | `E18T6D6MTJ5IDH` — **Deployed**           | `E1HAHSEJI5YNWC` — **Deployed**                |
| Distribution domain     | `d3c5u8o0gaamfs.cloudfront.net`           | `d3fm2jodmz390e.cloudfront.net`                |
| Route53 record          | `outreach.dev.betterangels.la` (A + AAAA) | `outreach.prod.betterangels.la` (A + AAAA)     |
| Certificate             | `*.dev.betterangels.la`                   | `*.betterangels.la` / `*.prod.betterangels.la` |
| Bucket                  | `development-us-west-2-outreach-web`      | `production-us-west-2-outreach-web`            |
| AWS account             | `784154756963`                            | `792513288588`                                 |
| `terragrunt apply`      | 11 added, 0 changed, 0 destroyed          | 11 added, 0 changed, 0 destroyed               |

Both sites return **403**, which is correct for an empty bucket — neither has had content
deployed yet. Two gaps remain before `outreach.betterangels.la` is usable:

1. **No DNS record for the bare host.** `outreach.betterangels.la` is configured as a
   CloudFront alias on the production distribution, but the unit creates a Route53 record only
   for its `service_record_name` (`outreach.prod.betterangels.la`, which does resolve). The
   live sibling `shelter.betterangels.la` resolves via a CNAME to its distribution that is
   **not** managed by any Terragrunt unit, so the bare host is handled out-of-band and outreach
   needs the equivalent record in the `betterangels.la` zone.
2. **No content deployed to either environment yet** — see the deploy section above.

With those values in place the deploy resolves the whole chain correctly:

```
sts assume-role --role-arn arn:aws:iam::784154756963:role/github-actions-deploy \
  --role-session-name deploy-betterangels
s3 sync dist/apps/betterangels s3://development-us-west-2-outreach-web/branches/pr-2527-with-envfix --delete
cloudfront create-invalidation --distribution-id E18T6D6MTJ5IDH --paths /branches/pr-2527-with-envfix/*
```

### Still to do

- **Replace `reconcileActiveOrgId`'s microtask with a shape that does not write during render.**
  Deferring the notification is safe for a non-yielding render, and the synchronous write is
  genuinely needed before child effects run, so this works today — but "a microtask lands outside
  the render pass" is not guaranteed under a concurrent render that yields, and the
  write-during-render is the thing to remove rather than preserve.
- **The consent flags are a latch, and the latch is field-scoped.** `parseUser` takes `prev` so
  `hasAcceptedTos` / `hasAcceptedPrivacyPolicy` can only go true — a deliberate trade-off,
  documented at the merge site. Every _other_ field is still replaced verbatim by whichever
  payload resolves last, so a read that predates a local write can still clear `firstName` /
  `lastName` (which re-opens the "Complete Your Registration" sheet through its name branch, now
  the only way back in), `organizations` (which redirects to `/welcome`) or
  `isOutreachAuthorized`. The honest fix is a request/response version counter in
  `createUserProvider` — bump on every app-side `setUser`, capture at issue, drop stale results —
  which would make the latch unnecessary rather than load-bearing. Considered and deferred here
  because it changes shared provider logic that native also runs.
- `useInitialLocation`'s reverse-geocode fallback now lives in one helper, but the same
  coordinate-fallback shape is still written in `NoteForm/Location.tsx` and
  `MapLocationPicker`; one exported helper in `libs/shared/places` would remove the drift risk.
- `useRememberEmail`'s native and web variants duplicate their whole state machine, and only the
  web one guards its storage calls — a native SecureStore rejection is currently unhandled. A
  `{ get, set, remove }` adapter would collapse the duplication and unify the error handling.
- `WheelDatePicker.web`'s overlay is positioned from the top of the whole `<Input>` (label
  included) with a hard-coded 56px height, so with a `label` the lower half of the field is not
  clickable. Latent today — the only `type="wheel"` call site passes no label — and it renders
  two focusable inputs, because the display-only `TextInput` is never taken out of the tab order.
- Remaining native surface is `expo-file-system` used for local caching. `DocumentModal`'s
  download is handled (unit-tested, not exercised in a browser because the dev DB has no
  attachments to download); `readFileAsBase64` is HMIS-only and stays deferred.
- **Camera capture: verified live in a browser.** Real Chrome with
  `--use-fake-device-for-media-stream`, driving the real journey (client header → media picker
  → "Take Photo" → shutter). Evidence: `camera-view` mounts, one `<video>` carries an **active
  MediaStream** with track `fake_device_0` and `readyState: 4`. That `readyState` matters — it
  is exactly the `HAVE_ENOUGH_DATA` precondition expo-camera's web `takePicture` checks before
  it will capture. After the shutter, the sheet unmounts and no camera error is logged, and
  `CameraView.handleCapture` only calls `onCapture` (the thing that closes the sheet) on
  `result.type === 'success'` — a cancel leaves it open and an error logs. So the whole chain
  ran: `takePictureAsync` → web `takePicture` → `{ uri: dataURL }` → `resizeImage` →
  `ReactNativeFile`. Verified live in a real Chrome session driven with a synthetic camera
  device, so the capture path really executed; the screenshot taken at the time was a local
  scratch artifact and is not committed.
- Camera on native is untouched by any of this (the hook is shared; only the unreachable
  simulator-mock branch uses expo-file-system).
- Remaining: desktop/responsive layout is a deliberate product decision, not a defect. There is
  no max-width frame and no centring in the app — `apps/betterangels/src/app/+html.tsx` only
  pins a mobile viewport — so a wide window renders the mobile layout at full viewport width.
  (An earlier revision of this note claimed the phone-width layout was centred in the viewport;
  no code does that.)
- **Infrastructure is applied for both environments** and `.env.deploy.preview` /
  `.env.deploy.production` are wired, so `nx affected -t deploy` covers dev branch previews and
  can publish production. Two things remain before production is _reachable_: the apex DNS
  record for `outreach.betterangels.la` (only `outreach.prod.betterangels.la` resolves today),
  and the first content deploy — both buckets are empty, so both distributions answer `403`
  at `/`.

### Decided: a seam for `react-native-keyboard-controller`, a Metro alias for `react-native-maps`

The map in `apps/betterangels/metro.config.js` is the last resort, not the default. It now has
one entry; `react-native-keyboard-controller` used to be the second and is a **seam** instead
(`libs/expo/shared/ui-components/src/lib/Keyboard`, a re-export with a `.web.tsx` twin), which
keeps the substitution visible at the import site and needs no bundler hook. A root
`no-restricted-imports` rule stops anything importing the package directly, so the seam cannot
be bypassed by accident.

`react-native-maps` stays an alias for two reasons together: it is imported by package name from
~20 files across `libs/` and the replacement needs the app's resolved browser key, so there is
no library module to hang a `.web` sibling off; and the replacement implements behaviour teovilla
omits rather than degrading to nothing.

**The keyboard package is worth understanding before anyone "simplifies" this away again.** It
ships its own non-native fallback — `src/bindings.ts` casts the native views to plain `View` and
replaces the native module with NOOPs, `src/reanimated.ts` stubs the keyboard handlers — and
those resolve for `platform=web`, so **importing** it does not throw. That is where the original
shim's justification ("its TurboModule-backed views cannot be created") was wrong, and it is
tempting to conclude the package needs no handling at all. **Using** it is what fails: with the
package's own fallback, `KeyboardAwareScrollView` resolves to `undefined` and the sign-in screen
hits the error boundary —

```
Error: Element type is invalid: expected a string (for built-in components) or a
class/function … but got: undefined. … Check the render method of `SignInContainer`.
```

— measured on the running web app by pointing the seam's web half at the real package. Its
toolbar also mounts a 42px "Done" bar (off-screen at the bottom, but real DOM). So the seam is
load-bearing, and it is the only reason the app's keyboard-aware screens work on web.

## Keys to provision

Two different keys, two different jobs — one cannot substitute for the other.

| Key                                    | Where                                     | Restriction                                                                                                            |
| -------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_WEB_GOOGLEMAPS_JS_APIKEY` | Frontend build (CI secret + `.env.local`) | **HTTP referrer**, Maps JavaScript API only. Public by nature — it is inlined into the JS bundle                       |
| `GOOGLE_MAPS_API_KEY`                  | Backend, already provisioned via SSM      | Server-side; used by `proxy/` for Places/geocoding. **Cannot** be referrer-restricted — server calls send no `Referer` |

The map _tiles_ cannot be proxied: `maps.googleapis.com/maps/api/js` is a script the
browser downloads and executes, and it validates the referrer itself.
Places/geocoding _can_ be proxied, and already is server-side.

> **Unverified: whether the web key's referrer allow-list includes the production host.**
> This is a deploy prerequisite — a key that omits `outreach.betterangels.la` breaks maps on
> the deployed site only, silently. It was _attempted_ here and could not be established: a
> Playwright harness spoofed the `Referer` for `maps.googleapis.com` and watched
> `window.gm_authFailure`, and every referrer "passed" — including a deliberately bogus one.
> The control that settles it is re-running the same harness with a **deliberately invalid
> key**, which _also_ reported `google.maps.Map === true` and no auth failure. So the harness
> could not detect auth failures at all, its results are meaningless, and it has been deleted
> rather than left around looking like evidence. `google.maps` is bootstrapped eagerly enough
> that neither `gm_authFailure` nor the presence of the `Map` constructor proves anything at
> that point.
>
> What is known: the same key renders maps from `http://localhost:8081` and the dev preview,
> and the production bundle bakes in the right key. Confirm the allow-list in the GCP console
> before publishing prod, or simply look at a map on the deployed site — but do not treat this
> document as having verified it.

**And the key is not in CI at all.** The workflow passes
`secrets.EXPO_PUBLIC_WEB_GOOGLEMAPS_JS_APIKEY` to the build and deploy steps, but that secret
does not exist in the `preview` or the `production` GitHub Environment (nor at repo level,
which only holds the two Expo tokens). An undefined secret expands to an empty string.

Measured, rather than assumed: exporting the app with an empty web key produced a bundle whose
`root` never rendered — **a white screen**, not a blank map, because `config.ts` treats a
missing key as fatal and `loadConfig()` runs at module load. The browser reported
`Missing required config: Google Places API key` and rendered nothing.

Two things now stand in for that:

- **The app no longer white-screens.** `config.ts` keeps the throw on native (where the build
  always bakes a key, so an empty one means a broken artifact) but degrades on web, logging
  `[config] EXPO_PUBLIC_WEB_GOOGLEMAPS_JS_APIKEY is empty in this build…` instead. The SPA
  renders; only the map and address-search surfaces lose function.
- **CI emits a GitHub `::warning`** annotation naming the missing secret and the environment.

> **Neither of those is a safety net in a production build.** The `console.error` above is
> deleted from production bundles — `apps/betterangels/metro.config.js` sets
> `minifierConfig.compress.drop_console = true`, so terser removes every `console.*` call.
> Verified against the committed export: an in-app `console.log` on a live code path
> (`loggerLink`) is absent from `dist/apps/betterangels/_expo/static/js/web`, while library
> strings that merely _contain_ `console.log` remain. And the CI annotation is a warning, not a
> gate, so the pipeline goes green and deploys an outreach app with no maps and no address
> search.
>
> **Decided: the warning stays a warning.** Making it fatal for the `production` environment was
> proposed and declined — the gate would sit in front of `nx affected -t deploy`, which deploys
> every affected app in one step, so one missing secret would hold up unrelated releases. The
> mitigation is provisioning, below. Revisit if the deploy step is ever split per app.

#### What a keyless build looks like, so it is not re-diagnosed

Reported as "a modal flickers while navigating, something about Google Maps not loading". All of
it is one cause — an empty key — and it comes and goes with the map, which is why it flickers:
tab screens stay mounted, so a transition creates and destroys the map, and the artefacts go with
it.

1. **Google's own dialog** over the map: _"This page can't load Google Maps correctly. Do you own
   this website?"_ — with tiled **"For development purposes only"** watermarks.
2. In **dev only**, Expo's LogBox toast at the bottom: `Google Maps JavaScript API error…`.
3. In the console (dev only — stripped from production by `drop_console`, see above):
   `Google Maps JavaScript API error: ApiProjectMapError` and `warning: NoApiKeys`.

Reproduced by emptying `EXPO_PUBLIC_WEB_GOOGLEMAPS_JS_APIKEY` and loading `/note/create` or the
client Locations tab; the Maps script request then carries **no `key=` parameter at all**.

Two ways to hit it:

- **Deployed.** The build has no key. Verified by pulling the deployed bundle and grepping it: a
  keyless deploy still contains the iOS and Android keys — both are inlined because `config.ts`
  and `app.config.js` reference them — so the bundle _looks_ keyed while the web key is `''`.
  Grep for the web key itself, not just for `AIza`.
- **Locally, with a stale bundle.** `EXPO_PUBLIC_*` is inlined at transform time, so a dev server
  started before the key was added keeps serving a keyless bundle. Restart it with `--clear`.

A third option — rendering an explicit "map unavailable" state instead of letting Google's dialog
show — was proposed and declined, so the map surfaces are unchanged.

Neither is a substitute for the key. Set it before relying on a deployed environment:

```sh
gh secret set EXPO_PUBLIC_WEB_GOOGLEMAPS_JS_APIKEY --env preview    --body '<key>'
gh secret set EXPO_PUBLIC_WEB_GOOGLEMAPS_JS_APIKEY --env production --body '<key>'
```

> **Local dev keys are fine to share; the sample file is just the wrong place.**
> `apps/betterangels-backend/.env.local.sample` is a template — **nothing reads it**.
> `settings.py` loads, in order, `.env` → `.compose/local.shared.env` → `.env.local`
> (last wins), and `.env.local` is gitignored. So a key placed in the `.sample` file is
> both committed _and_ inert: the local backend still sees the `<GOOGLE_MAPS_API_KEY>`
> placeholder from `.env`, and the Places proxy will fail locally. Put local values in
> `apps/betterangels-backend/.env.local`.
>
> The thing that only matters in **deployed** environments: the browser key and the
> backend key must be _different_ keys. A referrer-restricted key cannot serve the
> proxy (server calls send no `Referer`), and an unrestricted key that ships in a JS
> bundle is a billing risk. Locally, one shared key is harmless.

### Auth needs no backend change

Confirmed against the deployed configuration:

- **CSRF cookie is already cross-subdomain.** `csrf_cookie_domain = ".${local.zone_name}"`
  (dev) and `".${local.production_domain}"` (prod) in the backend terragrunt units, so the
  `csrftoken` cookie is readable via `document.cookie` from `outreach.dev.betterangels.la`
  just as it is from `shelter.dev.betterangels.la`.
- **Local dev is even simpler**: the web app (`localhost:8081`) and API (`localhost:8000`)
  are the _same host_ — cookies ignore port — and `CSRF_TRUSTED_ORIGINS` already lists
  `http://localhost:8081`.
- The session cookie stays host-only, which is correct: only the CSRF cookie needs to be
  readable by JS from a sibling subdomain.

### The deployed origins are allowed — by their own environment only

Worth stating plainly, because "CORS" came up repeatedly and the _only_ case that is actually
broken is local dev. Probed against the live APIs:

| Origin tested                          | `api.dev` ACAO             | `api.prod` ACAO |
| -------------------------------------- | -------------------------- | --------------- |
| `https://outreach.dev.betterangels.la` | **echoed** (+ credentials) | _none_          |
| `https://outreach.betterangels.la`     | _none_                     | **echoed**      |
| `https://shelter.betterangels.la`      | _none_                     | **echoed**      |

Both outreach environments are wired correctly and independently: dev web ↔ dev API, prod web
↔ prod API. So the production site will be able to authenticate as soon as it is deployed to —
this is not an outstanding blocker. The `http://localhost:8081` case is the exception (no API
allows it), which is why local web needs either the Metro dev proxy or a local API.

### The deployed preview actually boots

`https://outreach.dev.betterangels.la/` returns **403** because the root of the bucket is
empty, and that is expected — branch previews are served under a path prefix on the same
distribution. The thing that can silently rot is the _preview_ itself: the export is built
with `experiments.baseUrl`, so if asset resolution or the SPA fallback were wrong the HTML
would still return 200 while the page rendered nothing and 404'd every bundle.

Loaded in a real browser:

```
URL     https://outreach.dev.betterangels.la/branches/pr-2527-with-envfix/auth
title   BetterAngels (Dev)
text    "Choose an account: Better Angels HMIS App version: OTA version: N/A"
script  /branches/pr-2527-with-envfix/_expo/static/js/web/index-3217a2….js
asset failures: 0 | console errors: 0   → PASS
```

So the base path resolves, the bundle loads from the branch prefix, and the app paints the
real auth screen. The one failed request is the pre-login `currentUser` call to `api.dev`
(`net::ERR_ABORTED`, no console error) — a client-side abort on the signed-out path, not a
CORS or asset problem.

## Spike findings (2026-10-08)

### Full web export now succeeds

**With zero stubs**, `expo export --platform web` completes and `expo start --web` boots:
~4,730 modules, a single `index.html` (SPA — `web.output: 'single'` is the default, so
there is no per-route prerendering to worry about) plus a 7 MB unminified dev bundle.
The route tree is not the blocker; a handful of platform modules were.

### Google Maps / `@teovilla/react-native-web-maps`

**Viable, with one required correction.**

`@teovilla/react-native-web-maps@0.9.5` mounts correctly under React 19 /
react-native-web 0.21: it loads the Maps JS API through
`@react-google-maps/api@2.20.8` (which declares React 19 support), requests the
marker library, and renders Google's map container. A deliberately invalid key
produced Google's own `gm-err-*` overlay inside the mounted container, which is
the expected "component works, key is bad" outcome.

**The catch:** teovilla renders _nothing at all_ — no container, no error —
unless `provider="google"` is passed. It does **not** export `PROVIDER_GOOGLE`
(only `default`/`MapView`, `Marker`, `Polygon`, `Polyline`, `Circle`, `Callout`,
`Geojson`). A plain bundler alias of `react-native-maps` →
`@teovilla/react-native-web-maps` therefore silently breaks every call site
that passes `provider={PROVIDER_GOOGLE}`, because the constant resolves to
`undefined`:

- `libs/expo/shared/ui-components/src/lib/Map/index.ts` re-exports
  `PROVIDER_GOOGLE`/`PROVIDER_DEFAULT` straight from `react-native-maps`
- `.../Map/MapLocationPicker/index.tsx` passes `provider={PROVIDER_GOOGLE}`
- `libs/expo/betterangels/src/lib/screens/AppSettings/DefaultLocation/DefaultLocation.tsx`
  consumes it via the ui-components barrel

By contrast `libs/expo/betterangels/src/lib/maps/index.ts` already guards with
`Maps?.PROVIDER_GOOGLE || 'google'`, which is why the note/location screens are
fine.

**Conclusion:** build a real platform-split map module that re-exports teovilla
plus `PROVIDER_GOOGLE`/`PROVIDER_DEFAULT` constants — do not rely on a raw
resolver alias. Two known stale spots in teovilla to work around:
`MapView` requires a `googleMapsApiKey` prop (the app's native call sites pass
none; the key currently comes from native SDK config), and its
`addressForCoordinate` ref method calls `Location.setGoogleApiKey`, which no
longer exists in `expo-location` 57. The app does not use that method (it
reverse-geocodes via `GooglePlacesClient`), so it is latent, not blocking.

### Web maps opened at the wrong zoom (and `region` was ignored entirely)

Two more silent teovilla gaps, found because the web maps were visibly zoomed out
compared with mobile. Both live in
`dist/module/components/map-view.js` and both are now closed in the web shim
(`apps/betterangels/src/web-shims/react-native-maps.tsx`).

**Caveat, found after the fact and since fixed:** the shim is only reached by call
sites that import `react-native-maps`. `libs/expo/betterangels/src/lib/maps/map.web.ts`
imported teovilla _directly_, bypassing the shim entirely, so six call sites
(`NoteLocation`, `NoteLocationHmis`, `LocationHmis`, `NoteForm/Location`,
`ClientSummaryLastSeen`, `DefaultLocation`) kept both bugs — and also loaded the
Maps JS API with **no key at all** (teovilla takes the key as a prop, and only the
shim injects it), which showed up as Google's `NoApiKeys` warning in the dev server
log.

That bypass turned out to be a crash, not just a missing zoom: `useJsApiLoader` is a
module-level singleton that **throws** if it is ever called again with different
options, so mounting a shimmed map (real key) and then a bypassed one (empty key)
took the whole app down with "Something went wrong" — reproduced when switching
between the Interactions and Locations tabs. `map.web.ts` has been **deleted**; it
was redundant, because `map.ts` already imports `react-native-maps`, which Metro
substitutes with the shim on web. The shim is now the only module that imports
teovilla, so the loader can only ever see one option set.

**1. Region deltas are dropped; zoom is hardcoded to 3.** teovilla builds its
Google Map with:

```js
zoom: props.initialCamera?.zoom || 3,
center: map ? map.getCenter() : {
  lat: props.initialCamera?.center.latitude || props.initialRegion?.latitude || 0,
  lng: props.initialCamera?.center.longitude || props.initialRegion?.longitude || 0,
}
```

It reads only `latitude`/`longitude` out of `initialRegion`. `latitudeDelta` /
`longitudeDelta` are never consulted, and nothing in the app passes
`initialCamera`, so **every web map opened at zoom 3** — a continental view —
while the same `initialRegion` on native shows the neighbourhood. This is why
`animateToRegion` _appeared_ to work (it converts the deltas into a
`google.maps.LatLngBounds` and calls `fitBounds`) while the initial view did not.

**2. A controlled `region` prop is never read.** There is no `props.region`
access anywhere in `map-view.js`. Six call sites pass `region` instead of
`initialRegion` (`ClientSummaryLastSeen`, `NoteLocation`, `NoteLocationHmis`,
`LocationHmis`, `NoteForm/Location`, `DefaultLocation`), so on web they fell back
to `initialRegion ?? {lat: 0, lng: 0}` and rendered a world map centred on 0,0.

**Fix:** the shim converts whichever prop the call site used into the zoom Google
Maps wants and passes it as `initialCamera`:

```ts
zoom: Math.round(Math.log2(360 / region.longitudeDelta));
```

This is deliberately the same conversion as
`libs/expo/shared/ui-components/src/lib/Map/utils/regionToZoom.ts`, duplicated
rather than imported because this module _is_ the `react-native-maps`
substitution and importing from ui-components would close a resolution cycle
back through itself. Two consequences worth knowing:

- The result is a **fixed scale**, so it reproduces mobile's framing regardless of
  browser width. Native instead fits the deltas to the view, so on a very wide
  viewport native would show the same span at a higher zoom. Matching mobile is
  the point here.
- Where `defaultRegionDelta` (0.03) is used, that lands on zoom 14; teovilla's
  fallback was 3.

A controlled `region` also has to _move_ the map when it changes. `initialCamera`
only covers the first frame and teovilla re-reads the live map centre on every
later render, so props cannot drive it — the shim calls `animateToRegion`
imperatively, keyed on the region's **values** and never its object identity
(every call site builds the region literal inline, so identity-keying would
re-centre on every render and fight the user). This needed a callback-ref merge:
teovilla's `useImperativeHandle(..., [map])` re-attaches its handle once the map
loads, so the merged ref is refreshed rather than stale.

Guarded with an `isPlainRegion` check rather than trusting the props: `region` is
typed `Region | AnimatedRegion`, an `AnimatedMapRegion` has no numeric
coordinates, and call sites build `initialRegion` from possibly-absent data (a
client with no last-seen location) — an undefined delta would otherwise become
`zoom: NaN` instead of falling back.

Pinned by `apps/betterangels/src/web-shims/react-native-maps.spec.tsx` (12 tests:
both prop paths, the AnimatedRegion and partial-region fallbacks, ref forwarding,
re-centring on a region change, the pre-`onMapReady` gate and the pending-region
replay, and the `scrollEnabled` → `draggable` translation). Confirmed in a live
browser against seeded data: the local DB now holds 25 interactions each with a
PostGIS point across LA, so the client Locations map and the interaction detail
map both render real clusters. That data came from throwaway seeding scripts
that are **not** part of this PR — they were scaffolding for verification, not a
deliverable, and have been dropped. Probe account
`probe_x@example.com` / `probe-maps-1234`; the `caseworker1..10@example.com` /
`password` accounts those scripts created still exist in the author's local DB.

**The `map.web.ts` bypass — closed.** Metro's `WEB_SHIMS` substitution already
handles `react-native-maps` on web, so `libs/expo/betterangels/src/lib/maps/` did
not need a web variant, and having one actively opted six call sites out of the
shim:

```ts
// libs/expo/betterangels/src/lib/maps/map.web.ts  (DELETED)
import * as Maps from '@teovilla/react-native-web-maps';
export default Maps;
```

Deleting it makes `map.ts`'s `import * as Maps from 'react-native-maps'` resolve
through the shim on web, which fixed the missing key, the region handling **and**
the loader crash for those screens in one step. Verified in a browser: a tour that
mounts a map from each former code path (client Locations tab, interaction detail
`/note/8`, the settings location picker) produced **0** `Loader must not be called
again` errors and rendered 4 maps, including the exact
Locations → Interactions → Locations sequence that used to crash.

**The blank-message `ERROR` entries — diagnosed and fixed.** The hypothesis below
(a Maps JS double-load with different parameters) was correct, and it was not
cosmetic: `@react-google-maps/api`'s `useJsApiLoader` is a module-level singleton
that throws `Loader must not be called again with different options` on a second
call with a different key. That throw propagated to the root error boundary, which
replaced the app with "Sorry, something went wrong" — the crash users hit when
moving between interaction and location screens. Removing the bypass means the
loader can only ever see one option set, which is now asserted by a browser tour
rather than by inspection.

**Also fixed in the shim after review:** `initialCamera`/`initialRegion` are latched
(state, not refs read during render) so teovilla stops re-applying the camera
mid-gesture — the picker was re-fitting the bounds on every pointer move, which
looked like the map zooming in and out while dragging. Verified with a drag
protocol: three consecutive drags each moved the centre ~389 m with the zoom
unchanged at 16. `scrollEnabled` is translated into Google's `draggable` (teovilla
drops it, so six static mini-maps were drag-pannable off their own pin), the
imperative API is gated on `onMapReady` (calling `animateToRegion` before the SDK
loads throws `google.maps.LatLngBounds is not a constructor`), and
`isPlainRegion` rejects non-finite or non-positive deltas instead of producing
`zoom: NaN` / `Infinity`.

**Region changes now complete on zoom, not just on drag.** teovilla binds
`onBoundsChanged` → `props.onRegionChange` (continuous) but `onDragEnd` →
`props.onRegionChangeComplete`, and never forwards Google's `idle`. So a wheel or pinch
zoom — and any programmatic move — never reached `onRegionChangeComplete` at all, which is
why `InteractionsMap`'s clusters never broke apart when zooming in. The shim now forwards
`onRegionChange` verbatim _and_ settles the last continuous region into
`onRegionChangeComplete` after 200 ms of quiet, which is the honest stand-in for `idle`
that teovilla does not expose. Pinned by three new spec cases (verbatim forwarding, settle
after the delay, and a burst collapsing to a single completion carrying the last region).
Note the visible impact is small with the current demo data — every seeded client has at
most two interactions — so this was verified by spec rather than by watching clusters
split.

**The remaining framing gap, and why `fitBounds` cannot close it.** `regionToCamera`
deliberately computes a fixed scale, so it ignores how wide the container actually is: a
0.03° span (`regionDeltaMap.M`) covers `256 × 2^z` px, so a 1000 px viewport needs roughly
**two zoom levels more** than that formula yields. Measured on the client Locations map:

| Span      | Requested | Actually rendered | Ratio |
| --------- | --------- | ----------------- | ----- |
| Latitude  | 0.03°     | 0.0552°           | 1.84× |
| Longitude | 0.03°     | 0.0858°           | 2.86× |

Native fits the region to the view, so the honest fix is to put the container's pixel width
into the zoom — `log2(360 · width / (256 · longitudeDelta))` — which needs an `onLayout`
wrapper to measure it. That is a layout change across all 19 map call sites, so it is **not
done here** and wants a deliberate decision.

Framing it instead through teovilla's `animateToRegion` (which is `fitBounds`, i.e. native's
own semantics) was implemented, instrumented, measured, and **reverted, because it cannot be
made reliable**:

- The imperative handle closes over teovilla's `map`, which is still `null` when readiness
  fires, so `map?.fitBounds(...)` silently no-ops. Instrumentation showed the shim calling
  `animateToRegion` while teovilla's `fitBounds` was never entered — 0 calls in two of three
  runs. This is the same "swallowed by the optional chain" hazard the review flagged.
- Even when it _is_ entered, teovilla re-applies `initialCamera.zoom` as a controlled prop, so
  the map settles back on the fixed-scale zoom (14) rather than the fitted one, and the
  visible span is unchanged (0.0858° either way).

So the framing can only be fixed by computing the zoom correctly, not by moving the map after
the fact.

### Google Places on web — implemented

`GooglePlacesClient` called Google directly with an app-restricted key plus
`X-Ios-Bundle-Identifier` / `X-Android-Package` / `X-Android-Cert` headers. A browser can do
none of that: those headers are what satisfies the key restriction, and they cannot be set
from a page. `apps/betterangels-backend/proxy/` already exposed
`proxy/places/v1/<path>` and `proxy/maps/api/<path>` (with tests) but nothing used it.

`GooglePlacesClient` now takes an optional transport, `configurePlacesProxy({ apiUrl, fetch })`:

- **Native** leaves it unset and keeps calling Google directly (one fewer hop, unchanged).
- **Web** configures it in `init.web.ts`'s `buildFetchClient`, passing the **app's own fetch
  client** — so the call carries the session cookie and the `x-csrftoken` header that the
  proxy's `@login_required` requires. Re-installed on every environment switch, since the
  origin changes.
- Proxied calls send **no** Google key and drop the platform headers; the backend holds its
  own key. `X-Goog-FieldMask` is still sent, because the proxy forwards it.
- The geocode key is stripped from the proxied URL for the same reason.

Two traps worth recording: the proxy route is `places/v1/<path>/**` with a **trailing slash** —
without it Django redirects the POST and the body is lost — and the request must be made with
`credentials: 'include'` or `@login_required` bounces it.

**Reverse geocoding used to report failures as successes.** The Geocoding API answers
`REQUEST_DENIED` / `OVER_QUERY_LIMIT` with **HTTP 200** plus a `status` field, and
`reverseGeocode` only checked `response.ok`. So a denied key fell straight through to the
"no result" fallback and returned `"34.05, -118.24"` as though it were a real address — on a
path that feeds the location saved onto an interaction. It now throws unless the status is
`OK` or `ZERO_RESULTS` (the latter is a genuine "no address for this point", where the
coordinate fallback is the right answer), and tolerates a body with no `status` at all so a
reshaping proxy cannot make every geocode throw.

That makes the client honest, which shifts a responsibility onto its callers: the product
intent is clearly to fall back to coordinates on _any_ failure, so the two call sites that
previously let the failure pass silently now catch and fall back explicitly —
`NoteForm/Location.tsx` and `useInitialLocation.ts`. Both do it **inside** their geocode
helper rather than at the call site, because both are also invoked from an `onRefine`
callback that is not awaited, where a rejection would escape the surrounding `try` and float.
`MapLocationPicker` already had exactly this catch-and-fall-back shape.

Verified at both ends:

| Check                                                            | Result                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (`GooglePlacesClient.spec.ts`, via Nx `shared-places:test`) | 7 tests: direct URL + key header unchanged; proxied autocomplete/details/geocode URLs, no key, field mask preserved; a 200 `REQUEST_DENIED` now rejects; `ZERO_RESULTS` still falls back; a body with no `status` still works. The spec also restores `globalThis.fetch` in `afterEach` instead of leaking its stub |
| Backend proxy with the real key (Django test client)             | 200, 5 suggestions                                                                                                                                                                                                                                                                                                  |
| **From a real browser origin** (authenticated session + CSRF)    | **200, 5 suggestions, "1600 Amphitheatre Parkway"**                                                                                                                                                                                                                                                                 |

`libs/shared/places` gained a `test` target and a `vite.config.ts` for this — it previously had
only `typecheck`.

Map _tiles_ still need a referrer-restricted Maps JavaScript API key; only Places/geocoding
goes through the proxy.

### Native-only modules with no usable web build

Originally the full set: `react-native-pdf`, `@preeternal/react-native-cookie-manager`,
`newrelic-react-native-agent`, `@react-native-vector-icons/*`,
`@react-native-community/datetimepicker`, `@react-native-picker/picker`,
`expo-secure-store` (its web build is literally `export default {}`), and
`expo-file-system`'s new and legacy APIs (web builds warn "not supported on web").

All of those are now ported except `expo-file-system`, which only needs handling where it is
used for local file caching/reading (`DocumentModal`, `useCapturePicture`,
`readFileAsBase64`) — the web upload transport does not touch it. `@react-native-picker/picker`
turned out to be dead code and needed nothing.

### Confirmed NOT a problem (boots fine as-is)

Verified by booting the app: `react-native-mmkv` (localStorage-backed web build),
`expo-updates`, `expo-application`, `expo-dev-client`, `react-native-select-dropdown`,
`@likashefqet/react-native-image-zoom`.

### Not needed on web

- `react-native-keyboard-controller` — native keyboard insets/dismissal/toolbar
  only. Browsers handle this natively; use passthrough providers and normal
  scrolling. Import it through the `Keyboard` seam, never directly — its own web
  fallback leaves `KeyboardAwareScrollView` undefined (see the seam section above).
- `expo-updates` / `expo-application` — OTA and native version metadata have no
  web equivalent; guard and source version info from the deployment.
- `react-native-mmkv`, `expo-camera`, `expo-location`, `expo-image`,
  `expo-image-manipulator`, `expo-clipboard`, `expo-sharing`,
  `expo-document-picker`, `expo-image-picker`, `react-native-reanimated`,
  `react-native-gesture-handler`, `react-native-svg`, `react-native-screens`,
  `@shopify/flash-list`, `@gorhom/bottom-sheet` — all ship working web builds.

## Related

- Web session/CSRF/cookies already solved in `libs/ba-platform/web`
  (`createWebFetchClient`), used by `betterangels-admin` and `shelter-web`.
  The outreach app hard-wires the native adapter in
  `apps/betterangels/src/init.ts`; it needs a platform split.
- Web S3 upload transport already exists: `libs/expo/shared/services/src/lib/s3/s3Upload.web.ts`.
