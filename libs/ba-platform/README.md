# ba-platform

The **platform layer** for BetterAngels frontend applications — shared code that
connects our frontend apps to the BetterAngels backend.

## Why this exists

BetterAngels has four frontend apps sharing one backend:

| App | Platform | Stack |
|---|---|---|
| `betterangels-admin` | Web (Vite) | React + Apollo |
| `shelter-web` | Web (Vite) | React + Apollo |
| `shelter-operator` | Web (Vite) | React + Apollo |
| `betterangels` | Mobile (Expo) | React Native + Apollo |

Each app needs the same backend-specific behavior — sending the
`X-Organization-ID` header, managing the active organization, CSRF
protection, and so on. This code doesn't belong in the generic shared
libraries (`libs/react/shared`, `libs/apollo`) because those are designed
to be backend-agnostic (`scope:shared`). `ba-platform` is the dedicated
home for that glue.

## NX classification

Tagged **`type:data-access, scope:ba-platform`**. See
[`docs/styleguides/nx.md`](../../docs/styleguides/nx.md) for full monorepo
conventions.

| Rule | Meaning |
|---|---|
| `type:data-access` | Backend interaction + state management. May depend on other `data-access` libs and `type:util`. |
| `scope:ba-platform` | BA-specific. `scope:shared` libs must never import from here. |
| App dependency | Every BA app depends on `scope:ba-platform` + `scope:shared`. |

## Internal layout

Mirrors the top-level `libs/` structure. Organized by **layer** (framework,
not platform):

```
libs/ba-platform/
├── permissions/                    ← @monorepo/ba-platform/permissions (separate NX project)
│   └── src/__generated__/          ← Generated permission enums + PermissionEnum
├── web/                            ← @monorepo/ba-platform/web (separate NX project)
│   └── src/lib/                    ← Web fetch client, CSRF, cookies
├── expo/                           ← @monorepo/ba-platform/expo (separate NX project)
│   └── src/lib/                    ← Expo fetch client, CSRF
├── src/
│   ├── index.ts                    ← Main entry: @monorepo/ba-platform
│   ├── react.ts, expo.ts           ← Secondary barrels
│   └── lib/
│       ├── constants.ts            ← Platform-agnostic constants
│       ├── interceptors.ts         ← Re-exports from @monorepo/fetch
│       ├── apollo/                 ← BA-specific Apollo code
│       │   ├── graphql/            ← Generated GQL types (codegen output)
│       │   └── user/               ← GQL operations + generated hooks
│       └── react/                  ← Shared React code (works in web + native)
│           ├── ApiConfigProvider.tsx
│           ├── ApolloClientProvider.tsx
│           ├── EnvironmentSwitcherProvider.tsx
│           └── providers/
│               ├── activeOrg/      ← ActiveOrgProvider, permissions
│               └── user/           ← UserProvider, createUserProvider
```

The rule: if you'd put a **generic** version in `libs/react/` or `libs/apollo/`,
the **BA-specific** version goes under the corresponding directory here.

## Entry points

**Four entry points**, organized by **platform API dependency** — not by
UI framework.

> **Current state:** The ``web`` and ``expo`` entry points have graduated to
> separate NX projects under ``libs/ba-platform/`` (``ba-platform-web``,
> ``ba-platform-expo``). The ``types`` and ``permissions`` entry points
> remain as TypeScript barrel files until they grow enough code to warrant
> their own projects.

React runs on both web and native. Shared React code (hooks, providers)
has no platform dependency and belongs in the main entry. Pure TypeScript
(constants, enums, regex) is naturally platform-agnostic. Entry points
only split when a **platform-specific import** makes code incompatible
with one target.

| Import path | Target | Contents |
|---|---|---|
| `@monorepo/ba-platform` | All apps | Platform-agnostic — constants, React providers, `ApolloClientProvider`, `ApiConfigProvider`, `EnvironmentSwitcherProvider`, GQL hooks |
| `@monorepo/ba-platform/web` | Web only | `createWebFetchClient` — pre-composed fetch + Apollo link (browser localStorage / cookies) |
| `@monorepo/ba-platform/expo` | Expo only | `createExpoFetchClient` — pre-composed fetch + Apollo link (CookieManager / AsyncStorage) |
| `@monorepo/ba-platform/types` | All apps | Generated GQL types only (no runtime code) |
| `@monorepo/ba-platform/permissions` | All apps | Generated permission enums + `PermissionEnum` union type |

### Decision tree

When adding code, ask: **"Does this import a platform-specific API?"**

| Situation | Entry point |
|---|---|
| Pure TS (constants, enums, types, regex) | `@monorepo/ba-platform` |
| React code with no platform imports | `@monorepo/ba-platform` |
| Apollo code with no platform imports | `@monorepo/ba-platform` |
| Uses `document.cookie`, `window`, or other browser-only APIs | `@monorepo/ba-platform/web` |
| Uses `AsyncStorage`, `Platform.OS`, or other RN-only APIs | `@monorepo/ba-platform/expo` |
| Uses a different platform API entirely | Add a new entry point (see below) |

This keeps the compile surface clean: a web app importing
`@monorepo/ba-platform` never resolves `react-native`, and vice versa.

### Why not more entry points?

Pure TS doesn't need its own entry point — it has zero platform
dependencies and is safe everywhere. Shared React doesn't need its own —
React works on both web and native. The only boundary that matters is
**"this import will fail at compile time on one of our targets."**

### Adding a new entry point

If a new platform emerges (Node.js runtime, worker thread, etc.):

