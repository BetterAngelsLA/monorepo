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
├── src/lib/
│   ├── constants.ts                ← Platform-agnostic constants
├── apollo/                         ← BA-specific Apollo code
│   ├── orgLink.ts                  ← Platform-agnostic org link (takes StorageAdapter param)
│   ├── react/                      ← Web-only Apollo (browser APIs)
│   │   ├── client.ts
│   │   └── csrf.ts
│   ├── expo/                       ← Native-only Apollo (RN APIs)
│   │   ├── client.ts
│   │   └── links/orgLink/
│   ├── graphql/__generated__/      ← Generated GQL types (codegen output)
│   └── user/                       ← GQL operations + generated hooks
├── react/                          ← Shared React code (works in web + native)
│   └── providers/
│       ├── activeOrg/
│       └── user/
├── expo/                           ← Native-only React (RN APIs)
│   └── ApolloClientProvider.tsx
└── ts/                             ← (future) BA-specific pure TS — enums, regex
```

The rule: if you'd put a **generic** version in `libs/react/` or `libs/apollo/`,
the **BA-specific** version goes under the corresponding directory here.

## Entry points

**Four entry points**, organized by **platform API dependency** — not by
UI framework.

> **Target state:** entry points are scaffolding. Once platform-specific code
> arrives (PR #2203), each entry will graduate to its own NX project under
> `libs/ba-platform/` — e.g. `libs/ba-platform/web/`, `libs/ba-platform/expo/`.
> Separate projects give mechanical compile-time safety (the linter prevents
> web code from importing expo code) and independent `nx affected` caching.
> See [`docs/styleguides/nx.md`](../../docs/styleguides/nx.md) for the migration
> path.

React runs on both web and native. Shared React code (hooks, providers)
has no platform dependency and belongs in the main entry. Pure TypeScript
(constants, enums, regex) is naturally platform-agnostic. Entry points
only split when a **platform-specific import** makes code incompatible
with one target.

| Import path | Target | Contents |
|---|---|---|
| `@monorepo/ba-platform` | All apps | Platform-agnostic — constants, orgLink, React providers, GQL hooks |
| `@monorepo/ba-platform/react` | Web only | Browser APIs — CSRF link, web Apollo client |
| `@monorepo/ba-platform/web` | Web only | Browser APIs — CSRF + org fetch client, web Apollo client |
| `@monorepo/ba-platform/expo` | Expo only | Native APIs — Expo Apollo client, `ApolloClientProvider` |
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

1. **Create the barrel file** — `src/<name>.ts`, mirroring `src/react.ts`.
   Start with an `export {};` placeholder and a doc comment.

2. **Register the path alias** — add to `tsconfig.base.json`:
   `"@monorepo/ba-platform/<name>": ["./libs/ba-platform/src/<name>.ts"]`

3. **Update this README** — add the entry point to the table and decision
   tree above.

The `src/lib/` directory structure stays the same — the new entry point
re-exports from the internal directories that hold the platform-specific
code (e.g. `src/lib/<name>/`).

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
| `constants.ts` | TS | `DEFAULT_ORG_STORAGE_KEY` — shared between `orgLink` and `useActiveOrgState` |
| `apollo/orgLink` | Apollo | Creates an Apollo Link that injects `X-Organization-ID` from storage. Framework-agnostic — takes a `StorageAdapter` param. |
| `apollo/graphql/__generated__/` | Apollo | Generated TypeScript types from the BA GraphQL schema (codegen output) |
| `apollo/user/` | Apollo | `CurrentOrgUser` query + generated `useCurrentOrgUserQuery` hook |
| `react/providers/activeOrg/` | React | `ActiveOrgContext`, `ActiveOrgProvider`, `useActiveOrg`, `useActiveOrgState` — shared org management. Factory exports (`createActiveOrgContext<T>()`, etc.) for custom org types. |
| `react/providers/user/` | React | `UserProvider`, `useUser` — shared current-user context. Factory export (`createUserProvider`) for custom user types. |

### Web-only (`@monorepo/ba-platform/web`)

| Module | Layer | Purpose |
|---|---|---|
| `createWebFetchClient` | Fetch | Pre-composed web fetch client: org-id injection + CSRF token refresh, backed by browser localStorage and cookie APIs. Use as the `fetch` option for Apollo's `UploadHttpLink`. |

### Expo-only (`@monorepo/ba-platform/expo`)

| Module | Layer | Purpose |
|---|---|---|
| `apollo/expo/client` | Apollo | Expo Apollo client — composes native fetch, error link, expo org link |
| `apollo/expo/links/orgLink/` | Apollo | Pre-configured org link using `AsyncStorage` adapter |
| `expo/ApolloClientProvider` | React | RN `ApolloProvider` wrapper — reads API config from context, recreates client on URL change |

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
- **Right entry point** — shared → `@monorepo/ba-platform`, web → `@monorepo/ba-platform/react`, native → `@monorepo/ba-platform/expo`. See [decision tree](#decision-tree).
- **Single source of truth** — if two BA apps need it, it goes here. Apps re-export, never duplicate.
- **Barrel discipline** — the main `src/index.ts` must never re-export from `src/react.ts` or `src/expo.ts`. Platform-specific code stays behind its own entry point.
- **Factory exports** — providers and hooks that accept a type parameter (e.g. `createActiveOrgContext<T>()`) are exported as factories so apps can build their own typed instances.