1. **Create the NX project** — add a `project.json` under `libs/ba-platform/<name>/`
   (see `web/project.json` or `expo/project.json` for templates).

2. **Create the barrel file** — `libs/ba-platform/<name>/src/index.ts`.

3. **Register the path alias** — add to `tsconfig.base.json`:
   `"@monorepo/ba-platform/<name>": ["./libs/ba-platform/<name>/src/index.ts"]`

4. **Update this README** — add the entry point to the table and decision
   tree above.

The `src/lib/` directory structure stays the same — the new entry point
re-exports from the internal directories that hold the platform-specific
code.

## What belongs here

| ✅ Belongs here | ❌ Does NOT belong here |
|---|---|
| Code that depends on BA backend conventions (`X-Organization-ID`, `HasOrgPerm`, org-scoped queries) | Generic React hooks or utilities → `libs/react/shared` |
| Code shared by **two or more** BA frontend apps | App-specific pages or components → the app's own lib |
| BA-specific integration for any layer (React, Apollo, pure TS) | Generic Apollo or storage utilities → `libs/apollo`, `libs/react/shared` |
| GQL operations + generated types for the BA schema | Code with no BA dependency at all |
| Pure TypeScript — constants, enums, regex (→ `@monorepo/ba-platform`) | Platform-specific code in the wrong entry point (check the decision tree) |

## Module catalog

### Platform-agnostic (`@monorepo/ba-platform`)

| Module | Layer | Purpose |
|---|---|---|
| `constants.ts` | TS | `CSRF_COOKIE_NAME`, `CSRF_HEADER_NAME`, `CSRF_LOGIN_PATH`, `DEFAULT_ORG_STORAGE_KEY` |
| `interceptors.ts` | TS | Re-exports from `@monorepo/fetch` + BA-specific constants for convenience |
| `apollo/graphql/__generated__/` | Apollo | Generated TypeScript types from the BA GraphQL schema (codegen output) |
| `apollo/user/` | Apollo | `CurrentOrgUser` query + generated `useCurrentOrgUserQuery` hook + `logout` mutation |
| `react/ApiConfigProvider` | React | `ApiConfigProvider` + `useApiConfig` — provides base `apiUrl` and pre-wired `fetchClient` |
| `react/ApolloClientProvider` | React | Thin `ApolloProvider` wrapper — accepts an `ApolloLink`, `TypePolicies`, and optional cache |
| `react/EnvironmentSwitcherProvider` | React | `EnvironmentSwitcherProvider` + `useEnvironment` — wraps `ApiConfigProvider` with environment switching (persisted via storage). Only needed by apps that toggle API environments. |
| `react/providers/activeOrg/` | React | `ActiveOrgContext`, `ActiveOrgProvider`, `useActiveOrg`, `useActiveOrgState` — shared org management. Factory exports (`createActiveOrgContext<T>()`, etc.) for custom org types. |
| `react/providers/user/` | React | `UserProvider`, `useUser` — shared current-user context. Factory export (`createUserProvider`) for custom user types. |

### Web-only (`@monorepo/ba-platform/web`)

| Module | Layer | Purpose |
|---|---|---|
| `createWebFetchClient()` | Fetch | Returns a ``fetch``-compatible function — pre-composed web fetch (org-id injection + CSRF token refresh via browser localStorage / cookies). Pass to ``ApiConfigProvider`` (as ``fetch``) and to ``new UploadHttpLink({ fetch })``. |

### Expo-only (`@monorepo/ba-platform/expo`)

| Module | Layer | Purpose |
|---|---|---|
| `createExpoFetchClient(apiUrl, extraInterceptors?)` | Fetch | Returns a ``fetch``-compatible function — pre-composed Expo fetch (org-id + CSRF via CookieManager / AsyncStorage, body, credentials). App-specific interceptors passed via ``extraInterceptors``. Pass to ``EnvironmentSwitcherProvider`` (as ``fetch``) and to ``new UploadHttpLink({ fetch })``. |
| `createNativeTokenReader(baseUrl)` | Fetch | React Native `TokenReader` — reads cookies via `CookieManager` for CSRF token detection. |

### Types only (`@monorepo/ba-platform/types`)

| Module | Layer | Purpose |
|---|---|---|
| `apollo/graphql/__generated__/types` | Apollo | Lightweight re-export of generated GQL types for type-only consumers |

### Permissions (`@monorepo/ba-platform/permissions`)

> Separate NX project under `libs/ba-platform/permissions/`. See
> [`docs/styleguides/nx.md`](../../docs/styleguides/nx.md) for the ba-platform
> project split plan.

| Module | Layer | Purpose |
|---|---|---|
| `src/__generated__/index.ts` | TS | Auto-generated permission enums + `PermissionEnum` union type from the Django backend (`manage.py generate_permission_enums`) |
| `src/index.ts` | TS | Barrel re-export of generated permission types |

## Conventions

- **Symmetric layout** — mirror `libs/` internally. React → `react/`, Apollo → `apollo/`, TS → `ts/`.
- **Right entry point** — shared → `@monorepo/ba-platform`, web → `@monorepo/ba-platform/web`, native → `@monorepo/ba-platform/expo`. See [decision tree](#decision-tree).
- **Single source of truth** — if two BA apps need it, it goes here. Apps re-export, never duplicate.
- **Barrel discipline** — the main `src/index.ts` must never re-export from platform-specific entry points. Platform-specific code stays behind its own entry point (`web/`, `expo/`).
- **Factory exports** — providers and hooks that accept a type parameter (e.g. `createActiveOrgContext<T>()`) are exported as factories so apps can build their own typed instances.

